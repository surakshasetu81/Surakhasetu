/**
 * Suraksha Setu — Deterministic Safety Priority Rules (Layer 2)
 * Version: 2026.3
 *
 * This module runs independently of machine learning models.
 * It applies transparent, audited safety safeguards to prioritize human review.
 *
 * CORE POLICY:
 * 1. Severe sexual violence allegations (rape, forced intercourse, penetration,
 *    attempted rape, physical restraint with sexual assault) are DETERMINISTICALLY
 *    classified as HIGH priority for urgent trained human review.
 * 2. An ML prediction of LOW, missing evidence, short narrative, anonymous status,
 *    or historical timeframe CANNOT downgrade an urgent safety safeguard.
 * 3. Informational queries ("What is the POSH Act?", "How to form an IC?") are
 *    distinguished from actual incident reports to avoid false positives.
 * 4. Immediate self-harm concerns trigger urgent crisis pathways without mental-health diagnosis.
 * 5. Minor safeguarding concerns trigger restricted statutory POCSO review pathways.
 */

export const RULE_VERSION = '2026.3';

// ─────────────────────────────────────────────────────────────────────────────
// REGEX PATTERNS (Multilingual: English, Devanagari Hindi, Romanized Hinglish)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Severe Sexual Violence Indicators (Always HIGH Priority Safeguard)
const SEVERE_SEXUAL_VIOLENCE_PATTERNS = [
  // English (including common transcription / spelling variations like 'rapped', 'reped')
  /\b(rap+ed|rap(e|ing|ist)|reped|repist|attempted\s+rape|forced\s+(sexual\s+intercourse|intercourse|sex|penetration|oral)|non-consensual\s+sexual\s+penetration|sexually\s+assault(ed)?|forced\s+into\s+sex|sexual\s+violence)\b/i,
  /\b(physically\s+restrained(\s+me)?\s+and\s+(attempted\s+to\s+)?(sexually\s+assault|rape|molest))\b/i,
  /\b(forced\s+(me|her|myself|us)\s+to\s+have\s+sex)\b/i,
  /\b(i\s+was\s+(raped|rapped|reped)\s+by)\b/i,
  /\b((raped|rapped|reped)\s+by\s+(my\s+)?(hr|manager|boss|colleague|supervisor|officer|senior|director|doctor))\b/i,
  // Hindi (Devanagari - handle boundaries with non-Devanagari ranges)
  /(?:^|[^\u0900-\u097F])(बलात्कार|दुष्कर्म|जबरन\s*यौन\s*संबंध|यौन\s*हमला|यौन\s*हिंसा|जबरदस्ती\s*संबंध\s*बनाया|गलत\s*काम\s*किया)(?:$|[^\u0900-\u097F])/u,
  // Hinglish
  /\b(balat?kaar?|dush?karm|zabardasti\s+sexual\s+relation|zabardasti\s+relation\s+banaya|forced\s+sex|sexually\s+assault\s+kiya|galat\s+kaam\s+kiya)\b/i,
];

// 2. Immediate Danger / Life Threat Patterns
const IMMEDIATE_DANGER_PATTERNS = [
  /\b(immediate\s+danger|life\s+threat|kill\s+(me|us|her)|knife|weapon|gun|acid|armed|murder|strangled|choking)\b/i,
  /(?:^|[^\u0900-\u097F])(जान\s*को\s*खतरा|मार\s*डालेगा|मारने\s*की\s*धमकी|खतरे\s*में\s*हूँ|तेज़ाब\s*फेंक|चाकू)(?:$|[^\u0900-\u097F])/u,
  /\b(jaan\s*ka\s*khatra|maar\s*dalega|attacked\s*right\s*now|in\s*danger\s*now|acid\s*attack|chaku)\b/i,
];

// 3. Physical Violence, Battery, or Restraint Patterns
const PHYSICAL_FORCE_PATTERNS = [
  /\b(physical(ly)?\s+assault(ed)?|hit\s+me|beaten|slapped|strangled|pushed\s+down|locked\s+(the\s+)?door|cornered\s+me|restrained\s+me|pulled\s+me|grabbed\s+my\s+arm)\b/i,
  /(?:^|[^\u0900-\u097F])(मारपीट|शारीरिक\s*हमला|हाथापाई|हाथ\s*पकड़ा|कमरे\s*में\s*बंद|धक्का\s*दिया|थप्पड़\s*मारा)(?:$|[^\u0900-\u097F])/u,
  /\b(maarpeet|zabardasti\s+haath\s+pakda|physical\s*force|haath\s*uthaya|kamre\s*me\s*band)\b/i,
];

