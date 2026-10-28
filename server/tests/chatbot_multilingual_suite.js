/**
 * Suraksha Setu — Multilingual Safety Chatbot Unit & Regression Test Suite
 */

import assert from 'assert';
import { generateChatbotResponse, detectLanguage, isEmergencySituation } from '../src/services/safetyChatbotEngine.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    process.stdout.write(`Testing [${name}]... `);
    fn();
    console.log('✓ PASSED');
    passed++;
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

console.log('========================================================================');
console.log('SURAKSHA SETU — MULTILINGUAL SAFETY CHATBOT TEST SUITE');
console.log('========================================================================\n');

// 1. Language Detection Tests
runTest('Language Detection: English query', () => {
  assert.strictEqual(detectLanguage('What is the POSH Act?'), 'english');
});

runTest('Language Detection: Devanagari Hindi query', () => {
  assert.strictEqual(detectLanguage('पॉश अधिनियम क्या है और शिकायत कैसे करें?'), 'hindi');
});

runTest('Language Detection: Hinglish Roman Hindi query', () => {
  assert.strictEqual(detectLanguage('Office mein koi mujhe sexually harass kare toh kya karun?'), 'hinglish');
});

runTest('Language Detection: Mixed language query', () => {
  const lang = detectLanguage('Company complaint nahi sunti toh kahan report submit karein?');
  assert.ok(lang === 'hinglish' || lang === 'mixed');
});

// 2. High-Risk / Emergency Test Cases
runTest('Emergency 1: Immediate danger trigger (English)', () => {
  const res = generateChatbotResponse('I am in immediate danger. What should I do?');
  assert.strictEqual(res.isEmergency, true);
  assert.ok(res.reply.includes('112'));
  assert.ok(res.reply.includes('181'));
  assert.strictEqual(res.category, 'emergency_crisis');
});

runTest('Emergency 2: Immediate threat / weapon (Hinglish)', () => {
  const res = generateChatbotResponse('Mujhe abhi unsafe feel ho raha hai, jaan ka khatra hai');
  assert.strictEqual(res.isEmergency, true);
  assert.ok(res.reply.includes('112'));
  assert.ok(res.reply.includes('181'));
});

runTest('Emergency 3: Acute danger in Hindi', () => {
  const res = generateChatbotResponse('मेरी जान को खतरा है मुझे बचाओ');
  assert.strictEqual(res.isEmergency, true);
  assert.ok(res.reply.includes('112'));
});

// 3. Workplace Harassment & Uncomfortable Messages (User Example)
runTest('Workplace Harassment: Manager uncomfortable messages (Hinglish)', () => {
  const res = generateChatbotResponse('Office mein manager mujhe baar-baar uncomfortable messages bhej raha hai. Main kya karun?');
  assert.strictEqual(res.isEmergency, false);
  assert.strictEqual(res.category, 'workplace_sexual_harassment');
  assert.ok(res.reply.toLowerCase().includes('internal committee') || res.reply.includes('IC'));
  assert.ok(res.reply.toLowerCase().includes('preserve') || res.reply.toLowerCase().includes('screenshot'));
  assert.ok(res.reply.toLowerCase().includes('steps') || res.reply.toLowerCase().includes('3 months'));
  assert.ok(res.officialResources && res.officialResources.length > 0);
});

// 4. Retaliation & Threat of Termination
runTest('Retaliation: Job loss threat after complaint (Hinglish)', () => {
  const res = generateChatbotResponse('Meri complaint ke baad mujhe job se nikalne ki dhamki mil rahi hai.');
  assert.strictEqual(res.category, 'retaliation_and_threats');
  assert.ok(res.reply.includes('Section 12') || res.reply.includes('धारा 12'));
  assert.ok(res.reply.toLowerCase().includes('interim relief'));
});

runTest('Retaliation: Job loss threat in Devanagari Hindi', () => {
  const res = generateChatbotResponse('शिकायत के बाद मुझे नौकरी से निकालने की धमकी दी जा रही है।');
  assert.strictEqual(res.category, 'retaliation_and_threats');
  assert.ok(res.reply.includes('धारा 12') || res.reply.includes('अंतरिम राहत'));
});

// 5. Company Ignored Complaint / No IC
runTest('No IC / Company not listening (Hinglish)', () => {
  const res = generateChatbotResponse('Agar company complaint nahi sunti toh kahan complain karein?');
  assert.strictEqual(res.category, 'external_remedies_no_ic');
  assert.ok(res.reply.includes('Local Committee') || res.reply.includes('LC'));
  assert.ok(res.reply.includes('NCW') || res.reply.includes('7827170170'));
});

// 6. POSH Act Overview
runTest('POSH Act overview (English & Hinglish)', () => {
  const resEn = generateChatbotResponse('What is the POSH Act?');
  assert.strictEqual(resEn.category, 'posh_compliance');
  assert.ok(resEn.reply.includes('2013'));
  assert.ok(resEn.reply.includes('Internal Committee'));

  const resHi = generateChatbotResponse('POSH Act kya hota hai?');
  assert.strictEqual(resHi.category, 'posh_compliance');
  assert.ok(resHi.reply.toLowerCase().includes('internal committee') || resHi.reply.includes('IC'));
});

// 7. Evidence Preservation
runTest('Evidence Preservation (English & Hinglish)', () => {
  const res = generateChatbotResponse('How do I preserve screenshots as evidence?');
  assert.strictEqual(res.category, 'evidence_preservation');
  assert.ok(res.reply.toLowerCase().includes('timestamp') || res.reply.toLowerCase().includes('headers'));
  assert.ok(res.reply.toLowerCase().includes('vault'));
});

// 8. Confidentiality & Anonymous Reporting
runTest('Anonymous reporting & confidentiality', () => {
  const res = generateChatbotResponse('Can I report workplace harassment confidentially?');
  assert.strictEqual(res.category, 'confidentiality_and_anonymity');
  assert.ok(res.reply.includes('Section 16'));
});

// 9. Vishaka Guidelines Distinction
runTest('Vishaka Guidelines distinction', () => {
  const res = generateChatbotResponse('Difference between Vishaka Guidelines and POSH Act');
  assert.strictEqual(res.category, 'legal_history_distinction');
  assert.ok(res.reply.includes('1997'));
  assert.ok(res.reply.includes('Supreme Court'));
  assert.ok(res.reply.includes('2013'));
});

console.log('\n========================================================================');
console.log(`TOTAL SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================================\n');

if (failed > 0) process.exit(1);

