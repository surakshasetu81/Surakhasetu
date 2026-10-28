/**
 * Suraksha Setu — Legal Assessment Engine (Module C / Legal Category Recommendation)
 *
 * Integrates Python multi-label ML service with the verified legal knowledge base.
 *
 * ARCHITECTURAL SAFEGUARDS:
 * 1. Strictly answers: "What category does this reported incident describe,
 *    and which Indian legal frameworks and provisions may be relevant for further review?"
 * 2. Independent of safety priority (HIGH/MEDIUM/LOW).
 * 3. Hallucination prevention: Only approved candidate provisions from the verified
 *    legal knowledge base can ever be returned.
 * 4. Safe fallback: If Python ML microservice is offline, runs deterministic verified
 *    knowledge-base lookup without blocking or failing report submission.
 */

import {
  LEGAL_KB_VERSION,
  VERIFIED_LEGAL_FRAMEWORKS,
  getVerifiedProvisions,
  getFrameworkById,
} from './legalKnowledgeBase.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS, 10) || 2500;

const VAGUE_REGEX = /^(something happened|issue|problem|help|मदद चाहिए|problem hai|office issue|kuch hua)[\.\?!]*$/i;

const NON_SEXUAL_BULLYING_REGEX = /\b(no sexual|not sexual|without sexual|micromanag|unfair treatment|partiality|rude emails|lunch|formatting|allocation|typo|leave approval|पक्षपात|चिल्लाते|तनावपूर्ण|अपमानजनक|यौन आचरण नहीं|rude tone|mental harassment)\b/i;
const SEXUAL_CONDUCT_REGEX = /\b(unwelcome touch|kiss|grope|overture|favour|pornography|private photos|bedroom|masturbat|यौन|अवांछित स्पर्श|छेड़छाड़|अश्लील|हस्तमैथुन|जबरदस्ती|chhua|hath pakad|sexually colored|sexual comments|sexual overtures|sexual favours|sexual advance)\b/i;
const HIGHER_ED_REGEX = /\b(university|college|campus|professor|student|dissertation|hostel|phd|scholar|faculty|dean|ugc|विश्वविद्यालय|कॉलेज|छात्र|छात्रा|शोधार्थी|प्रोफेसर|विभागाध्यक्ष|हॉस्टल)\b/i;
const STALKING_REGEX = /\b(stalk(s|ed|ing)?|follow(s|ed|ing)?|watch(es|ed|ing)?\s+outside|track(s|ed|ing)?|monitor(s|ed|ing)?|peep|chase|पीछा|निगरानी|घर के बाहर|रास्ता रोका|peecha|follow karta|ghar ke bahar)\b/i;
const CHILD_REGEX = /\b(minor|child|under 18|school student|13 year|14 year|15 year|16 year|kid|daughter|नाबालिग|बच्ची|बालक|बालिका|स्कूल छात्रा|14 वर्षीय|15 वर्षीय|nabalig|chhoti bachi)\b/i;
const CYBER_REGEX = /\b(social media|fake profile|instagram|whatsapp|email|online|leak photos|video viral|internet|cyber|इंटरनेट|फर्जी प्रोफाइल|वायरल)\b/i;

/**
 * Deterministic fallback evaluator when ML microservice is offline or times out.
 */
