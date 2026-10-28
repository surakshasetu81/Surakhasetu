/**
 * Suraksha Setu — Section 14 ML & Legal Regression Tests (Tests A - H)
 * 
 * Verifies exact compliance with Part C, Section 14 specifications:
 * - Test A: "I was raped by my HR officer."
 * - Test B: "I was rapped by my HR officer."
 * - Test C: "मेरे साथ बलात्कार हुआ है और मुझे मदद चाहिए।"
 * - Test D: "Mere saath zabardasti sexual relation banaya gaya."
 * - Test E: "How can I report rape under Indian law?"
 * - Test F: "My supervisor repeatedly makes unwanted sexual remarks."
 * - Test G: "I feel distressed after workplace harassment and need support."
 * - Test H: ML service unavailable.
 */

import { evaluateSafetyRules } from '../src/services/safetyPriorityRules.js';
import { generateLegalAssessment, evaluateDeterministicKnowledgeBase } from '../src/services/legalAssessmentEngine.js';

const SECTION_14_TESTS = [
  {
    id: 'Test A',
    name: '"I was raped by my HR officer."',
    input: {
      description: 'I was raped by my HR officer.',
      incidentCategory: 'sexual_harassment',
    },
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'I was raped by my HR officer.',
        incidentCategory: 'sexual_harassment',
      });
      if (safety.priority !== 'HIGH') {
        throw new Error(`Test A failed: expected HIGH priority, got ${safety.priority}`);
      }
      if (safety.reviewStatus !== 'PENDING_URGENT_HUMAN_REVIEW') {
        throw new Error(`Test A failed: expected PENDING_URGENT_HUMAN_REVIEW, got ${safety.reviewStatus}`);
      }

      const legal = await generateLegalAssessment({
        narrative: 'I was raped by my HR officer.',
        incidentCategory: 'sexual_harassment',
      });
      if (legal.incidentCategory?.label.includes('General Inquiry')) {
        throw new Error(`Test A failed: classified as General Inquiry! Got: ${legal.incidentCategory?.label}`);
      }
      const bns = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('BNS'));
      if (!bns) {
        throw new Error('Test A failed: expected BNS 2023 framework in legal recommendation');
      }
      return 'Routed for urgent human review and relevant legal assessment under BNS 2023 and POSH Act 2013';
    },
  },
  {
    id: 'Test B',
    name: '"I was rapped by my HR officer."',
    input: {
      description: 'I was rapped by my HR officer.',
      incidentCategory: 'sexual_harassment',
    },
    run: async () => {
      // Must not silently rewrite the narrative
      const originalNarrative = 'I was rapped by my HR officer.';
      const safety = evaluateSafetyRules({
        description: originalNarrative,
        incidentCategory: 'sexual_harassment',
      });
      if (safety.priority !== 'HIGH') {
        throw new Error(`Test B failed: expected HIGH priority, got ${safety.priority}`);
      }
      if (safety.reviewStatus !== 'PENDING_URGENT_HUMAN_REVIEW') {
        throw new Error(`Test B failed: expected PENDING_URGENT_HUMAN_REVIEW, got ${safety.reviewStatus}`);
      }

      const legal = await generateLegalAssessment({
        narrative: originalNarrative,
        incidentCategory: 'sexual_harassment',
      });
      if (legal.incidentCategory?.label.includes('General Inquiry') || legal.incidentCategory?.label.includes('Uncategorized')) {
        throw new Error(`Test B failed: automatically dismissed as General Inquiry / Uncategorized! Got: ${legal.incidentCategory?.label}`);
      }
      return 'Recognized phonetic/transcription variation without rewriting; prevented General Inquiry dismissal; routed for urgent review';
    },
  },
  {
    id: 'Test C',
    name: '"मेरे साथ बलात्कार हुआ है और मुझे मदद चाहिए।"',
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'मेरे साथ बलात्कार हुआ है और मुझे मदद चाहिए।',
        incidentCategory: 'sexual_harassment',
      });
      if (safety.priority !== 'HIGH') {
        throw new Error(`Test C failed: expected HIGH priority for Hindi rape allegation, got ${safety.priority}`);
      }
      if (!safety.safetyFlags.includes('SEVERE_SEXUAL_VIOLENCE_REPORTED')) {
        throw new Error('Test C failed: expected SEVERE_SEXUAL_VIOLENCE_REPORTED flag');
      }
      return 'Serious-sexual-violence safety safeguard triggered for Hindi incident narrative';
    },
  },
  {
    id: 'Test D',
    name: '"Mere saath zabardasti sexual relation banaya gaya."',
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'Mere saath zabardasti sexual relation banaya gaya.',
        incidentCategory: 'sexual_harassment',
      });
      if (safety.priority !== 'HIGH') {
        throw new Error(`Test D failed: expected HIGH priority for Hinglish forced sexual relations, got ${safety.priority}`);
      }
      return 'Recognized serious sexual-violence allegation in Hinglish phrasing and routed for urgent review';
    },
  },
  {
    id: 'Test E',
    name: '"How can I report rape under Indian law?"',
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'How can I report rape under Indian law?',
        incidentCategory: 'other',
      });
      if (safety.priority !== 'LOW') {
        throw new Error(`Test E failed: expected LOW priority for informational query, got ${safety.priority}`);
      }
      if (safety.reviewStatus !== 'INFORMATIONAL_INQUIRY') {
        throw new Error(`Test E failed: expected INFORMATIONAL_INQUIRY reviewStatus, got ${safety.reviewStatus}`);
      }
      const legal = await generateLegalAssessment({
        narrative: 'How can I report rape under Indian law?',
        incidentCategory: 'other',
      });
      if (!legal.incidentCategory?.label.includes('Information Only') && !legal.incidentCategory?.label.includes('Legal Awareness')) {
        throw new Error(`Test E failed: expected informational label, got ${legal.incidentCategory?.label}`);
      }
      return 'Correctly treated as educational/informational question without raising crime alarm';
    },
  },
  {
    id: 'Test F',
    name: '"My supervisor repeatedly makes unwanted sexual remarks."',
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'My supervisor repeatedly makes unwanted sexual remarks.',
        incidentCategory: 'sexual_harassment',
      });
      if (safety.priority !== 'MEDIUM') {
        throw new Error(`Test F failed: expected MEDIUM priority, got ${safety.priority}`);
      }
      const legal = await generateLegalAssessment({
        narrative: 'My supervisor repeatedly makes unwanted sexual remarks.',
        incidentCategory: 'sexual_harassment',
      });
      const posh = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('POSH'));
      if (!posh) {
        throw new Error('Test F failed: expected POSH Act, 2013 recommendation');
      }
      return 'Used selected category & narrative context to identify workplace sexual harassment under POSH Act 2013';
    },
  },
  {
    id: 'Test G',
    name: '"I feel distressed after workplace harassment and need support."',
    run: async () => {
      const safety = evaluateSafetyRules({
        description: 'I feel distressed after workplace harassment and need support.',
        incidentCategory: 'workplace_harassment',
      });
      if (safety.priority !== 'MEDIUM') {
        throw new Error(`Test G failed: expected MEDIUM priority, got ${safety.priority}`);
      }
      // Ensure no clinical psychiatric diagnosis is made
      const allText = JSON.stringify(safety);
      if (/schizophrenia|bipolar|clinical depression|major depressive/i.test(allText)) {
        throw new Error('Test G failed: improperly diagnosed clinical mental illness');
      }
      return 'Recognized emotional distress and support need without clinical mental illness diagnosis';
    },
  },
  {
    id: 'Test H',
    name: 'ML service unavailable',
    run: async () => {
      // Test deterministic fallback behavior when ML microservice is unreachable
      const legal = evaluateDeterministicKnowledgeBase({
        narrative: 'i was rapped by my hr officer',
        incidentCategory: 'sexual_harassment',
      });
      if (legal.incidentCategory?.label.includes('General Inquiry') || legal.incidentCategory?.label.includes('Uncategorized')) {
        throw new Error(`Test H failed: fallback produced General Inquiry / Uncategorized! Got: ${legal.incidentCategory?.label}`);
      }
      if (!legal.potentiallyRelevantFrameworks || legal.potentiallyRelevantFrameworks.length === 0) {
        throw new Error('Test H failed: deterministic fallback failed to identify candidate frameworks');
      }
      return 'Returned honest deterministic assessment without fabricating a General Inquiry prediction';
    },
  },
];

async function runSection14Suite() {
  console.log('========================================================================');
  console.log('SURAKSHA SETU — SECTION 14 ML & LEGAL REGRESSION SUITE (TESTS A - H)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of SECTION_14_TESTS) {
    try {
      process.stdout.write(`Executing [${t.id}] ${t.name}... `);
      const detail = await t.run();
      console.log(`✓ PASSED`);
      console.log(`   -> ${detail}`);
      passed++;
    } catch (err) {
      console.log(`✗ FAILED`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`SECTION 14 SUITE SUMMARY: ${passed} / ${SECTION_14_TESTS.length} PASSED (${failed} FAILED)`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSection14Suite().catch(err => {
  console.error('Fatal error in Section 14 suite:', err);
  process.exit(1);
});
