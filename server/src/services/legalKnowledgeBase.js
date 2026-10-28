/**
 * Suraksha Setu — Verified Indian Legal Knowledge Base (Module C / Legal Engine)
 * Version: 2026.2
 *
 * All provisions, section numbers, statutes, and official links in this knowledge
 * base are strictly curated from official government primary sources (India Code,
 * Ministry of Women & Child Development, Ministry of Home Affairs, UGC).
 *
 * CRITICAL SAFEGUARDS:
 * 1. The ML model is prohibited from inventing statutory sections from memory.
 * 2. Only candidate provisions present in this verified store can be presented.
 * 3. All recommendations are preliminary and advisory, subject to statutory human review.
 */

export const LEGAL_KB_VERSION = '2026.2';

export const VERIFIED_LEGAL_FRAMEWORKS = [
  {
    frameworkId: 'posh_act_2013',
    actName: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    shortName: 'POSH Act, 2013',
    statute: 'Act No. 14 of 2013',
    category: 'workplace_sexual_harassment',
    primaryApplicability: 'Women experiencing unwelcome conduct of a sexual nature connected with a workplace or employment.',
    contextRequirements: ['workplace', 'employment', 'office', 'remote_work', 'business_trip'],
    provisions: [
      {
        section: 'Section 2(n)',
        title: 'Definition of Sexual Harassment',
        summary: 'Defines sexual harassment to include unwelcome physical contact and advances, demand or request for sexual favours, making sexually coloured remarks, showing pornography, or any other unwelcome physical, verbal or non-verbal conduct of sexual nature.',
        applicabilityCondition: 'Applies where conduct is unwelcome and has sexual undertones or sexual overtures.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
      {
        section: 'Section 3',
        title: 'Prevention of Sexual Harassment & Hostile Environment',
        summary: 'Prohibits sexual harassment and provides that implied/explicit promise of preferential treatment, threat of detrimental treatment, or creating an intimidating, hostile or offensive work environment may constitute sexual harassment.',
        applicabilityCondition: 'Applies where career advancement, employment conditions, or workplace environment are compromised.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
      {
        section: 'Section 4',
        title: 'Constitution of Internal Committee (IC)',
        summary: 'Mandates every employer of a workplace with 10 or more employees to constitute an Internal Committee headed by a senior woman presiding officer, with employee members and one external member from an NGO/association committed to women\'s causes.',
        applicabilityCondition: 'Workplace establishments with 10 or more employees.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
      {
        section: 'Section 9',
        title: 'Filing of Complaint',
        summary: 'Any aggrieved woman may make a complaint of sexual harassment in writing to the Internal Committee or Local Committee within 3 months from the date of the incident (extendable up to another 3 months upon reasonable grounds).',
        applicabilityCondition: 'Complaint submitted within statutory timeframe or justifiable delay.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
      {
        section: 'Section 12',
        title: 'Interim Relief During Inquiry',
        summary: 'During the pendency of inquiry, the complainant may request the committee to recommend transfer of the complainant or respondent, grant leave up to 3 months (in addition to entitled leave), or restrain respondent from reporting on work performance.',
        applicabilityCondition: 'Upon written request by aggrieved woman during active inquiry.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
      {
        section: 'Section 16',
        title: 'Prohibition of Publication of Content of Complaint',
        summary: 'Prohibits publishing, communicating, or making known to the public, press or media the identity and address of complainant, respondent, or witnesses, as well as details of inquiry proceedings.',
        applicabilityCondition: 'Mandatory confidentiality across all inquiry stages.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2104',
      },
    ],
    officialSources: [
      { name: 'India Code (POSH Act 2013)', url: 'https://www.indiacode.nic.in/handle/123456789/2104' },
      { name: 'Ministry of Women and Child Development (MWCD Legislations)', url: 'https://www.wcd.gov.in/documents/legislations' },
      { name: 'Ministry of MSME (Govt POSH Act 2013 Information)', url: 'https://www.dcmsme.gov.in/POSHACT2013.aspx' },
      { name: 'MWCD Women Legislations Portal', url: 'https://wcd.gov.in/women/legislations' },
    ],
    clarificationPrompts: [
      'Clarify whether the respondent is an employee, manager, contractor, client, or visitor at the workplace.',
      'Confirm whether the organization has 10 or more workers and an active Internal Committee (IC).',
    ],
  },
  {
    frameworkId: 'bns_2023',
    actName: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS, 2023',
    statute: 'Act No. 45 of 2023 (Repealing & Replacing IPC 1860)',
    category: 'criminal_penal_offences',
    primaryApplicability: 'Substantive penal code defining criminal offences including rape, sexual assault, stalking, voyeurism, and criminal intimidation.',
    contextRequirements: ['all', 'public', 'cyber', 'workplace', 'domestic'],
    provisions: [
      {
        section: 'Section 63',
        title: 'Definition of Rape',
        summary: 'Defines rape as non-consensual sexual acts, sexual penetration of penis or any object/substance into vagina, urethra, anus or mouth against will or without consent.',
        applicabilityCondition: 'Acts of non-consensual sexual penetration or forced sexual intercourse.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 64',
        title: 'Punishment for Rape',
        summary: 'Prescribes rigorous imprisonment of not less than 10 years extending to life imprisonment and fine for the offence of rape.',
        applicabilityCondition: 'Offence of rape under Section 63.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 65',
        title: 'Punishment for Rape in Certain Cases',
        summary: 'Enhanced statutory penalties for rape by persons in authority, public servants, management/staff of hospital or institution, or rape of a woman under eighteen/sixteen years.',
        applicabilityCondition: 'Custodial, institutional, or aggravated circumstances.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 66',
        title: 'Punishment for Causing Death or Persistent Vegetative State',
        summary: 'Penalizes inflicting injury causing death or resulting in persistent vegetative state of the victim during commission of rape.',
        applicabilityCondition: 'Fatal or grievous bodily harm resulting in persistent vegetative state.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 74',
        title: 'Assault or Use of Criminal Force to Woman with Intent to Outrage Modesty',
        summary: 'Penalizes assaulting or using criminal force against any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty.',
        applicabilityCondition: 'Involves physical force, battery, or assaultive physical touching.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 75',
        title: 'Sexual Harassment',
        summary: 'Defines the offence of sexual harassment including physical contact involving unwelcome and explicit sexual overtures, demanding or requesting sexual favours, showing pornography against will, or making sexually coloured remarks.',
        applicabilityCondition: 'Criminal complaint for unwelcome sexual acts punishable with imprisonment.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 76',
        title: 'Assault or Use of Criminal Force with Intent to Disrobe',
        summary: 'Penalizes assaulting or using criminal force to any woman with intent to disrobe or compel her to be naked.',
        applicabilityCondition: 'Assaultive conduct intended to disrobe a woman.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 77',
        title: 'Voyeurism',
        summary: 'Penalizes watching, capturing, or disseminating the image of a woman engaging in a private act in circumstances where she would usually have the expectation of privacy.',
        applicabilityCondition: 'Capturing, recording, or sharing images/videos of private acts without consent.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 78',
        title: 'Stalking',
        summary: 'Defines stalking as repeatedly following a woman, contacting or attempting to contact her to foster personal interaction despite clear disinterest, or monitoring her use of the internet, email, or any other form of electronic communication.',
        applicabilityCondition: 'Repeated pattern of following, persistent unwanted contact, or digital monitoring.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 79',
        title: 'Word, Gesture or Act Intended to Insult Modesty',
        summary: 'Penalizes uttering any word, making any sound or gesture, or exhibiting any object with intent that such word or sound be heard, or gesture/object be seen by a woman, intruding upon her privacy.',
        applicabilityCondition: 'Verbal slurs, gestures, or exhibitionism intruding upon privacy.',
        officialSource: 'https://www.mha.gov.in/',
      },
      {
        section: 'Section 351',
        title: 'Criminal Intimidation',
        summary: 'Penalizes threatening another with injury to person, reputation or property with intent to cause alarm or compel them to do any act they are not legally bound to do.',
        applicabilityCondition: 'Explicit threats of bodily harm, character assassination, or extortion.',
        officialSource: 'https://www.mha.gov.in/',
      },
    ],
    officialSources: [
      { name: 'Ministry of Home Affairs (MHA — BNS 2023)', url: 'https://www.mha.gov.in/' },
      { name: 'India Code (BNS 2023)', url: 'https://www.indiacode.nic.in/' },
    ],
    clarificationPrompts: [
      'Clarify whether a formal police complaint (FIR) has been lodged or if parallel criminal redressal is sought.',
      'Specify the timeline, frequency, and electronic or physical evidence of repeated following/threats.',
      'Specify whether immediate medical examination / forensic preservation has been completed.',
    ],
  },
  {
    frameworkId: 'pocso_act_2012',
    actName: 'Protection of Children from Sexual Offences Act, 2012',
    shortName: 'POCSO Act, 2012',
    statute: 'Act No. 32 of 2012',
    category: 'child_safeguarding',
    primaryApplicability: 'Special statutory protection for persons under 18 years of age against sexual abuse, harassment, and exploitation.',
    contextRequirements: ['minor', 'under_18', 'educational', 'academic', 'domestic', 'online'],
    provisions: [
      {
        section: 'Section 7 & 8',
        title: 'Sexual Assault of a Child',
        summary: 'Defines and penalizes sexual assault against a child with physical sexual touching without penetration.',
        applicabilityCondition: 'Aggrieved individual is below 18 years of age at the time of the incident.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2079',
      },
      {
        section: 'Section 11 & 12',
        title: 'Sexual Harassment of a Child',
        summary: 'Penalizes uttering words, making sounds or gestures, exhibiting body parts, repeatedly following or tracking a child with sexual intent.',
        applicabilityCondition: 'Any sexual gesture, remark, exhibitionism, or tracking targeting a minor under 18.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2079',
      },
      {
        section: 'Section 19 & 21',
        title: 'Mandatory Reporting of Offences Against Children',
        summary: 'Imposes a strict statutory duty on any person (including institution heads and staff) with apprehension or knowledge of an offence against a child to report it to the Special Juvenile Police Unit or local police. Section 21 prescribes penalties for failure to report.',
        applicabilityCondition: 'Mandatory statutory reporting requirement for any person or institution.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/2079',
      },
    ],
    officialSources: [
      { name: 'India Code (POCSO Act 2012)', url: 'https://www.indiacode.nic.in/handle/123456789/2079' },
      { name: 'National Commission for Protection of Child Rights (NCPCR)', url: 'https://ncpcr.gov.in/' },
    ],
    clarificationPrompts: [
      'Confirm the approximate age of the affected person (under 18 years triggers statutory POCSO safeguards).',
      'Confirm whether institutional or school authorities have been formally alerted under Section 19.',
    ],
  },
  {
    frameworkId: 'ugc_regulations_2015',
    actName: 'UGC (Prevention, Prohibition and Redressal of Sexual Harassment of Women Employees and Students in Higher Educational Institutions) Regulations, 2015',
    shortName: 'UGC Regulations, 2015',
    statute: 'University Grants Commission Notification F.91-1/2013(TFGS)',
    category: 'higher_education_harassment',
    primaryApplicability: 'Women employees (faculty/staff) and students within universities, colleges, and higher educational institutions (HEIs).',
    contextRequirements: ['university', 'college', 'higher_education', 'campus', 'hostel', 'academic'],
    provisions: [
      {
        section: 'Regulation 3',
        title: 'Responsibilities of Higher Educational Institutions (HEIs)',
        summary: 'Mandates HEIs to publicly commit to a zero-tolerance policy against sexual harassment, display policy conspicuously on campus and website, conduct orientation sessions, and ensure adequate security and lighting.',
        applicabilityCondition: 'All universities, deemed universities, and colleges recognized by UGC.',
        officialSource: 'https://www.ugc.gov.in/',
      },
      {
        section: 'Regulation 4',
        title: 'Internal Complaints Committee (ICC) in Higher Education',
        summary: 'Requires every HEI to constitute an ICC consisting of a Presiding Officer (senior woman faculty), two faculty members, two non-teaching staff, three student representatives (if complaint involves students), and an external member.',
        applicabilityCondition: 'Institutions of higher learning; includes mandatory student representation when students are parties.',
        officialSource: 'https://www.ugc.gov.in/',
      },
      {
        section: 'Regulation 5',
        title: 'Grievance Redressal Process & Student Protections',
        summary: 'Sets out the inquiry procedure, timeline (completion within 90 days), and interim protections including campus restriction for respondent, hostel room reallocation, or examination accommodations for aggrieved student.',
        applicabilityCondition: 'Aggrieved student or employee seeking time-bound campus redressal.',
        officialSource: 'https://www.ugc.gov.in/',
      },
    ],
    officialSources: [
      { name: 'University Grants Commission (UGC Regulations)', url: 'https://www.ugc.gov.in/' },
      { name: 'Saksham Guidelines (UGC)', url: 'https://www.ugc.gov.in/pdfnews/7203627_saksham-book.pdf' },
    ],
    clarificationPrompts: [
      'Confirm whether the institution is a university, affiliated college, or autonomous academic institution under UGC.',
      'Clarify whether the parties involved are students, research scholars, teaching faculty, or administrative staff.',
    ],
  },
  {
    frameworkId: 'it_act_2000',
    actName: 'Information Technology Act, 2000',
    shortName: 'IT Act, 2000',
    statute: 'Act No. 21 of 2000',
    category: 'cyber_harassment',
    primaryApplicability: 'Offences committed using computer systems, digital networks, messaging applications, or electronic devices.',
    contextRequirements: ['cyber', 'online', 'social_media', 'email', 'messaging'],
    provisions: [
      {
        section: 'Section 66E',
        title: 'Violation of Privacy',
        summary: 'Penalizes capturing, publishing or transmitting the image of a private area of any person without consent, under circumstances violating the privacy of that person.',
        applicabilityCondition: 'Unauthorized recording or digital distribution of non-consensual images.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/1999',
      },
      {
        section: 'Section 67',
        title: 'Publishing or Transmitting Obscene Material Electronically',
        summary: 'Penalizes publishing or transmitting in electronic form any material which is lascivious or appeals to the prurient interest.',
        applicabilityCondition: 'Electronic transmission of obscene texts, images, or media.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/1999',
      },
      {
        section: 'Section 67A',
        title: 'Publishing Material Containing Sexually Explicit Act',
        summary: 'Prescribes severe imprisonment for publishing or transmitting material containing sexually explicit acts or conduct in electronic form.',
        applicabilityCondition: 'Electronic transmission or publishing of explicit pornography without consent.',
        officialSource: 'https://www.indiacode.nic.in/handle/123456789/1999',
      },
    ],
    officialSources: [
      { name: 'India Code (Information Technology Act 2000)', url: 'https://www.indiacode.nic.in/handle/123456789/1999' },
      { name: 'National Cyber Crime Reporting Portal (MHA)', url: 'https://cybercrime.gov.in/' },
    ],
    clarificationPrompts: [
      'Preserve electronic artifacts (screenshots, URLs, chat headers, phone numbers, or email headers).',
      'Clarify whether the communications were made via corporate network/devices or public social media platforms.',
    ],
  },
  {
    frameworkId: 'general_workplace_misconduct',
    actName: 'Institutional HR Grievance Policy / Service Rules (Non-Statutory Bullying)',
    shortName: 'Internal Service Rules & HR Policy',
    statute: 'Organizational Standing Orders / Employment Contract',
    category: 'general_workplace_bullying',
    primaryApplicability: 'Workplace incivility, managerial friction, unreasonable task allocation, or non-sexual interpersonal bullying without statutory sexual overtures or physical violence.',
    contextRequirements: ['workplace', 'office'],
    provisions: [
      {
        section: 'Institutional Code of Conduct',
        title: 'Employee Grievance Redressal Mechanism',
        summary: 'Standard organizational grievance mechanism handling non-sexual workplace disputes, bullying, unfair appraisal claims, or interpersonal conflicts through HR mediation or Ombudsman.',
        applicabilityCondition: 'Report does not allege sexual harassment or criminal offences, but workplace incivility.',
        officialSource: 'https://labour.gov.in/',
      },
    ],
    officialSources: [
      { name: 'Ministry of Labour & Employment', url: 'https://labour.gov.in/' },
    ],
    clarificationPrompts: [
      'Does the reported conduct involve sexual remarks, unwanted physical advances, or demands for sexual favours? If not, the complaint falls under internal HR grievance channels rather than the statutory POSH Act.',
      'Check whether the organization has an internal Employee Ombudsman or HR Grievance Committee.',
    ],
  },
];

/**
 * Validates candidate provisions against the approved knowledge base.
 * Ensures the ML model cannot hallucinate nonexistent sections or acts.
 *
 * @param {string} frameworkId
 * @param {Array<string>} candidateSectionIds
 * @returns {Array<Object>} Verified provision objects
 */
export function getVerifiedProvisions(frameworkId, candidateSectionIds = []) {
  const fw = VERIFIED_LEGAL_FRAMEWORKS.find(f => f.frameworkId === frameworkId);
  if (!fw) return [];

  if (!candidateSectionIds || candidateSectionIds.length === 0) {
    return fw.provisions.slice(0, 3); // default top verified provisions
  }

  // Filter ONLY provisions present in our verified knowledge base
  return fw.provisions.filter(p => candidateSectionIds.includes(p.section));
}

/**
 * Returns framework metadata from the approved knowledge base.
 *
 * @param {string} frameworkId
 * @returns {Object|null}
 */
export function getFrameworkById(frameworkId) {
  return VERIFIED_LEGAL_FRAMEWORKS.find(f => f.frameworkId === frameworkId) || null;
}

export const VERIFIED_LEGAL_KNOWLEDGE_BASE = Object.fromEntries(
  VERIFIED_LEGAL_FRAMEWORKS.map(f => [f.frameworkId, f])
);
