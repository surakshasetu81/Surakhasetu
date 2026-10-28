/**
 * Suraksha Setu — Legal Framework Recommendation Service (Module C)
 *
 * Suggests potentially relevant legal frameworks from a curated, versioned
 * knowledge base based on structured inputs and complaint narrative.
 *
 * CRITICAL LEGAL SAFEGUARD:
 * Recommendations are strictly advisory and educational. The system does not
 * make legal verdicts or replace statutory committees or qualified advocates.
 */

export const LEGAL_KB_VERSION = '2026.1';

export const LEGAL_FRAMEWORKS = [
  {
    frameworkId: 'posh_act_2013',
    title: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH)',
    statute: 'Act No. 14 of 2013',
    summary: 'Governs prevention and redressal of workplace sexual harassment across private, public, and unorganized sectors.',
    triggerCategories: ['sexual_harassment', 'workplace_harassment', 'discrimination'],
    triggerKeywords: [
      'colleague', 'manager', 'boss', 'office', 'workplace', 'company', 'client',
      'promotion', 'fired', 'cabin', 'meeting', 'icc', 'sexual harassment', 'quid pro quo',
      'hostile environment', 'सहकर्मी', 'बॉस', 'दफ्तर', 'कंपनी', 'नौकरी'
    ],
    provisions: [
      'Mandatory Internal Committee (IC) in establishments with 10+ employees.',
      'Local Committee (LC) at district level for establishments with under 10 workers.',
      'Section 12: Complainant right to request interim relief (up to 3 months paid leave or transfer).',
      'Section 16: Strict confidentiality protecting identity of all parties.',
      'Inquiry must be completed within 90 days of receipt.',
    ],
    officialSource: 'https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf',
  },
  {
    frameworkId: 'pocso_act_2012',
    title: 'Protection of Children from Sexual Offences (POCSO) Act, 2012',
    statute: 'Act No. 32 of 2012',
    summary: 'Comprehensive legal framework for the protection of children under 18 from sexual assault, harassment, and exploitation.',
    triggerCategories: ['child_abuse'],
    triggerKeywords: [
      'minor', 'child', 'under 18', 'school', 'student', 'pocso', 'kid', 'teenager',
      'नाबालिग', 'बच्ची', 'स्कूल', 'बालक', 'बालिका'
    ],
    provisions: [
      'Protects every person below 18 years of age regardless of gender.',
      'Mandatory reporting obligation: Failure to report an offence against a child is punishable under Section 21.',
      'Child-friendly procedures and special designated POCSO courts.',
      'Strict prohibition of publishing any identifying information of the child.',
    ],
    officialSource: 'https://wcd.nic.in/sites/default/files/POCSO-ACT.pdf',
  },
  {
    frameworkId: 'bns_2023',
    title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
    statute: 'Act No. 45 of 2023 (Repealing and Replacing IPC 1860)',
    summary: 'Substantive penal code defining criminal offences including assault, harassment, stalking, and voyeurism.',
    triggerCategories: ['sexual_harassment', 'domestic_violence', 'cyber_crime'],
    triggerKeywords: [
      'stalking', 'assault', 'threat', 'blackmail', 'photographs', 'recorded video', 'leak',
      'peeping', 'following', 'force', 'पीछा', 'हमला', 'धमकी', 'वीडियो', 'फोटो'
    ],
    provisions: [
      'Section 74: Assault or criminal force to woman with intent to outrage modesty.',
      'Section 75: Sexual harassment including unwelcome physical contact or demand for sexual favours.',
      'Section 77: Voyeurism (capturing or disseminating private images).',
      'Section 78: Stalking (physical following or electronic/cyber monitoring).',
      'Section 79: Word, gesture or act intended to insult the modesty of a woman.',
    ],
    officialSource: 'https://www.mha.gov.in/',
  },
  {
    frameworkId: 'nalsa_legal_aid',
    title: 'Legal Services Authorities Act, 1987 — Section 12 Legal Aid',
    statute: 'Act No. 39 of 1987',
    summary: 'Guarantees free legal services and legal counsel to women across all court and tribunal proceedings.',
    triggerCategories: ['sexual_harassment', 'workplace_harassment', 'domestic_violence', 'discrimination'],
    triggerKeywords: [
      'lawyer', 'advocate', 'legal aid', 'court', 'police', 'complaint', 'cannot afford',
      'fees', 'legal advice', 'वकील', 'कानूनी सहायता'
    ],
    provisions: [
      'Section 12(c): Women are unconditionally entitled to free state-sponsored legal aid.',
      'Provided via National Legal Services Authority (NALSA) and District Legal Services Authorities (DLSA).',
      'Covers free legal counsel, document drafting, filing, and legal representation in court.',
    ],
    officialSource: 'https://nalsa.gov.in/',
  },
  {
    frameworkId: 'vishaka_guidelines_1997',
    title: 'Vishaka & Others v. State of Rajasthan (Supreme Court Guidelines, 1997)',
    statute: 'AIR 1997 SC 3011',
    summary: 'Landmark Supreme Court jurisprudence establishing employer affirmative duties to provide a safe working environment.',
    triggerCategories: ['workplace_harassment', 'discrimination'],
    triggerKeywords: [
      'workplace dignity', 'employer duty', 'safe environment', 'gender equality',
      'workplace guideline', 'supreme court'
    ],
    provisions: [
      'Affirmed that sexual harassment violates fundamental rights under Articles 14, 19(1)(g), and 21 of the Constitution.',
      'Placed binding affirmative duty on employers to prevent harassment and institute dispute resolution mechanisms.',
      'Formed the foundational jurisprudence leading to the POSH Act 2013.',
    ],
    officialSource: 'https://main.sci.gov.in/',
  },
];

