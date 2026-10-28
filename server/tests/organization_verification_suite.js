/**
 * Suraksha Setu — Organization Verification Comprehensive Test Suite
 * 
 * Verifies all 11 test scenarios required by the specification:
 * 1. Employee type checks: Employee ID requirements.
 * 2. Student type checks: College ID requirements.
 * 3. Missing IDs are rejected with informative error messages.
 * 4. Invalid IDs failing regex rules do not result in verification.
 * 5. Successful verification works when valid organization & ID are provided.
 * 6. Verification failures (e.g. unconfigured organization, domain mismatch) handled correctly.
 * 7. Anonymous reporting remains available without forced verification.
 * 8. Verified organization information is cleanly associated with the complaint.
 * 9. Tampered frontend state (claimed isVerified: true without valid token) is rejected by backend.
 * 10. Existing complaint submission without organization continues to work seamlessly.
 * 11. Public tracking strips all internal ID hashes and confidential information.
 */

import assert from 'assert';
import jwt from 'jsonwebtoken';
import {
  verifyOrganizationDetails,
  validateVerificationToken,
  hashIdentifier,
  CONFIGURED_ORGANIZATIONS,
} from '../src/services/organizationVerificationService.js';
import Case from '../src/models/Case.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`Testing [${name}]... `);
    await fn();
    console.log('✓ PASSED');
    passed++;
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

console.log('========================================================================');
console.log('SURAKSHA SETU — ORGANIZATION VERIFICATION TEST SUITE (SCENARIOS 1 - 11)');
console.log('========================================================================\n');

// 1. Employee selects Employee and requires Employee ID
await test('Scenario 1: Employee type requires valid Employee ID', async () => {
  const res = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Apex Global Technologies',
    identifier: 'EMP-10492',
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.verified, true);
  assert.strictEqual(res.organizationType, 'employee');
  assert.ok(res.verificationToken);
});

// 2. Student selects College Student and requires College ID
await test('Scenario 2: Student type requires valid College ID', async () => {
  const res = await verifyOrganizationDetails({
    organizationType: 'college_student',
    organizationName: 'Delhi University',
    identifier: 'DU-2024891',
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.verified, true);
  assert.strictEqual(res.organizationType, 'college_student');
  assert.ok(res.verificationToken);
});

// 3. Missing IDs are rejected appropriately
await test('Scenario 3: Missing IDs are rejected appropriately', async () => {
  const resEmp = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Apex Global Technologies',
    identifier: '',
  });
  assert.strictEqual(resEmp.verified, false);
  assert.strictEqual(resEmp.code, 'MISSING_ID');

  const resStu = await verifyOrganizationDetails({
    organizationType: 'college_student',
    organizationName: 'Delhi University',
    identifier: '   ',
  });
  assert.strictEqual(resStu.verified, false);
  assert.strictEqual(resStu.code, 'MISSING_ID');
});

// 4. Invalid IDs failing regex rules do not result in successful verification
await test('Scenario 4: Invalid IDs failing organizational rules are rejected', async () => {
  // Apex expects EMP- followed by 4-6 digits
  const resBadFormat = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Apex Global Technologies',
    identifier: 'INVALID_ID_ABC',
  });

  assert.strictEqual(resBadFormat.verified, false);
  assert.strictEqual(resBadFormat.code, 'INVALID_ID_FORMAT');
  assert.ok(resBadFormat.formatHint);
});

// 5. Successful verification works when a real verification record/format exists
await test('Scenario 5: Successful verification produces signed token with zero plaintext ID', async () => {
  const res = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Tata Consultancy Services',
    identifier: 'TCS-123456',
    email: 'rahul.s@tcs.com',
  });

  assert.strictEqual(res.verified, true);
  assert.ok(res.verificationToken);

  // Decode token and verify raw ID is NOT stored
  const decoded = jwt.decode(res.verificationToken);
  assert.strictEqual(decoded.organizationName, 'Tata Consultancy Services');
  assert.strictEqual(decoded.verified, true);
  assert.strictEqual(decoded.identifier, undefined, 'Raw ID must NEVER be stored in token');
  assert.ok(decoded.idHash, 'Token must contain secure one-way hash');
});

// 6. Verification failures for unconfigured organizations and domain mismatches handled correctly
await test('Scenario 6: Unconfigured organizations and domain mismatches return clear guidance', async () => {
  // Unconfigured organization
  const resUnconfigured = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'NonExistentFakeCorp_12345',
    identifier: 'EMP-9999',
  });
  assert.strictEqual(resUnconfigured.verified, false);
  assert.strictEqual(resUnconfigured.code, 'ORGANIZATION_NOT_CONFIGURED');
  assert.ok(resUnconfigured.message.includes('No official directory or verification provider is configured'));

  // Domain mismatch
  const resDomainMismatch = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Apex Global Technologies',
    identifier: 'EMP-10492',
    email: 'user@yahoo.com', // Not apextech.com
  });
  assert.strictEqual(resDomainMismatch.verified, false);
  assert.strictEqual(resDomainMismatch.code, 'DOMAIN_MISMATCH');
});

