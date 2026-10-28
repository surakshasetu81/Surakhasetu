/**
 * Suraksha Setu — Synthetic Safety Triage & Legal Recommendation Regression Suite
 *
 * Validates the 12 critical regression scenarios mandated by specification:
 * 1. Alleged Rape ("Someone forced sexual intercourse on me...") -> HIGH
 * 2. Attempted Rape with Restraint -> HIGH
 * 3. Serious Sexual Violence (Historical) -> HIGH (never downgraded for elapsed time)
 * 4. Repeated Workplace Harassment -> MEDIUM (POSH Act)
 * 5. General POSH Question -> LOW (informational, no crime escalation)
 * 6. Missing Evidence -> HIGH (never downgraded for lack of attachments)
 * 7. Hindi Narrative -> HIGH (बलात्कार)
 * 8. Hinglish Narrative -> HIGH (zabardasti sexual relation)
 * 9. Emotional Distress -> MEDIUM (counselling offered, no clinical diagnosis)
 * 10. Immediate Self-Harm Concern -> HIGH (safety crisis pathway, 112 guidance)
 * 11. Ambiguous Narrative -> Provisional review / clarification required (not auto-LOW)
 * 12. Child-Safeguarding Concern -> HIGH (POCSO statutory pathway)
 */

import { evaluateSafetyRules } from '../src/services/safetyPriorityRules.js';
import { generateLegalAssessment } from '../src/services/legalAssessmentEngine.js';

