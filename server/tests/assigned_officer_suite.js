/**
 * Suraksha Setu — Assigned Committee Member & Case Officer Test Suite
 */

import assert from 'assert';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Case from '../src/models/Case.js';
import User from '../src/models/User.js';
import CaseUpdate from '../src/models/CaseUpdate.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import AuditLog from '../src/models/AuditLog.js';
import Notification from '../src/models/Notification.js';

import {
  assignCase,
  trackCase,
} from '../src/controllers/case.controller.js';
import {
  createStaffAccount,
  getAllStaff,
} from '../src/controllers/admin.staff.controller.js';

console.log('========================================================================');
console.log('SURAKSHA SETU — ASSIGNED COMMITTEE MEMBER / CASE OFFICER TEST SUITE');
console.log('========================================================================\n');

let passedCount = 0;
let failedCount = 0;

async function runTest(name, fn) {
  process.stdout.write(`Testing [${name}]... `);
  try {
    await fn();
    console.log('✓ PASSED');
    passedCount++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failedCount++;
  }
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function runAll() {
  mongoose.connection.readyState = 1;

  const testCaseId = `SS-IC-${Date.now().toString(36).toUpperCase()}`;
  const rawRecoveryCode = 'SECUREKEY2026';
  const hashedRecoveryCode = await bcrypt.hash(rawRecoveryCode, 10);

  const mockAdminId = new mongoose.Types.ObjectId();
  const mockAdmin = {
    _id: mockAdminId,
    name: 'Main Administrator',
    email: 'admin@surakshasetu.org',
    role: 'admin',
  };

  const mockOfficerId1 = new mongoose.Types.ObjectId();
  const mockOfficer1 = {
    _id: mockOfficerId1,
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@institution.ac.in',
    role: 'ic_member',
    icRole: 'presiding_officer',
    designation: 'Senior Professor & Presiding Officer',
    department: 'Internal Complaints Committee',
    organization: 'POSH Internal Complaints Committee',
    officialPhone: '+91 98765 43210',
    isContactPublic: true,
    isActive: true,
  };

  const mockOfficerId2 = new mongoose.Types.ObjectId();
  const mockOfficer2 = {
    _id: mockOfficerId2,
    name: 'Adv. Rajesh Verma',
    email: 'rajesh.verma@legalcouncil.org',
    role: 'ic_member',
    icRole: 'external_member',
    designation: 'External Legal Specialist',
    department: 'POSH External Advisory',
    organization: 'Legal Aid & POSH Council',
    officialPhone: '+91 91234 56789',
    isContactPublic: false, // Private phone, should NOT be shown to complainant
    isActive: true,
  };

  let createdCaseDoc = null;
  let createdConvDoc = null;

  // TEST 1: Admin Provisions Committee Member Profile with IC Role & Contact Info
  await runTest('Admin Provisions Committee Member with IC Role & Approved Contact', async () => {
    const origFindOne = User.findOne;
    const origCreate = User.create;
    const origCount = User.countDocuments;
    const origAuditCreate = AuditLog.create;

    User.findOne = async () => null;
    User.countDocuments = async () => 41;
    User.create = async (doc) => ({
      ...doc,
      _id: mockOfficerId1,
      staffId: 'STF-2026-042',
      createdAt: new Date(),
    });
    AuditLog.create = async () => ({});

    const req = {
      user: mockAdmin,
      ip: '127.0.0.1',
      body: {
        name: 'Dr. Ananya Sharma',
        email: 'ananya.sharma@institution.ac.in',
        department: 'Internal Complaints Committee',
        designation: 'Senior Professor & Presiding Officer',
        role: 'ic_member',
        icRole: 'presiding_officer',
        officialPhone: '+91 98765 43210',
        isContactPublic: true,
      },
    };
    const res = createMockRes();

    await createStaffAccount(req, res);

    User.findOne = origFindOne;
    User.create = origCreate;
    User.countDocuments = origCount;
    AuditLog.create = origAuditCreate;

    assert.strictEqual(res.statusCode, 201, `Expected status 201, got ${res.statusCode}`);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.staff.name, 'Dr. Ananya Sharma');
  });

  // TEST 2: Admin Assigns Committee Member to Case
  await runTest('Admin Assigns Committee Member to Case (Updates Case, Conversation & Timeline)', async () => {
    const origUserFindById = User.findById;
    const origCaseFindOne = Case.findOne;
    const origCaseUpdateCreate = CaseUpdate.create;
    const origAuditCreate = AuditLog.create;
    const origNotifCreate = Notification.create;
    const origConvFindOne = Conversation.findOne;
    const origMsgCreate = Message.create;

    createdCaseDoc = new Case({
      caseId: testCaseId,
      recoveryCode: hashedRecoveryCode,
      incidentCategory: 'workplace_harassment',
      description: 'Hostile workplace conduct in committee meetings.',
      status: 'submitted',
      isAnonymous: true,
      classification: { priority: 'HIGH' },
    });
    createdCaseDoc.save = async function() { return this; };

    createdConvDoc = new Conversation({
      caseId: testCaseId,
      caseRef: createdCaseDoc._id,
      incidentCategory: 'workplace_harassment',
      priority: 'HIGH',
      isAnonymous: true,
      complainantPseudonym: 'Complainant #TEST',
      assignedStaffId: null,
      status: 'active',
    });
    createdConvDoc.save = async function() { return this; };

    User.findById = async (id) => {
      if (String(id) === String(mockOfficerId1)) return mockOfficer1;
      return null;
    };
    Case.findOne = async () => createdCaseDoc;
    Conversation.findOne = async () => createdConvDoc;
    CaseUpdate.create = async () => ({});
    AuditLog.create = async () => ({});
    Notification.create = async () => ({});
    Message.create = async () => ({});

    const req = {
      params: { caseId: testCaseId },
      body: {
        staffId: mockOfficerId1.toString(),
        reason: 'Assigned as primary Presiding Officer for formal inquiry',
      },
      user: mockAdmin,
      ip: '127.0.0.1',
    };
    const res = createMockRes();

    await assignCase(req, res);

    User.findById = origUserFindById;
    Case.findOne = origCaseFindOne;
    Conversation.findOne = origConvFindOne;
    CaseUpdate.create = origCaseUpdateCreate;
    AuditLog.create = origAuditCreate;
    Notification.create = origNotifCreate;
    Message.create = origMsgCreate;

    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(String(createdCaseDoc.assignedTo), String(mockOfficerId1));
    assert.strictEqual(String(createdCaseDoc.assignedStaffId), String(mockOfficerId1));
    assert.strictEqual(createdCaseDoc.status, 'assigned');
    assert.strictEqual(createdCaseDoc.assignmentHistory.length, 1);
    assert.strictEqual(createdCaseDoc.assignmentHistory[0].newStaffName, 'Dr. Ananya Sharma');
    assert.strictEqual(String(createdConvDoc.assignedStaffId), String(mockOfficerId1));
  });

  // TEST 3: Complainant Tracks Case and Receives Assigned Officer Details
  await runTest('Complainant Tracks Case with Valid Key: Receives Assigned Officer Profile', async () => {
    const origCaseFindOne = Case.findOne;
    const origCaseUpdateFind = CaseUpdate.find;

    Case.findOne = () => ({
      select: () => ({
        populate: async () => {
          createdCaseDoc.assignedTo = mockOfficer1;
          createdCaseDoc._assignedOfficer = mockOfficer1;
          return createdCaseDoc;
        },
      }),
    });
    CaseUpdate.find = () => ({
      sort: () => ({
        select: async () => [
          { status: 'assigned', message: 'Case assigned to Dr. Ananya Sharma', createdAt: new Date() },
        ],
      }),
    });

    const req = {
      body: {
        caseId: testCaseId,
        recoveryCode: rawRecoveryCode,
      },
    };
    const res = createMockRes();

    await trackCase(req, res);

    Case.findOne = origCaseFindOne;
    CaseUpdate.find = origCaseUpdateFind;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.case.assignedOfficer, 'assignedOfficer should be populated');
    assert.strictEqual(res.data.case.assignedOfficer.name, 'Dr. Ananya Sharma');
    assert.strictEqual(res.data.case.assignedOfficer.designation, 'Senior Professor & Presiding Officer');
    assert.strictEqual(res.data.case.assignedOfficer.icRole, 'presiding_officer');
    assert.strictEqual(res.data.case.assignedOfficer.email, 'ananya.sharma@institution.ac.in');
    assert.strictEqual(res.data.case.assignedOfficer.officialPhone, '+91 98765 43210');
    assert.strictEqual(res.data.case.assignedOfficer.isContactPublic, true);
    assert.strictEqual(res.data.case.assignedOfficer.communicationStatus, 'Available / Contact Through Secure Portal');
  });

  // TEST 4: Invalid Recovery Key Cannot Access Officer Details
  await runTest('Invalid Recovery Key Rejection (401 - Zero Officer Details Exposed)', async () => {
    const origCaseFindOne = Case.findOne;

    Case.findOne = () => ({
      select: () => ({
        populate: async () => createdCaseDoc,
      }),
    });

    const req = {
      body: {
        caseId: testCaseId,
        recoveryCode: 'WRONG_CODE_9999',
      },
    };
    const res = createMockRes();

    await trackCase(req, res);

    Case.findOne = origCaseFindOne;

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.case, undefined);
  });

  // TEST 5: Case Reassignment Updates History, Officer Details & Notifies Complainant
  await runTest('Case Reassignment Updates Officer, Appends Audit History & Syncs Conversation', async () => {
    const origUserFindById = User.findById;
    const origCaseFindOne = Case.findOne;
    const origConvFindOne = Conversation.findOne;
    const origCaseUpdateCreate = CaseUpdate.create;
    const origAuditCreate = AuditLog.create;
    const origNotifCreate = Notification.create;
    const origMsgCreate = Message.create;

    let timelineMessageCreated = '';
    let systemNoticeCreated = '';

    User.findById = async (id) => {
      if (String(id) === String(mockOfficerId1)) return mockOfficer1;
      if (String(id) === String(mockOfficerId2)) return mockOfficer2;
      return null;
    };
    Case.findOne = async () => createdCaseDoc;
    Conversation.findOne = async () => createdConvDoc;
    CaseUpdate.create = async (doc) => {
      timelineMessageCreated = doc.message;
      return doc;
    };
    AuditLog.create = async () => ({});
    Notification.create = async () => ({});
    Message.create = async (doc) => {
      systemNoticeCreated = doc.content;
      return doc;
    };

    const req = {
      params: { caseId: testCaseId },
      body: {
        staffId: mockOfficerId2.toString(),
        reason: 'Recusal of initial officer; reassigned to External Legal Specialist for impartiality',
      },
      user: mockAdmin,
      ip: '127.0.0.1',
    };
    const res = createMockRes();

    await assignCase(req, res);

    User.findById = origUserFindById;
    Case.findOne = origCaseFindOne;
    Conversation.findOne = origConvFindOne;
    CaseUpdate.create = origCaseUpdateCreate;
    AuditLog.create = origAuditCreate;
    Notification.create = origNotifCreate;
    Message.create = origMsgCreate;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(String(createdCaseDoc.assignedTo), String(mockOfficerId2));
    assert.strictEqual(createdCaseDoc.assignmentHistory.length, 2);
    const latestReassignment = createdCaseDoc.assignmentHistory[1];
    assert.strictEqual(latestReassignment.previousStaffName, 'Dr. Ananya Sharma');
    assert.strictEqual(latestReassignment.newStaffName, 'Adv. Rajesh Verma');
    assert.ok(latestReassignment.reason.includes('Recusal'));

    // Check timeline and conversation notifications
    assert.ok(timelineMessageCreated.includes('reassigned to Adv. Rajesh Verma'));
    assert.ok(systemNoticeCreated.includes('Adv. Rajesh Verma'));
    assert.strictEqual(String(createdConvDoc.assignedStaffId), String(mockOfficerId2));
  });

  // TEST 6: Private Contact Number Protection (isContactPublic = false)
  await runTest('Private Contact Privacy Protection (isContactPublic=false yields null phone)', async () => {
    const origCaseFindOne = Case.findOne;
    const origCaseUpdateFind = CaseUpdate.find;

    Case.findOne = () => ({
      select: () => ({
        populate: async () => {
          createdCaseDoc.assignedTo = mockOfficer2;
          createdCaseDoc._assignedOfficer = mockOfficer2;
          return createdCaseDoc;
        },
      }),
    });
    CaseUpdate.find = () => ({
      sort: () => ({
        select: async () => [],
      }),
    });

    const req = {
      body: {
        caseId: testCaseId,
        recoveryCode: rawRecoveryCode,
      },
    };
    const res = createMockRes();

    await trackCase(req, res);

    Case.findOne = origCaseFindOne;
    CaseUpdate.find = origCaseUpdateFind;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.case.assignedOfficer.name, 'Adv. Rajesh Verma');
    assert.strictEqual(res.data.case.assignedOfficer.icRole, 'external_member');
    assert.strictEqual(res.data.case.assignedOfficer.isContactPublic, false);
    // Private phone must NOT be leaked
    assert.strictEqual(res.data.case.assignedOfficer.officialPhone, null);
  });

  // TEST 7: Staff Workload Calculation
  await runTest('Staff Workload Calculation (activeCasesCount calculated correctly)', async () => {
    const origUserFind = User.find;
    const origCaseCount = Case.countDocuments;

    User.find = () => ({
      select: () => ({
        sort: async () => [
          {
            ...mockOfficer1,
            toObject: () => ({ ...mockOfficer1 }),
          },
          {
            ...mockOfficer2,
            toObject: () => ({ ...mockOfficer2 }),
          },
        ],
      }),
    });

    Case.countDocuments = async ({ assignedTo }) => {
      if (String(assignedTo) === String(mockOfficerId2)) return 3;
      return 1;
    };

    const req = { user: mockAdmin };
    const res = createMockRes();

    await getAllStaff(req, res);

    User.find = origUserFind;
    Case.countDocuments = origCaseCount;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.staff.length, 2);
    assert.strictEqual(res.data.staff[0].activeCasesCount, 1);
    assert.strictEqual(res.data.staff[1].activeCasesCount, 3);
  });
}

runAll().then(() => {
  console.log('\n========================================================================');
  console.log(`ASSIGNED OFFICER TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');
  if (failedCount > 0) process.exit(1);
  process.exit(0);
}).catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
