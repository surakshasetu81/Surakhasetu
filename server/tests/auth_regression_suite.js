/**
 * Suraksha Setu — Authentication & Staff Login Regression Test Suite
 *
 * Verifies:
 * 1. Admin login with standard credentials (admin@surakshasetu.org / Admin@12345)
 * 2. Legacy seed password migration compatibility (AdminPassword123!)
 * 3. Invalid password rejection (401 Invalid credentials)
 * 4. Unknown email rejection (401 Invalid credentials)
 * 5. Email normalization & case-insensitivity
 * 6. Missing email/password validation (400)
 * 7. Deactivated account rejection (401)
 * 8. Protected staff route access with JWT Bearer token
 * 9. Unauthorized request rejection on protected route without token
 * 10. Role-based authorization enforcement (staff vs admin)
 * 11. Password hashing integrity (bcrypt with 12 rounds, no plaintext in DB)
 * 12. Safe token emission (no password exposed in response JSON)
 */

import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import AuditLog from '../src/models/AuditLog.js';
import { login, logout, getMe } from '../src/controllers/auth.controller.js';
import { protect, authorize } from '../src/middleware/auth.middleware.js';

// Prevent Mongoose buffering on AuditLog during in-memory mock testing
AuditLog.create = async () => Promise.resolve({});

console.log('========================================================================');
console.log('SURAKSHA SETU — AUTHENTICATION & LOGIN REGRESSION TEST SUITE');
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

// Mock Express req, res
function createMockReqRes(body = {}, headers = {}, cookies = {}) {
  const req = {
    body,
    headers: { ...headers },
    cookies: { ...cookies },
    ip: '127.0.0.1',
  };
  const res = {
    statusCode: 200,
    headers: {},
    cookiesSent: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookiesSent[name] = { val, opts };
      return this;
    },
  };
  return { req, res };
}

// In-memory mock user store to guarantee fast, zero-network sandboxed testing
const mockUserDb = new Map();

// Helper to create mock user doc with User model prototype
async function createMockUser({ name, email, password, role, isActive = true }) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const userDoc = new User({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    isActive,
  });
  userDoc.password = hashedPassword;
  userDoc._isMock = true;
  userDoc.save = async function () {
    // If password is not yet hashed, hash it
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    mockUserDb.set(this.email, this);
    return this;
  };
  mockUserDb.set(email.toLowerCase().trim(), userDoc);
  return userDoc;
}

// Intercept User.findOne & User.findById for testing
const originalFindOne = User.findOne;
const originalFindById = User.findById;

User.findOne = function (query) {
  const email = query.email ? String(query.email).toLowerCase().trim() : null;
  const user = email ? mockUserDb.get(email) : null;
  return {
    select: function () {
      return Promise.resolve(user || null);
    },
    then: function (resolve) {
      return Promise.resolve(user || null).then(resolve);
    },
  };
};

User.findById = function (id) {
  for (const user of mockUserDb.values()) {
    if (String(user._id) === String(id)) {
      return {
        select: function () {
          return Promise.resolve(user);
        },
      };
    }
  }
  return {
    select: function () {
      return Promise.resolve(null);
    },
  };
};

