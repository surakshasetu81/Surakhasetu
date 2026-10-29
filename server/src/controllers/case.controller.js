import Case from '../models/Case.js';
import CaseUpdate from '../models/CaseUpdate.js';
import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { evaluateSafetyRules, RULE_VERSION } from '../services/safetyPriorityRules.js';
import { checkDuplicateSubmission } from '../services/duplicateDetectionService.js';
import { recommendLegalFrameworks } from '../services/legalFrameworkRecommender.js';
import { requestMLClassification } from '../services/mlClientService.js';
import { generateLegalAssessment } from '../services/legalAssessmentEngine.js';
import { validateVerificationToken } from '../services/organizationVerificationService.js';
import { isDatabaseConnected } from '../config/database.js';

// In-memory dev storage for development and offline fallback
export const devCaseStore = {
  cases: new Map(),
  updates: new Map(),
};

// Seed pre-verified test case for local testing & validation
(async () => {
  try {
    const seedRawCode = 'A1B2C3D4E5F6';
    const seedHashedCode = await bcrypt.hash(seedRawCode, 10);
    const testCase = new Case({
      caseId: 'SS-TEST2026-A1B2C3',
      recoveryCode: seedHashedCode,
      isAnonymous: true,
      incidentCategory: 'workplace_harassment',
      description: 'Repeated offensive remarks and hostile conduct during quarterly departmental meetings.',
      status: 'under_review',
      isUrgent: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      supportRequired: ['formal_complaint', 'legal_info'],
      legalAdvisory: {
        assessmentType: 'LEGAL_CATEGORY_RECOMMENDATION',
        status: 'PRELIMINARY',
        incidentCategory: {
          label: 'Workplace Sexual Harassment',
          explanation: 'Allegations describe inappropriate conduct occurring within an employment setting.',
        },
        potentiallyRelevantFrameworks: [
          {
            actName: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
            shortName: 'POSH Act, 2013',
            candidateProvisions: [
              {
                section: 'Section 2(n)',
                title: 'Definition of Sexual Harassment',
                summary: 'Defines unwelcome physical, verbal or non-verbal conduct of a sexual nature.',
                officialSource: 'Ministry of Women and Child Development (WCD)',
              },
              {
                section: 'Section 4',
                title: 'Constitution of Internal Complaints Committee',
                summary: 'Mandates constitution of an Internal Complaints Committee in establishments with 10 or more employees.',
                officialSource: 'WCD Gazette Notification',
              },
            ],
            reason: 'Applicable statutory framework for incidents within an organized workplace context.',
          },
        ],
        disclaimer: 'These suggestions are preliminary legal information based on the details provided. They do not determine liability or replace advice from a qualified legal practitioner.',
      },
    });

    devCaseStore.cases.set(testCase.caseId, testCase);
    devCaseStore.updates.set(testCase.caseId, [
      {
        status: 'submitted',
        message: 'Your report has been received and registered securely in the intake repository.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        status: 'acknowledged',
        message: 'Filing reviewed and acknowledged by the designated Internal Complaints Committee secretary.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        status: 'under_review',
        message: 'Inquiry commenced under Section 11 of the POSH Act 2013 (statutory 90-day review period).',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]);
  } catch (seedErr) {
    console.warn('Seed test case warning:', seedErr.message);
  }
})();

// POST /api/cases - Submit new complaint (public)
export const submitCase = async (req, res) => {
  try {
    if (req.headers?.['x-simulate-offline'] === 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently offline. Please configure a valid MONGODB_URI in server/.env and ensure MongoDB is running.',
      });
    }

    const {
      isAnonymous,
      reporterName,
      reporterEmail,
      reporterPhone,
      incidentCategory,
      incidentDate,
      description,
      location,
      preferredLanguage,
      supportRequired,
      isUrgent,
      safetyIndicators = {},
      organizationVerification = {},
      employeeOrCollegeId,
      organizationId,
    } = req.body;

    const ALLOWED_NEW_REPORT_CATEGORIES = [
      'sexual_harassment',
      'workplace_harassment',
      'cyber_crime',
      'discrimination',
      'other',
    ];

    if (!incidentCategory || !description) {
      return res.status(400).json({ success: false, message: 'Incident category and description are required' });
    }
    if (!ALLOWED_NEW_REPORT_CATEGORIES.includes(incidentCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident category for new report. Please select an authorized workplace/women safety category.',
      });
    }
    if (description.length < 20) {
      return res.status(400).json({ success: false, message: 'Description must be at least 20 characters' });
    }

    // Generate secure recovery code (12 uppercase hex characters)
    const rawRecoveryCode = crypto.randomBytes(16).toString('hex').toUpperCase().slice(0, 12);
    const hashedRecoveryCode = await bcrypt.hash(rawRecoveryCode, 10);

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 1: Deterministic Safety Safeguards
    // ─────────────────────────────────────────────────────────────────────────
    const safetyAssessment = evaluateSafetyRules({
      incidentCategory,
      description,
      supportRequired: supportRequired || [],
      isUrgent: !!isUrgent,
      safetyIndicators,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 4: Duplicate & Submission Consistency Verification (Module D)
    // ─────────────────────────────────────────────────────────────────────────
    const duplicateCheck = await checkDuplicateSubmission(description);

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 3: Advisory Legal Framework & Category Recommendation (Module C)
    // ─────────────────────────────────────────────────────────────────────────
    const legalAssessment = await generateLegalAssessment({
      narrative: description,
      incidentCategory,
      contextType: safetyIndicators?.contextType || 'workplace',
      targetMinor: !!safetyIndicators?.targetIsMinor,
      isOnline: safetyIndicators?.contextType === 'cyber',
      language: preferredLanguage || 'en',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 2: ML Triage Service (Module B)
    // ─────────────────────────────────────────────────────────────────────────
    let finalPriority = safetyAssessment.priority;
    let classificationMethod = safetyAssessment.classificationMethod;
    let priorityReasons = [...safetyAssessment.priorityReasons];
    let recommendedActions = [...safetyAssessment.recommendedActions];
    let ruleVersion = safetyAssessment.ruleVersion;
    let modelVersion = null;
    let isDemoModel = true;
    let mlConfidence = null;
    let mlScores = {};

    // IMMUTABLE SAFETY SAFEGUARD:
    // If Layer 1 flagged an acute safety trigger (isUrgentOverride: true),
    // HIGH priority CANNOT be downgraded by the ML service.
    if (safetyAssessment.isUrgentOverride) {
      finalPriority = 'HIGH';
      classificationMethod = 'DETERMINISTIC_SAFETY_OVERRIDE';
    } else {
      // For cases without an acute safety override, consult ML model
      const mlResponse = await requestMLClassification({
        description,
        incidentCategory,
        preferredLanguage: preferredLanguage || 'en',
        safetyIndicators,
        isUrgent: !!isUrgent,
        supportRequired: supportRequired || [],
      });

      if (mlResponse.available && mlResponse.suggestedPriority) {
        finalPriority = mlResponse.suggestedPriority;
        classificationMethod = 'TRAINED_ML_MODEL';
        modelVersion = mlResponse.modelVersion;
        isDemoModel = mlResponse.isDemoModel;
        mlConfidence = mlResponse.confidenceScore;
        mlScores = mlResponse.classProbabilities;
        if (mlResponse.priorityReasons && mlResponse.priorityReasons.length > 0) {
          priorityReasons = mlResponse.priorityReasons;
        }
      } else {
        // Safe fallback to deterministic rules if ML service is down or times out
        classificationMethod = 'RULE_BASED_FALLBACK';
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Verification State Synthesis (Module D)
    // NOTE: Duplicate flags NEVER downgrade HIGH priority.
    // ─────────────────────────────────────────────────────────────────────────
    const verificationStatus = duplicateCheck.isPossibleDuplicate ? 'POSSIBLE_DUPLICATE' : 'CLEAR';
    const verificationFlags = [...duplicateCheck.flags];

    // Independently validate organization verification token (Prevent frontend state manipulation)
    let verifiedOrgData = { isVerified: false };
    if (organizationVerification && organizationVerification.verificationToken) {
      const validatedAffiliation = validateVerificationToken(organizationVerification.verificationToken);
      if (validatedAffiliation && validatedAffiliation.isVerified) {
        verifiedOrgData = validatedAffiliation;
      }
    }

    // Build Case Persistence Object
    const caseData = {
      isAnonymous: isAnonymous !== false,
      organizationVerification: verifiedOrgData,
      incidentCategory,
      description,
      preferredLanguage: preferredLanguage || 'en',
      supportRequired: supportRequired || [],
      recoveryCode: hashedRecoveryCode,
      isUrgent: finalPriority === 'HIGH' || !!isUrgent,
      safetyIndicators: {
        immediateDangerReported: !!safetyIndicators.immediateDangerReported,
        physicalForceReported: !!safetyIndicators.physicalForceReported,
        ongoingThreats: !!safetyIndicators.ongoingThreats,
        stalkingOrTracking: !!safetyIndicators.stalkingOrTracking,
        ongoingHarassment: !!safetyIndicators.ongoingHarassment,
        fearOfRetaliation: !!safetyIndicators.fearOfRetaliation,
        targetIsMinor: !!safetyIndicators.targetIsMinor,
        requestUrgentSupport: !!safetyIndicators.requestUrgentSupport || !!isUrgent,
        contextType: safetyIndicators.contextType || 'workplace',
      },
      classification: {
        priority: finalPriority,
        priorityReasons,
        recommendedActions,
        classificationMethod,
        ruleVersion,
        modelVersion,
        isDemoModel,
        reviewStatus: safetyAssessment.reviewStatus || (finalPriority === 'HIGH' ? 'PENDING_URGENT_HUMAN_REVIEW' : 'PENDING_HUMAN_REVIEW'),
        currentEmergency: safetyAssessment.currentEmergency || 'UNKNOWN',
        conductCategory: safetyAssessment.conductCategory || 'UNSPECIFIED',
        mlConfidence,
        mlScores,
        classifiedAt: new Date(),
      },
      verification: {
        status: verificationStatus,
        similarityScore: duplicateCheck.maxSimilarity,
        matchedCaseId: duplicateCheck.matchedCaseId,
        flags: verificationFlags,
        lastCheckedAt: new Date(),
      },
      legalAdvisory: legalAssessment,
      escalation: {
        internalReviewRequired: finalPriority === 'HIGH' || safetyAssessment.isUrgentOverride,
        internalReviewStatus: finalPriority === 'HIGH' ? 'PENDING_URGENT_HUMAN_REVIEW' : 'STANDARD_QUEUE',
        internalNotificationStatus: finalPriority === 'HIGH' ? 'CONFIGURED_INTERNAL_QUEUE' : 'STANDARD_INTERNAL_QUEUE',
        externalReportingStatus: 'NOT_INITIATED',
        emergencyGuidance: 'For immediate emergency assistance, dial 112 (National Emergency Response Support System) or Women Helpline 181.',
        safeguardingPathway: (safetyAssessment.safetyFlags && safetyAssessment.safetyFlags.includes('CHILD_SAFEGUARDING_TRIGGER'))
          ? 'POCSO_STATUTORY_SAFEGUARDING_REVIEW'
          : 'STANDARD_ADULT_REVIEW',
      },
      auditHistory: [
        {
          action: 'AUTOMATED_INITIAL_CLASSIFICATION',
          originalPriority: null,
          newPriority: finalPriority,
          reason: `Initial automated triage via ${classificationMethod} (Rule: ${ruleVersion || 'N/A'}, Model: ${modelVersion || 'N/A'})`,
          timestamp: new Date(),
        },
      ],
    };

    if (verifiedOrgData.isVerified) {
      caseData.auditHistory.push({
        action: 'ORGANIZATION_AFFILIATION_VERIFIED',
        reason: `Affiliation confirmed: ${verifiedOrgData.organizationName} (${verifiedOrgData.organizationType}) via ${verifiedOrgData.verificationMethod}`,
        timestamp: new Date(),
      });
    }

    if (!caseData.isAnonymous) {
      caseData.reporterName = reporterName;
      caseData.reporterEmail = reporterEmail;
      caseData.reporterPhone = reporterPhone;
    }
    if (incidentDate) caseData.incidentDate = new Date(incidentDate);
    if (location) caseData.location = location;
    const optionalId = (employeeOrCollegeId || organizationId || '').toString().trim();
    if (optionalId) caseData.employeeOrCollegeId = optionalId;

    const requestId = req.headers?.['x-request-id'] || `req-${crypto.randomBytes(4).toString('hex')}`;

    // In serverless / on-demand environments, ensure database connection is established
    if (!isDatabaseConnected()) {
      try {
        await connectDB();
      } catch (dbConnectErr) {
        console.warn('DB connect attempt on submitCase note:', dbConnectErr.message);
      }
    }

    if (!isDatabaseConnected()) {
      console.warn(JSON.stringify({
        level: 'WARN',
        requestId,
        errorCategory: 'DATABASE_SERVICE_UNAVAILABLE',
        operation: 'SUBMIT_CASE',
        httpStatus: 503,
        message: 'Report submission aborted: MongoDB connection is currently disconnected or uninitialized.',
      }));
      return res.status(503).json({
        success: false,
        requestId,
        errorCategory: 'DATABASE_SERVICE_UNAVAILABLE',
        message: 'Database persistence is currently unavailable. Your complaint could not be stored in the database. Please verify the database connection and try again.',
      });
    }

    const newCase = await Case.create(caseData);

    await CaseUpdate.create({
      case: newCase._id,
      status: 'submitted',
      message: 'Your complaint has been received. You will be notified of updates.',
      updatedBy: null,
      isVisibleToReporter: true,
    });

    await AuditLog.create({
      action: 'CASE_SUBMITTED',
      targetModel: 'Case',
      targetId: newCase._id,
      details: {
        caseId: newCase.caseId,
        isAnonymous: newCase.isAnonymous,
        priority: finalPriority,
        classificationMethod,
      },
      ipAddress: req.ip,
    });

    // Public response: Real Case ID, Recovery Code, submitted timestamp (no sensitive internal notes)
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      caseId: newCase.caseId,
      recoveryCode: rawRecoveryCode,
      submittedAt: newCase.createdAt || new Date(),
    });
  } catch (err) {
    const requestId = req.headers?.['x-request-id'] || 'req-err';
    const isValidationError = err.name === 'ValidationError';
    console.error(JSON.stringify({
      level: 'ERROR',
      requestId,
      errorCategory: isValidationError ? 'SCHEMA_VALIDATION_ERROR' : 'DATABASE_PERSISTENCE_ERROR',
      operation: 'SUBMIT_CASE',
      httpStatus: isValidationError ? 400 : 500,
      sanitizedError: err.message,
    }));
    if (isValidationError) {
      return res.status(400).json({
        success: false,
        requestId,
        errorCategory: 'SCHEMA_VALIDATION_ERROR',
        message: 'Report validation failed. Please check the submitted fields.',
      });
    }
    res.status(500).json({
      success: false,
      requestId,
      errorCategory: 'DATABASE_PERSISTENCE_ERROR',
      message: 'Failed to submit complaint. Database error encountered.',
    });
  }
};

// POST /api/cases/track and /api/cases/track-lookup - Track case with Report ID/Case ID + Recovery Key/Code (public)
export const trackCase = async (req, res) => {
  try {
    if (req.headers?.['x-simulate-offline'] === 'true' || !isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Case tracking is temporarily unavailable. Database connection is not established.',
      });
    }

    const { caseId, recoveryCode, reportId, recoveryKey } = req.body;
    const targetId = (reportId || caseId || '').toString().trim().toUpperCase();
    const targetKey = (recoveryKey || recoveryCode || '').toString().trim().toUpperCase();

    if (!targetId || !targetKey) {
      return res.status(400).json({ success: false, message: 'Report ID and Recovery Key are required' });
    }

    const foundCase = await Case.findOne({ caseId: targetId }).select('+recoveryCode');
    if (!foundCase) {
      return res.status(401).json({
        success: false,
        message: 'Unable to verify these details. Please check your Report ID and Recovery Key and try again.',
      });
    }

    const isMatch = await bcrypt.compare(targetKey, foundCase.recoveryCode);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Unable to verify these details. Please check your Report ID and Recovery Key and try again.',
      });
    }

    const updates = await CaseUpdate.find({ case: foundCase._id, isVisibleToReporter: true })
      .sort({ createdAt: 1 })
      .select('status message createdAt');

    res.json({
      success: true,
      case: foundCase.toPublicJSON(),
      timeline: updates,
    });
  } catch (err) {
    console.error('trackCase error:', err);
    res.status(500).json({ success: false, message: 'Case tracking is temporarily unavailable. Please try again.' });
  }
};