// 7. Anonymous reporting remains available
await test('Scenario 7: Anonymous reporting remains available without forced verification', async () => {
  const testCase = new Case({
    recoveryCode: 'DUMMY_HASH',
    isAnonymous: true,
    incidentCategory: 'workplace_harassment',
    description: 'A completely anonymous report with no organization affiliation verified.',
    organizationVerification: { isVerified: false },
  });

  assert.strictEqual(testCase.isAnonymous, true);
  assert.strictEqual(testCase.organizationVerification.isVerified, false);
  assert.strictEqual(testCase.organizationVerification.organizationName, null);
});

// 8. Verified organization information is associated with the correct complaint
await test('Scenario 8: Verified organization information is associated with complaint', async () => {
  const verificationRes = await verifyOrganizationDetails({
    organizationType: 'employee',
    organizationName: 'Apex Global Technologies',
    identifier: 'EMP-44211',
  });

  const validated = validateVerificationToken(verificationRes.verificationToken);
  assert.ok(validated);

  const testCase = new Case({
    recoveryCode: 'DUMMY_HASH',
    isAnonymous: false,
    reporterName: 'Sunita Mehra',
    incidentCategory: 'workplace_harassment',
    description: 'Workplace harassment complaint from verified company employee.',
    organizationVerification: validated,
  });

  assert.strictEqual(testCase.organizationVerification.isVerified, true);
  assert.strictEqual(testCase.organizationVerification.organizationName, 'Apex Global Technologies');
  assert.strictEqual(testCase.organizationVerification.organizationType, 'employee');
});

// 9. Users cannot manipulate frontend state to bypass backend verification
await test('Scenario 9: Claimed isVerified=true without valid token is rejected by backend validator', async () => {
  // Attacker sends forged token or claimed isVerified: true with invalid token
  const forgedToken = 'ey.fake.jwt.token';
  const validated = validateVerificationToken(forgedToken);
  assert.strictEqual(validated, null, 'Forged token must return null');

  // Attacker creates a self-signed token with wrong secret
  const attackerToken = jwt.sign({ verified: true, organizationName: 'Hacked Corp' }, 'wrong_attacker_secret');
  const validatedAttacker = validateVerificationToken(attackerToken);
  assert.strictEqual(validatedAttacker, null, 'Token signed with wrong key must be rejected');
});

// 10. Existing complaint submission continues to work
await test('Scenario 10: Standard complaint submission continues to work without verification', async () => {
  const standardCase = new Case({
    recoveryCode: 'DUMMY_HASH',
    isAnonymous: true,
    incidentCategory: 'cyber_crime',
    description: 'Online trolling and harassment on social media with no organization specified.',
  });

  assert.strictEqual(standardCase.organizationVerification.isVerified, false);
  assert.strictEqual(standardCase.status, 'submitted');
});

// 11. Public tracking never exposes Employee ID, College ID, or idHash
await test('Scenario 11: Public tracking (toPublicJSON) omits confidential ID and idHash', async () => {
  const testCase = new Case({
    caseId: 'SS-TEST-ORG-1234',
    recoveryCode: 'DUMMY_HASH',
    isAnonymous: true,
    incidentCategory: 'sexual_harassment',
    description: 'Confidential case description for public tracking verification test.',
    organizationVerification: {
      isVerified: true,
      organizationType: 'college_student',
      organizationName: 'Delhi University',
      idHash: hashIdentifier('DU-987654'),
      verifiedAt: new Date(),
    },
  });

  const publicData = testCase.toPublicJSON();

  assert.strictEqual(publicData.caseId, 'SS-TEST-ORG-1234');
  assert.strictEqual(publicData.organizationVerification.isVerified, true);
  assert.strictEqual(publicData.organizationVerification.organizationName, 'Delhi University');
  assert.strictEqual(publicData.organizationVerification.organizationType, 'college_student');

  // Strict confidentiality checks
  assert.strictEqual(publicData.organizationVerification.idHash, undefined, 'idHash must NOT be in public JSON');
  assert.strictEqual(publicData.organizationVerification.identifier, undefined, 'identifier must NOT be in public JSON');
  assert.strictEqual(publicData.organizationVerification.employeeId, undefined, 'employeeId must NOT be in public JSON');
  assert.strictEqual(publicData.organizationVerification.collegeId, undefined, 'collegeId must NOT be in public JSON');
});

console.log('========================================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}

