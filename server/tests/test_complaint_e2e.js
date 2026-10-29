import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Case from '../src/models/Case.js';
import CaseUpdate from '../src/models/CaseUpdate.js';
import AuditLog from '../src/models/AuditLog.js';
import { connectDB, closeDB } from '../src/config/database.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${message}`);
    failed++;
  }
}

async function runComplaintE2ETest() {
  console.log('========================================================================');
  console.log('SURAKSHA SETU — COMPLAINT SUBMISSION & PERSISTENCE E2E VERIFICATION');
  console.log('========================================================================\n');

  try {
    await connectDB();
    assert(mongoose.connection.readyState === 1, 'MongoDB database is successfully connected');

    // ─── TEST 1: Submit Anonymous Complaint ───
    console.log('\n--- Test 1: Anonymous Complaint Submission ---');
    const rawRecoveryCode1 = 'A1B2C3D4E5F6';
    const hashedCode1 = await bcrypt.hash(rawRecoveryCode1, 10);

    const anonCaseData = {
      isAnonymous: true,
      incidentCategory: 'workplace_harassment',
      description: 'Persistent intimidation and exclusionary behavior experienced during project sync meetings.',
      supportRequired: ['formal_complaint', 'documentation'],
      recoveryCode: hashedCode1,
      isUrgent: false,
      safetyIndicators: {
        ongoingHarassment: true,
        fearOfRetaliation: true,
      },
      classification: {
        priority: 'MEDIUM',
        classificationMethod: 'fallback_deterministic',
        priorityReasons: ['Ongoing workplace harassment reported'],
      },
      auditHistory: [
        {
          action: 'AUTOMATED_INITIAL_CLASSIFICATION',
          newPriority: 'MEDIUM',
          reason: 'Initial intake registration',
        },
      ],
    };

    const savedAnon = await Case.create(anonCaseData);
    assert(!!savedAnon._id, 'Anonymous complaint persisted to MongoDB with ObjectId');
    assert(savedAnon.caseId.startsWith('SS-'), `Generated Case ID follows format: ${savedAnon.caseId}`);
    assert(savedAnon.isAnonymous === true, 'Complaint is marked anonymous');
    assert(!savedAnon.reporterName, 'Complainant name is omitted');

    // ─── TEST 2: Retrieve Case via Case ID & Recovery Code (Tracking Flow) ───
    console.log('\n--- Test 2: Case Tracking & Recovery Verification ---');
    const fetchedCase = await Case.findOne({ caseId: savedAnon.caseId }).select('+recoveryCode');
    assert(!!fetchedCase, 'Case found in database by caseId');

    const codeMatches = await bcrypt.compare(rawRecoveryCode1, fetchedCase.recoveryCode);
    assert(codeMatches, 'Recovery code validates against hashed database record');

    const wrongCodeMatches = await bcrypt.compare('WRONG_KEY_12', fetchedCase.recoveryCode);
    assert(!wrongCodeMatches, 'Invalid recovery code is rejected');

    const publicJSON = fetchedCase.toPublicJSON ? fetchedCase.toPublicJSON() : fetchedCase.toJSON();
    assert(!publicJSON.recoveryCode, 'Public JSON representation strips hashed recovery code');
    assert(!publicJSON.internalNotes, 'Public JSON strips internal confidential notes');

    // ─── TEST 3: Identified Complaint with Organization Verification ───
    console.log('\n--- Test 3: Identified Complaint with Organization Affiliation ---');
    const rawRecoveryCode2 = 'Z9Y8X7W6V5U4';
    const hashedCode2 = await bcrypt.hash(rawRecoveryCode2, 10);

    const identifiedCaseData = {
      isAnonymous: false,
      reporterName: 'Pooja Sharma',
      reporterEmail: 'pooja.sharma@example.org',
      reporterPhone: '+91 98765 43210',
      incidentCategory: 'sexual_harassment',
      description: 'Manager repeatedly made explicit verbal comments and sent unwelcome messages after work hours.',
      supportRequired: ['formal_complaint', 'counselling'],
      recoveryCode: hashedCode2,
      isUrgent: true,
      organizationVerification: {
        isVerified: true,
        organizationName: 'TechCorp India Pvt Ltd',
        organizationType: 'employee',
      },
      safetyIndicators: {
        ongoingThreats: true,
        requestUrgentSupport: true,
      },
      classification: {
        priority: 'HIGH',
        classificationMethod: 'DETERMINISTIC_SAFETY_OVERRIDE',
        priorityReasons: ['Acute threat and urgent support requested'],
      },
      auditHistory: [
        {
          action: 'AUTOMATED_INITIAL_CLASSIFICATION',
          newPriority: 'HIGH',
          reason: 'Acute safety trigger escalated',
        },
      ],
    };

    const savedIdentified = await Case.create(identifiedCaseData);
    assert(!!savedIdentified._id, 'Identified complaint persisted to MongoDB');
    assert(savedIdentified.reporterName === 'Pooja Sharma', 'Complainant identity stored securely');
    assert(savedIdentified.organizationVerification.isVerified === true, 'Organization affiliation recorded');

    // Clean up test records
    await Case.deleteOne({ _id: savedAnon._id });
    await Case.deleteOne({ _id: savedIdentified._id });
    console.log('\nTest cleanup: test cases deleted safely.');

    console.log('\n========================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');

    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    await closeDB();
    process.exit(1);
  }
}

runComplaintE2ETest();
