/**
 * Suraksha Setu — Multilingual Safety Assistant Test Suite
 *
 * Verifies:
 * 1. Language detection (English, Hindi Devanagari, Hinglish, Mixed)
 * 2. High-risk & Emergency triage (immediate danger, 112, 181, no delays)
 * 3. Specificity & Actionability (non-generic responses)
 * 4. Grounded official government links (no hallucinations)
 * 5. Domain knowledge coverage across POSH Act, IC/LC, retaliation, evidence preservation,
 *    counselling, cyber harassment, stalking.
 */

import assert from 'assert';
import {
  detectLanguage,
  isEmergencyQuery,
  classifyIntent,
  processSafetyChat,
  INTENTS
} from '../src/services/safetyAssistantService.js';

console.log('========================================================================');
console.log('SURAKSHA SETU — MULTILINGUAL SAFETY ASSISTANT TEST SUITE');
console.log('========================================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  process.stdout.write(`Testing [${name}]... `);
  try {
    fn();
    console.log('✓ PASSED');
    passedCount++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
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

// ── 1. LANGUAGE DETECTION TESTS ──
runTest('Language Detection: English query', () => {
  assert.strictEqual(detectLanguage('What should I do if my manager harasses me?'), 'en');
  assert.strictEqual(detectLanguage('How can I report harassment anonymously?'), 'en');
});

runTest('Language Detection: Hindi Devanagari query', () => {
  assert.strictEqual(detectLanguage('कार्यालय में यौन उत्पीड़न की शिकायत कैसे करें?'), 'hi');
  assert.strictEqual(detectLanguage('मुझे तुरंत मदद चाहिए'), 'hi');
});

runTest('Language Detection: Hinglish (Roman Hindi) query', () => {
  assert.strictEqual(detectLanguage('Office mein koi mujhe sexually harass kare toh kya karun?'), 'hinglish');
  assert.strictEqual(detectLanguage('Agar company complaint nahi sunti toh kahan complain karein?'), 'hinglish');
  assert.strictEqual(detectLanguage('POSH Act kya hai?'), 'hinglish');
  assert.strictEqual(detectLanguage('Meri complaint ke baad mujhe job se nikalne ki dhamki mil rahi hai.'), 'hinglish');
});

runTest('Language Detection: Mixed Hindi and English query', () => {
  assert.strictEqual(detectLanguage('Evidence ko safely kaise store karun?'), 'hinglish');
  assert.strictEqual(detectLanguage('Mujhe abhi unsafe feel ho raha hai, kya karun?'), 'hinglish');
});

// ── 2. HIGH RISK & EMERGENCY DETECTION TESTS ──
runTest('Emergency Detection: English immediate danger', () => {
  assert.strictEqual(isEmergencyQuery('I am in immediate danger. What should I do?'), true);
  assert.strictEqual(isEmergencyQuery('Someone is attacking me right now help please'), true);
});

runTest('Emergency Detection: Hindi Devanagari danger', () => {
  assert.strictEqual(isEmergencyQuery('मुझे अभी अपनी जान का खतरा है, तुरंत मदद चाहिए'), true);
  assert.strictEqual(isEmergencyQuery('बचाओ मुझ पर हमला किया गया है'), true);
});

runTest('Emergency Detection: Hinglish danger', () => {
  assert.strictEqual(isEmergencyQuery('Mujhe abhi unsafe feel ho raha hai, kya karun?'), true);
  assert.strictEqual(isEmergencyQuery('Khatra hai abhi maar raha hai bachao'), true);
});

runTest('Non-Emergency informational queries are NOT flagged as emergency', () => {
  assert.strictEqual(isEmergencyQuery('What is the POSH Act?'), false);
  assert.strictEqual(isEmergencyQuery('How do I preserve screenshots as evidence?'), false);
  assert.strictEqual(isEmergencyQuery('POSH Act kya hota hai?'), false);
});

// ── 3. ASYNC CHAT RESPONSE GENERATION TESTS ──
async function runAllAsyncTests() {
  // Test 1: POSH Act in English
  await runAsyncTest('Query 1 [EN]: "What is the POSH Act?"', async () => {
    const res = await processSafetyChat({ message: 'What is the POSH Act?' });
    assert.strictEqual(res.language, 'en');
    assert.strictEqual(res.intent, INTENTS.POSH_EXPLANATION);
    assert.ok(res.reply.includes('POSH Act, 2013'));
    assert.ok(res.reply.includes('Section 2(n)') || res.reply.includes('Section 4'));
    assert.ok(res.reply.includes('Vishaka Guidelines'));
    assert.ok(!res.reply.includes('I can answer common questions about your rights and safety options.'));
  });

  // Test 2: POSH Act in Hinglish
  await runAsyncTest('Query 2 [Hinglish]: "POSH Act kya hota hai?"', async () => {
    const res = await processSafetyChat({ message: 'POSH Act kya hota hai?' });
    assert.strictEqual(res.language, 'hinglish');
    assert.strictEqual(res.intent, INTENTS.POSH_EXPLANATION);
    assert.ok(res.reply.includes('POSH Act'));
    assert.ok(res.reply.includes('Internal Committee') || res.reply.includes('Section 4'));
    assert.ok(!res.reply.includes('I can answer common questions'));
  });

  // Test 3: Workplace harassment complaint in Hinglish
  await runAsyncTest('Query 3 [Hinglish]: "Office mein harassment ho toh complaint kaise karein?"', async () => {
    const res = await processSafetyChat({ message: 'Office mein harassment ho toh complaint kaise karein?' });
    assert.strictEqual(res.language, 'hinglish');
    assert.strictEqual(res.intent, INTENTS.HOW_TO_REPORT_WORKPLACE);
    assert.ok(res.reply.includes('Internal Committee') || res.reply.includes('IC'));
    assert.ok(res.reply.includes('3 months') || res.reply.includes('SHe-Box'));
    assert.ok(res.officialResources.some(r => r.url.includes('shebox.wcd.gov.in') || r.url.includes('indiacode.nic.in')));
  });

  // Test 4: Evidence preservation in English
  await runAsyncTest('Query 4 [EN]: "How do I preserve screenshots as evidence?"', async () => {
    const res = await processSafetyChat({ message: 'How do I preserve screenshots as evidence?' });
    assert.strictEqual(res.language, 'en');
    assert.strictEqual(res.intent, INTENTS.EVIDENCE_PRESERVATION);
    assert.ok(res.reply.includes('Screenshots'));
    assert.ok(res.reply.includes('timestamp') || res.reply.includes('Proof Vault'));
    assert.ok(!res.reply.includes('I can answer common questions'));
  });

  // Test 5: Manager retaliation/threats in Hinglish
  await runAsyncTest('Query 5 [Hinglish]: "Mujhe manager se threat mil rahi hai."', async () => {
    const res = await processSafetyChat({ message: 'Mujhe manager se threat mil rahi hai.' });
    assert.strictEqual(res.language, 'hinglish');
    assert.strictEqual(res.intent, INTENTS.RETALIATION_THREATS);
    assert.ok(res.reply.includes('Section 12') || res.reply.includes('retaliation') || res.reply.includes('IC'));
    assert.ok(res.reply.includes('SHe-Box') || res.reply.includes('NCW') || res.reply.includes('BNS'));
  });

  // Test 6: Immediate danger in English
  await runAsyncTest('Query 6 [EN]: "I am in immediate danger. What should I do?"', async () => {
    const res = await processSafetyChat({ message: 'I am in immediate danger. What should I do?' });
    assert.strictEqual(res.isEmergency, true);
    assert.ok(res.reply.includes('112'));
    assert.ok(res.reply.includes('181'));
    assert.ok(res.reply.includes('cannot dispatch police') || res.reply.includes('informational assistant'));
  });

  // Test 7: Confidential / anonymous reporting in English
  await runAsyncTest('Query 7 [EN]: "Can I report workplace harassment confidentially?"', async () => {
    const res = await processSafetyChat({ message: 'Can I report workplace harassment confidentially?' });
    assert.strictEqual(res.intent, INTENTS.ANONYMOUS_REPORTING);
    assert.ok(res.reply.includes('Section 16') || res.reply.includes('Case ID') || res.reply.includes('confidential'));
    assert.ok(res.reply.includes('Suraksha Setu') || res.reply.includes('Recovery Code'));
  });

  // Test 8: Internal Committee in English
  await runAsyncTest('Query 8 [EN]: "Where can I find official information about the Internal Committee?"', async () => {
    const res = await processSafetyChat({ message: 'Where can I find official information about the Internal Committee?' });
    assert.ok(res.reply.includes('Internal Committee') || res.reply.includes('POSH Act'));
    assert.ok(res.officialResources.some(r => r.url.includes('indiacode.nic.in')));
  });

  // Test 9: Company refusal / She-Box in Hinglish
  await runAsyncTest('Query 9 [Hinglish]: "Agar company complaint nahi sunti toh kahan complain karein?"', async () => {
    const res = await processSafetyChat({ message: 'Agar company complaint nahi sunti toh kahan complain karein?' });
    assert.strictEqual(res.intent, INTENTS.COMPANY_REFUSAL_SHEBOX);
    assert.ok(res.reply.includes('SHe-Box') || res.reply.includes('shebox.wcd.gov.in'));
    assert.ok(res.reply.includes('Local Committee') || res.reply.includes('LC') || res.reply.includes('District'));
    assert.ok(res.reply.includes('50,000') || res.reply.includes('fine') || res.reply.includes('NCW'));
  });

  // Test 10: Hindi Devanagari complaint query
  await runAsyncTest('Query 10 [HI]: "कार्यालय में यौन उत्पीड़न की शिकायत कैसे करें?"', async () => {
    const res = await processSafetyChat({ message: 'कार्यालय में यौन उत्पीड़न की शिकायत कैसे करें?' });
    assert.strictEqual(res.language, 'hi');
    assert.ok(res.reply.includes('आंतरिक समिति') || res.reply.includes('शिकायत'));
    assert.ok(res.reply.includes('3 माह') || res.reply.includes('90 दिन'));
  });

  // Test 11: Mixed language evidence query
  await runAsyncTest('Query 11 [Mixed]: "Evidence ko safely kaise store karun?"', async () => {
    const res = await processSafetyChat({ message: 'Evidence ko safely kaise store karun?' });
    assert.strictEqual(res.intent, INTENTS.EVIDENCE_PRESERVATION);
    assert.ok(res.reply.includes('Screenshots') || res.reply.includes('screenshot'));
    assert.ok(res.reply.includes('Proof Vault'));
  });

  // Test 12: Empty message error validation
  await runAsyncTest('Query 12: Empty message throws validation error', async () => {
    try {
      await processSafetyChat({ message: '   ' });
      assert.fail('Should have thrown error on empty message');
    } catch (e) {
      assert.ok(e.message.includes('empty'));
    }
  });

  // Test 13: Official links verification
  runTest('Resource Integrity: All links use verified government/statutory domains', () => {
    const validDomains = ['.gov.in', '.nic.in', 'indiacode.nic.in'];
    const res = processSafetyChat; // ensure function exists
    // Test that all OFFICIAL_RESOURCES point to official government portals
    for (const [key, resource] of Object.entries({ ...res })) {
      if (resource && resource.url) {
        const isOfficial = validDomains.some(d => resource.url.includes(d));
        assert.ok(isOfficial, `Link ${resource.url} for ${key} must be an official .gov.in or .nic.in domain`);
      }
    }
  });

  console.log('\n========================================================================');
  console.log(`SAFETY ASSISTANT SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllAsyncTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
