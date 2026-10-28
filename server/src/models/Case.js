import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const safetyIndicatorSchema = new mongoose.Schema({
  immediateDangerReported: { type: Boolean, default: false },
  physicalForceReported: { type: Boolean, default: false },
  ongoingThreats: { type: Boolean, default: false },
  stalkingOrTracking: { type: Boolean, default: false },
  ongoingHarassment: { type: Boolean, default: false },
  fearOfRetaliation: { type: Boolean, default: false },
  targetIsMinor: { type: Boolean, default: false },
  requestUrgentSupport: { type: Boolean, default: false },
  contextType: {
    type: String,
    enum: ['workplace', 'cyber', 'educational', 'public_transport', 'domestic', 'other'],
    default: 'workplace',
  },
}, { _id: false });

const classificationSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
    required: true,
  },
  priorityReasons: { type: [String], default: [] },
  recommendedActions: { type: [String], default: [] },
  classificationMethod: {
    type: String,
    enum: [
      'safety_rule_override',
      'ml_assisted',
      'fallback_deterministic',
      'human_override',
      'ml_triage',
      'deterministic_rules',
      'ml_unavailable_fallback',
      'DETERMINISTIC_SAFETY_OVERRIDE',
      'DETERMINISTIC_SAFETY_RULE',
      'TRAINED_ML_MODEL',
      'HYBRID_CLASSIFICATION',
      'RULE_BASED_FALLBACK',
    ],
    default: 'DETERMINISTIC_SAFETY_RULE',
  },
  ruleVersion: { type: String, default: null },
  modelVersion: { type: String, default: null },
  isDemoModel: { type: Boolean, default: true },
  reviewStatus: {
    type: String,
    enum: [
      'PENDING_HUMAN_REVIEW',
      'PENDING_URGENT_HUMAN_REVIEW',
      'CLARIFICATION_REQUIRED',
      'INFORMATIONAL_INQUIRY',
      'CONFIRMED',
      'OVERRIDDEN',
    ],
    default: 'PENDING_HUMAN_REVIEW',
  },
  currentEmergency: { type: String, default: 'UNKNOWN' },
  conductCategory: { type: String, default: 'UNSPECIFIED' },
  mlConfidence: { type: Number, default: null },
  mlScores: { type: Map, of: Number, default: {} },
  classifiedAt: { type: Date, default: Date.now },
}, { _id: false });

const verificationFlagSchema = new mongoose.Schema({
  code: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
  matchedCaseId: { type: String, default: null },
  detectedAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  resolutionNote: { type: String },
});

const verificationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'NOT_CHECKED',
      'CLEAR',
      'NEEDS_REVIEW',
      'POSSIBLE_DUPLICATE',
      'EVIDENCE_INTEGRITY_CHECK_FAILED',
      'SPAM_SUSPECTED',
      'CLARIFICATION_REQUIRED',
    ],
    default: 'NOT_CHECKED',
  },
  similarityScore: { type: Number, default: 0 },
  matchedCaseId: { type: String, default: null },
  flags: { type: [verificationFlagSchema], default: [] },
  lastCheckedAt: { type: Date, default: Date.now },
}, { _id: false });

const candidateProvisionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String },
  applicabilityCondition: { type: String },
  officialSource: { type: String },
}, { _id: false });

const potentiallyRelevantFrameworkSchema = new mongoose.Schema({
  actName: { type: String, required: true },
  shortName: { type: String, required: true },
  statute: { type: String },
  candidateProvisions: { type: [candidateProvisionSchema], default: [] },
  candidateSections: { type: [String], default: [] },
  supportingReportedFacts: { type: [String], default: [] },
  elementsToVerify: { type: [String], default: [] },
  reason: { type: String },
  officialSources: [{ name: String, url: String }],
  applicabilityStatus: { type: String, default: 'REQUIRES_HUMAN_REVIEW' },
}, { _id: false });

const escalationSchema = new mongoose.Schema({
  internalReviewRequired: { type: Boolean, default: false },
  internalReviewStatus: { type: String, default: 'STANDARD_QUEUE' },
  internalNotificationStatus: { type: String, default: 'CONFIGURED_INTERNAL_QUEUE' },
  externalReportingStatus: { type: String, default: 'NOT_INITIATED' },
  emergencyGuidance: { type: String, default: 'For immediate emergency assistance, dial 112 (National Emergency Support System) or Women Helpline 181.' },
  safeguardingPathway: { type: String, default: 'STANDARD_ADULT_REVIEW' },
}, { _id: false });

