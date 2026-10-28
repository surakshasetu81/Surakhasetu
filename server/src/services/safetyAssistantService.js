/**
 * Suraksha Setu — Intelligent Multilingual Women-Safety Assistant Service
 *
 * Capabilities:
 * 1. Multilingual understanding & generation: English, Hindi (Devanagari), Hinglish (Roman Hindi), Mixed.
 * 2. Automatic language detection without requiring manual selection.
 * 3. High-risk & Emergency triage (immediate danger, assault, threats, violence).
 * 4. Comprehensive domain knowledge: POSH Act 2013, Vishaka Guidelines, IC/LC procedures,
 *    timelines, evidence preservation, Proof Vault, cyber safety, stalking (BNS 78),
 *    retaliation protections, counselling (Tele-MANAS/KIRAN), employer inaction/She-Box.
 * 5. Official Indian government sources & links only (no hallucinations, no fabricated links).
 * 6. Actionable, compassionate, non-victim-blaming guidance.
 */

// ─── LANGUAGE DETECTION ───────────────────────────────────────────────────────

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

const HINGLISH_TOKENS = new Set([
  'kya', 'kyu', 'kyun', 'kaise', 'kahan', 'kidhar', 'kab', 'kaun', 'kisko', 'kisne',
  'karun', 'karein', 'kare', 'karna', 'karta', 'karti', 'karte', 'kiya', 'hoga', 'hogi', 'honge',
  'meri', 'mera', 'mere', 'mujhe', 'mujhko', 'hum', 'humein', 'apna', 'apni', 'apne',
  'hai', 'hain', 'ho', 'hoon', 'tha', 'thi', 'the', 'raha', 'rahi', 'rahe',
  'nahi', 'mat', 'nhi', 'bhi', 'aur', 'ya', 'par', 'lekin', 'agar', 'toh', 'to',
  'dhamki', 'madad', 'chahiye', 'bachao', 'khatra', 'dar', 'lag', 'shikayat', 'saboot',
  'baat', 'bheja', 'bhej', 'unhone', 'usne', 'saath', 'office', 'mein', 'se', 'ko', 'ka', 'ke', 'ki',
  'pehle', 'baad', 'abhi', 'turant', 'police', 'safe', 'suraksha', 'kisi', 'kuch', 'koi'
]);

/**
 * Detects whether the message is English, Hindi (Devanagari), Hinglish (Roman Hindi), or Mixed.
 * @param {string} text 
 * @returns {'hi' | 'hinglish' | 'en'}
 */
export function detectLanguage(text = '') {
  if (DEVANAGARI_REGEX.test(text)) {
    return 'hi';
  }

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'en';

  let hinglishCount = 0;
  for (const w of words) {
    if (HINGLISH_TOKENS.has(w)) {
      hinglishCount++;
    }
  }

  // If >= 2 hinglish words or >= 25% of words are Hinglish
  if (hinglishCount >= 2 || (words.length > 0 && (hinglishCount / words.length) >= 0.25)) {
    return 'hinglish';
  }

  return 'en';
}

// ─── HIGH RISK / EMERGENCY DETECTION ──────────────────────────────────────────

const EMERGENCY_PATTERNS = [
  /\b(immediate\s+danger|in\s+danger\s+right\s+now|danger\s+now|someone\s+is\s+attacking|kill\s+me|threatened\s+to\s+kill|weapon|knife|gun|physically\s+attacking|rape|raped|assaulted\s+just\s+now|help\s+me\s+please\s+now|unsafe\s+right\s+now|feeling\s+unsafe\s+right\s+now|urgent\s+help\s+needed)\b/i,
  /(जान\s*का\s*खतरा|तुरंत\s*मदद|अभी\s*खतरा|मारने\s*की\s*धमकी|बचाओ|हमला\s*किया|बलात्कार|शारीरिक\s*हमला|चाकू|हथियार|अभी\s*असुरक्षित)/,
  /\b(abhi\s+unsafe|khatra\s+hai|jaan\s+ka\s+khatra|bachao|maar\s+peet|maar\s+raha|marne\s+ki\s+dhamki|attack\s+kiya|chaku|turant\s+madad|abhi\s+kya\s+karun\s+unsafe)\b/i,
];

/**
 * Checks if the message describes an active emergency or immediate physical danger.
 * @param {string} text 
 * @returns {boolean}
 */
export function isEmergencyQuery(text = '') {
  return EMERGENCY_PATTERNS.some(p => p.test(text));
}

// ─── OFFICIAL RESOURCES DIRECTORY ─────────────────────────────────────────────

export const OFFICIAL_RESOURCES = {
  emergency_112: {
    name: 'National Emergency Response Support System (112)',
    url: 'https://112.gov.in/',
    phone: '112',
    description: 'All-in-one emergency number in India for Police, Fire, and Ambulance (24/7 Toll-Free).'
  },
  women_helpline_181: {
    name: 'Women Helpline (181)',
    url: 'https://wcd.gov.in/schemes/women-helpline-scheme',
    phone: '181',
    description: 'National 24/7 emergency and non-emergency helpline for women facing violence or harassment.'
  },
  childline_1098: {
    name: 'Childline India (1098)',
    url: 'https://wcd.gov.in/',
    phone: '1098',
    description: 'National 24/7 toll-free emergency response service for children in distress.'
  },
  ncw: {
    name: 'National Commission for Women (NCW)',
    url: 'https://ncw.nic.in/',
    phone: '7827170170',
    description: 'Statutory body receiving complaints of harassment, deprivation of women rights, and workplace abuse.'
  },
  shebox: {
    name: 'SHe-Box Portal (Ministry of WCD)',
    url: 'https://shebox.wcd.gov.in/',
    description: 'Centralized government portal for registering sexual harassment complaints at workplace (Govt & Private).'
  },
  posh_statute: {
    name: 'India Code — POSH Act 2013 (Official Gazette)',
    url: 'https://www.indiacode.nic.in/handle/123456789/2104',
    description: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.'
  },
  cybercrime: {
    name: 'National Cyber Crime Reporting Portal',
    url: 'https://cybercrime.gov.in/',
    phone: '1930',
    description: 'Official portal to report online harassment, cyber stalking, morphing, and digital privacy violations.'
  },
  nalsa: {
    name: 'National Legal Services Authority (NALSA)',
    url: 'https://nalsa.gov.in/',
    phone: '15100',
    description: 'Free legal aid and legal counsel for women and victims of crimes under the Legal Services Authorities Act.'
  },
  telemanas: {
    name: 'Tele-MANAS Mental Health Helpline (Govt of India)',
    url: 'https://telemanas.mohfw.gov.in/',
    phone: '14416',
    description: '24/7 free tele-mental health and emotional counselling service by Ministry of Health & Family Welfare.'
  },
  kiran: {
    name: 'KIRAN 24/7 Mental Health Helpline',
    url: 'https://disabilityaffairs.gov.in/',
    phone: '1800-599-0019',
    description: 'Toll-free 24/7 psychosocial support and stress helpline by Ministry of Social Justice.'
  },
  bns_statute: {
    name: 'Ministry of Home Affairs — Bharatiya Nyaya Sanhita, 2023',
    url: 'https://www.mha.gov.in/',
    description: 'Substantive penal law covering offences of sexual harassment (Sec 75), stalking (Sec 78), and assault.'
  }
};

// ─── INTENT RECOGNITION ────────────────────────────────────────────────────────

export const INTENTS = {
  EMERGENCY: 'emergency_immediate_danger',
  POSH_EXPLANATION: 'posh_explanation',
  INTERNAL_COMMITTEE: 'internal_committee_info',
  HOW_TO_REPORT_WORKPLACE: 'how_to_report_workplace',
  MANAGER_HARASSMENT: 'manager_harassment',
  RETALIATION_THREATS: 'retaliation_threats',
  EVIDENCE_PRESERVATION: 'evidence_preservation',
  ANONYMOUS_REPORTING: 'anonymous_reporting',
  COMPANY_REFUSAL_SHEBOX: 'company_refusal_shebox',
  STALKING_UNWANTED_CONTACT: 'stalking_unwanted_contact',
  CYBER_ONLINE_HARASSMENT: 'cyber_online_harassment',
  COUNSELLING_SUPPORT: 'counselling_support',
  COLLEGE_CAMPUS_HARASSMENT: 'college_campus_harassment',
  CHILD_SAFETY_POCSO: 'child_safety_pocso',
  GENERAL_GUIDANCE: 'general_guidance'
};

/**
 * Classifies user message into a specific women-safety intent.
 * @param {string} text 
 * @returns {string} intent
 */