// 4. Escalating Threat, Extortion, Stalking Patterns
const ONGOING_THREAT_PATTERNS = [
  /\b(blackmail(ing)?|extort(ion)?|leak\s+(photos|videos|nudes|pictures)|threaten(ing|ed)?\s+to\s+(ruin|terminate|kill)|stalk(ing)?\s+(my\s+)?(home|car|house)|following\s+(me|my\s+car))\b/i,
  /(?:^|[^\u0900-\u097F])(धमकी\s*दे\s*रहा|ब्लैकमेल|फोटो\s*वायरल|पीछा\s*कर\s*रहा|घर\s*तक\s*पीछा)(?:$|[^\u0900-\u097F])/u,
  /\b(dhamki\s*de\s*raha|viral\s*kar\s*dunga|peechha\s*kar\s*raha|tracking\s*me|photos\s*viral)\b/i,
];

// 5. Immediate Self-Harm Concern Patterns
const SELF_HARM_PATTERNS = [
  /\b(hurt\s+myself|harm\s+myself|end\s+my\s+life|kill\s+myself|suicide|take\s+my\s+own\s+life|don't\s+want\s+to\s+live)\b/i,
  /(?:^|[^\u0900-\u097F])(खुद\s*को\s*नुकसान|जान\s*दे\s*दूंगी|आत्महत्या|जीना\s*नहीं\s*चाहती)(?:$|[^\u0900-\u097F])/u,
  /\b(khud\s*ko\s*nuksan|jaan\s*de\s*dung(a|i)|suicide|marne\s*ka\s*mann)\b/i,
];

// 6. Child Safeguarding (POCSO) Patterns
const MINOR_SAFEGUARDING_PATTERNS = [
  /\b(minor|child|under\s*18|school\s*student|14\s*year|13\s*year|15\s*year|16\s*year|daughter|pocso|kid)\b/i,
  /(?:^|[^\u0900-\u097F])(नाबालिग|बच्ची|बालक|बालिका|पॉक्सो|स्कूल\s*छात्रा)(?:$|[^\u0900-\u097F])/u,
  /\b(nabalig|bachi|chhoti\s*bachhi|under\s*18)\b/i,
];

// 7. Informational / Awareness-Only Patterns (Policy, FAQ, Academic)
const INFORMATIONAL_PATTERNS = [
  /\b(how\s+can\s+i\s+(report|file|submit)|how\s+to\s+(report|file|submit)|what\s+is\s+the\s+procedure\s+to\s+report|how\s+does\s+one\s+report|seeking\s+legal\s+awareness|what\s+is\s+the\s+policy|awareness\s+brochures|posh\s+guidelines|composition\s+of\s+(the\s+)?internal\s+committee|information\s+regarding|what\s+is\s+the\s+standard\s+procedure|what\s+is\s+the\s+limitation\s+period|download\s+the\s+official\s+posh|posh\s+training\s+conduct|template\s+for\s+recording|complaint\s+box|where\s+can\s+i\s+download)\b/i,
  /(?:^|[^\u0900-\u097F])(दिशानिर्देश\s*और\s*पॉश\s*अधिनियम\s*के\s*नियमों\s*की\s*जानकारी|हेल्पलाइन.*की\s*सत्यापित\s*सूची|प्रक्रिया\s*क्या\s*है|जागरूकता\s*सामग्री|शिकायत\s*कैसे\s*(दर्ज|करें|करे))(?:$|[^\u0900-\u097F])/u,
  /\b(kya\s+aap\s+awareness\s+material|process\s+samjha\s+dijiye|rules\s+samajhne\s+hain|training\s+conduct\s+karni\s+hai|shikayat\s+kaise\s+kare)\b/i,
];

// First-person victimization cues to avoid treating genuine complaints as informational
const FIRST_PERSON_VICTIM_CUES = [
  /\b(on\s+me|to\s+me|with\s+me|against\s+me|my\s+supervisor|my\s+manager|my\s+director|my\s+colleague|he\s+attacked|he\s+forced|he\s+touched|he\s+threatened|i\s+was|i\s+am\s+afraid|i\s+experienced|i\s+feel)\b/i,
  /(?:^|[^\u0900-\u097F])(मेरे\s*साथ|मुझ\s*पर|मुझे|मेरा\s*रास्ता|मेरे\s*साथ\s*हाथापाई)(?:$|[^\u0900-\u097F])/u,
  /\b(mere\s*saath|mujh\s*par|mujhe|mera\s*haath|mere\s*manager)\b/i,
];

// Ambiguous narrative regex
const AMBIGUOUS_NARRATIVE_REGEX = /^(i\s+need\s+help\s+understanding\s+something(\s+that\s+happened(\s+at\s+work)?)?|something\s+happened|help\s+me|kuch\s+hua\s+hai|मदद\s*चाहिए)[\.\?!]*$/i;

/**
 * Evaluates deterministic safety rules on a submitted complaint narrative.
 *
 * @param {Object} input - Incident data
 * @param {string} input.incidentCategory - Category of incident
 * @param {string} input.description - Free text narrative
 * @param {Array<string>} [input.supportRequired] - Requested assistance types
 * @param {boolean} [input.isUrgent] - User-reported urgent flag
 * @param {Object} [input.safetyIndicators] - Optional structured indicators
 * @returns {Object} Comprehensive safety assessment
 */
export function evaluateSafetyRules(input) {
  const description = (input.description || '').trim();
  const category = input.incidentCategory || '';
  const support = Array.isArray(input.supportRequired) ? input.supportRequired : [];
  const indicators = input.safetyIndicators || {};

  const priorityReasons = [];
  const recommendedActions = [];
  const safetyFlags = [];
  let isUrgentOverride = false;
  let currentEmergency = 'UNKNOWN';
  let conductCategory = 'UNSPECIFIED';

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 0: Informational / Policy Query Detection
  // (Prevents educational/legal questions from triggering crime alarms)
  // ─────────────────────────────────────────────────────────────────────────
  const isInformationalPhrase = INFORMATIONAL_PATTERNS.some(rx => rx.test(description));
  const hasFirstPersonVictimCue = FIRST_PERSON_VICTIM_CUES.some(rx => rx.test(description));

  // If text is purely an informational question with no first-person victim allegation
  const isPureInformational = isInformationalPhrase && !hasFirstPersonVictimCue && !indicators.immediateDangerReported && !indicators.physicalForceReported;

  if (isPureInformational) {
    return {
      priority: 'LOW',
      priorityReasons: ['General informational request or procedural awareness inquiry without reported victim incident'],
      recommendedActions: [
        'Provide verified POSH Act and workplace policy documentation resources',
        'Direct user to standard compliance templates and training materials',
      ],
      classificationMethod: 'DETERMINISTIC_SAFETY_RULE',
      ruleVersion: RULE_VERSION,
      isUrgentOverride: false,
      reviewStatus: 'INFORMATIONAL_INQUIRY',
      currentEmergency: 'NONE',
      conductCategory: 'INFORMATIONAL_INQUIRY',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 1: Severe Sexual Violence Safeguard (MANDATORY HIGH)
  // ─────────────────────────────────────────────────────────────────────────
  const hasSevereSexualViolence = SEVERE_SEXUAL_VIOLENCE_PATTERNS.some(rx => rx.test(description));

  if (hasSevereSexualViolence) {
    priorityReasons.push('Serious sexual violence allegation reported; urgent human review recommended.');
    recommendedActions.push('Immediate internal committee notification and expedited specialized human review protocol');
    recommendedActions.push('Provide verified confidential medical, psychological counselling, and emergency 112 guidance');
    safetyFlags.push('SEVERE_SEXUAL_VIOLENCE_REPORTED');
    isUrgentOverride = true;
    conductCategory = 'ALLEGED_SEXUAL_VIOLENCE';
    currentEmergency = IMMEDIATE_DANGER_PATTERNS.some(rx => rx.test(description)) || indicators.immediateDangerReported
      ? 'ACUTE'
      : 'HISTORICAL_OR_NON_ACUTE';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 2: Immediate Self-Harm Concern Safeguard (MANDATORY HIGH)
  // ─────────────────────────────────────────────────────────────────────────
  const hasSelfHarmConcern = SELF_HARM_PATTERNS.some(rx => rx.test(description));

  if (hasSelfHarmConcern) {
    priorityReasons.push('Immediate self-harm concern reported; urgent safety assessment and crisis support recommended.');
    recommendedActions.push('Display India National Tele-MANAS (14416) and Kiran (1800-599-0019) mental health helpline guidance immediately');
    recommendedActions.push('Route for immediate crisis welfare assessment without clinical diagnosis');
    safetyFlags.push('SELF_HARM_SAFETY_CONCERN');
    isUrgentOverride = true;
    currentEmergency = 'ACUTE';
    if (conductCategory === 'UNSPECIFIED') conductCategory = 'SAFETY_CRISIS';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 3: Child Safeguarding (POCSO / Minor Concern) (MANDATORY HIGH)
  // ─────────────────────────────────────────────────────────────────────────
  const isMinorReported = indicators.targetIsMinor || category === 'child_abuse' || MINOR_SAFEGUARDING_PATTERNS.some(rx => rx.test(description));

  if (isMinorReported) {
    priorityReasons.push('Child safeguarding concern identified under statutory POCSO framework; immediate human review required.');
    recommendedActions.push('Statutory child-safeguarding escalation pursuant to Section 19 of POCSO Act 2012');
    recommendedActions.push('Ensure complete non-disclosure of child identity and assign to trained safeguarding officer');
    safetyFlags.push('CHILD_SAFEGUARDING_TRIGGER');
    isUrgentOverride = true;
    if (conductCategory === 'UNSPECIFIED') conductCategory = 'ALLEGED_CHILD_OFFENCE';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 4: Immediate Physical Danger or Life Threat
  // ─────────────────────────────────────────────────────────────────────────
  const hasImmediateDanger = indicators.immediateDangerReported || input.isUrgent || IMMEDIATE_DANGER_PATTERNS.some(rx => rx.test(description));

  if (hasImmediateDanger) {
    priorityReasons.push('Immediate safety hazard or life-safety threat reported by complainant');
    recommendedActions.push('Emergency 112 assistance guidance displayed and expedited case intake initiated');
    safetyFlags.push('IMMEDIATE_DANGER_REPORTED');
    isUrgentOverride = true;
    currentEmergency = 'ACUTE';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 5: Physical Violence, Assault, Restraint
  // ─────────────────────────────────────────────────────────────────────────
  const hasPhysicalForce = indicators.physicalForceReported || category === 'domestic_violence' || PHYSICAL_FORCE_PATTERNS.some(rx => rx.test(description));

  if (hasPhysicalForce && !hasSevereSexualViolence) {
    priorityReasons.push('Reported physical force, battery, or bodily restraint in connection with complaint');
    recommendedActions.push('Safety assessment, evidence preservation guidance, and supervisory inquiry review');
    safetyFlags.push('PHYSICAL_FORCE_REPORTED');
    isUrgentOverride = true;
    if (conductCategory === 'UNSPECIFIED') conductCategory = 'PHYSICAL_ASSAULT';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 6: Escalating Threats, Stalking, Extortion
  // ─────────────────────────────────────────────────────────────────────────
  const hasOngoingThreats = indicators.ongoingThreats || indicators.stalkingOrTracking || ONGOING_THREAT_PATTERNS.some(rx => rx.test(description));

  if (hasOngoingThreats) {
    priorityReasons.push('Ongoing extortion, cyber tracking, or persistent stalking detected');
    recommendedActions.push('Evidence preservation protocol and protective interim relief consideration');
    safetyFlags.push('ONGOING_THREAT_OR_STALKING');
    isUrgentOverride = true;
    if (conductCategory === 'UNSPECIFIED') conductCategory = 'STALKING_OR_EXTORTION';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 7: Urgent Support Requested Explicitly by User
  // ─────────────────────────────────────────────────────────────────────────
  if (support.includes('urgent_safety')) {
    priorityReasons.push('Complainant explicitly requested urgent crisis and safety assistance');
    recommendedActions.push('Priority helpline dispatch and expedited case acknowledgment');
    isUrgentOverride = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVALUATION OUTCOME: HIGH PRIORITY IMMUTABLE OVERRIDE
  // ─────────────────────────────────────────────────────────────────────────
  if (isUrgentOverride) {
    return {
      priority: 'HIGH',
      priorityReasons,
      recommendedActions,
      classificationMethod: 'DETERMINISTIC_SAFETY_OVERRIDE',
      ruleVersion: RULE_VERSION,
      isUrgentOverride: true,
      reviewStatus: 'PENDING_URGENT_HUMAN_REVIEW',
      currentEmergency,
      conductCategory,
      safetyFlags,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 8: Ambiguous / Vague Narrative (Provisional Review)
  // ─────────────────────────────────────────────────────────────────────────
  if (AMBIGUOUS_NARRATIVE_REGEX.test(description) || description.length < 25) {
    return {
      priority: 'MEDIUM',
      priorityReasons: ['Submitted narrative requires clarification; assigned for provisional human review without making adverse assumptions'],
      recommendedActions: [
        'Contact complainant through confidential channel to request clarification of specific conduct and timeline',
        'Provide structured complaint guidance to help complainant detail their concerns',
      ],
      classificationMethod: 'DETERMINISTIC_SAFETY_RULE',
      ruleVersion: RULE_VERSION,
      isUrgentOverride: false,
      reviewStatus: 'CLARIFICATION_REQUIRED',
      currentEmergency: 'UNKNOWN',
      conductCategory: 'AMBIGUOUS_SUBMISSION',
      safetyFlags: ['AMBIGUOUS_NARRATIVE'],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 9: Medium Priority (Workplace Harassment, Hostile Environment)
  // ─────────────────────────────────────────────────────────────────────────
  const isWorkplaceConcern = ['sexual_harassment', 'workplace_harassment', 'discrimination', 'cyber_crime'].includes(category);
  const formalInquiryRequested = support.includes('formal_complaint');

  if (isWorkplaceConcern || formalInquiryRequested || indicators.ongoingHarassment || indicators.fearOfRetaliation) {
    const medReasons = [];
    if (category === 'sexual_harassment') medReasons.push('Workplace sexual harassment allegation requiring statutory Internal Committee inquiry review');
    if (category === 'workplace_harassment') medReasons.push('Reported workplace harassment or hostile work environment');
    if (category === 'discrimination') medReasons.push('Workplace discrimination or professional retaliation concern');
    if (formalInquiryRequested) medReasons.push('Complainant requested formal inquiry proceeding under POSH Act');
    if (indicators.fearOfRetaliation) medReasons.push('Reported fear of professional retaliation or appraisal penalty');

    return {
      priority: 'MEDIUM',
      priorityReasons: medReasons.length > 0 ? medReasons : ['Report requires structured committee assessment and inquiry planning'],
      recommendedActions: [
        'Assign to designated Internal Committee (IC) member within standard statutory timeframe',
        'Review documentation and schedule preliminary intake discussion with complainant',
      ],
      classificationMethod: 'DETERMINISTIC_SAFETY_RULE',
      ruleVersion: RULE_VERSION,
      isUrgentOverride: false,
      reviewStatus: 'PENDING_HUMAN_REVIEW',
      currentEmergency: 'NONE',
      conductCategory: 'WORKPLACE_SEXUAL_HARASSMENT',
      safetyFlags: [],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK 10: Low Priority (Standard Non-Urgent)
  // ─────────────────────────────────────────────────────────────────────────
  return {
    priority: 'LOW',
    priorityReasons: ['General information request or documentation-only record without reported ongoing safety hazard'],
    recommendedActions: [
      'Standard informational review workflow',
      'Provide educational and policy guidance resources',
    ],
    classificationMethod: 'DETERMINISTIC_SAFETY_RULE',
    ruleVersion: RULE_VERSION,
    isUrgentOverride: false,
    reviewStatus: 'PENDING_HUMAN_REVIEW',
    currentEmergency: 'NONE',
    conductCategory: 'GENERAL_INQUIRY',
    safetyFlags: [],
  };
}
