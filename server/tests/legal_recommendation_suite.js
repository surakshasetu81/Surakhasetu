/**
 * Suraksha Setu — Legal Category & Applicable Law Recommendation Engine Test Suite
 *
 * Verifies all 10 required test scenarios (Tests A through J):
 * Test A: Workplace Sexual Harassment (POSH Act, 2013)
 * Test B: General Workplace Bullying (Not POSH; General Misconduct / Clarification)
 * Test C: Stalking (BNS 2023 Section 78)
 * Test D: Child-Safeguarding Concern (POCSO Act, 2012)
 * Test E: Higher Education Institution (UGC Regulations, 2015 + POSH)
 * Test F: Online Conduct (IT Act 2000 contextual analysis)
 * Test G: Multiple Potential Frameworks (Multi-label POSH + BNS)
 * Test H: Insufficient Information (ADDITIONAL_INFORMATION_NEEDED)
 * Test I: Unavailable ML Service (Graceful fallback, complaint submission proceeds)
 * Test J: Hallucinated Section Prevention (Only verified KB provisions permitted)
 */

import assert from 'assert';
import { generateLegalAssessment } from '../src/services/legalAssessmentEngine.js';
import {
  LEGAL_KB_VERSION,
  VERIFIED_LEGAL_FRAMEWORKS,
  getVerifiedProvisions,
  getFrameworkById,
} from '../src/services/legalKnowledgeBase.js';

let passed = 0;
let failed = 0;