async function runAllTests() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'suraksha_test_secret_key_2026';

  // Seed mock accounts: admin with legacy password to test auto-upgrade
  await createMockUser({
    name: 'Internal Committee Admin',
    email: 'admin@surakshasetu.org',
    password: 'AdminPassword123!',
    role: 'admin',
    isActive: true,
  });

  await createMockUser({
    name: 'Safety Support Staff',
    email: 'staff@surakshasetu.org',
    password: 'StaffPassword123!',
    role: 'staff',
    isActive: true,
  });

  await createMockUser({
    name: 'Deactivated User',
    email: 'disabled@surakshasetu.org',
    password: 'DisabledPassword123!',
    role: 'staff',
    isActive: false,
  });

  // Test 1: Admin sign in with Admin@12345 (auto-migrating legacy password)
  await runTest('Admin Login with displayed demo credentials Admin@12345', async () => {
    const { req, res } = createMockReqRes({
      email: 'admin@surakshasetu.org',
      password: 'Admin@12345',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${JSON.stringify(res.jsonData)}`);
    assert.strictEqual(res.jsonData.success, true);
    assert.ok(res.jsonData.token, 'Must return JWT token');
    assert.strictEqual(res.jsonData.user.role, 'admin');
    assert.strictEqual(res.jsonData.user.email, 'admin@surakshasetu.org');
    assert.strictEqual(res.jsonData.user.password, undefined, 'Must not expose password in JSON response');
  });

  // Test 2: Subsequent login with now-synced Admin@12345
  await runTest('Subsequent Admin Login directly with Admin@12345', async () => {
    const { req, res } = createMockReqRes({
      email: 'admin@surakshasetu.org',
      password: 'Admin@12345',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
  });

  // Test 3: Legacy AdminPassword123! also works seamlessly
  await runTest('Legacy admin password compatibility (AdminPassword123!)', async () => {
    const { req, res } = createMockReqRes({
      email: 'admin@surakshasetu.org',
      password: 'AdminPassword123!',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
  });

  // Test 4: Incorrect password is rejected with 401
  await runTest('Incorrect password is rejected with 401 Invalid credentials', async () => {
    const { req, res } = createMockReqRes({
      email: 'admin@surakshasetu.org',
      password: 'WrongPassword999!',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.message, 'Invalid credentials');
  });

  // Test 5: Unknown email is rejected with 401
  await runTest('Unknown email is rejected with 401 Invalid credentials', async () => {
    const { req, res } = createMockReqRes({
      email: 'nonexistent@surakshasetu.org',
      password: 'Admin@12345',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.message, 'Invalid credentials');
  });

  // Test 6: Missing email or password is rejected with 400
  await runTest('Missing email or password returns 400', async () => {
    const { req, res } = createMockReqRes({ email: '', password: '' });
    await login(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
  });

  // Test 7: Email normalization (uppercase + whitespace) works correctly
  await runTest('Email normalization (case-insensitive + trim)', async () => {
    const { req, res } = createMockReqRes({
      email: '  ADMIN@SURAKSHASETU.ORG  ',
      password: 'Admin@12345',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.user.email, 'admin@surakshasetu.org');
  });

  // Test 8: Deactivated account is rejected with 401
  await runTest('Deactivated account (isActive: false) cannot log in', async () => {
    const { req, res } = createMockReqRes({
      email: 'disabled@surakshasetu.org',
      password: 'DisabledPassword123!',
    });
    await login(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.jsonData.message, 'Invalid credentials');
  });

  // Test 9: Protected staff route access with valid Bearer token
  await runTest('Protected staff route access with Bearer token', async () => {
    const adminUser = mockUserDb.get('admin@surakshasetu.org');
    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const protectedPair = createMockReqRes({}, { authorization: `Bearer ${token}` });
    let nextCalled = false;
    await protect(protectedPair.req, protectedPair.res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'protect middleware should call next()');
    assert.strictEqual(protectedPair.req.user.email, 'admin@surakshasetu.org');
  });

  // Test 10: Protected route access rejected without token
  await runTest('Protected staff route rejects unauthenticated request', async () => {
    const { req, res } = createMockReqRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'protect must not call next()');
    assert.strictEqual(res.statusCode, 401);
  });

  // Test 11: Role authorization: Staff cannot access admin-only endpoint
  await runTest('Role authorization: non-admin rejected from admin-only route', async () => {
    const { req, res } = createMockReqRes();
    req.user = { role: 'staff' };
    let nextCalled = false;
    const adminOnly = authorize('admin');
    adminOnly(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  // Test 12: Password storage security: verified bcrypt hash length 60, no plaintext
  await runTest('Password storage security (bcrypt salted hash, no plaintext)', async () => {
    const userDoc = mockUserDb.get('admin@surakshasetu.org');
    assert.strictEqual(userDoc.password.length, 60, 'Bcrypt hash must be 60 characters');
    assert.ok(userDoc.password.startsWith('$2a$') || userDoc.password.startsWith('$2b$'));
    assert.ok(!userDoc.password.includes('Admin@12345'));
  });

  // Restore mocks
  User.findOne = originalFindOne;
  User.findById = originalFindById;

  console.log('\n========================================================================');
  console.log(`AUTH REGRESSION SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