export function classifyIntent(text = '') {
  const t = text.toLowerCase();

  // 1. Emergency
  if (isEmergencyQuery(text)) {
    return INTENTS.EMERGENCY;
  }

  // 2. Retaliation & Threats
  if (
    /(nikalne\s+ki\s+dhamki|dhamki|job\s+se\s+nikal|threat|threaten|retaliat|fired|loss\s+of\s+job|demot|नौकरी\s*से\s*निकाल|धमकी)/i.test(t)
  ) {
    return INTENTS.RETALIATION_THREATS;
  }

  // 3. Evidence preservation / screenshots / Vault
  if (
    /(evidence|saboot|screenshot|record|store|preserve|proof|vault|screen\s*shot|whatsapp\s+chat|audio\s+record|साक्ष्य|सबूत\s*सुरक्षित|सुरक्षित\s*रख)/i.test(t)
  ) {
    return INTENTS.EVIDENCE_PRESERVATION;
  }

  // 4. Company refusal / won't listen / no IC / where to complain if company doesn't act
  if (
    /(company\s+nahi\s+sunti|sunwai\s+nahi|action\s+nahi|complaint\s+kahan\s+karein|kahan\s+complain|where\s+to\s+report\s+if\s+company|refuses\s+to\s+listen|no\s+ic|no\s+committee|management\s+ignoring|कंपनी\s*कार्रवाई\s*नहीं|कहाँ\s*शिकायत)/i.test(t)
  ) {
    return INTENTS.COMPANY_REFUSAL_SHEBOX;
  }

  // 5. Manager / Supervisor harassment
  if (
    /(manager|boss|supervisor|senior|director|lead|uncomfortable\s+message|baar\s*baar|messages\s+bhej|harass\s+kare|मैनेजर|बॉस|सुपरवाइजर)/i.test(t) &&
    /(harass|message|uncomfortable|call|touch|parshan|छेड़छाड़|परेशान)/i.test(t)
  ) {
    return INTENTS.MANAGER_HARASSMENT;
  }

  // 6. Anonymous reporting & confidentiality
  if (
    /(anonymous|anonymously|gumnaam|naam\s+bina|without\s+name|confidential|pehechan|identity\s+reveal|secret|गुमनाम|पहचान\s*छुपा)/i.test(t)
  ) {
    return INTENTS.ANONYMOUS_REPORTING;
  }

  // 7. Internal Committee / Local Committee
  if (
    /(internal\s+committee|local\s+committee|\bic\b|\blcc?\b|complaint\s+committee|who\s+is\s+in\s+ic|presiding\s+officer|आंतरिक\s*समिति|आईसीसी|इंटरनल\s*कमेटी)/i.test(t)
  ) {
    return INTENTS.INTERNAL_COMMITTEE;
  }

  // 8. POSH Act explanation & Vishaka
  if (
    /(posh\s+act|what\s+is\s+posh|posh\s+kya\s+hai|vishaka|sexual\s+harassment\s+act|posh\s+law|पॉश\s*अधिनियम|विशाखा)/i.test(t)
  ) {
    return INTENTS.POSH_EXPLANATION;
  }

  // 9. College / University harassment
  if (
    /(college|university|campus|professor|ugc|student|faculty|hostel|कॉलेज|विश्वविद्यालय|प्रोफेसर|छात्रा)/i.test(t)
  ) {
    return INTENTS.COLLEGE_CAMPUS_HARASSMENT;
  }

  // 10. Cyber / Online harassment
  if (
    /(online|cyber|instagram|facebook|whatsapp|social\s+media|photo\s+leak|morph|video\s+viral|troll|साइबर|ऑनलाइन\s*परेशान|तस्वीर)/i.test(t)
  ) {
    return INTENTS.CYBER_ONLINE_HARASSMENT;
  }

  // 11. Stalking & Unwanted Contact
  if (
    /(stalk|following|peecha|follow\s+kar|ghar\s+ke\s+bahar|calls\s+repeatedly|block\s+karne\s+ke\s+baad|पीछा\s*करना|रास्ता\s*रोक)/i.test(t)
  ) {
    return INTENTS.STALKING_UNWANTED_CONTACT;
  }

  // 12. Counselling & Emotional support
  if (
    /(counselling|counselor|mental\s+health|distress|stress|scared|rona\s+aa\s+raha|anxiety|depressed|emotional\s+support|मनोवैज्ञानिक|काउंसलिंग|तनाव|परेशान\s*हूं)/i.test(t)
  ) {
    return INTENTS.COUNSELLING_SUPPORT;
  }

  // 13. Child Safety / POCSO
  if (
    /(child|minor|under\s+18|school\s+girl|pocso|बच्ची|नाबालिग|छात्रा)/i.test(t)
  ) {
    return INTENTS.CHILD_SAFETY_POCSO;
  }

  // 14. How to report / complaint procedure
  if (
    /(complaint\s+kaise|how\s+to\s+report|how\s+to\s+file|steps\s+to\s+report|procedure|शिकायत\s*कैसे|रिपोर्ट\s*कैसे|शिकायत\s*दर्ज)/i.test(t)
  ) {
    return INTENTS.HOW_TO_REPORT_WORKPLACE;
  }

  return INTENTS.GENERAL_GUIDANCE;
}

// ─── ACTIONABLE MULTILINGUAL RESPONSES ─────────────────────────────────────────

