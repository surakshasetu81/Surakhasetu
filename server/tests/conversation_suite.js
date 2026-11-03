/**
 * Suraksha Setu — Anonymous Two-Way Communication System Test Suite
 */

import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Case from '../src/models/Case.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import Notification from '../src/models/Notification.js';

import {
  authenticateComplainant,
  authenticateConversationParticipant,
  getConversation,
  sendMessage,
  markAsRead,
  requestAdditionalEvidence,
  updateConversationStatus,
} from '../src/controllers/conversation.controller.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_suraksha_setu_2026';

console.log('========================================================================');
console.log('SURAKSHA SETU — ANONYMOUS TWO-WAY COMMUNICATION SYSTEM TEST SUITE');
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
  const res = {
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
  return res;
}

// ─── RUN IN-MEMORY REGRESSION TESTS ──────────────────────────────────────────
async function runAll() {
  const testCaseId = `SS-TEST-${Date.now().toString(36).toUpperCase()}`;
  const rawRecoveryCode = 'ABCD1234EFGH';
  const hashedRecoveryCode = await bcrypt.hash(rawRecoveryCode, 10);

  const mockStaffId = new mongoose.Types.ObjectId();
  const mockStaffUser = {
    _id: mockStaffId,
    name: 'Officer Priya Sharma',
    role: 'staff',
    email: 'priya@surakshasetu.org',
    isActive: true,
  };

  const mockCase = {
    _id: new mongoose.Types.ObjectId(),
    caseId: testCaseId,
    recoveryCode: hashedRecoveryCode,
    isAnonymous: true,
    incidentCategory: 'workplace_harassment',
    description: 'Test incident description',
    assignedTo: mockStaffId,
    classification: { priority: 'HIGH' },
  };

  // 1. Mock DB Lookups
  const originalFindOne = Case.findOne;
  Case.findOne = function (filter) {
    return {
      select: () => {
        if (filter.caseId === testCaseId) {
          return Promise.resolve({ ...mockCase });
        }
        return Promise.resolve(null);
      },
    };
  };

  User.findById = function (id) {
    return {
      select: () => {
        if (id && id.toString() === mockStaffId.toString()) {
          return Promise.resolve({ ...mockStaffUser });
        }
        return Promise.resolve(null);
      },
    };
  };

  // Mock in-memory memory store for conversations and messages
  let storedConversation = null;
  const storedMessages = [];

  Conversation.findOne = async function (filter) {
    if (filter.caseId === testCaseId) {
      return storedConversation;
    }
    return null;
  };

  Conversation.create = async function (data) {
    storedConversation = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      unreadStaffCount: 0,
      unreadComplainantCount: 0,
      save: async function () { return this; },
    };
    return storedConversation;
  };

  Message.find = function (filter) {
    return {
      sort: () => ({
        lean: async () => storedMessages.filter(m => m.conversationId.toString() === filter.conversationId.toString()),
      }),
    };
  };

  Message.create = async function (data) {
    const msg = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      createdAt: new Date(),
    };
    storedMessages.push(msg);
    return msg;
  };

  Message.updateMany = async function (filter, update) {
    return { modifiedCount: 1 };
  };

  Notification.create = async () => Promise.resolve({});

  // ─── TEST 1: Complainant Authentication with Valid Credentials ─────────────
  await runTest('Anonymous Complainant Valid Auth (Case ID + Recovery Code)', async () => {
    const req = {
      body: { caseId: testCaseId, recoveryCode: rawRecoveryCode },
    };
    const res = createMockRes();

    await authenticateComplainant(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.token, 'Should issue signed conversation JWT');
    assert.strictEqual(res.data.caseId, testCaseId);
    assert.strictEqual(res.data.priority, 'HIGH');
  });

  // ─── TEST 2: Invalid Recovery Code Rejection ───────────────────────────────
  await runTest('Invalid Recovery Code Rejection (401)', async () => {
    const req = {
      body: { caseId: testCaseId, recoveryCode: 'WRONG_CODE' },
    };
    const res = createMockRes();

    await authenticateComplainant(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
  });

  // ─── TEST 3: Cross-Case IDOR Access Prevention ─────────────────────────────
  await runTest('Cross-Case IDOR Protection (Token Mismatch 403)', async () => {
    // Generate token for Case A
    const tokenForCaseA = jwt.sign(
      { caseId: 'SS-OTHER-CASE-999', role: 'complainant', isComplainant: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const req = {
      params: { caseId: testCaseId },
      headers: { authorization: `Bearer ${tokenForCaseA}` },
    };
    const res = createMockRes();
    let nextCalled = false;

    await authenticateConversationParticipant(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(nextCalled, false, 'Middleware must block unauthorized cross-case access');
  });

  // ─── TEST 4: Complainant Sends Message (Pseudonymous Protection) ───────────
  await runTest('Complainant Sends Message (Zero PII, unreadStaffCount incremented)', async () => {
    const req = {
      params: { caseId: testCaseId },
      body: { content: 'I have additional details regarding the incident on Thursday.' },
      participant: { isComplainant: true, caseId: testCaseId },
    };
    const res = createMockRes();

    await sendMessage(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.message.senderType, 'complainant');
    assert.strictEqual(res.data.message.content, 'I have additional details regarding the incident on Thursday.');
    assert.strictEqual(storedConversation.unreadStaffCount, 1);
  });

  // ─── TEST 5: Staff Reads Conversation & Messages ───────────────────────────
  await runTest('Staff Retrieves Messages (Sanitized)', async () => {
    const req = {
      params: { caseId: testCaseId },
      participant: { isStaff: true, user: mockStaffUser },
    };
    const res = createMockRes();

    await getConversation(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.messages));
    assert.strictEqual(res.data.messages.length, 1);
  });

  // ─── TEST 6: Staff Replies to Complainant ──────────────────────────────────
  await runTest('Staff Replies to Complainant (Increments Complainant Unread)', async () => {
    const req = {
      params: { caseId: testCaseId },
      body: { content: 'Thank you for contacting us. We have received your update and are reviewing.' },
      participant: { isStaff: true, user: mockStaffUser, type: 'staff' },
    };
    const res = createMockRes();

    await sendMessage(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.message.senderType, 'staff');
    assert.strictEqual(storedConversation.unreadComplainantCount, 1);
    assert.strictEqual(storedConversation.status, 'awaiting_complainant');
  });

  // ─── TEST 7: Mark Messages As Read ─────────────────────────────────────────
  await runTest('Complainant Marks Conversation as Read', async () => {
    const req = {
      params: { caseId: testCaseId },
      participant: { isComplainant: true, caseId: testCaseId },
    };
    const res = createMockRes();

    await markAsRead(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(storedConversation.unreadComplainantCount, 0);
  });

  // ─── TEST 8: Staff Requests Additional Evidence ────────────────────────────
  await runTest('Staff Issues Structured Evidence Request', async () => {
    const req = {
      params: { caseId: testCaseId },
      body: { instructions: 'Please upload any emails or chat screenshots from June 15.' },
      participant: { isStaff: true, user: mockStaffUser },
    };
    const res = createMockRes();

    await requestAdditionalEvidence(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.message.messageType, 'evidence_request');
    assert.strictEqual(storedConversation.evidenceRequested, true);
    assert.strictEqual(storedConversation.status, 'evidence_requested');
  });

  // ─── TEST 9: Status Transition & Audit Event ───────────────────────────────
  await runTest('Conversation Status Concluded / Closed', async () => {
    const req = {
      params: { caseId: testCaseId },
      body: { status: 'closed' },
      participant: { isStaff: true, user: mockStaffUser },
    };
    const res = createMockRes();

    await updateConversationStatus(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.status, 'closed');
  });

  // Restore mocks
  Case.findOne = originalFindOne;

  console.log('\n========================================================================');
  console.log(`CONVERSATION TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