// GET /api/cases - Staff: list all cases with explainable classification panel details
export const getAllCases = async (req, res) => {
  try {
    const { status, priority, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query['classification.priority'] = priority;
    if (verificationStatus) query['verification.status'] = verificationStatus;
    if (req.user.role === 'staff') query.assignedTo = req.user._id;

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assignedTo', 'name email')
      .populate('evidence', 'filename originalName mimetype size sha256Hash integrityStatus lastVerifiedAt')
      .select('-recoveryCode -internalNotes -reporterEmail -reporterPhone');

    const total = await Case.countDocuments(query);
    res.json({
      success: true,
      cases,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cases' });
  }
};

// GET /api/cases/:caseId - Staff: get single case with full triage explainability
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const foundCase = await Case.findOne({ caseId })
      .populate('assignedTo', 'name email role')
      .populate('evidence')
      .populate('auditHistory.performedBy', 'name email role')
      .select('-recoveryCode');

    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.json({ success: true, case: foundCase });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve case details' });
  }
};

// PATCH /api/cases/:caseId/status - Staff: update case status
export const updateCaseStatus = async (req, res) => {
  try {
    const { status, message, isVisibleToReporter } = req.body;
    const { caseId } = req.params;

    const foundCase = await Case.findOne({ caseId });
    if (!foundCase) return res.status(404).json({ success: false, message: 'Case not found' });

    if (req.user.role === 'staff' && foundCase.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not assigned to this case' });
    }

    foundCase.status = status;
    await foundCase.save();

    await CaseUpdate.create({
      case: foundCase._id,
      status,
      message: message || `Status updated to ${status}`,
      updatedBy: req.user._id,
      isVisibleToReporter: isVisibleToReporter !== false,
    });

    await AuditLog.create({
      action: 'CASE_STATUS_UPDATED',
      performedBy: req.user._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: { caseId, newStatus: status },
    });

    res.json({ success: true, message: 'Case status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update case' });
  }
};

// PATCH /api/cases/:caseId/priority - Staff/Admin: Audited Priority Override
export const overridePriority = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newPriority, reason } = req.body;

    if (!newPriority || !['HIGH', 'MEDIUM', 'LOW'].includes(newPriority)) {
      return res.status(400).json({ success: false, message: "Valid priority ('HIGH', 'MEDIUM', or 'LOW') is required" });
    }
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory justification reason (minimum 10 characters) is required to override priority',
      });
    }

    const foundCase = await Case.findOne({ caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const originalPriority = foundCase.classification.priority;

    // Record override in case audit history
    const auditRecord = {
      action: 'HUMAN_PRIORITY_OVERRIDE',
      originalPriority,
      newPriority,
      reason: reason.trim(),
      performedBy: req.user._id,
      reviewerName: req.user.name || 'Staff Reviewer',
      reviewerRole: req.user.role || 'staff',
      timestamp: new Date(),
    };

    foundCase.classification.priority = newPriority;
    foundCase.classification.reviewStatus = 'OVERRIDDEN';
    foundCase.classification.classificationMethod = 'human_override';
    foundCase.isUrgent = newPriority === 'HIGH';
    foundCase.auditHistory.push(auditRecord);

    await foundCase.save();

    // Also persist in global AuditLog
    await AuditLog.create({
      action: 'PRIORITY_OVERRIDDEN',
      performedBy: req.user._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: {
        caseId,
        originalPriority,
        newPriority,
        reason: reason.trim(),
        reviewerRole: req.user.role,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Priority overridden successfully with full audit trail',
      case: foundCase,
    });
  } catch (err) {
    console.error('overridePriority error:', err);
    res.status(500).json({ success: false, message: 'Failed to override priority' });
  }
};

// PATCH /api/cases/:caseId/verification-flag - Staff/Admin: Dismiss/Resolve verification flag
export const resolveVerificationFlag = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { flagIndex, resolutionNote } = req.body;

    if (flagIndex === undefined || flagIndex === null) {
      return res.status(400).json({ success: false, message: 'flagIndex is required' });
    }

    const foundCase = await Case.findOne({ caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (!foundCase.verification.flags[flagIndex]) {
      return res.status(404).json({ success: false, message: 'Flag not found at specified index' });
    }

    foundCase.verification.flags[flagIndex].resolved = true;
    foundCase.verification.flags[flagIndex].resolvedBy = req.user._id;
    foundCase.verification.flags[flagIndex].resolvedAt = new Date();
    foundCase.verification.flags[flagIndex].resolutionNote = resolutionNote || 'Dismissed upon human review';

    // If all flags are resolved, change verification status to CLEAR
    const unresolved = foundCase.verification.flags.filter(f => !f.resolved);
    if (unresolved.length === 0) {
      foundCase.verification.status = 'CLEAR';
    }

    // Append to audit history without erasing prior history
    foundCase.auditHistory.push({
      action: 'VERIFICATION_FLAG_RESOLVED',
      reason: resolutionNote || `Flag #${flagIndex} resolved by staff review`,
      performedBy: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: req.user.role,
      timestamp: new Date(),
    });

    await foundCase.save();

    await AuditLog.create({
      action: 'VERIFICATION_FLAG_RESOLVED',
      performedBy: req.user._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: { caseId, flagIndex, resolutionNote },
    });

    res.json({
      success: true,
      message: 'Verification flag updated successfully',
      verification: foundCase.verification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update verification flag' });
  }
};

// GET /api/cases/:caseId/assessment - Staff: Structured Assessment conforming to Section 11 Schema
export const getCaseAssessment = async (req, res) => {
  try {
    const { caseId } = req.params;
    let foundCase = null;

    if (isDatabaseConnected()) {
      foundCase = await Case.findOne({ caseId })
        .populate('assignedTo', 'name email role')
        .populate('evidence');
    } else {
      foundCase = devCaseStore.cases.get(caseId);
    }

    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const legalRecs = (foundCase.legalAdvisory?.potentiallyRelevantFrameworks || []).map(fw => ({
      act: fw.actName,
      candidateSections: fw.candidateSections || (fw.candidateProvisions || []).map(p => p.section),
      supportingReportedFacts: fw.supportingReportedFacts || [fw.reason || 'Reported incident facts'],
      elementsToVerify: fw.elementsToVerify || [],
      status: fw.applicabilityStatus || 'REQUIRES_HUMAN_LEGAL_REVIEW',
      officialSources: (fw.officialSources || []).map(s => (typeof s === 'string' ? s : s.url)),
    }));

    const structuredAssessment = {
      classification: {
        riskPriority: foundCase.classification?.priority || 'MEDIUM',
        priorityReasons: foundCase.classification?.priorityReasons || [],
        classificationMethod: foundCase.classification?.classificationMethod || 'DETERMINISTIC_SAFETY_RULE',
        reviewStatus: foundCase.classification?.reviewStatus || 'PENDING_HUMAN_REVIEW',
        currentEmergency: foundCase.classification?.currentEmergency || 'UNKNOWN',
      },
      conductCategories: [
        foundCase.classification?.conductCategory || foundCase.incidentCategory,
      ],
      legalRecommendations: legalRecs,
      supportNeeds: {
        emotionalSupportRequested: Boolean(foundCase.supportRequired?.includes('counselling')),
        urgentSupportRequested: Boolean(foundCase.supportRequired?.includes('urgent_safety') || foundCase.isUrgent),
      },
      verification: {
        status: foundCase.verification?.status || 'NOT_CHECKED',
        flags: foundCase.verification?.flags || [],
      },
      escalation: foundCase.escalation || {
        internalReviewRequired: foundCase.classification?.priority === 'HIGH',
        internalReviewStatus: foundCase.classification?.priority === 'HIGH' ? 'PENDING_URGENT_HUMAN_REVIEW' : 'STANDARD_QUEUE',
        internalNotificationStatus: 'CONFIGURED_INTERNAL_QUEUE',
        externalReportingStatus: 'NOT_INITIATED',
        emergencyGuidance: 'For immediate emergency assistance, dial 112 (National Emergency Response Support System) or Women Helpline 181.',
        safeguardingPathway: 'STANDARD_ADULT_REVIEW',
      },
      modelMetadata: {
        modelVersion: foundCase.classification?.modelVersion || 'v2026.3-multilingual',
        ruleVersion: foundCase.classification?.ruleVersion || '2026.3',
        trainingDatasetVersion: 'synthetic-development-2026.3',
      },
      disclaimer: 'Preliminary triage and legal information only. This is not a finding of guilt or a final legal determination.',
    };

    res.json({
      success: true,
      caseId: foundCase.caseId,
      assessment: structuredAssessment,
    });
  } catch (err) {
    console.error('getCaseAssessment error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve case assessment' });
  }
};

// POST /api/cases/:caseId/clarification - Staff: Request clarification from complainant
export const requestCaseClarification = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Clarification request message (minimum 10 characters) is required' });
    }

    let foundCase = null;
    if (isDatabaseConnected()) {
      foundCase = await Case.findOne({ caseId });
      if (!foundCase) return res.status(404).json({ success: false, message: 'Case not found' });

      foundCase.status = 'additional_info_required';
      foundCase.classification.reviewStatus = 'CLARIFICATION_REQUIRED';
      foundCase.auditHistory.push({
        action: 'CLARIFICATION_REQUESTED',
        reason: message.trim(),
        performedBy: req.user._id,
        reviewerName: req.user.name,
        reviewerRole: req.user.role,
        timestamp: new Date(),
      });
      await foundCase.save();

      await CaseUpdate.create({
        case: foundCase._id,
        status: 'additional_info_required',
        message: `Clarification requested by review committee: ${message.trim()}`,
        updatedBy: req.user._id,
        isVisibleToReporter: true,
      });
    } else {
      foundCase = devCaseStore.cases.get(caseId);
      if (!foundCase) return res.status(404).json({ success: false, message: 'Case not found' });
      foundCase.status = 'additional_info_required';
      foundCase.classification.reviewStatus = 'CLARIFICATION_REQUIRED';
    }

    res.json({ success: true, message: 'Clarification request recorded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to request clarification' });
  }
};