/**
 * Recommends relevant legal frameworks based on incident facts.
 *
 * @param {Object} input - Incident data
 * @param {string} input.incidentCategory - Category value
 * @param {string} input.description - Description narrative
 * @param {Array<string>} [input.supportRequired] - Selected support
 * @returns {Object} Legal advisory suggestions and disclaimer
 */
export function recommendLegalFrameworks(input) {
  const category = input.incidentCategory || '';
  const text = (input.description || '').toLowerCase();
  const support = Array.isArray(input.supportRequired) ? input.supportRequired : [];

  const applicableResources = [];

  for (const fw of LEGAL_FRAMEWORKS) {
    let matchScore = 0;
    const matchedReasons = [];

    // Category match
    if (fw.triggerCategories.includes(category)) {
      matchScore += 40;
      matchedReasons.push(`Report category (${category.replace(/_/g, ' ')}) aligns with ${fw.title}`);
    }

    // Support option match
    if (support.includes('legal_info') || support.includes('formal_complaint')) {
      matchScore += 15;
    }

    // Keyword match in description
    const foundKeywords = fw.triggerKeywords.filter(kw => text.includes(kw.toLowerCase()));
    if (foundKeywords.length > 0) {
      matchScore += Math.min(foundKeywords.length * 10, 35);
      matchedReasons.push(`Narrative references related indicators: ${foundKeywords.slice(0, 3).join(', ')}`);
    }

    if (matchScore >= 35) {
      applicableResources.push({
        frameworkId: fw.frameworkId,
        title: fw.title,
        statute: fw.statute,
        rationale: matchedReasons.join('. '),
        relevanceScore: Math.min(matchScore, 95),
        keyProvisions: fw.provisions,
        officialSource: fw.officialSource,
      });
    }
  }

  // Sort by relevance score
  applicableResources.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    applicableResources: applicableResources.slice(0, 3), // Top 3 most relevant frameworks
    disclaimer: 'Potentially relevant statutory information for advisory and educational review only. Final legal assessment requires appropriate human review by qualified legal counsel or statutory committees.',
    knowledgeBaseVersion: LEGAL_KB_VERSION,
    evaluatedAt: new Date().toISOString(),
  };
}