const REGRESSION_CASES = [
  {
    id: 'TC-01',
    name: 'Alleged Rape (English Narrative)',
    input: {
      description: 'Someone forced sexual intercourse on me. I want to report the incident and need help.',
      incidentCategory: 'other',
      isUrgent: false,
      safetyIndicators: {},
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Expected HIGH priority, got: ${result.priority}`);
      }
      if (!result.isUrgentOverride) {
        throw new Error('Expected isUrgentOverride to be true');
      }
      const hasRapeReason = result.priorityReasons.some(r => /serious sexual violence|sexual violence/i.test(r));
      if (!hasRapeReason) {
        throw new Error(`Expected serious sexual violence reason, got: ${JSON.stringify(result.priorityReasons)}`);
      }
    },
    async assertLegal(legal) {
      const bns = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('BNS'));
      if (!bns) {
        throw new Error('Expected BNS 2023 to be recommended for rape allegation');
      }
      const sections = bns.candidateSections || bns.candidateProvisions.map(p => p.section);
      if (!sections.includes('Section 63') || !sections.includes('Section 64')) {
        throw new Error(`Expected BNS Sections 63 & 64, got: ${JSON.stringify(sections)}`);
      }
    },
  },
  {
    id: 'TC-02',
    name: 'Attempted Rape With Physical Restraint',
    input: {
      description: 'My colleague physically restrained me and attempted to sexually assault me. I am afraid the person may approach me again.',
      incidentCategory: 'workplace_harassment',
      isUrgent: true,
      safetyIndicators: { physicalForceReported: true, ongoingThreats: true },
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') throw new Error(`Expected HIGH, got: ${result.priority}`);
      if (!result.isUrgentOverride) throw new Error('Expected isUrgentOverride to be true');
    },
    async assertLegal(legal) {
      const fws = (legal.potentiallyRelevantFrameworks || []).map(f => f.shortName);
      if (!fws.some(f => f.includes('BNS'))) throw new Error('Expected BNS 2023 for assault/attempted rape');
    },
  },
  {
    id: 'TC-03',
    name: 'Serious Sexual Violence, Historical Incident',
    input: {
      description: 'I experienced rape several months ago. I am now seeking information and support.',
      incidentCategory: 'other',
      isUrgent: false,
      safetyIndicators: { immediateDangerReported: false },
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Historical rape MUST still be HIGH priority for specialized human review, got: ${result.priority}`);
      }
      if (result.currentEmergency === 'ACUTE') {
        throw new Error('Historical incident should not be flagged as ACUTE current emergency unless ongoing danger');
      }
    },
    async assertLegal(legal) {
      const bns = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('BNS'));
      if (!bns) throw new Error('Expected BNS 2023 recommendation for historical rape report');
    },
  },
  {
    id: 'TC-04',
    name: 'Repeated Workplace Sexual Harassment',
    input: {
      description: 'My supervisor repeatedly makes unwanted sexual remarks and threatens my appraisal if I complain.',
      incidentCategory: 'sexual_harassment',
      supportRequired: ['formal_complaint'],
      safetyIndicators: { ongoingHarassment: true, fearOfRetaliation: true },
    },
    expectedPriority: 'MEDIUM',
    assertRules(result) {
      if (result.priority !== 'MEDIUM') throw new Error(`Expected MEDIUM for workplace harassment without acute physical danger, got: ${result.priority}`);
    },
    async assertLegal(legal) {
      const posh = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('POSH'));
      if (!posh) throw new Error('Expected POSH Act 2013 recommendation for workplace sexual harassment');
    },
  },
  {
    id: 'TC-05',
    name: 'General POSH Question (Purely Informational)',
    input: {
      description: 'How can I submit a workplace harassment complaint under the POSH Act?',
      incidentCategory: 'other',
      safetyIndicators: {},
    },
    expectedPriority: 'LOW',
    assertRules(result) {
      if (result.priority !== 'LOW') {
        throw new Error(`Informational question should be LOW priority, got: ${result.priority}`);
      }
      if (result.reviewStatus !== 'INFORMATIONAL_INQUIRY') {
        throw new Error(`Expected reviewStatus INFORMATIONAL_INQUIRY, got: ${result.reviewStatus}`);
      }
    },
    async assertLegal(legal) {
      // Should not escalate to criminal BNS rape
      const hasCriminalRape = (legal.potentiallyRelevantFrameworks || []).some(f =>
        f.candidateSections && f.candidateSections.includes('Section 63')
      );
      if (hasCriminalRape) throw new Error('Informational POSH question should not recommend criminal rape provisions');
    },
  },
  {
    id: 'TC-06',
    name: 'Missing Evidence (Sexual Assault)',
    input: {
      description: 'I was sexually assaulted, but I do not have documents or files to upload.',
      incidentCategory: 'other',
      safetyIndicators: {},
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Missing evidence must NEVER downgrade a serious assault allegation, got: ${result.priority}`);
      }
    },
  },
  {
    id: 'TC-07',
    name: 'Hindi Narrative (बलात्कार)',
    input: {
      description: 'मेरे साथ बलात्कार हुआ है और मुझे मदद चाहिए।',
      incidentCategory: 'other',
      safetyIndicators: {},
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Hindi rape report must be HIGH priority, got: ${result.priority}`);
      }
    },
    async assertLegal(legal) {
      const bns = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('BNS'));
      if (!bns) throw new Error('Expected BNS recommendation for Devanagari Hindi rape report');
    },
  },
  {
    id: 'TC-08',
    name: 'Hinglish Narrative (zabardasti sexual relation)',
    input: {
      description: 'Mere saath zabardasti sexual relation banaya gaya. Mujhe darr hai ki woh phir se mujhe harm karega.',
      incidentCategory: 'other',
      safetyIndicators: { ongoingThreats: true },
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Hinglish transliterated serious sexual violence must be HIGH priority, got: ${result.priority}`);
      }
    },
  },
  {
    id: 'TC-09',
    name: 'Emotional Distress Following Workplace Harassment',
    input: {
      description: 'After the harassment at work, I feel frightened, distressed and unable to concentrate. I need support.',
      incidentCategory: 'workplace_harassment',
      supportRequired: ['counselling'],
      safetyIndicators: {},
    },
    expectedPriority: 'MEDIUM',
    assertRules(result) {
      if (result.priority !== 'MEDIUM') {
        throw new Error(`Emotional distress without acute physical hazard or self-harm should be MEDIUM, got: ${result.priority}`);
      }
      // Ensure no clinical mental health diagnosis is made
      const reasons = result.priorityReasons.join(' ');
      if (/depression|bipolar|schizophrenia|disorder/i.test(reasons)) {
        throw new Error('System must not diagnose mental health disorders');
      }
    },
  },
  {
    id: 'TC-10',
    name: 'Immediate Self-Harm Concern',
    input: {
      description: 'I feel that I may hurt myself tonight because of what has been happening.',
      incidentCategory: 'other',
      safetyIndicators: {},
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Immediate self-harm concern must be HIGH priority, got: ${result.priority}`);
      }
      const hasCrisis = result.priorityReasons.some(r => /self-harm/i.test(r));
      if (!hasCrisis) throw new Error('Expected self-harm reason');
      const hasHelpline = result.recommendedActions.some(a => /Tele-MANAS|14416|Kiran/i.test(a));
      if (!hasHelpline) throw new Error('Expected emergency mental health helpline action');
    },
  },
  {
    id: 'TC-11',
    name: 'Ambiguous Narrative',
    input: {
      description: 'I need help understanding something that happened at work.',
      incidentCategory: 'other',
      safetyIndicators: {},
    },
    expectedPriority: 'MEDIUM',
    assertRules(result) {
      if (result.reviewStatus !== 'CLARIFICATION_REQUIRED') {
        throw new Error(`Ambiguous narrative must have reviewStatus CLARIFICATION_REQUIRED, got: ${result.reviewStatus}`);
      }
      if (result.priority === 'LOW') {
        throw new Error('Ambiguous submission must not be automatically discarded or marked LOW without review');
      }
    },
  },
  {
    id: 'TC-12',
    name: 'Child-Safeguarding Concern (Minor / POCSO)',
    input: {
      description: 'A report indicates possible sexual abuse involving a person under 18.',
      incidentCategory: 'sexual_harassment',
      safetyIndicators: { targetIsMinor: true },
    },
    expectedPriority: 'HIGH',
    assertRules(result) {
      if (result.priority !== 'HIGH') {
        throw new Error(`Child safeguarding must be HIGH priority, got: ${result.priority}`);
      }
      const hasPocso = result.priorityReasons.some(r => /POCSO|child safeguarding/i.test(r));
      if (!hasPocso) throw new Error('Expected POCSO reason in child safeguarding evaluation');
    },
    async assertLegal(legal) {
      const pocso = (legal.potentiallyRelevantFrameworks || []).find(f => f.shortName.includes('POCSO'));
      if (!pocso) throw new Error('Expected POCSO Act recommendation for child under 18');
      const sections = pocso.candidateSections || pocso.candidateProvisions.map(p => p.section);
      if (!sections.some(s => s.includes('19'))) {
        throw new Error('Expected POCSO Section 19 mandatory reporting reference');
      }
    },
  },
];