// PATCH /api/cases/:caseId/legal-review - Staff: Review / Dismiss legal recommendation
export const reviewLegalRecommendation = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { frameworkIndex, action, note } = req.body; // action: 'ACCEPT' or 'MARK_NOT_RELEVANT'

    let foundCase = null;
    if (isDatabaseConnected()) {
      foundCase = await Case.findOne({ caseId });
    } else {
      foundCase = devCaseStore.cases.get(caseId);
    }

    if (!foundCase) return res.status(404).json({ success: false, message: 'Case not found' });

    const fws = foundCase.legalAdvisory?.potentiallyRelevantFrameworks;
    if (!fws || !fws[frameworkIndex]) {
      return res.status(404).json({ success: false, message: 'Legal framework recommendation not found at index' });
    }

    fws[frameworkIndex].applicabilityStatus = action === 'MARK_NOT_RELEVANT' ? 'DISMISSED_NOT_RELEVANT' : 'CONFIRMED_RELEVANT';
    if (note) {
      fws[frameworkIndex].reviewNote = note.trim();
    }

    foundCase.auditHistory.push({
      action: 'LEGAL_RECOMMENDATION_REVIEWED',
      reason: `Framework ${fws[frameworkIndex].shortName} marked as ${fws[frameworkIndex].applicabilityStatus}: ${note || 'No note provided'}`,
      performedBy: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: req.user.role,
      timestamp: new Date(),
    });

    if (isDatabaseConnected()) {
      await foundCase.save();
    }

    res.json({ success: true, message: 'Legal recommendation review updated', framework: fws[frameworkIndex] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to review legal recommendation' });
  }
};
