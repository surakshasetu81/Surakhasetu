import assert from 'assert';
import { connectDB, closeDB, isDatabaseConnected } from '../src/config/database.js';
import Case from '../src/models/Case.js';
import CaseUpdate from '../src/models/CaseUpdate.js';
import AuditLog from '../src/models/AuditLog.js';
import * as caseController from '../src/controllers/case.controller.js';

async function runE2E() {
  console.log('--- STARTING COMPLAINT SUBMISSION E2E TEST ---');

  // 1. Ensure DB connection
  const conn = await connectDB();
  assert.ok(isDatabaseConnected(), 'Database must be connected');
  console.log('✓ Database connected successfully');

  // 2. Mock Express req and res for submission
  let responseStatus = 0;
  let responseData = null;

  const mockRes = {
    status(s) {
      responseStatus = s;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const payload = {
    isAnonymous: false,
    reporterName: 'Priya Sharma',
    reporterEmail: 'priya.sharma@example.com',
    reporterPhone: '+91 98765 43210',
    employeeOrCollegeId: 'EMP-98214',
    organizationDetails: 'Tech Mahindra SEZ',
    incidentCategory: 'workplace_harassment',
    incidentDate: '2026-03-15',
    location: 'Bangalore Office - 4th Floor Meeting Room',
    description: 'During a team retrospective meeting, an offensive and derogatory comment was made repeatedly despite direct objections. I request formal review and appropriate corrective action.',
    preferredLanguage: 'en',
    supportRequired: ['formal_complaint'],
    isUrgent: false,
  };

  const mockReq = {
    body: payload,
    ip: '127.0.0.1',
    user: null,
  };

  console.log('Submitting complaint through caseController.submitCase...');
  await caseController.submitCase(mockReq, mockRes);
  if (responseStatus !== 201) {
    console.error('Response failed with status:', responseStatus, responseData);
  }

  assert.strictEqual(responseStatus, 201, `Expected status 201, got ${responseStatus}`);
  assert.ok(responseData.success, 'Response must indicate success');
  assert.ok(responseData.caseId, 'Response must include caseId');
  assert.ok(responseData.recoveryCode, 'Response must include recoveryCode');

  const { caseId, recoveryCode } = responseData;
  console.log(`✓ Complaint created: caseId=${caseId}, recoveryCode=${recoveryCode}`);

  // 3. Verify in MongoDB
  const savedCase = await Case.findOne({ caseId }).select('+employeeOrCollegeId');
  assert.ok(savedCase, 'Case must be found in MongoDB');
  assert.strictEqual(savedCase.employeeOrCollegeId, 'EMP-98214');
  assert.strictEqual(savedCase.reporterName, 'Priya Sharma');
  assert.strictEqual(savedCase.incidentCategory, 'workplace_harassment');
  console.log('✓ Verified Case in MongoDB: employeeOrCollegeId and details preserved');

  // 4. Verify CaseUpdate was created
  const updates = await CaseUpdate.find({ case: savedCase._id });
  assert.ok(updates.length > 0, 'CaseUpdate record must be created');
  console.log(`✓ Verified ${updates.length} CaseUpdate record(s) in MongoDB`);

  // 5. Verify AuditLog was created
  const auditLogs = await AuditLog.find({ targetId: savedCase._id });
  assert.ok(auditLogs.length > 0, 'AuditLog record must be created');
  console.log(`✓ Verified ${auditLogs.length} AuditLog record(s) in MongoDB`);

  // 6. Test Track Case with valid credentials
  let trackStatus = 200;
  let trackData = null;
  const mockTrackRes = {
    status(s) {
      trackStatus = s;
      return this;
    },
    json(data) {
      trackData = data;
      return this;
    },
  };

  const mockTrackReq = {
    body: {
      caseId,
      recoveryCode,
    },
    ip: '127.0.0.1',
  };

  await caseController.trackCase(mockTrackReq, mockTrackRes);
  assert.strictEqual(trackStatus, 200, `Expected 200, got ${trackStatus}`);
  assert.ok(trackData.success, 'Tracking must succeed');
  assert.strictEqual(trackData.case.caseId, caseId);
  console.log('✓ Track Your Case successfully verified with Report ID and Recovery Key');

  // 7. Test Track Case with wrong recovery code
  let badTrackStatus = 200;
  let badTrackData = null;
  const mockBadTrackRes = {
    status(s) {
      badTrackStatus = s;
      return this;
    },
    json(data) {
      badTrackData = data;
      return this;
    },
  };

  const mockBadTrackReq = {
    body: {
      caseId,
      recoveryCode: 'WRONG-KEY-1234',
    },
    ip: '127.0.0.1',
  };

  await caseController.trackCase(mockBadTrackReq, mockBadTrackRes);
  assert.strictEqual(badTrackStatus, 401, `Expected 401, got ${badTrackStatus}`);
  assert.strictEqual(badTrackData.success, false);
  console.log('✓ Wrong recovery key rejected with 401 as expected');

  // 8. Test Anonymous Submission
  let anonStatus = 0;
  let anonData = null;
  const mockAnonRes = {
    status(s) {
      anonStatus = s;
      return this;
    },
    json(data) {
      anonData = data;
      return this;
    },
  };

  const anonPayload = {
    isAnonymous: true,
    incidentCategory: 'cyber_crime',
    incidentDate: '2026-03-20',
    location: 'Campus Library Area',
    description: 'An individual has been repeatedly following me from class to the library and sending unsolicited messages across multiple platforms.',
    preferredLanguage: 'en',
    supportRequired: ['counselling'],
    isUrgent: false,
  };

  await caseController.submitCase({ body: anonPayload, ip: '127.0.0.1', user: null }, mockAnonRes);
  assert.strictEqual(anonStatus, 201);
  assert.ok(anonData.caseId);
  const anonCase = await Case.findOne({ caseId: anonData.caseId });
  assert.ok(anonCase);
  assert.strictEqual(anonCase.isAnonymous, true);
  assert.strictEqual(anonCase.reporterName, undefined);
  console.log('✓ Anonymous complaint submitted and verified in MongoDB');

  await closeDB();
  console.log('--- ALL E2E PERSISTENCE AND SUBMISSION TESTS PASSED ---');
}

runE2E().catch(err => {
  console.error('E2E TEST FAILURE:', err);
  process.exit(1);
});