async function runRegressionSuite() {
  console.log('========================================================================');
  console.log('SURAKSHA SETU — 12 SYNTHETIC SAFETY & LEGAL REGRESSION TEST SCENARIOS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const testCase of REGRESSION_CASES) {
    try {
      process.stdout.write(`Testing [${testCase.id}] ${testCase.name}... `);

      // 1. Evaluate Deterministic Safety Rules
      const ruleResult = evaluateSafetyRules(testCase.input);
      if (ruleResult.priority !== testCase.expectedPriority) {
        throw new Error(`Priority mismatch: expected ${testCase.expectedPriority}, got ${ruleResult.priority}`);
      }
      if (testCase.assertRules) {
        testCase.assertRules(ruleResult);
      }

      // 2. Evaluate Legal Framework Recommendations if applicable
      if (testCase.assertLegal) {
        const legalResult = await generateLegalAssessment({
          narrative: testCase.input.description,
          incidentCategory: testCase.input.incidentCategory,
          contextType: testCase.input.safetyIndicators?.contextType || 'workplace',
          targetMinor: Boolean(testCase.input.safetyIndicators?.targetIsMinor),
        });
        await testCase.assertLegal(legalResult);
      }

      console.log(`✓ PASSED (Priority: ${ruleResult.priority}, Method: ${ruleResult.classificationMethod})`);
      passed++;
    } catch (err) {
      console.log(`✗ FAILED`);
      console.error(`  Error: ${err.message}`);
      failures.push({ id: testCase.id, name: testCase.name, error: err.message });
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`REGRESSION SUMMARY: ${passed} / ${REGRESSION_CASES.length} PASSED (${failed} FAILED)`);
  console.log('========================================================================');

  if (failed > 0) {
    console.error('\nFailures detail:');
    failures.forEach(f => console.error(` - [${f.id}] ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('All 12 synthetic regression test scenarios passed successfully!');
    process.exit(0);
  }
}

runRegressionSuite().catch(err => {
  console.error('Fatal regression suite error:', err);
  process.exit(1);
});