async function runTestCase(testId, name, testFn) {
  try {
    await testFn();
    console.log(`✓ [${testId}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ [${testId}] FAILED: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function runAllLegalTests() {
  console.log('\n================================================================');
  console.log(' SURAKSHA SETU — LEGAL CATEGORY & APPLICABLE LAW TEST SUITE');
  console.log('================================================================\n');

  // Test A: Workplace Sexual Harassment
  await runTestCase('Test A', 'Workplace Sexual Harassment suggests POSH Act 2013 and verified provisions', async () => {
    const input = {
      narrative: 'Senior manager in our Mumbai branch repeatedly makes sexually colored remarks, touched my hand during meetings without consent, and stated that my appraisal depends on visiting his hotel room on tour.',
      contextType: 'workplace',
      incidentCategory: 'sexual_harassment',
    };
    const res = await generateLegalAssessment(input);
    assert.strictEqual(res.assessmentType, 'LEGAL_CATEGORY_RECOMMENDATION');
    assert.strictEqual(res.status, 'PRELIMINARY');
    assert.strictEqual(res.incidentCategory.label, 'Workplace Sexual Harassment');

    const posh = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('POSH'));
    assert.ok(posh, 'Must recommend POSH Act 2013');
    assert.ok(posh.candidateProvisions.length > 0, 'Must include candidate provisions');
    assert.ok(posh.candidateProvisions.some(p => p.section === 'Section 2(n)'), 'Must include Section 2(n)');
    assert.ok(posh.candidateProvisions.some(p => p.section === 'Section 3'), 'Must include Section 3');
    assert.ok(posh.officialSources.length > 0, 'Must include official sources');
  });

  // Test B: General Workplace Bullying
  await runTestCase('Test B', 'General Workplace Bullying is NOT classified as POSH sexual harassment', async () => {
    const input = {
      narrative: 'Project manager constantly micromanages my tasks, excluded me from team lunch, and sends rude emails about formatting typos. There is no sexual conduct or sexual remarks, but unfair treatment and mental harassment.',
      contextType: 'workplace',
      incidentCategory: 'workplace_harassment',
    };
    const res = await generateLegalAssessment(input);
    assert.notStrictEqual(res.incidentCategory.label, 'Workplace Sexual Harassment', 'Must NOT classify general non-sexual bullying as sexual harassment');
    assert.ok(res.incidentCategory.label.includes('Bullying') || res.incidentCategory.label.includes('Misconduct'));

    const hasPosh = res.potentiallyRelevantFrameworks.some(f => f.shortName.includes('POSH'));
    assert.strictEqual(hasPosh, false, 'POSH Act must NOT be assigned to non-sexual workplace incivility');

    const internalMisconduct = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('HR Policy'));
    assert.ok(internalMisconduct, 'Should point to internal HR grievance channels and service rules');
  });

  // Test C: Stalking
  await runTestCase('Test C', 'Stalking considers candidate BNS Section 78 provisions without final finding', async () => {
    const input = {
      narrative: 'A colleague has been following my car home every evening after office, watches outside my apartment gate, and sends messages tracking my movements.',
      contextType: 'workplace',
      incidentCategory: 'workplace_harassment',
    };
    const res = await generateLegalAssessment(input);
    const bns = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('BNS'));
    assert.ok(bns, 'Must identify BNS 2023 for repeated stalking');
    assert.ok(bns.candidateProvisions.some(p => p.section === 'Section 78'), 'Must include candidate Section 78 stalking');
    assert.strictEqual(bns.applicabilityStatus, 'REQUIRES_HUMAN_REVIEW');
    assert.ok(res.disclaimer.includes('preliminary legal information'));
  });

  // Test D: Child-Safeguarding Concern
  await runTestCase('Test D', 'Child-safeguarding concern suggests POCSO Act candidate provisions', async () => {
    const input = {
      narrative: 'A school tuition teacher touched a 14-year-old minor student inappropriately and threatened her not to tell her family.',
      contextType: 'educational',
      targetMinor: true,
      incidentCategory: 'child_abuse',
    };
    const res = await generateLegalAssessment(input);
    const pocso = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('POCSO'));
    assert.ok(pocso, 'Must recommend POCSO Act 2012');
    assert.ok(pocso.candidateProvisions.some(p => p.section.includes('Section 11')), 'Must include Section 11/12 sexual harassment of child');
    assert.ok(pocso.candidateProvisions.some(p => p.section.includes('Section 19')), 'Must include mandatory reporting duty');
  });

  // Test E: Higher Education Institution
  await runTestCase('Test E', 'Higher Education campus harassment considers UGC Regulations 2015 and POSH', async () => {
    const input = {
      narrative: 'Assistant professor at university physics department demands sexual favours from a post-graduate female research scholar in exchange for approving doctoral dissertation.',
      contextType: 'higher_education',
      incidentCategory: 'sexual_harassment',
    };
    const res = await generateLegalAssessment(input);
    const ugc = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('UGC'));
    assert.ok(ugc, 'Must recommend UGC Regulations 2015 for higher education');
    assert.ok(ugc.candidateProvisions.some(p => p.section.includes('Regulation 4')), 'Must include Regulation 4 (ICC in HEIs)');

    const posh = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('POSH'));
    assert.ok(posh, 'Must also consider POSH Act as complementary statutory framework');
  });

  // Test F: Online Conduct
  await runTestCase('Test F', 'Online conduct with private photo/video violation considers IT Act 2000', async () => {
    const input = {
      narrative: 'Someone recorded private video of me and posted it across Instagram and WhatsApp groups with defamatory sexually explicit remarks.',
      contextType: 'cyber',
      isOnline: true,
      incidentCategory: 'cyber_crime',
    };
    const res = await generateLegalAssessment(input);
    const itAct = res.potentiallyRelevantFrameworks.find(f => f.shortName.includes('IT Act'));
    assert.ok(itAct, 'Must recommend Information Technology Act 2000');
    assert.ok(itAct.candidateProvisions.some(p => p.section.includes('66E') || p.section.includes('67')), 'Must include Section 66E or 67');
  });

  // Test G: Multiple Potential Frameworks
  await runTestCase('Test G', 'Multiple potential frameworks (workplace harassment + stalking) returns both', async () => {
    const input = {
      narrative: 'Manager in my team cornered me in the office and made physical sexual overtures, and now follows me to the metro station every evening and stands outside my apartment door.',
      contextType: 'workplace',
      incidentCategory: 'sexual_harassment',
    };
    const res = await generateLegalAssessment(input);
    assert.ok(res.potentiallyRelevantFrameworks.length >= 2, 'Must recommend multiple frameworks');
    const hasPosh = res.potentiallyRelevantFrameworks.some(f => f.shortName.includes('POSH'));
    const hasBns = res.potentiallyRelevantFrameworks.some(f => f.shortName.includes('BNS'));
    assert.ok(hasPosh, 'Must include POSH Act');
    assert.ok(hasBns, 'Must include BNS 2023');
  });

  // Test H: Insufficient Information
  await runTestCase('Test H', 'Vague or short description returns ADDITIONAL_INFORMATION_NEEDED without inventing sections', async () => {
    const input = {
      narrative: 'Something happened.',
      contextType: 'workplace',
    };
    const res = await generateLegalAssessment(input);
    assert.strictEqual(res.status, 'ADDITIONAL_INFORMATION_NEEDED');
    assert.strictEqual(res.potentiallyRelevantFrameworks.length, 0, 'Must NOT invent frameworks on vague input');
    assert.ok(res.additionalInformationNeeded.length > 0, 'Must provide clarification questions');
  });

  // Test I: Unavailable ML Service
  await runTestCase('Test I', 'Service unavailability or timeout invokes graceful deterministic fallback', async () => {
    // Temporarily point ML service to an unreachable port
    process.env.ML_SERVICE_URL = 'http://127.0.0.1:9998';
    const input = {
      narrative: 'Colleague touched me inappropriately at the office and demanded sexual favours.',
      contextType: 'workplace',
      incidentCategory: 'sexual_harassment',
    };
    const res = await generateLegalAssessment(input);
    assert.ok(res, 'Must return a valid response without crashing');
    assert.ok(res.potentiallyRelevantFrameworks.some(f => f.shortName.includes('POSH')));
    assert.strictEqual(res.modelMetadata.assessmentMethod, 'rule_assisted_knowledge_base');
    delete process.env.ML_SERVICE_URL;
  });

  // Test J: Hallucinated Section Prevention
  await runTestCase('Test J', 'Hallucinated or unverified legal sections are filtered out', () => {
    // Test getVerifiedProvisions with a hallucinated section "Section 999XYZ"
    const verified = getVerifiedProvisions('posh_act_2013', ['Section 2(n)', 'Section 999XYZ_FAKE', 'Section 12']);
    assert.ok(verified.some(p => p.section === 'Section 2(n)'));
    assert.ok(verified.some(p => p.section === 'Section 12'));
    assert.strictEqual(verified.some(p => p.section === 'Section 999XYZ_FAKE'), false, 'Fake/hallucinated section must be stripped');
  });

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAllLegalTests();