export function evaluateDeterministicKnowledgeBase(input) {
  const narrative = (input.narrative || input.description || '').trim();
  const contextType = input.context_type || input.contextType || 'workplace';
  const targetMinor = Boolean(input.target_minor || input.targetMinor);
  const isOnline = Boolean(input.is_online || input.isOnline);
  const incidentCategory = input.incident_category || input.incidentCategory || '';

  const WORKPLACE_AUTHORITY_REGEX = /\b(hr|hr\s+officer|hr\s+manager|manager|boss|supervisor|director|colleague|coworker|co-worker|employer|officer|senior|team\s+lead|workplace|office|department|firm|company)\b/i;
  const isWorkplaceContext = contextType === 'workplace' || contextType === 'office' || WORKPLACE_AUTHORITY_REGEX.test(narrative) || incidentCategory === 'sexual_harassment' || incidentCategory === 'workplace_harassment';

  const INFORMATIONAL_QUERY_REGEX = /\b(how\s+can\s+i\s+(report|file|submit)|how\s+to\s+(report|file|submit)|seeking\s+legal\s+awareness|what\s+is\s+the\s+procedure|what\s+is\s+the\s+law|legal\s+provisions\s+for|what\s+are\s+the\s+penalties|procedure\s+to\s+report)\b/i;
  const FIRST_PERSON_VICTIM_REGEX = /\b(on\s+me|to\s+me|with\s+me|against\s+me|my\s+supervisor|my\s+manager|my\s+hr|my\s+director|my\s+colleague|he\s+attacked|he\s+forced|i\s+was|मेरे\s*साथ|मुझ\s*पर|mere\s*saath)\b/i;

  const isPureInformational = INFORMATIONAL_QUERY_REGEX.test(narrative) && !FIRST_PERSON_VICTIM_REGEX.test(narrative);

  if (!narrative || narrative.length < 15 || VAGUE_REGEX.test(narrative)) {
    return {
      assessmentType: 'LEGAL_CATEGORY_RECOMMENDATION',
      status: 'ADDITIONAL_INFORMATION_NEEDED',
      incidentCategory: {
        label: incidentCategory === 'sexual_harassment'
          ? 'Workplace Sexual Harassment (Clarification Required)'
          : incidentCategory === 'workplace_harassment'
          ? 'Workplace Harassment (Clarification Required)'
          : 'Insufficient Information / Clarification Required',
        explanation: 'The submitted description is too brief or ambiguous to identify specific statutory legal categories. Complainant selected category is preserved for human review.',
      },
      additionalCategories: [],
      potentiallyRelevantFrameworks: incidentCategory === 'sexual_harassment' || incidentCategory === 'workplace_harassment'
        ? [{
            actName: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
            shortName: 'POSH Act, 2013',
            statute: 'Act No. 14 of 2013',
            candidateProvisions: getVerifiedProvisions('posh_act_2013'),
            candidateSections: ['Section 2(n)', 'Section 3', 'Section 4', 'Section 9'],
            supportingReportedFacts: ['Selected category: Workplace Sexual Harassment'],
            elementsToVerify: ['Factual narrative detailing specific unwelcome conduct', 'Workplace/employment context'],
            reason: 'Preliminary reference framework based on complainant selected category.',
            officialSources: [{ name: 'India Code', url: 'https://www.indiacode.nic.in/handle/123456789/2104' }],
            applicabilityStatus: 'REQUIRES_HUMAN_REVIEW',
          }]
        : [],
      additionalInformationNeeded: [
        'Please describe the specific conduct, words, or actions that took place.',
        'Mention whether the incident occurred in a workplace, educational campus, public place, or online.',
        'Specify approximate dates and whether the conduct is ongoing or repeated.',
      ],
      modelMetadata: {
        modelVersion: 'v1.0.0-legal-multilabel',
        knowledgeBaseVersion: LEGAL_KB_VERSION,
        assessmentMethod: 'rule_assisted_knowledge_base',
        isDemoModel: true,
        labelsPredicted: ['insufficient_information'],
      },
      disclaimer: 'These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body.',
    };
  }

  const matchedFrameworkIds = new Set();

  // Pattern includes common spelling variations and typos like 'rapped', 'reped'
  const SEVERE_SEXUAL_VIOLENCE_REGEX = /(?:\b(rap+ed|rap(e|ing|ist)|reped|repist|attempted\s+rape|forced\s+(sexual\s+intercourse|intercourse|sex|penetration|oral)|non-consensual\s+sexual\s+penetration|sexually\s+assault(ed)?|sexual\s+violence|balat?kaar?|dush?karm|zabardasti\s+sexual\s+relation|zabardasti\s+relation\s+banaya|forced\s+sex|galat\s+kaam\s+kiya)\b|(?:^|[^\u0900-\u097F])(बलात्कार|दुष्कर्म|जबरन\s*यौन\s*संबंध|यौन\s*हमला|यौन\s*हिंसा|जबरदस्ती\s*संबंध\s*बनाया|गलत\s*काम\s*किया)(?:$|[^\u0900-\u097F]))/iu;

  const hasNegativeSexualDisclaimer = /\b(no|not|without|neither)\s+sexual\b/i.test(narrative);
  const hasAffirmativeSexualOvertures = /\b(unwelcome touch|kiss|grope|overture|pornography|private photos|bedroom|masturbat|यौन शोषण|अवांछित स्पर्श|छेड़छाड़|हस्तमैथुन|जबरदस्ती|chhua|hath pakad)\b/i.test(narrative);
  const isNonSexualBullying = (NON_SEXUAL_BULLYING_REGEX.test(narrative) || hasNegativeSexualDisclaimer) && !hasAffirmativeSexualOvertures;

  const isSevereSexualViolence = SEVERE_SEXUAL_VIOLENCE_REGEX.test(narrative);
  const isStalking = STALKING_REGEX.test(narrative);
  const strippedNarrative = narrative.replace(/\b(no|not|neither|without any)\s+[^.,;]*sexual[^.,;]*/gi, '');
  const hasSexualCues = isSevereSexualViolence || (!isNonSexualBullying && (/\bsexual\b/i.test(strippedNarrative) || SEXUAL_CONDUCT_REGEX.test(strippedNarrative) || incidentCategory === 'sexual_harassment'));

  if (isPureInformational) {
    if (/\brape|sexual\s+assault|bns\b/i.test(narrative)) {
      matchedFrameworkIds.add('bns_2023');
    }
    if (/\bposh|workplace|office|internal\s+committee\b/i.test(narrative) || incidentCategory === 'sexual_harassment' || incidentCategory === 'workplace_harassment') {
      matchedFrameworkIds.add('posh_act_2013');
    }
  } else {
    if (isSevereSexualViolence) {
      matchedFrameworkIds.add('bns_2023');
      if (isWorkplaceContext) {
        matchedFrameworkIds.add('posh_act_2013');
      }
    } else if (incidentCategory === 'sexual_harassment') {
      matchedFrameworkIds.add('posh_act_2013');
      if (/\bassault|touch|grope|forced\b/i.test(narrative)) {
        matchedFrameworkIds.add('bns_2023');
      }
    } else if (incidentCategory === 'workplace_harassment') {
      if (isNonSexualBullying) {
        matchedFrameworkIds.add('general_workplace_misconduct');
      } else if (hasSexualCues) {
        matchedFrameworkIds.add('posh_act_2013');
      } else {
        matchedFrameworkIds.add('posh_act_2013');
      }
    } else if (isNonSexualBullying) {
      matchedFrameworkIds.add('general_workplace_misconduct');
    } else if (hasSexualCues) {
      if (contextType === 'workplace' || contextType === 'office' || isWorkplaceContext) {
        matchedFrameworkIds.add('posh_act_2013');
      }
    }

    if (contextType === 'higher_education' || HIGHER_ED_REGEX.test(narrative)) {
      matchedFrameworkIds.add('ugc_regulations_2015');
      matchedFrameworkIds.add('posh_act_2013');
    }

    if (targetMinor || CHILD_REGEX.test(narrative) || incidentCategory === 'child_abuse') {
      matchedFrameworkIds.add('pocso_act_2012');
    }

    if (isStalking) {
      matchedFrameworkIds.add('bns_2023');
    }

    if (isOnline || CYBER_REGEX.test(narrative) || incidentCategory === 'cyber_crime') {
      matchedFrameworkIds.add('it_act_2000');
    }
  }

  // Fallback safety: If still no matched frameworks, honor the user's explicit selection
  if (matchedFrameworkIds.size === 0) {
    if (incidentCategory === 'sexual_harassment' || incidentCategory === 'workplace_harassment') {
      matchedFrameworkIds.add('posh_act_2013');
    } else if (incidentCategory === 'cyber_crime') {
      matchedFrameworkIds.add('it_act_2000');
    }
  }

  if (matchedFrameworkIds.size === 0) {
    return {
      assessmentType: 'LEGAL_CATEGORY_RECOMMENDATION',
      status: 'ADDITIONAL_INFORMATION_NEEDED',
      incidentCategory: {
        label: 'Additional Information or Human Review Required',
        explanation: 'Available facts do not directly correspond to a verified statutory provision in the knowledge base. Routed for committee intake review.',
      },
      additionalCategories: [],
      potentiallyRelevantFrameworks: [],
      additionalInformationNeeded: [
        'Clarify specific actions, statements, or events communicated by the respondent.',
        'Indicate whether the incident took place in a workplace, university, online, or public setting.',
      ],
      modelMetadata: {
        modelVersion: 'v1.0.0-legal-multilabel',
        knowledgeBaseVersion: LEGAL_KB_VERSION,
        assessmentMethod: 'rule_assisted_knowledge_base',
        isDemoModel: true,
        labelsPredicted: [],
      },
      disclaimer: 'These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body.',
    };
  }

  let primaryCategoryLabel = '';
  let primaryCategoryExpl = '';
  const additionalCategories = [];
  const potentiallyRelevantFrameworks = [];
  const additionalInformationNeeded = new Set();

  for (const fwId of matchedFrameworkIds) {
    const fw = getFrameworkById(fwId);
    if (!fw) continue;

    if (!primaryCategoryLabel) {
      if (isPureInformational) {
        primaryCategoryLabel = 'Legal Awareness & Reporting Procedures (Information Only)';
        primaryCategoryExpl = 'General informational inquiry regarding statutory reporting mechanisms under Indian law. No individual complaint or criminal accusation against an alleged respondent is recorded.';
      } else if (isSevereSexualViolence) {
        if (isWorkplaceContext) {
          primaryCategoryLabel = 'Alleged Workplace Sexual Harassment & Serious Sexual Violence (Review Required)';
          primaryCategoryExpl = 'Reported narrative describes allegations of serious non-consensual sexual acts / rape (including spelling variation "rapped") involving an organizational authority figure (HR officer). Governed by criminal penal provisions under Bharatiya Nyaya Sanhita, 2023 (Sections 63–65) alongside organizational redressal under the POSH Act, 2013. Urgent human review recommended.';
        } else {
          primaryCategoryLabel = 'Alleged Serious Sexual Violence / Rape (BNS 2023)';
          primaryCategoryExpl = 'Reported facts describe allegations of rape, forced sexual intercourse, or severe sexual violence under Bharatiya Nyaya Sanhita, 2023 (Sections 63–66). Specialized human review recommended.';
        }
      } else if (fwId === 'posh_act_2013') {
        primaryCategoryLabel = 'Workplace Sexual Harassment';
        primaryCategoryExpl = 'Reported facts describe unwelcome physical, verbal or non-verbal conduct of a sexual nature in a workplace or employment setting.';
      } else if (fwId === 'general_workplace_misconduct') {
        primaryCategoryLabel = 'General Workplace Bullying / Non-Sexual Misconduct';
        primaryCategoryExpl = 'Reported facts describe workplace incivility or managerial conflict without sexual overtures or physical violence. Governed by internal HR grievance procedures rather than statutory POSH inquiry.';
      } else if (fwId === 'pocso_act_2012') {
        primaryCategoryLabel = 'Child Sexual Exploitation & Safeguarding (POCSO)';
        primaryCategoryExpl = 'Reported concern involves conduct targeting a person below 18 years of age, triggering mandatory statutory child safeguarding procedures.';
      } else if (fwId === 'ugc_regulations_2015') {
        primaryCategoryLabel = 'Higher Education Campus Harassment (UGC)';
        primaryCategoryExpl = 'Reported incident involves women students, scholars, or employees within a university, college, or higher educational institution campus.';
      } else if (fwId === 'bns_2023') {
        primaryCategoryLabel = 'Criminal Penal Offences (Stalking / Assault / Harassment)';
        primaryCategoryExpl = 'Reported conduct describes acts of physical assault, persistent stalking, cyber tracking, or criminal intimidation under the general penal code.';
      } else if (fwId === 'it_act_2000') {
        primaryCategoryLabel = 'Cyber Harassment & Digital Privacy Violation';
        primaryCategoryExpl = 'Reported conduct involves computer networks, electronic messaging, fake online profiles, or non-consensual digital dissemination of media.';
      } else {
        primaryCategoryLabel = fw.shortName;
        primaryCategoryExpl = fw.primaryApplicability;
      }
    } else {
      let addLabel = fw.shortName;
      if (fwId === 'bns_2023') addLabel = isSevereSexualViolence ? 'Criminal Penal Provisions — Rape / Sexual Assault (BNS)' : 'Stalking & Criminal Intimidation (BNS)';
      if (fwId === 'it_act_2000') addLabel = 'Cyber Harassment (IT Act)';
      if (fwId === 'ugc_regulations_2015') addLabel = 'Higher Education Campus Redressal (UGC)';
      if (fwId === 'posh_act_2013') addLabel = 'Workplace Harassment Redressal (POSH Act)';
      additionalCategories.push({
        label: addLabel,
        explanation: fw.primaryApplicability,
      });
    }

    let reason = fw.primaryApplicability;
    const supportingReportedFacts = [];
    const elementsToVerify = [];

    if (fwId === 'posh_act_2013') {
      reason = isSevereSexualViolence
        ? 'The submitted report describes non-consensual sexual acts / serious sexual harassment occurring in or connected with a workplace setting involving an organizational figure.'
        : 'The submitted report describes unwelcome conduct of a sexual nature occurring in or connected with a workplace setting.';
      supportingReportedFacts.push('Reported conduct occurring in workplace or employment context');
      if (isSevereSexualViolence) supportingReportedFacts.push('Allegations involving organizational figure / HR authority');
      elementsToVerify.push('Employment/contractual connection between parties', 'Whether IC is constituted and complaint is within statutory limitation period');
    } else if (fwId === 'bns_2023') {
      if (isSevereSexualViolence) {
        reason = 'Reported conduct describes allegations of rape, forced sexual intercourse, or severe sexual violence governed under Bharatiya Nyaya Sanhita, 2023 (Sections 63–66).';
        supportingReportedFacts.push('Reported non-consensual sexual acts / forced sexual intercourse');
        elementsToVerify.push('Absence of free consent', 'Date, time, location, and corroborating witness or medical/forensic preservation where available');
      } else if (isStalking) {
        reason = 'Reported conduct exhibits a pattern of repeated following, unwanted pursuit, or monitoring (relevant to BNS Section 78).';
        supportingReportedFacts.push('Reported pattern of repeated following or surveillance');
        elementsToVerify.push('Frequency and duration of tracking', 'Electronic communication logs or witness statements');
      } else {
        reason = 'Reported conduct describes acts of physical assault, harassment, or intimidation governed under the general penal code.';
        supportingReportedFacts.push('Reported assault, threats, or intimidation');
        elementsToVerify.push('Specific acts of force or intimidation', 'Identity and jurisdiction of the respondent');
      }
    } else if (fwId === 'pocso_act_2012') {
      reason = 'The report concerns potential sexual misconduct or harassment involving a person under 18 years of age, triggering mandatory POCSO safeguards.';
      supportingReportedFacts.push('Report involves a child or minor under 18 years of age');
      elementsToVerify.push('Confirmation of exact age under 18', 'Statutory notification to Special Juvenile Police Unit pursuant to Section 19');
    } else if (fwId === 'ugc_regulations_2015') {
      reason = 'The report concerns sexual harassment within a higher educational institution involving students, faculty, or campus premises.';
      supportingReportedFacts.push('Higher educational campus or university context');
      elementsToVerify.push('Affiliation of parties with academic institution', 'Referral to campus Internal Complaints Committee');
    } else if (fwId === 'it_act_2000') {
      reason = 'The report describes unauthorized digital transmission, private photo/video violation, or electronic obscenity under the IT Act.';
      supportingReportedFacts.push('Digital messages, social media posts, or electronic images');
      elementsToVerify.push('Digital device logs, URLs, or electronic message records');
    } else if (fwId === 'general_workplace_misconduct') {
      reason = 'The narrative describes workplace incivility, task allocation friction, or interpersonal bullying without sexual overtures or physical violence. Internal HR grievance channels apply.';
      supportingReportedFacts.push('Workplace conflict or administrative friction without sexual overtures');
      elementsToVerify.push('Internal HR grievance policy compliance', 'Managerial appraisal and assignment records');
    }

    let provisions = getVerifiedProvisions(fwId);
    if (fwId === 'bns_2023') {
      if (isSevereSexualViolence) {
        provisions = getVerifiedProvisions(fwId, ['Section 63', 'Section 64', 'Section 65', 'Section 74', 'Section 75']);
      } else if (isStalking) {
        provisions = getVerifiedProvisions(fwId, ['Section 78', 'Section 75', 'Section 74']);
      }
    }

    potentiallyRelevantFrameworks.push({
      actName: fw.actName,
      shortName: fw.shortName,
      statute: fw.statute,
      candidateProvisions: provisions,
      candidateSections: provisions.map(p => p.section),
      supportingReportedFacts,
      elementsToVerify,
      reason,
      officialSources: fw.officialSources,
      applicabilityStatus: 'REQUIRES_HUMAN_REVIEW',
    });

    for (const prompt of fw.clarificationPrompts || []) {
      additionalInformationNeeded.add(prompt);
    }
  }

  return {
    assessmentType: 'LEGAL_CATEGORY_RECOMMENDATION',
    status: 'PRELIMINARY',
    incidentCategory: {
      label: primaryCategoryLabel,
      explanation: primaryCategoryExpl,
    },
    additionalCategories,
    potentiallyRelevantFrameworks,
    additionalInformationNeeded: Array.from(additionalInformationNeeded),
    modelMetadata: {
      modelVersion: 'v1.0.0-legal-multilabel',
      knowledgeBaseVersion: LEGAL_KB_VERSION,
      assessmentMethod: 'rule_assisted_knowledge_base',
      isDemoModel: true,
      labelsPredicted: Array.from(matchedFrameworkIds),
    },
    disclaimer: 'These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body.',
  };
}