const legalAdvisorySchema = new mongoose.Schema({
  assessmentType: { type: String, default: 'LEGAL_CATEGORY_RECOMMENDATION' },
  status: { type: String, default: 'PRELIMINARY' },
  incidentCategory: {
    label: { type: String },
    explanation: { type: String },
  },
  additionalCategories: [{
    label: String,
    explanation: String,
  }],
  potentiallyRelevantFrameworks: { type: [potentiallyRelevantFrameworkSchema], default: [] },
  additionalInformationNeeded: { type: [String], default: [] },
  modelMetadata: {
    modelVersion: String,
    knowledgeBaseVersion: String,
    assessmentMethod: String,
    isDemoModel: { type: Boolean, default: true },
  },
  disclaimer: {
    type: String,
    default: 'These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body.',
  },
  evaluatedAt: { type: Date, default: Date.now },
}, { _id: false });

const auditHistorySchema = new mongoose.Schema({
  action: { type: String, required: true },
  originalPriority: { type: String },
  newPriority: { type: String },
  reason: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String },
  reviewerRole: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const organizationVerificationSchema = new mongoose.Schema({
  isVerified: { type: Boolean, default: false },
  organizationType: { type: String, enum: ['employee', 'college_student', null], default: null },
  organizationName: { type: String, trim: true, default: null },
  verificationMethod: { type: String, default: null },
  idHash: { type: String, select: false },
  verifiedAt: { type: Date, default: null },
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    default: () => `SS-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`,
    unique: true,
    index: true,
  },
  recoveryCode: { type: String, required: true, select: false },
  isAnonymous: { type: Boolean, default: true },
  reporterName: { type: String, trim: true },
  reporterEmail: { type: String, lowercase: true, trim: true },
  reporterPhone: { type: String, trim: true },
  incidentCategory: {
    type: String,
    required: true,
    enum: ['sexual_harassment', 'workplace_harassment', 'child_abuse', 'domestic_violence', 'cyber_crime', 'discrimination', 'other'],
  },
  incidentDate: Date,
  description: { type: String, required: true, maxlength: 5000 },
  location: { type: String, trim: true },
  preferredLanguage: { type: String, default: 'en', enum: ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'bn'] },
  supportRequired: {
    type: [String],
    enum: ['formal_complaint', 'counselling', 'legal_info', 'documentation', 'urgent_safety'],
  },
  status: {
    type: String,
    enum: ['submitted', 'acknowledged', 'under_review', 'additional_info_required', 'decision_recorded', 'closed'],
    default: 'submitted',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  isUrgent: { type: Boolean, default: false },
  internalNotes: { type: String, select: false },

  // AI/ML, Safety Safeguards & Integrity Fields
  organizationVerification: { type: organizationVerificationSchema, default: () => ({ isVerified: false }) },
  safetyIndicators: { type: safetyIndicatorSchema, default: () => ({}) },
  classification: { type: classificationSchema, default: () => ({}) },
  verification: { type: verificationSchema, default: () => ({}) },
  legalAdvisory: { type: legalAdvisorySchema, default: () => ({}) },
  escalation: { type: escalationSchema, default: () => ({}) },
  auditHistory: { type: [auditHistorySchema], default: [] },
}, { timestamps: true });

// Do NOT expose recovery code, reporter identity (if anonymous), or internal notes to public tracking
caseSchema.methods.toPublicJSON = function () {
  return {
    caseId: this.caseId,
    incidentCategory: this.incidentCategory,
    incidentDate: this.incidentDate,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isAnonymous: this.isAnonymous,
    supportRequired: this.supportRequired,
    isUrgent: this.isUrgent,
    legalAdvisory: this.legalAdvisory,
    organizationVerification: this.organizationVerification?.isVerified ? {
      isVerified: true,
      organizationType: this.organizationVerification.organizationType,
      organizationName: this.organizationVerification.organizationName,
    } : { isVerified: false },
  };
};

export default mongoose.model('Case', caseSchema);