const KNOWLEDGE_RESPONSES = {
  // ── 1. EMERGENCY ──
  [INTENTS.EMERGENCY]: {
    en: {
      reply: `🚨 **Your immediate safety is the highest priority.**

1. **Move to safety**: If possible, immediately move to a well-lit, crowded public area, a security desk, or near people you trust.
2. **Call Emergency Services immediately**:
   - **Police Emergency:** Dial **112** (National Emergency Helpline, 24/7 Toll-Free).
   - **Women Helpline:** Dial **181** (24/7 dedicated support for women).
3. **Alert a trusted contact**: Share your live location with a close friend, family member, or trusted colleague.

*Note: This chatbot is an informational assistant and cannot dispatch police or rescue personnel directly. Please call 112 right now if you are in immediate danger.*`,
      resources: [OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['Call 112 Emergency', 'Call 181 Women Helpline', 'How to preserve evidence safely']
    },
    hi: {
      reply: `🚨 **आपकी सुरक्षा इस समय सबसे पहली प्राथमिकता है।**

1. **सुरक्षित स्थान पर जाएं:** यदि संभव हो, तुरंत किसी सुरक्षित, रोशनी वाली या भीड़भाड़ वाली जगह पर जाएं, जहाँ सुरक्षा गार्ड या अन्य लोग मौजूद हों।
2. **तुरंत आपातकालीन नंबर पर कॉल करें:**
   - **पुलिस आपातकालीन सेवा:** डायल करें **112** (राष्ट्रीय आपातकालीन हेल्पलाइन, 24/7 निःशुल्क)।
   - **महिला हेल्पलाइन:** डायल करें **181** (संकट में महिलाओं के लिए 24/7 सहायता)।
3. **विश्वसनीय व्यक्ति को सूचित करें:** अपने किसी करीबी मित्र या परिवार के सदस्य के साथ अपनी लाइव लोकेशन साझा करें।

*महत्वपूर्ण सूचना: यह चैटबॉट केवल सूचनात्मक सहायता प्रदान करता है और स्वयं पुलिस नहीं भेज सकता। यदि आप खतरे में हैं, तो कृपया तुरंत 112 पर कॉल करें।*`,
      resources: [OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['112 पर कॉल करें', '181 महिला हेल्पलाइन', 'साक्ष्य सुरक्षित रखने के तरीके']
    },
    hinglish: {
      reply: `🚨 **Aapki immediate safety sabse pehli priority hai.**

1. **Turant safe jagah jayein:** Agar possible ho, turant kisi public, well-lit jagah, security guard ke paas ya trusted logon ke beech chale jayein.
2. **Emergency numbers par abhi call karein:**
   - **Police Emergency:** Dial karein **112** (National Emergency, 24/7 Free).
   - **Women Helpline:** Dial karein **181** (Women crisis helpline, 24/7).
3. **Trusted contact ko inform karein:** Apne kisi close friend ya family member ko apni live location share karein aur call par rahein.

*Dhyan dein: Ye chatbot ek informational tool hai aur directly police nahi bhej sakta. Agar aap khatre mein hain toh bina deri kiye turant 112 par call karein.*`,
      resources: [OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['Call 112 Emergency', 'Call 181 Women Helpline', 'How to preserve evidence']
    }
  },

  // ── 2. MANAGER HARASSMENT ──
  [INTENTS.MANAGER_HARASSMENT]: {
    en: {
      reply: `Unwelcome or uncomfortable messages from a manager or supervisor create a hostile work environment and can qualify as sexual harassment under **Section 2(n) and Section 3 of the POSH Act, 2013**.

**Immediate Recommended Steps:**
1. **Preserve every communication:** Do not delete chat history. Take complete screenshots showing the sender's phone number/email, date, and exact timestamps.
2. **You are not required to confront them:** If confronting your manager feels unsafe, intimidating, or could invite retaliation, you do NOT have to do so.
3. **Know your reporting channel:** Under POSH Act Section 4, every organization with 10+ employees has an **Internal Committee (IC)** headed by a senior woman presiding officer. You can complain directly to the IC, bypassing your manager and HR hierarchy.
4. **Interim Protections (Section 12):** When you file an IC complaint, you can formally request interim relief—such as changing your reporting supervisor, getting transferred to another team, or taking up to 3 months of paid leave during inquiry.

Would you like me to guide you on how to file a formal complaint with the Internal Committee or how to store your screenshots securely in our Proof Vault?`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['Internal Committee (IC) Process', 'How to preserve screenshots safely', 'What if company refuses to act?']
    },
    hi: {
      reply: `मैनेजर या वरिष्ठ अधिकारी द्वारा असहज करने वाले संदेश भेजना कार्यस्थल पर शत्रुतापूर्ण वातावरण बनाता है और यह **पॉश अधिनियम, 2013 की धारा 2(n) और धारा 3** के तहत यौन उत्पीड़न की श्रेणी में आ सकता है।

**आपके लिए महत्वपूर्ण कदम:**
1. **सभी साक्ष्य सुरक्षित रखें:** किसी भी संदेश या चैट को डिलीट न करें। फोन नंबर, ईमेल और सटीक समय (timestamp) सहित स्क्रीनशॉट लें।
2. **मैनेजर से सीधे बात करना अनिवार्य नहीं है:** यदि आपको मैनेजर से सीधे बात करने में असुरक्षा या डर महसूस होता है, तो ऐसा करना कतई आवश्यक नहीं है।
3. **आंतरिक समिति (IC) में शिकायत:** 10 या अधिक कर्मचारियों वाले प्रत्येक संस्थान में एक **आंतरिक समिति (Internal Committee)** होती है जिसकी अध्यक्षता एक वरिष्ठ महिला अधिकारी करती हैं। आप सीधे समिति के समक्ष लिखित शिकायत दर्ज करा सकती हैं।
4. **अंतरिम सुरक्षा (धारा 12):** जांच के दौरान आप समिति से अनुरोध कर सकती हैं कि आपका रिपोर्टिंग मैनेजर बदला जाए या आपको किसी अन्य टीम में ट्रांसफर किया जाए, ताकि आप पर कोई दबाव न बना सके।

क्या आप आंतरिक समिति में शिकायत दर्ज करने की प्रक्रिया या हमारे प्रूफ वॉल्ट (Proof Vault) में साक्ष्य सुरक्षित रखने के बारे में जानना चाहती हैं?`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['शिकायत दर्ज करने के चरण', 'साक्ष्य सुरक्षित कैसे रखें', 'कंपनी कार्रवाई न करे तो क्या करें']
    },
    hinglish: {
      reply: `Ye situation kaafi uncomfortable aur stressful hoti hai. Manager ya supervisor ke uncomfortable messages **POSH Act, 2013 ke Section 2(n) aur Section 3** ke tehat workplace sexual harassment aur hostile work environment maane jaate hain.

**Aapko kya karna chahiye (Actionable Steps):**
1. **Chats aur Evidence preserve karo:** Messages ko delete mat karna. Pura screenshot lo jisme sender ka number/email, date aur time saaf dikhe.
2. **Directly confront karna zaroori nahi:** Agar manager se direct baat karne mein unsafe ya threatening lagta hai, toh aisa karna bilkul zaroori nahi hai.
3. **Internal Committee (IC) ko report karo:** Har 10+ employees wali company mein **Internal Complaints Committee (IC)** hoti hai jinki head ek senior woman presiding officer hoti hain. Aap directly IC ko complaint de sakti hain, apne manager ko bypass karke.
4. **Interim Protections (Section 12):** Complaint ke dauran aap IC se request kar sakti hain ki aapka supervisor badla jaye ya aapko dusri team mein shift kiya jaye taaki reporting relationship ka galat fayda na uthaya jaye.

Kya aap workplace complaint file karne ke steps ya Proof Vault mein evidence securely save karne ke baare mein detail jaana chahti hain?`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['Workplace Complaint Steps', 'How to preserve screenshots safely', 'What if company refuses to act?']
    }
  },

  // ── 3. POSH EXPLANATION & VISHAKA ──
  [INTENTS.POSH_EXPLANATION]: {
    en: {
      reply: `The **POSH Act, 2013** (*Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013*) is India's dedicated statutory law enacted to protect all women from sexual harassment across organized, unorganized, government, and private workplaces.

**Key Provisions of POSH Act 2013:**
- **Section 2(n) Definition:** Covers unwelcome physical contact, demand/request for sexual favours, sexually coloured remarks, showing pornography, or any other unwelcome conduct of a sexual nature.
- **Section 3 Hostile Environment:** Prohibits implied or explicit promises of preferential treatment or threats of detrimental employment consequences (quid pro quo).
- **Section 4 Internal Committee (IC):** Mandatory for every workplace with 10 or more employees, headed by a senior woman presiding officer, with employee members and an independent external member from an NGO.
- **Section 6 Local Committee (LC):** Set up at district level for organizations with fewer than 10 workers or where the complaint is against the employer himself.
- **Section 9 Time Limit:** Complaints must be filed in writing within **3 months** of the incident (extendable up to an additional 3 months by the committee upon justifiable delay).
- **Section 11 & 16:** Inquiry must be completed within **90 days**, with strict statutory confidentiality prohibiting publication of parties' identities.

*Historical Background:* The POSH Act codified and expanded the landmark 1997 **Vishaka Guidelines** laid down by the Supreme Court of India.`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['Internal Committee Constitution', 'Filing Timeline & Steps', 'Protection against retaliation']
    },
    hi: {
      reply: `**पॉश अधिनियम, 2013 (POSH Act, 2013)** भारत का एक विशेष कानून है जो कार्यस्थल पर महिलाओं को यौन उत्पीड़न से सुरक्षा प्रदान करता है और निष्पक्ष शिकायत निवारण तंत्र स्थापित करता है।

**मुख्य कानूनी प्रावधान:**
- **धारा 2(n) - यौन उत्पीड़न की परिभाषा:** अवांछित शारीरिक स्पर्श, यौन अनुग्रह (favours) की मांग, यौन संकेत वाली टिप्पणियाँ, अश्लील सामग्री दिखाना या यौन प्रकृति का कोई भी अवांछित आचरण।
- **धारा 4 - आंतरिक समिति (Internal Committee):** 10 या अधिक कर्मचारियों वाले प्रत्येक कार्यालय में अनिवार्य। इसकी अध्यक्ष एक वरिष्ठ महिला होती हैं और इसमें एनजीओ से एक निष्पक्ष बाहरी सदस्य भी शामिल होता है।
- **धारा 6 - स्थानीय समिति (Local Committee):** 10 से कम कर्मचारियों वाले संस्थानों के लिए या जब शिकायत सीधे मालिक/नियोक्ता के विरुद्ध हो, तो जिला स्तर पर गठित स्थानीय समिति में शिकायत होती है।
- **धारा 9 - समय सीमा:** घटना के **3 महीने** के भीतर लिखित शिकायत दर्ज कराई जानी चाहिए (उचित कारण होने पर समिति इसे अतिरिक्त 3 महीने तक बढ़ा सकती है)।
- **धारा 11 और 16 - जांच और गोपनीयता:** जांच 90 दिनों में पूरी होनी चाहिए और शिकायतकर्ता व गवाहों की पहचान पूरी तरह गोपनीय रखना कानूनी रूप से अनिवार्य है।

*ऐतिहासिक पृष्ठभूमि:* यह कानून 1997 में सुप्रीम कोर्ट के ऐतिहासिक **विशाखा दिशानिर्देशों (Vishaka Guidelines)** को औपचारिक संसद कानून में बदलकर लागू किया गया।`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['आंतरिक समिति के नियम', 'शिकायत दर्ज करने की समयसीमा', 'धमकी मिलने पर सुरक्षा']
    },
    hinglish: {
      reply: `**POSH Act, 2013** (*Sexual Harassment of Women at Workplace Act, 2013*) India ka dedicated law hai jo har working woman ko workplace harassment se protect karta hai—chahe company private ho, government ho ya startup.

**POSH Act ke zaroori rules:**
- **Section 2(n):** Unwelcome physical contact, sexual favors ki demand, sexually colored remarks, pornography dikhana ya sexual nature ka koi bhi unwelcome behaviour isme aata hai.
- **Section 3:** Kaam ke badle faayda dene ka vaada karna ya career kharab karne ki dhamki dena (Hostile Environment) bhi prohibited hai.
- **Section 4 (Internal Committee):** Har wo office jisme 10 ya usse zyada employees hain, wahan Internal Complaints Committee (IC) hona statutory mandatory hai. Iski head ek senior woman officer hoti hain aur ek NGO external member bhi hota hai.
- **Section 9 (Time Limit):** Incident ke **3 months** ke andar written complaint deni hoti hai (agar valid delay reason ho toh committee 3 months aur extend kar sakti hai).
- **Section 11 & 16:** Inquiry 90 days ke andar complete honi chahiye aur victim ki identity disclose karna legally strictly prohibited hai.

*Vishaka Guidelines connection:* Ye act Supreme Court ke 1997 ke **Vishaka Guidelines** ko codify karke permanent statute banaya gaya tha.`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['Internal Committee Constitution', 'Filing Timeline & Steps', 'Protection against retaliation']
    }
  },

  // ── 4. HOW TO REPORT / WORKPLACE PROCEDURE ──
  [INTENTS.HOW_TO_REPORT_WORKPLACE]: {
    en: {
      reply: `Here are the verified steps to submit a workplace harassment complaint under the **POSH Act 2013**:

1. **Identify the Competent Committee:**
   - If your organization has **10 or more employees**: Submit your complaint to your workplace's **Internal Committee (IC)**.
   - If your company has **fewer than 10 employees** or your complaint is against the employer/owner: Submit to the **Local Committee (LC)** constituted by the District Magistrate.
   - You can also register via the Ministry of Women and Child Development's **SHe-Box portal** (shebox.wcd.gov.in).

2. **Prepare the Complaint Document:**
   - Write a clear account of what happened, specifying dates, times, locations, and names of individuals involved.
   - Mention any witnesses or colleagues who were present or aware.
   - Attach supporting evidence (emails, chat logs, call records).

3. **Statutory Timelines (Section 9 & 11):**
   - File within **3 months** of the incident (extendable up to 6 months for justifiable reasons).
   - The committee must conclude the inquiry within **90 days**.

4. **Your Right to Interim Relief (Section 12):**
   - You can request transfer of yourself or the respondent, or request up to 3 months of additional paid leave during proceedings.

Would you like help documenting your complaint details or learning about confidential tracking on Suraksha Setu?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.ncw],
      suggestedActions: ['Draft complaint outline', 'Know about SHe-Box portal', 'Proof Vault evidence storage']
    },
    hi: {
      reply: `कार्यस्थल पर उत्पीड़न की औपचारिक शिकायत दर्ज करने की आधिकारिक प्रक्रिया निम्नलिखित है:

1. **सही समिति का चयन करें:**
   - यदि आपके संस्थान में **10 या अधिक कर्मचारी** हैं: अपनी कंपनी की **आंतरिक समिति (Internal Committee - IC)** को लिखित शिकायत दें।
   - यदि कंपनी में **10 से कम कर्मचारी** हैं या शिकायत कंपनी के मालिक/नियोक्ता के विरुद्ध है: अपने जिले के डीएम/कलेक्टर द्वारा गठित **स्थानीय समिति (Local Committee - LC)** में शिकायत दर्ज करें।
   - आप केंद्र सरकार के **SHe-Box पोर्टल** (shebox.wcd.gov.in) पर भी ऑनलाइन शिकायत दर्ज कर सकती हैं।

2. **शिकायत का प्रारूप:**
   - घटना की तारीख, समय, स्थान और संबंधित व्यक्तियों के नाम स्पष्ट रूप से लिखें।
   - यदि कोई गवाह या साथी मौजूद था तो उसका उल्लेख करें।
   - संबंधित साक्ष्य (चैट, ईमेल, ऑडियो) साथ में संलग्न करें।

3. **कानूनी समय सीमा (धारा 9 एवं 11):**
   - घटना के **3 माह** के भीतर शिकायत दर्ज की जानी चाहिए (पर्याप्त कारण होने पर समिति 3 माह का अतिरिक्त समय दे सकती है)।
   - समिति को 90 दिनों के भीतर जांच पूरी करनी होती है।

4. **अंतरिम सुरक्षा का अधिकार (धारा 12):**
   - जांच लंबित रहने के दौरान आप ट्रांसफर या 3 महीने तक के सवैतनिक अवकाश (paid leave) की मांग कर सकती हैं।`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['शिकायत का प्रारूप कैसे बनाएं', 'SHe-Box पोर्टल की जानकारी', 'साक्ष्य सुरक्षित रखना']
    },
    hinglish: {
      reply: `Workplace harassment ki complaint karne ke verified steps ye hain:

1. **Pata karein kahan complain karni hai:**
   - Agar office mein **10 ya zyada workers** hain: Apni company ki **Internal Committee (IC)** ko written complaint dein.
   - Agar company mein **10 se kam workers** hain ya complaint owner/employer ke khilaaf hai: District Officer/DM ki **Local Committee (LC)** mein complaint hogi.
   - Central Government ke **SHe-Box portal** (shebox.wcd.gov.in) par bhi direct online complaint submit ki ja sakti hai.

2. **Complaint mein kya likhein:**
   - Incident ki exact date, approximate time, location aur kya bola/kiya gaya saaf shabdon mein likhein.
   - Agar koi witness (colleague) tha toh unka naam likhein.
   - Screen-shots, email ya chat printout attach karein.

3. **Timelines (Section 9 & 11):**
   - Incident ke **3 months** ke andar report karna hota hai (genuine delay par committee 3 months aur allow kar sakti hai).
   - IC ko 90 days ke andar inquiry puri karke report deni hoti hai.

4. **Interim Relief (Section 12):**
   - Inquiry chalne tak aap apni team badalne, supervisor change karne ya 3 months tak ki paid leave ki statutory request kar sakti hain.

Kya aapko complaint draft karne mein ya Suraksha Setu par incident record karne mein guidance chahiye?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Draft complaint outline', 'Know about SHe-Box portal', 'Proof Vault evidence storage']
    }
  },

  // ── 5. RETALIATION & THREATS ──
  [INTENTS.RETALIATION_THREATS]: {
    en: {
      reply: `Retaliation after reporting harassment—such as threatening your employment, demotion, hostile transfers, or isolation—is strictly prohibited under the law.

**Legal Protections & Concrete Steps:**
1. **POSH Act Section 12 (Statutory Interim Protections):**
   - You have the legal right to submit an immediate application to the Internal Committee (IC) reporting the retaliation.
   - The IC has statutory authority to restrain the respondent from reviewing or influencing your work appraisals, recommend a transfer, or grant up to 3 months of paid leave during inquiry.
2. **Criminal Intimidation (Bharatiya Nyaya Sanhita, 2023 - Section 351):**
   - Threatening injury to your reputation, livelihood, or physical safety constitutes the criminal offence of Criminal Intimidation punishable by law.
3. **Document Every Threat:**
   - Log the exact date, time, words used, medium (verbal, call, WhatsApp, email), and any witnesses present.
   - If threats are verbal in private, write a follow-up confirmation email to create an official paper trail.
4. **Escalate Outside the Workplace:**
   - If your employer is enabling the retaliation or suppressing your complaint, report directly to the **Ministry of WCD SHe-Box Portal** or file a grievance with the **National Commission for Women (NCW)**.

Are you experiencing threats to your physical safety, or is it job-related retaliation?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Section 12 Interim Relief', 'Report to SHe-Box Portal', 'Emergency contacts']
    },
    hi: {
      reply: `शिकायत दर्ज करने के बाद नौकरी से निकालने की धमकी देना या प्रताड़ित करना (Retaliation) कानूनन पूरी तरह वर्जित है।

**आपके कानूनी अधिकार और सुरक्षा के उपाय:**
1. **पॉश अधिनियम धारा 12 (अंतरिम संरक्षण):**
   - आप तुरंत आंतरिक समिति (IC) को सूचित कर सकती हैं कि शिकायत के बाद आपको धमकाया जा रहा है।
   - समिति के पास यह कानूनी अधिकार है कि वह संबंधित व्यक्ति को आपके कार्य मूल्यांकन (appraisal) से हटा दे और आपकी नौकरी को सुरक्षित रखने के निर्देश जारी करे।
2. **आपराधिक धमकी (भारतीय न्याय संहिता, 2023 - धारा 351):**
   - किसी व्यक्ति को उसके रोजगार, मान-सम्मान या सुरक्षा की हानि पहुंचाने की धमकी देना संज्ञेय अपराध है।
3. **धमकी का रिकॉर्ड रखें:**
   - प्रत्येक धमकी की तारीख, समय, प्रयुक्त शब्द और माध्यम (कॉल, ईमेल, मैसेज) को एक डायरी या सुरक्षित स्थान पर नोट करें।
4. **बाहरी मंचों पर शिकायत:**
   - यदि कंपनी प्रबंधन सहयोग नहीं कर रहा है, तो सीधे महिला एवं बाल विकास मंत्रालय के **SHe-Box पोर्टल** या **राष्ट्रीय महिला आयोग (NCW)** में शिकायत दर्ज कराएं।

क्या धमकी शारीरिक सुरक्षा से संबंधित है या नौकरी/करियर के संबंध में?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['धारा 12 अंतरिम राहत', 'SHe-Box पर शिकायत', 'आपातकालीन नंबर']
    },
    hinglish: {
      reply: `Complaint karne ke baad job se nikalne ya career barbaad karne ki dhamki dena **illegal retaliation** hai aur law iske khilaaf strict protections deta hai.

**Aapko kya kadam uthane chahiye:**
1. **IC ko turant likhit mein report karo (Section 12):**
   - Internal Committee (IC) ko batao ki complaint ke baad retaliatory threats mil rahi hain.
   - POSH Act ke Section 12 ke tehat IC management ko direct kar sakti hai ki us person ko aapki appraisal ya evaluation se turant alag kiya jaye.
2. **Criminal Intimidation (BNS 2023 Section 351):**
   - Job se nikalne ya harm karne ki dhamki dena criminal offence maana ja sakta hai.
3. **Paper trail aur Saboot banao:**
   - Har dhamki ka time, date, caller ID aur exact words note karo.
   - Agar verbal meeting mein bola gaya, toh unko formal email likho: *"As per our discussion today where you mentioned my employment could be terminated due to my complaint..."* isse written proof ban jaata hai.
4. **SHe-Box aur NCW ko escalate karo:**
   - Agar company aapki complaint dabane ki koshish kare, toh central government ke **SHe-Box portal** (shebox.wcd.gov.in) aur **NCW (7827170170)** par complaint register karo.

Kya aapko physical safety ka bhi threat hai ya employment/job related pressure hai?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Section 12 Interim Relief', 'Report to SHe-Box Portal', 'Emergency contacts']
    }
  },

  // ── 6. EVIDENCE PRESERVATION & PROOF VAULT ──
  [INTENTS.EVIDENCE_PRESERVATION]: {
    en: {
      reply: `Preserving digital and physical evidence properly is essential for ensuring your complaint cannot be dismissed for lack of corroboration.

**Best Practices for Evidence Preservation:**
1. **Screenshots:**
   - Capture full-screen images showing the complete conversation context, phone number/handle, date, and exact timestamp.
   - Avoid cropping out time bars or battery status, as full screen images retain stronger forensic credibility.
2. **Emails & Documents:**
   - Forward emails to a personal, non-work account or export them as .eml / PDF files with full header information.
3. **Call & Audio Records:**
   - Retain call logs showing call frequency and duration.
   - Store audio recordings with device metadata intact.
4. **Incident Diary (Contemporaneous Notes):**
   - Write notes as soon as possible after each incident. Notes written shortly after an event are treated as contemporaneous evidence.
5. **Secure Encrypted Storage (Suraksha Setu Proof Vault):**
   - You can use Suraksha Setu's **Proof Vault** (on this platform) to store encrypted files using client-side AES-256-GCM encryption with cryptographic SHA-256 checksums, ensuring your evidence cannot be altered or accessed without your secret key.

Would you like me to guide you to the Proof Vault page or explain how cryptographic checksums protect evidence integrity?`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Open Proof Vault', 'What evidence is valid under POSH', 'How to file complaint']
    },
    hi: {
      reply: `डिजिटल और भौतिक साक्ष्यों (Evidence) को सही तरीके से सुरक्षित रखना बेहद महत्वपूर्ण है ताकि आपकी शिकायत को कोई खारिज न कर सके।

**साक्ष्य सुरक्षित रखने के सर्वोत्तम तरीके:**
1. **स्क्रीनशॉट (Screenshots):**
   - स्क्रीनशॉट लेते समय पूरा स्क्रीन कैप्चर करें, जिसमें फोन नंबर, प्रोफाइल नाम, दिनांक और सटीक समय (timestamp) स्पष्ट दिखे।
   - स्क्रीनशॉट को क्रॉप (काट-छाँट) न करें।
2. **ईमेल और संदेश:**
   - ऑफिस ईमेल से संबंधित फाइलों को अपने निजी सुरक्षित ईमेल पर फॉरवर्ड करें या पीडीएफ के रूप में सुरक्षित रखें।
3. **कॉल रिकॉर्ड और डायरी:**
   - कॉल हिस्ट्री का स्क्रीनशॉट लें जिसमें कॉल का समय और अवधि दिखे।
   - घटना के तुरंत बाद अपने पास एक निजी डायरी में पूरी घटना का विवरण लिख लें।
4. **सुरक्षा सेतु प्रूफ वॉल्ट (Proof Vault):**
   - आप हमारे प्लेटफॉर्म के **Proof Vault** का उपयोग कर सकती हैं, जहाँ फाइलें आपके अपने डिवाइस पर AES-256 एन्क्रिप्शन और SHA-256 हैश द्वारा सुरक्षित रहती हैं और आपके सीक्रेट कोड के बिना कोई नहीं देख सकता।

क्या आप प्रूफ वॉल्ट (Proof Vault) के उपयोग के बारे में और जानना चाहती हैं?`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['प्रूफ वॉल्ट खोलें', 'पॉश में कौन से सबूत मान्य हैं', 'शिकायत कैसे दर्ज करें']
    },
    hinglish: {
      reply: `Evidence ko sahi tareeqe se preserve karna sabse zaroori step hai taaki koi aapki complaint ko dismiss na kar sake.

**Evidence Safe Rakhne ke Golden Rules:**
1. **Full Screenshots lo:**
   - Chat ya message ka pura screenshot lo jisme contact number/name, date aur exact time dikh raha ho. Time ya header ko crop mat karna.
2. **Work email se backup lo:**
   - Har relevant email ko apne personal email par forward karo ya PDF export karke rakho, kyunki company access revoke kar sakti hai.
3. **Incident Diary maintain karo:**
   - Jab bhi koi incident ho, date, time, location aur kya bola gaya ek jagah likh lo. Law mein contemporaneous notes (turant likhe gaye notes) strong evidence maane jaate hain.
4. **Suraksha Setu Proof Vault:**
   - Hamare platform par **Proof Vault** feature hai jahan aap apne files ko client-side AES-256 encrypted format mein safely store kar sakti hain. Iska SHA-256 cryptographic hash ensure karta hai ki files tamper-proof rahein.

Kya aap Proof Vault open karna chahti hain ya evidence verification ke baare mein jaana chahti hain?`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Open Proof Vault', 'What evidence is valid under POSH', 'How to file complaint']
    }
  },

  // ── 7. COMPANY REFUSAL / NO IC / SHE-BOX ──
  [INTENTS.COMPANY_REFUSAL_SHEBOX]: {
    en: {
      reply: `If your employer refuses to accept your complaint, ignores it, does not have an active Internal Committee (IC), or if the accused is the owner/director:

**Official Recourse Outside Your Company:**
1. **Ministry of WCD SHe-Box Portal (Central Government):**
   - Register on **SHe-Box** (*Sexual Harassment electronic Box* at **shebox.wcd.gov.in**).
   - Once submitted, the central government system monitors the complaint and routes it directly to the designated authority or District Officer for time-bound inquiry.
2. **Local Complaints Committee (LC) at District Level (Section 6):**
   - By law, every District Magistrate/Collector constitutes a Local Committee (LC).
   - You can submit your complaint directly to the District Officer / LC.
3. **Penalties on Employer for Non-Compliance (Section 26):**
   - Failure to constitute an IC or failure to act on a complaint is punishable by a fine of up to **₹50,000**, and repeat non-compliance can lead to **cancellation of the business license**.
4. **National Commission for Women (NCW):**
   - File a complaint at **ncw.nic.in** or call their dedicated 24/7 helpline at **7827170170**.
5. **Police Complaint (FIR):**
   - You retain the absolute right to lodge a criminal complaint (FIR) under the **Bharatiya Nyaya Sanhita, 2023** (Section 74/75/78) independent of workplace proceedings.

Would you like the direct link to the SHe-Box portal or assistance in drafting an escalation letter?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Open SHe-Box Portal', 'Contact NCW Helpline', 'Local Committee (LC) details']
    },
    hi: {
      reply: `यदि कंपनी शिकायत स्वीकार नहीं करती, उस पर कार्रवाई नहीं करती, कंपनी में आंतरिक समिति नहीं है, या शिकायत कंपनी के मालिक/डायरेक्टर के खिलाफ है:

**कंपनी के बाहर कानूनी रास्ते:**
1. **महिला एवं बाल विकास मंत्रालय का SHe-Box पोर्टल:**
   - केंद्र सरकार के **SHe-Box** पोर्टल (**shebox.wcd.gov.in**) पर ऑनलाइन शिकायत दर्ज करें।
   - यहाँ दर्ज शिकायत की निगरानी सीधे मंत्रालय द्वारा की जाती है और इसे संबंधित जिले के नोडल अधिकारी को भेजा जाता है।
2. **जिला स्तर पर स्थानीय समिति (Local Committee - LC):**
   - पॉश अधिनियम की धारा 6 के तहत प्रत्येक जिले के डीएम/कलेक्टर द्वारा एक स्थानीय समिति गठित की जाती है। आप सीधे जिले की स्थानीय समिति में शिकायत दे सकती हैं।
3. **कंपनी पर कानूनी जुर्माना (धारा 26):**
   - समिति गठित न करने या कार्रवाई न करने पर कंपनी पर **₹50,000 तक का जुर्माना** लग सकता है और दोबारा उल्लंघन पर कंपनी का **लाइसेंस रद्द** किया जा सकता है।
4. **राष्ट्रीय महिला आयोग (NCW):**
   - **ncw.nic.in** पर ऑनलाइन शिकायत करें या उनकी 24/7 हेल्पलाइन **7827170170** पर संपर्क करें।
5. **पुलिस में प्राथमिकी (FIR):**
   - कंपनी की जांच के अतिरिक्त, आप भारतीय न्याय संहिता (BNS 2023) के तहत नजदीकी पुलिस थाने में सीधे FIR दर्ज कराने का पूर्ण कानूनी अधिकार रखती हैं।`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['SHe-Box पोर्टल खोलें', 'NCW हेल्पलाइन संपर्क', 'FIR दर्ज करने के नियम']
    },
    hinglish: {
      reply: `Agar company aapki complaint lene se mana kare, ignore kare, company mein IC na ho, ya complaint company ke owner/director ke khilaaf ho:

**Company ke bahar complaint kahan karein:**
1. **Central Govt SHe-Box Portal:**
   - Ministry of Women & Child Development ke **SHe-Box portal** (**shebox.wcd.gov.in**) par online complaint lodge karein.
   - SHe-Box par aayi complaint seedhe central monitoring mein aati hai aur District Officer ko inquiry ke liye bhej di jaati hai.
2. **District Local Committee (LC) (Section 6):**
   - Har district ke District Magistrate/Collector office mein ek Local Complaints Committee hoti hai. Aap directly District Officer/LC ko complaint de sakti hain.
3. **Company par Penalty (Section 26):**
   - IC na banane ya complaint par action na lene par company par **₹50,000 ka fine** lagta hai aur repeat violation par business registration/license cancel ho sakta hai.
4. **National Commission for Women (NCW):**
   - **ncw.nic.in** par grievance submit karein ya helpline **7827170170** par call karein.
5. **Police Complaint (FIR under BNS 2023):**
   - Workplace inquiry ke alawa aapko direct police station mein FIR file karne ka full statutory right hai under Bharatiya Nyaya Sanhita 2023 (Section 75/78).

Kya aapko SHe-Box par report karne ka procedure ya Local Committee complaint draft karne mein madad chahiye?`,
      resources: [OFFICIAL_RESOURCES.shebox, OFFICIAL_RESOURCES.ncw, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Open SHe-Box Portal', 'Contact NCW Helpline', 'Local Committee details']
    }
  },

  // ── 8. ANONYMOUS REPORTING ──
  [INTENTS.ANONYMOUS_REPORTING]: {
    en: {
      reply: `**Anonymous Reporting & Confidentiality:**

1. **On Suraksha Setu:**
   - You can submit an anonymous report on our **Report** page. We do not collect your name, email, or phone number.
   - You receive a secret **Case ID** and **Recovery Code** to securely track updates without exposing your identity.
2. **Under the POSH Act, 2013:**
   - Formal statutory inquiries under POSH require a written complaint so the Internal Committee (IC) can establish facts and allow the respondent to respond.
   - However, **Section 16 of the POSH Act strictly prohibits** publishing, circulating, or disclosing the identity of the complainant, respondent, or witnesses to the public or press. Violating this attracts statutory penalties under Section 17.
3. **Verified Organization Option:**
   - On Suraksha Setu, you can also verify using your Employee ID or College ID. We generate an opaque cryptographic token so the organization knows you are an authentic member without exposing your plaintext ID publicly.

Would you like to proceed with anonymous reporting or learn more about our organization verification?`,
      resources: [OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Start Anonymous Report', 'Verify Organization ID', 'Track Existing Case']
    },
    hi: {
      reply: `**गुमनाम रिपोर्टिंग और कानूनी गोपनीयता:**

1. **सुरक्षा सेतु प्लेटफॉर्म पर:**
   - आप हमारे **शिकायत (Report)** पेज पर पूरी तरह गुमनाम (Anonymous) रहकर रिपोर्ट दर्ज कर सकती हैं। इसमें आपका नाम, फोन या ईमेल नहीं लिया जाता।
   - आपको एक गोपनीय **Case ID** और **Recovery Code** मिलता है जिससे आप अपनी पहचान बताए बिना स्टेटस ट्रैक कर सकती हैं।
2. **पॉश कानून (POSH Act) के तहत गोपनीयता:**
   - औपचारिक आंतरिक जांच के लिए लिखित शिकायत की आवश्यकता होती है, लेकिन **पॉश अधिनियम की धारा 16** के तहत शिकायतकर्ता और गवाहों की पहचान उजागर करना पूर्णतः प्रतिबंधित और दंडनीय है।
3. **संस्थान सत्यापन विकल्प:**
   - आप अपने एम्प्लॉई आईडी या कॉलेज आईडी से भी सत्यापन कर सकती हैं, जिसमें टोकन के जरिए आपकी संबद्धता प्रमाणित होती है बिना किसी सार्वजनिक पहचान के।

क्या आप गुमनाम रिपोर्टिंग शुरू करना चाहती हैं या केस ट्रैकिंग के बारे में जानना चाहती हैं?`,
      resources: [OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['गुमनाम रिपोर्ट दर्ज करें', 'आईडी सत्यापित करें', 'केस ट्रैक करें']
    },
    hinglish: {
      reply: `**Anonymous Reporting aur Confidentiality ke niyam:**

1. **Suraksha Setu platform par:**
   - Aap hamare **Report** page par jakar bina apna naam, email ya phone diye complaint submit kar sakti hain.
   - Submission ke baad aapko ek **Case ID** aur **Recovery Code** milta hai jisse aap future mein bina login status track kar sakti hain.
2. **POSH Act ke tehat confidentiality:**
   - Formal IC inquiry ke liye written complaint zaroori hoti hai, lekin **POSH Act ka Section 16** victim aur witnesses ki identity disclose karna strictly ban karta hai.
3. **Organization Verification:**
   - Agar aap apna Employee ID ya College ID verify karti hain, toh system ek secure cryptographic token banata hai taaki company affiliation prove ho jaye bina aapka plain ID expose hue.

Kya aap Anonymous Report form open karna chahti hain ya existing case track karna chahti hain?`,
      resources: [OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['Start Anonymous Report', 'Verify Organization ID', 'Track Existing Case']
    }
  },

  // ── 9. STALKING & UNWANTED CONTACT ──
  [INTENTS.STALKING_UNWANTED_CONTACT]: {
    en: {
      reply: `Persistent unwanted following, tracking, or repeated calls and messages despite clear disinterest is a criminal offence under **Section 78 of the Bharatiya Nyaya Sanhita, 2023 (BNS)** (formerly Section 354D IPC).

**Key Legal Provisions (BNS Section 78):**
- Defines stalking as repeatedly following a woman, attempting contact to foster personal interaction despite clear indication of disinterest, or monitoring her electronic communications (phone, internet, social media).
- **Punishment:** Punishable with imprisonment up to 3 years on first conviction, and up to 5 years on subsequent convictions, along with fine.

**Actionable Safety Recommendations:**
1. **Send one clear, unambiguous written refusal:** *"I am not interested in any contact with you. Stop following/contacting me immediately."* Keep a screenshot of this.
2. **Do not engage in further replies:** Any reply gives the stalker perceived interaction. Block them on accounts after screenshotting the harassment.
3. **Safety Planning:** Vary your daily commute routes and travel times if being followed physically. Share your live location with trusted family.
4. **Official Help:** If you feel threatened, call **112** (Police) or **181** (Women Helpline), or report online at **cybercrime.gov.in** for digital stalking.`,
      resources: [OFFICIAL_RESOURCES.bns_statute, OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['Call 112 Police', 'Call 181 Women Helpline', 'Report Cyber Stalking']
    },
    hi: {
      reply: `मना करने के बावजूद बार-बार पीछा करना, अनचाहा संपर्क साधना या फोन/मैसेज करना **भारतीय न्याय संहिता, 2023 (BNS) की धारा 78** (पूर्व में IPC 354D) के तहत गंभीर संज्ञेय अपराध (Stalking) है।

**कानूनी प्रावधान (BNS धारा 78):**
- यदि कोई व्यक्ति किसी महिला की स्पष्ट अनिच्छा के बावजूद उसका पीछा करता है, संपर्क करने का प्रयास करता है, या उसके इंटरनेट/सोशल मीडिया के उपयोग की निगरानी करता है, तो यह स्टॉकिंग माना जाता है।
- **सजा:** पहली बार दोषी पाए जाने पर 3 वर्ष तक का कारावास तथा दोबारा अपराध करने पर 5 वर्ष तक का कारावास व जुर्माना।

**सुरक्षा हेतु आवश्यक कदम:**
1. **एक स्पष्ट लिखित संदेश भेजें:** *"मुझसे संपर्क न करें। तुरंत मेरा पीछा/संदेश भेजना बंद करें।"* इसका स्क्रीनशॉट लें।
2. **इसके बाद कोई बातचीत न करें:** स्क्रीनशॉट लेने के बाद नंबर/अकाउंट को ब्लॉक करें।
3. **शारीरिक पीछा होने पर:** अपने आने-जाने के सामान्य रास्ते और समय में बदलाव करें तथा परिजनों को अपनी लोकेशन बताएं।
4. **आपातकालीन सहायता:** यदि तुरंत खतरा महसूस हो, तो बिना संकोच **112** (पुलिस) या **181** (महिला हेल्पलाइन) पर कॉल करें।`,
      resources: [OFFICIAL_RESOURCES.bns_statute, OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['112 पर कॉल करें', '181 महिला हेल्पलाइन', 'साइबर स्टॉकिंग रिपोर्ट करें']
    },
    hinglish: {
      reply: `Clear mana karne ke baad bhi baar-baar peecha karna, calls karna ya social media par monitor karna **Bharatiya Nyaya Sanhita, 2023 (BNS) ke Section 78** (pehle IPC 354D) ke tehat Stalking ka criminal offence hai.

**Kanoon kya kehta hai (BNS Section 78):**
- Agar koi disinterest ke baad bhi peecha kare ya electronic communication monitor kare, toh pehli baar mein 3 saal tak ki jail aur repeat offence mein 5 saal tak ki imprisonment ho sakti hai.

**Aapko kya karna chahiye:**
1. **Ek clear written refusal do:** *"Mujhse contact karne ki koshish mat karo. Turant ye sab band karo."* Iska screenshot le lo taaki prove ho sake ki aapne mana kiya tha.
2. **Uske baad argue mat karo:** Screenshot lene ke baad block karo. Stalker se argument karne se wo aur interact karne ki koshish karta hai.
3. **Physical safety plan:** Agar raste mein peecha kar raha hai toh regular route badlo, akele sunsaan raste se mat jao aur family ke saath live location share rakho.
4. **Helpline:** Agar situation unsafe lage toh turant **112** (Police) ya **181** (Women Helpline) par call karo.`,
      resources: [OFFICIAL_RESOURCES.bns_statute, OFFICIAL_RESOURCES.emergency_112, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['Call 112 Police', 'Call 181 Women Helpline', 'Report Cyber Stalking']
    }
  },

  // ── 10. CYBER / ONLINE HARASSMENT ──
  [INTENTS.CYBER_ONLINE_HARASSMENT]: {
    en: {
      reply: `Online harassment, blackmailing, unauthorized sharing of photos, morphing, and abusive trolling are strictly penalized under Indian law.

**Applicable Legal Frameworks:**
- **IT Act, 2000 - Section 66E:** Penalizes capturing, publishing, or transmitting images of private areas without consent.
- **IT Act, 2000 - Section 67 & 67A:** Severe imprisonment for publishing or transmitting sexually explicit materials online.
- **BNS, 2023 - Section 78:** Covers online and digital stalking.
- **BNS, 2023 - Section 79:** Penalizes insulting the modesty of a woman electronically.

**Actionable Steps:**
1. **Preserve Digital Evidence:** Save URLs, take uncropped screenshots with profile IDs and timestamps, and do not delete WhatsApp/DM threads.
2. **National Cyber Crime Portal:** Lodge a complaint online at **cybercrime.gov.in** under the dedicated "Report Crime Against Women/Child" section, or call **1930** (Cyber Crime Helpline).
3. **Platform Reporting:** Report the abusive profile or content to the platform (Instagram, Meta, X, WhatsApp) using their safety reporting forms.
4. **Never Pay Extortion:** If facing sextortion or blackmail, do not send money. Extortion demands never stop after payment; reporting to **1930** is the verified remedy.`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['National Cyber Crime Portal (1930)', 'Evidence preservation tips', 'Emergency Helplines']
    },
    hi: {
      reply: `ऑनलाइन प्रताड़ना, ब्लैकमेलिंग, तस्वीरों का दुरुपयोग, मॉर्फिंग और अभद्र संदेश भेजना भारतीय कानून में कड़ा दंडनीय अपराध है।

**संबंधित कानूनी धाराएं:**
- **सूचना प्रौद्योगिकी अधिनियम (IT Act), 2000 - धारा 66E:** बिना सहमति निजी तस्वीरों को खींचना या प्रसारित करना।
- **IT Act धारा 67 व 67A:** अश्लील व यौन सामग्री प्रसारित करने पर कठोर कारावास का प्रावधान।
- **भारतीय न्याय संहिता (BNS), 2023 - धारा 78 व 79:** डिजिटल स्टॉकिंग और महिला की गरिमा को ठेस पहुंचाना।

**तुरंत किए जाने वाले उपाय:**
1. **डिजिटल साक्ष्य सुरक्षित करें:** संबंधित प्रोफाइल का यूआरएल (URL) और समय सहित पूर्ण स्क्रीनशॉट सुरक्षित रखें।
2. **राष्ट्रीय साइबर क्राइम पोर्टल:** **cybercrime.gov.in** पर "महिलाओं व बच्चों के विरुद्ध अपराध" श्रेणी में ऑनलाइन शिकायत दर्ज करें या **1930** पर कॉल करें।
3. **ब्लैकमेल पर पैसे न दें:** यदि कोई ब्लैकमेल कर रहा है, तो कभी पैसे न दें। सीधे 1930 पर संपर्क करें।`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['साइबर क्राइम पोर्टल (1930)', 'साक्ष्य सुरक्षित रखने के उपाय', 'आपातकालीन हेल्पलाइन']
    },
    hinglish: {
      reply: `Online harassment, blackmailing, private photos leak karne ki dhamki, morphing ya abusive DMs bhejte rehna legally severe criminal offence hai.

**Kaunsi legal sections lagti hain:**
- **IT Act, 2000 (Section 66E, 67, 67A):** Private images bina consent share karne par jail aur heavy fines ka provision hai.
- **BNS, 2023 (Section 78):** Digital stalking aur internet par monitor karna punishable hai.

**Immediate Action Steps:**
1. **Digital Evidence preserve karo:** Profile ka URL copy karo, full uncropped screenshots lo jisme account handle aur message date/time dikhe.
2. **National Cyber Crime Portal par report karo:** **cybercrime.gov.in** par "Report Crime Against Women/Child" tab mein complaint register karein ya **1930** (National Cyber Helpline) par call karein.
3. **Extortion mein paise mat do:** Agar koi blackmail karke paise maang raha hai, toh paise bilkul mat bhejo. Turant 1930 par call karke report karo.`,
      resources: [OFFICIAL_RESOURCES.cybercrime, OFFICIAL_RESOURCES.posh_statute],
      suggestedActions: ['National Cyber Crime Portal (1930)', 'Evidence preservation tips', 'Emergency Helplines']
    }
  },

  // ── 11. COUNSELLING & EMOTIONAL SUPPORT ──
  [INTENTS.COUNSELLING_SUPPORT]: {
    en: {
      reply: `Experiencing harassment or distress is emotionally overwhelming. You do not have to carry this alone, and seeking support is a sign of strength, not weakness.

**Verified Government & Professional Helplines:**
- **Tele-MANAS (Ministry of Health & Family Welfare):**
  - **14416** or **1800-891-4416** (24/7 Toll-Free, available across 20+ Indian languages).
  - Free, confidential professional tele-counselling provided by trained mental health professionals.
- **KIRAN Mental Health Helpline:**
  - **1800-599-0019** (24/7 Toll-Free, Ministry of Social Justice).
- **iCALL Psychosocial Helpline (TISS):**
  - **9152987821** (Mon–Sat: 10 AM – 8 PM).

*Important:* You can also book a supportive session on Suraksha Setu's **Counselling Support** page. Talking to a counsellor does not obligate you to file a police or workplace complaint until you feel ready.`,
      resources: [OFFICIAL_RESOURCES.telemanas, OFFICIAL_RESOURCES.kiran],
      suggestedActions: ['Call Tele-MANAS (14416)', 'Call KIRAN (1800-599-0019)', 'Book Counselling on Platform']
    },
    hi: {
      reply: `उत्पीड़न या असुरक्षा का सामना करना मानसिक और भावनात्मक रूप से अत्यंत कठिन हो सकता है। आपको यह सब अकेले सहने की आवश्यकता नहीं है।

**सत्यापित सरकारी व पेशेवर हेल्पलाइन:**
- **टेली-मानस (Tele-MANAS - स्वास्थ्य मंत्रालय, भारत सरकार):**
  - **14416** या **1800-891-4416** (24/7 निःशुल्क, 20+ भाषाओं में उपलब्ध)।
  - प्रशिक्षित मनोवैज्ञानिकों द्वारा पूरी तरह गोपनीय व मुफ्त परामर्श।
- **किरण (KIRAN) मानसिक स्वास्थ्य हेल्पलाइन:**
  - **1800-599-0019** (24/7 टोल-फ्री)।
- **iCALL साइकोसोशल हेल्पलाइन (TISS):**
  - **9152987821** (सोमवार - शनिवार: सुबह 10 से रात 8 बजे तक)।

*ध्यान दें:* काउंसलर से बात करने का अर्थ यह नहीं है कि आपको अनिवार्य रूप से कानूनी शिकायत करनी ही होगी। जब तक आप स्वयं तैयार न हों, यह पूरी तरह आपका निर्णय है।`,
      resources: [OFFICIAL_RESOURCES.telemanas, OFFICIAL_RESOURCES.kiran],
      suggestedActions: ['टेली-मानस (14416) पर कॉल करें', 'किरण हेल्पलाइन (1800-599-0019)', 'काउंसलिंग सेशन बुक करें']
    },
    hinglish: {
      reply: `Harassment ya unsafe environment se emotionally bahut distress aur stress hota hai. Is waqt kisi trusted professional se baat karna aapke mental peace ke liye bahut helpful hoga.

**Verified Free Counselling Helplines:**
- **Tele-MANAS (Govt of India):**
  - **14416** ya **1800-891-4416** (24/7 Toll-Free).
  - Health Ministry ki free aur confidential counselling service hai jo multiple languages mein available hai.
- **KIRAN Helpline:**
  - **1800-599-0019** (24/7 Free).
- **iCALL Helpline (TISS):**
  - **9152987821** (Mon–Sat, 10 AM – 8 PM).

*Yaad rakhein:* Counsellor se baat karne ka matlab ye nahi ki aapko complaint karni hi padegi. Aap apni pacing decide kar sakti hain. Humare platform par bhi Counselling Support page available hai.`,
      resources: [OFFICIAL_RESOURCES.telemanas, OFFICIAL_RESOURCES.kiran],
      suggestedActions: ['Call Tele-MANAS (14416)', 'Call KIRAN (1800-599-0019)', 'Book Counselling on Platform']
    }
  },

  // ── 12. COLLEGE / CAMPUS HARASSMENT ──
  [INTENTS.COLLEGE_CAMPUS_HARASSMENT]: {
    en: {
      reply: `Sexual harassment in universities, colleges, and higher educational institutions is governed by the **UGC Regulations, 2015** along with the **POSH Act, 2013**.

**Key Student Protections under UGC Regulations:**
1. **Mandatory ICC with Student Representation (Regulation 4):**
   - Higher educational institutions must have an Internal Complaints Committee (ICC).
   - When a complaint involves students, the committee must include **3 elected/nominated student representatives** alongside faculty and an external NGO member.
2. **Zero Victimisation & Retaliation Protection:**
   - The institution is strictly bound to protect the complainant from academic victimisation (e.g. grading bias, exam attendance withholding, guide reassignment).
3. **Interim Measures (Regulation 5):**
   - You can request changes in hostel accommodations, assignment of an alternate research supervisor/guide, or academic deadline extensions during inquiry.
4. **Time Limits:**
   - File within 3 months of the incident; inquiry must conclude within 90 days.
5. **Grievance Portal:**
   - If the college fails to act, you can escalate to the **UGC e-Samadhan portal** (samadhan.ugc.ac.in).`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.ncw],
      suggestedActions: ['UGC Regulations Guidelines', 'How to write campus complaint', 'Proof Vault for evidence']
    },
    hi: {
      reply: `कॉलेजों और विश्वविद्यालयों में यौन उत्पीड़न के मामले **यूजीसी विनियम, 2015 (UGC Regulations, 2015)** और **पॉश अधिनियम, 2013** के अंतर्गत आते हैं।

**छात्रों के लिए विशेष कानूनी अधिकार:**
1. **छात्र प्रतिनिधित्व वाली आंतरिक समिति (ICC):**
   - यदि शिकायत में छात्र शामिल हैं, तो समिति में **3 छात्र प्रतिनिधि** का होना अनिवार्य है।
2. **शैक्षणिक प्रतिशोध (Academic Victimisation) पर रोक:**
   - शिकायत के कारण अंकों में भेदभाव, उपस्थिति रोकने या गाइड द्वारा परेशान करने पर सख्त कानूनी रोक है।
3. **अंतरिम सुरक्षा:**
   - जांच के दौरान हॉस्टल बदलने, गाइड/प्रोफेसर बदलने या परीक्षा में वैकल्पिक व्यवस्था की मांग की जा सकती है।
4. **यूजीसी में अपील:**
   - यदि कॉलेज प्रशासन कार्रवाई नहीं करता है, तो सीधे **UGC e-Samadhan पोर्टल** पर शिकायत की जा सकती है।`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.ncw],
      suggestedActions: ['यूजीसी नियम विवरण', 'कैंपस शिकायत प्रारूप', 'साक्ष्य सुरक्षित रखना']
    },
    hinglish: {
      reply: `Colleges aur Universities mein sexual harassment **UGC Regulations, 2015** aur **POSH Act, 2013** ke tehat strictly address hota hai.

**College Students ke Main Rights:**
1. **ICC mein Student Representation:**
   - Agar complaint students se related hai, toh college ki Internal Complaints Committee (ICC) mein **3 student representatives** ka hona mandatory hai.
2. **Academic Victimisation se Protection:**
   - Professor ya department aapke marks, attendance ya PhD/project grading ko negatively affect nahi kar sakta. Aisa karna illegal victimisation maana jaata hai.
3. **Interim Relief:**
   - Aap hostel room change karne, professor/guide change karne ya exam accommodations ki formal request kar sakti hain inquiry ke dauran.
4. **College action na le toh:**
   - Agar college IC sunwai na kare, toh **UGC e-Samadhan portal** aur **National Commission for Women (NCW)** par escalate kiya ja sakta hai.`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.ncw],
      suggestedActions: ['UGC Regulations Guidelines', 'How to write campus complaint', 'Proof Vault for evidence']
    }
  },

  // ── 13. CHILD SAFETY & POCSO ──
  [INTENTS.CHILD_SAFETY_POCSO]: {
    en: {
      reply: `Any sexual offence, touching, harassment, or exploitation involving a person under 18 years of age is governed by the **POCSO Act, 2012** (*Protection of Children from Sexual Offences Act*).

**Critical Statutory Rules:**
1. **Mandatory Reporting (Section 19):**
   - Any person or institution having knowledge of sexual harassment or abuse of a minor has a mandatory legal duty to report it to the Special Juvenile Police Unit (SJPU) or local police. Failure to report is punishable under Section 21.
2. **Emergency Helpline:**
   - Call **1098** (Childline India, 24/7 free toll-free support for children in distress).
   - Call **112** for emergency police protection.
3. **Child-Friendly Procedures:**
   - The child's identity cannot be disclosed in media or public under Section 23.
   - Statements are recorded at the child's residence or a child-friendly place without police in uniform.`,
      resources: [OFFICIAL_RESOURCES.childline_1098, OFFICIAL_RESOURCES.emergency_112],
      suggestedActions: ['Call Childline 1098', 'Call 112 Police Emergency', 'POCSO Legal Provisions']
    },
    hi: {
      reply: `18 वर्ष से कम आयु के किसी भी बालक या बालिका के साथ यौन दुर्व्यवहार या उत्पीड़न **पॉक्सो अधिनियम, 2012 (POCSO Act, 2012)** के तहत आता है।

**महत्वपूर्ण कानूनी बिंदु:**
1. **अनिवार्य रिपोर्टिंग (धारा 19):**
   - नाबालिग के खिलाफ किसी भी यौन अपराध की जानकारी होने पर पुलिस या विशेष किशोर पुलिस इकाई को सूचना देना कानूनन अनिवार्य है। सूचना न देना धारा 21 में दंडनीय है।
2. **आपातकालीन हेल्पलाइन:**
   - **1098** पर कॉल करें (चाइल्डलाइन - 24/7 निःशुल्क सेवा)।
   - आपात स्थिति में तुरंत **112** पर संपर्क करें।
3. **गोपनीयता:**
   - बच्चे की पहचान किसी भी रूप में उजागर करना कानूनन सख्त मना है।`,
      resources: [OFFICIAL_RESOURCES.childline_1098, OFFICIAL_RESOURCES.emergency_112],
      suggestedActions: ['चाइल्डलाइन 1098 पर कॉल करें', '112 आपातकालीन सेवा', 'पॉक्सो कानून विवरण']
    },
    hinglish: {
      reply: `18 saal se kam age ke kisi bhi individual ke saath sexual abuse ya harassment **POCSO Act, 2012** ke tehat treat hota hai jo ek bohot strict special law hai.

**Main Rules:**
1. **Mandatory Reporting (Section 19):**
   - Agar kisi ko minor ke khilaaf offence ki jankari hai, toh police ya Special Juvenile Police Unit ko inform karna statutory duty hai. Report na karna bhi punishable hai.
2. **Helpline:**
   - **1098** (Childline India - 24/7 Free Helpline).
   - Immediate danger mein **112** (Police Emergency).
3. **Child Identity Protection:**
   - Minor ki identity kisi bhi media ya public platform par disclose karna legally prohibited hai.`,
      resources: [OFFICIAL_RESOURCES.childline_1098, OFFICIAL_RESOURCES.emergency_112],
      suggestedActions: ['Call Childline 1098', 'Call 112 Police Emergency', 'POCSO Legal Provisions']
    }
  },

  // ── 14. GENERAL / UNKNOWN GUIDANCE ──
  [INTENTS.GENERAL_GUIDANCE]: {
    en: {
      reply: `I am here to assist you with women's safety rights, workplace harassment, POSH compliance, evidence preservation, and support resources in India.

**I can provide specific, actionable information on:**
1. **Workplace Harassment & POSH Act:** What qualifies as harassment, Internal Committee (IC) constitution, filing procedures, and 3-month timelines.
2. **Protection Against Retaliation:** What to do if facing threats to your job after filing a complaint (Section 12).
3. **Evidence Preservation:** How to safely store screenshots, chat logs, and emails in our encrypted Proof Vault.
4. **Stalking & Cyber Safety:** Your legal remedies under BNS Section 78 and the National Cyber Crime Portal (1930).
5. **Where to Report if Company Refuses:** Filing on the Central Govt SHe-Box portal or with the Local Committee (LC).
6. **Emotional Support:** Connecting with 24/7 free helplines like Tele-MANAS (14416) or Women Helpline (181).

How can I assist you with your specific question today?`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.women_helpline_181, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['What is the POSH Act?', 'How to report workplace harassment?', 'How to store evidence safely', 'Emergency helplines']
    },
    hi: {
      reply: `मैं भारत में महिलाओं के सुरक्षा अधिकारों, कार्यस्थल उत्पीड़न, पॉश अधिनियम (POSH Act), साक्ष्य संरक्षण और सहायता सेवाओं के संबंध में आपकी सहायता कर सकती हूँ।

**मैं इन विषयों पर सटीक जानकारी प्रदान कर सकती हूँ:**
1. **कार्यस्थल पर यौन उत्पीड़न:** पॉश अधिनियम के तहत शिकायत के नियम, आंतरिक समिति (IC) और 3 महीने की समयसीमा।
2. **धमकी मिलने पर सुरक्षा:** शिकायत के बाद नौकरी से निकालने की धमकी मिलने पर अंतरिम राहत (धारा 12)।
3. **साक्ष्य सुरक्षित रखना:** स्क्रीनशॉट और चैट को हमारे प्रूफ वॉल्ट (Proof Vault) में सुरक्षित स्टोर करना।
4. **कंपनी कार्रवाई न करे तो:** केंद्र सरकार के SHe-Box पोर्टल और जिला स्थानीय समिति में शिकायत।
5. **स्टॉकिंग व ऑनलाइन उत्पीड़न:** साइबर अपराध पोर्टल (1930) और कानूनी धाराएं।
6. **मानसिक स्वास्थ्य सहायता:** टेली-मानस (14416) और महिला हेल्पलाइन (181)।

कृपया बताएं कि आपकी स्थिति के अनुसार मैं आपकी किस प्रकार सहायता कर सकती हूँ?`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.women_helpline_181],
      suggestedActions: ['पॉश अधिनियम क्या है?', 'शिकायत कैसे दर्ज करें?', 'सबूत सुरक्षित कैसे रखें?', 'आपातकालीन हेल्पलाइन']
    },
    hinglish: {
      reply: `Main India mein women's safety rights, workplace harassment, POSH compliance, evidence preservation aur official support resources ke baare mein aapko guide kar sakti hoon.

**Aap mujhse specific questions pooch sakti hain jaise:**
1. **Workplace Harassment & POSH Act:** Harassment ki definition, Internal Committee (IC) rules, complaint timeline (3 months).
2. **Retaliation Protections:** Complaint ke baad job ya appraisal ki threat milne par Section 12 ke relief rights.
3. **Evidence Storage:** Screenshots aur chats ko Suraksha Setu ke encrypted Proof Vault mein securely save karna.
4. **Company Action Na Le Toh:** SHe-Box portal ya District Local Committee (LC) mein complaint kaise karein.
5. **Stalking & Cyber Bullying:** BNS Section 78 aur Cyber Crime portal (1930) par report karne ke tareeqe.
6. **Emotional Support:** Tele-MANAS (14416) ya Women Helpline (181) par free support.

Aap apne case ya question ke baare mein batayein, main step-by-step madad kar sakti hoon.`,
      resources: [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.women_helpline_181, OFFICIAL_RESOURCES.shebox],
      suggestedActions: ['POSH Act kya hota hai?', 'Office mein harassment ki complaint kaise karein?', 'Saboot kaise save karein?', 'Emergency numbers']
    }
  }
};

/**
 * Main chat handler: processes user message and returns intelligent, multilingual response.
 * @param {Object} params
 * @param {string} params.message
 * @param {Array} [params.history]
 * @returns {Promise<Object>}
 */
export async function processSafetyChat({ message = '', history = [] }) {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  // 1. Language Detection
  const language = detectLanguage(trimmed);

  // 2. Intent Classification
  const intent = classifyIntent(trimmed);
  const isEmergency = intent === INTENTS.EMERGENCY;

  // 3. Optional AI Provider Integration (if GEMINI_API_KEY / AI_API_KEY is configured)
  const aiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;

  if (aiKey && !isEmergency) {
    try {
      // If external AI key is available, call it with grounded system instruction
      const aiReply = await callExternalAIProvider({ message: trimmed, history, language, intent, aiKey });
      if (aiReply) {
        return {
          success: true,
          reply: aiReply.text,
          language,
          isEmergency: false,
          intent,
          suggestedActions: aiReply.suggestedActions || ['How to preserve evidence', 'What is POSH Act?'],
          officialResources: aiReply.resources || [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.women_helpline_181],
          aiConfigured: true,
          source: 'ai_grounded_engine',
        };
      }
    } catch (err) {
      console.warn('[SafetyAssistant] External AI provider error, falling back to Knowledge Engine:', err.message);
    }
  }

  // 4. Built-in Grounded Knowledge Engine Response
  const intentData = KNOWLEDGE_RESPONSES[intent] || KNOWLEDGE_RESPONSES[INTENTS.GENERAL_GUIDANCE];
  const langData = intentData[language] || intentData['en'];

  return {
    success: true,
    reply: langData.reply,
    language,
    isEmergency,
    intent,
    suggestedActions: langData.suggestedActions || [],
    officialResources: langData.resources || [],
    aiConfigured: Boolean(aiKey),
    source: 'verified_knowledge_engine',
  };
}

/**
 * Helper to call Gemini / external AI with strict safety constraints when API key is provided.
 */
async function callExternalAIProvider({ message, history, language, intent, aiKey }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiKey}`;
  const systemPrompt = `You are the Suraksha Setu Women-Safety Legal and Support Assistant.
You provide accurate, empathetic, and actionable guidance on women's safety, workplace sexual harassment (POSH Act 2013), criminal laws (BNS 2023), evidence collection, and national helplines in India.
Language instruction: Respond in the exact language used by the user:
- If user writes in English, reply in clear, professional English.
- If user writes in Hindi (Devanagari), reply in Hindi (Devanagari).
- If user writes in Hinglish (Roman Hindi), reply in natural, supportive Hinglish.
Rules:
1. Never blame the victim.
2. Never invent laws, section numbers, or fabricated URLs.
3. For emergencies, recommend 112 and 181 immediately.
4. For POSH Act: Section 2(n) defines sexual harassment, Section 4 mandates Internal Committee, Section 9 gives 3 months timeline, Section 12 provides interim relief, Section 16 mandates strict confidentiality.
5. Emphasize that the assistant is informational and does not constitute formal advocate representation.`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I will provide verified, supportive, and multilingual guidance strictly adhering to Indian legal frameworks.' }] },
  ];

  // Append recent history
  if (Array.isArray(history)) {
    for (const h of history.slice(-4)) {
      if (h.role && h.text) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }
  }

  contents.push({ role: 'user', parts: [{ text: message }] });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
    signal: AbortSignal.timeout(6000)
  });

  if (!res.ok) {
    throw new Error(`AI API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from AI provider');
  }

  const defaultResources = [OFFICIAL_RESOURCES.posh_statute, OFFICIAL_RESOURCES.women_helpline_181];
  return { text, resources: defaultResources, suggestedActions: [] };
}