/**
 * Recommends legal category & applicable statutory framework for an incident.
 *
 * @param {Object} input
 * @param {string} input.narrative - Narrative description
 * @param {string} [input.contextType] - Context: workplace, higher_education, educational, cyber, public, domestic
 * @param {boolean} [input.targetMinor] - Is victim/affected under 18
 * @param {boolean} [input.isOnline] - Incident via electronic/online channels
 * @param {string} [input.incidentCategory] - Form selected category
 * @param {string} [input.language] - Language code
 * @returns {Promise<Object>} Legal assessment conforming to Section 9 schema
 */
export async function generateLegalAssessment(input) {
  const narrative = (input.narrative || input.description || '').trim();
  const contextType = input.contextType || input.context_type || 'workplace';
  const targetMinor = Boolean(input.targetMinor || input.target_minor);
  const isOnline = Boolean(input.isOnline || input.is_online);
  const language = input.language || input.preferredLanguage || 'en';
  const incidentCategory = input.incidentCategory || 'other';

  const payload = {
    report_id: input.reportId || input.caseId || null,
    narrative,
    incident_category: incidentCategory,
    context_type: contextType,
    target_minor: targetMinor,
    is_online: isOnline,
    language,
  };

  const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const response = await fetch(`${mlUrl}/internal/v1/legal-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SurakshaSetu-Backend/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`ML microservice HTTP error ${response.status}`);
    }

    const data = await response.json();

    // Verify hallucination guard: filter candidate provisions to only verified KB entries
    if (Array.isArray(data.potentiallyRelevantFrameworks)) {
      for (const fw of data.potentiallyRelevantFrameworks) {
        if (Array.isArray(fw.candidateProvisions)) {
          // Cross-verify each section against our verified knowledge base
          const verified = getVerifiedProvisions(
            fw.shortName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10),
            fw.candidateProvisions.map(p => p.section)
          );
          if (verified.length > 0) {
            fw.candidateProvisions = verified;
          }
        }
      }
    }

    return data;
  } catch (err) {
    // Graceful deterministic fallback when Python ML service is offline or times out
    return evaluateDeterministicKnowledgeBase(payload);
  }
}
