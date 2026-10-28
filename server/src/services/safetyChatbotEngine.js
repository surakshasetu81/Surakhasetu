/**
 * Suraksha Setu — Intelligent Multilingual Women-Safety Chatbot Engine
 * 
 * Supports:
 * - English
 * - Hindi (Devanagari script)
 * - Hinglish (Romanized Hindi)
 * - Mixed Hindi and English
 * 
 * Domains:
 * - Workplace sexual harassment & POSH Act 2013
 * - Vishaka Guidelines (1997 Supreme Court) distinction
 * - Internal Committee (IC) & Local Committee (LC) procedures
 * - Retaliation, threats & job-loss intimidation (Section 12 interim relief)
 * - Evidence collection, timestamps & Proof Vault preservation
 * - Confidentiality & anonymous reporting boundaries
 * - Stalking, digital privacy & cyber harassment (IT Act & BNS)
 * - Emergency response (112, 181, 1098, 1091, 1930)
 * - Verified Government portals & official legal resources
 */

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL RESOURCES & VERIFIED HELPLINES
// ─────────────────────────────────────────────────────────────────────────────

export const OFFICIAL_PORTALS = {
  mwcd: {
    name: 'Ministry of Women & Child Development (MWCD Legislations)',
    url: 'https://www.wcd.gov.in/documents/legislations',
    category: 'legislation',
  },
  mwcdWomen: {
    name: 'MWCD Women Legislations Portal',
    url: 'https://wcd.gov.in/women/legislations',
    category: 'legislation',
  },
  poshAct: {
    name: 'India Code — POSH Act 2013 Official Statute',
    url: 'https://www.indiacode.nic.in/handle/123456789/2104',
    category: 'statute',
  },
  msmePosh: {
    name: 'Ministry of MSME — Official POSH Act 2013 Guide',
    url: 'https://www.dcmsme.gov.in/POSHACT2013.aspx',
    category: 'compliance',
  },
  sciGender: {
    name: 'Supreme Court of India — Judgments & Gender Portal',
    url: 'https://www.sci.gov.in/document/judgments-and-gender/',
    category: 'judgments',
  },
  ncw: {
    name: 'National Commission for Women (NCW)',
    url: 'https://ncw.nic.in/',
    category: 'commission',
  },
  cybercrime: {
    name: 'National Cyber Crime Reporting Portal (MHA)',
    url: 'https://cybercrime.gov.in/',
    category: 'cyber',
  },
  pocsoAct: {
    name: 'India Code — POCSO Act 2012 Official Statute',
    url: 'https://www.indiacode.nic.in/handle/123456789/2079',
    category: 'statute',
  },
  bnsAct: {
    name: 'India Code — Bharatiya Nyaya Sanhita, 2023',
    url: 'https://www.indiacode.nic.in/handle/123456789/20062',
    category: 'statute',
  },
};

export const EMERGENCY_HELPLINES = [
  { name: 'National Emergency Service (Police/Ambulance)', number: '112', availability: '24/7 Toll-Free' },
  { name: 'Women Helpline (National)', number: '181', availability: '24/7 Toll-Free' },
  { name: 'Women in Distress (Police Special Cell)', number: '1091', availability: '24/7 Dedicated' },
  { name: 'National Commission for Women Helpline', number: '7827170170', availability: '24/7 Helpline' },
  { name: 'Childline (For minors below 18)', number: '1098', availability: '24/7 Toll-Free' },
  { name: 'National Cyber Crime Helpline', number: '1930', availability: '24/7 Toll-Free' },
  { name: 'Tele-MANAS Mental Health Counselling', number: '14416', availability: '24/7 Toll-Free' },
  { name: 'NALSA Free Legal Aid Helpline', number: '15100', availability: 'National Legal Aid' },
];

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects whether input is Devanagari Hindi, Romanized Hinglish, English, or Mixed.
 * @param {string} text 
 * @returns {'hindi' | 'hinglish' | 'english' | 'mixed'}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'english';

  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;
  const totalLetters = (text.match(/[a-zA-Z\u0900-\u097F]/g) || []).length;

  if (totalLetters > 0 && devanagariCount / totalLetters > 0.3) {
    return 'hindi';
  }

  const hinglishKeywords = [
    'kya', 'kaise', 'karo', 'karun', 'karein', 'kare', 'karna', 'kariye',
    'mujhe', 'mera', 'meri', 'mere', 'mujhse', 'hamara', 'hum',
    'nahi', 'nahin', 'mat', 'nhi',
    'aur', 'par', 'lekin', 'agar', 'toh', 'jab', 'tab',
    'hai', 'hain', 'ho', 'tha', 'thi', 'the', 'hoga', 'hogi',
    'dhamki', 'bachao', 'shikayat', 'peechha', 'picha', 'kamre', 'haath',
    'office', 'manager', 'boss', 'kaam', 'job', 'nikalne', 'nikal', 'dega', 'raha', 'rahi',
    'chahiye', 'hota', 'hoti', 'hote', 'kahan', 'kidhar', 'kisko', 'kise',
    'baat', 'bheja', 'bhej', 'de\\s+raha', 'mil\\s+rahi', 'dar', 'lag', 'lagta',
    'sun', 'sunta', 'sunte', 'batao', 'samjhao', 'saboot', 'rakhun'
  ];

  const lower = text.toLowerCase();
  const tokens = lower.split(/\W+/).filter(Boolean);
  const matchedHinglish = tokens.filter(t => hinglishKeywords.includes(t));

  if (matchedHinglish.length >= 2 || (tokens.length <= 4 && matchedHinglish.length >= 1)) {
    return 'hinglish';
  }

  if (matchedHinglish.length === 1 && tokens.length > 5) {
    return 'mixed';
  }

  return 'english';
}

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY & IMMEDIATE DANGER DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const EMERGENCY_REGEXES = [
  /\b(immediate\s+danger|in\s+danger\s+now|life\s+threat|kill\s+(me|us)|knife|weapon|gun|acid|armed|murder|strangled|choking)\b/i,
  /(?:^|[^\u0900-\u097F])(जान\s*को\s*खतरा|मार\s*डालेगा|मारने\s*की\s*धमकी|खतरे\s*में\s*हूँ|तेज़ाब\s*फेंक|चाकू|बचाओ|अभी\s*खतरा)(?:$|[^\u0900-\u097F])/u,
  /\b(jaan\s*ka\s*khatra|maar\s*dalega|attacked\s*right\s*now|in\s*danger\s*now|bachao|acid\s*attack|chaku|abhi\s*unsafe|unsafe\s*feel\s*ho\s*raha)\b/i,
  /\b(rap+ed|rap(e|ing)|reped|forced\s+sex|sexual\s+assault\s+now|physically\s+attacking)\b/i,
  /(?:^|[^\u0900-\u097F])(बलात्कार\s*हुआ|यौन\s*हमला\s*हुआ|जबरदस्ती\s*कर\s*रहा)(?:$|[^\u0900-\u097F])/u,
  /\b(balat?kaar|dushkarm|zabardasti\s+kar\s+raha|physical\s*force|haath\s*uthaya)\b/i,
];

export function isEmergencySituation(text) {
  return EMERGENCY_REGEXES.some(rgx => rgx.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN INTENT RECOGNITION & ACTIONABLE RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an empathetic, actionable, and legally sound response in the user's language.
 * @param {string} userMessage
 * @param {Array<Object>} [history=[]]
 * @returns {Object} response
 */
export function generateChatbotResponse(userMessage, history = []) {
  const text = (userMessage || '').trim();
  const lang = detectLanguage(text);
  const lower = text.toLowerCase();

  // 1. EMERGENCY & IMMEDIATE DANGER
  if (isEmergencySituation(lower)) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `🚨 **आपकी सुरक्षा सबसे पहली प्राथमिकता है:**\n\n` +
        `यदि आप इस समय किसी भी प्रकार के शारीरिक खतरे या आपातकालीन स्थिति में हैं, तो तुरंत किसी सुरक्षित और भीड़-भाड़ वाली जगह पर जाएं और बिना देर किए आपातकालीन सेवाओं से संपर्क करें:\n\n` +
        `• **112** — राष्ट्रीय आपातकालीन हेल्पलाइन (पुलिस एवं तत्काल सहायता)\n` +
        `• **181** — महिला हेल्पलाइन (24x7 निःशुल्क)\n` +
        `• **1091** — संकटग्रस्त महिलाओं हेतु विशेष पुलिस सेल\n\n` +
        `⚠️ *ध्यान दें:* यह चैटबॉट एक सूचनात्मक सहायक है और सीधे पुलिस या रेस्क्यू टीम नहीं भेज सकता। कृपया तुरंत 112 या 181 पर कॉल करें और अपने किसी विश्वसनीय परिजन के साथ अपनी लाइव लोकेशन साझा करें।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `🚨 **Aapki safety sabse pehle aati hai:**\n\n` +
        `Agar aap abhi kisi physical danger, violence ya emergency situation mein hain, toh turant kisi safe, well-lit ya public jagah par move karein aur bina delay kiye emergency services ko call karein:\n\n` +
        `• **112** — National Police & Emergency Response\n` +
        `• **181** — Women Helpline (24/7 Toll-Free)\n` +
        `• **1091** — Women in Distress Police Support\n\n` +
        `⚠️ *Important:* Ye chatbot ek digital support tool hai aur directly emergency team dispatch nahi kar sakta. Kripya turant 112 dial karein aur apne trusted family member ya friend ke saath live location share karein. Hum aapki safety ke liye yahan hain.`;
    } else {
      reply = `🚨 **Your immediate safety is the highest priority:**\n\n` +
        `If you are in immediate physical danger, experiencing violence, or facing an active threat, please move to a safe, populated, or well-lit location immediately and contact emergency authorities:\n\n` +
        `• **112** — National Emergency & Police Response (Toll-Free, 24/7)\n` +
        `• **181** — National Women Helpline (24/7 Support)\n` +
        `• **1091** — Women in Distress Special Cell\n\n` +
        `⚠️ *Please note:* This chatbot is an informational support tool and cannot directly dispatch rescue personnel or police. Please dial 112 right away and share your live location with a trusted contact.`;
    }

    return {
      reply,
      category: 'emergency_crisis',
      isEmergency: true,
      helplines: EMERGENCY_HELPLINES.slice(0, 4),
      officialResources: [OFFICIAL_PORTALS.mwcd, OFFICIAL_PORTALS.ncw],
      suggestedQuestions: [
        'How do I share emergency details safely?',
        'What should I do after reaching a safe location?',
        'How to file a Zero FIR at any police station?'
      ],
    };
  }

  // 2. RETALIATION & THREATS OF TERMINATION
  const isRetaliationQuery = /\b(dhamki|job\s*se\s*nikal|fire\s*me|terminate|retaliat(e|ion)|bad\s*appraisal|career\s*ruin|job\s*chali\s*jayegi|threaten(ing|ed)?\s*to\s*fire)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(नौकरी\s*से\s*निकालने|धमकी\s*दे|करियर\s*खराब)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isRetaliationQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `शिकायत करने के बाद नौकरी से निकालने या नुकसान पहुंचाने की धमकी देना कानूनन गंभीर अपराध और उत्पीड़न का हिस्सा है।\n\n` +
        `**पॉश अधिनियम, 2013 के तहत आपके अधिकार:**\n` +
        `1. **धारा 12 (अंतरिम राहत / Interim Relief):** जांच के दौरान आप इंटरनल कमेटी (IC) से लिखित अनुरोध कर सकती हैं कि आपका या धमकी देने वाले का ट्रांसफर किया जाए, या आपको 3 महीने तक की अतिरिक्त सवेतन छुट्टी (Paid Leave) दी जाए।\n` +
        `2. **परफॉर्मेंस अप्रेजल सुरक्षा:** आरोपी व्यक्ति को आपके कार्य मूल्यांकन या परफॉर्मेंस रिपोर्ट लिखने से रोका जा सकता है।\n` +
        `3. **धमकी के सबूत सुरक्षित रखें:** हर धमकी भरे ईमेल, मैसेज या बातचीत का समय, तारीख और स्क्रीनशॉट सुरक्षित रखें।\n` +
        `4. **कमेटी को तुरंत सूचित करें:** इस धमकी को अपनी मुख्य शिकायत के अतिरिक्त पत्र (Supplementary Application) के रूप में IC के सामने दर्ज कराएं।\n\n` +
        `यदि कंपनी प्रबंधन सहयोग नहीं कर रहा है, तो आप जिला कलेक्टर / स्थानीय समिति (LC) या राष्ट्रीय महिला आयोग (NCW) में शिकायत दर्ज करा सकती हैं।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `Complaint karne ke baad job se nikalne ya appraisal kharab karne ki dhamki milna ek statutory violation hai aur POSH law iske khilaaf clear protection deta hai.\n\n` +
        `**Aapko kya kadam uthane chahiye:**\n` +
        `1. **Section 12 ke tehat Interim Relief:** POSH Act ke Section 12 ke tehat aap Internal Committee (IC) se likhit request kar sakti hain ki aapko ya accused ko dusre department/branch mein transfer kiya jaye, ya aapko 3 months tak ki additional paid leave mile.\n` +
        `2. **Appraisal Restraint:** Accused supervisor aapki performance rating ya report nahi likh sakta.\n` +
        `3. **Retaliation Evidence Preserve Karein:** Jo bhi threats mile hain (emails, WhatsApp messages, verbal threats ki date/time), unko preserve karein.\n` +
        `4. **IC ko Supplementary Application Dein:** IC ko inform karein ki aapko complaint ke baad retaliate kiya ja raha hai.\n\n` +
        `Agar company management action nahi leta, toh aap District Local Committee (LC) ya NCW (7827170170) mein formal complaint escalate kar sakti hain.`;
    } else {
      reply = `Facing threats of termination, adverse appraisal, or workplace retaliation after reporting harassment is unlawful and recognized under Indian workplace protections.\n\n` +
        `**Your Statutory Rights Under POSH Act, 2013:**\n` +
        `1. **Interim Relief Under Section 12:** During the pendency of the inquiry, you can make a written application to the Internal Committee (IC) requesting:\n` +
        `   • Transfer of either yourself or the respondent to another department/team.\n` +
        `   • Grant of paid leave up to 3 months (in addition to your regular leaves).\n` +
        `   • Restraining the respondent from supervising or assessing your work performance.\n` +
        `2. **Document Every Threat:** Preserve all text messages, emails, memos, and make a dated log of verbal interactions.\n` +
        `3. **Submit a Retaliation Complaint to IC:** Retaliatory conduct should be formally added to the inquiry record as aggravated misconduct.\n` +
        `4. **External Escalation:** If company leadership fails to protect you, complaints can be escalated to the District Local Committee (LC) or the National Commission for Women (NCW).`;
    }

    return {
      reply,
      category: 'retaliation_and_threats',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[3], EMERGENCY_HELPLINES[7]],
      officialResources: [OFFICIAL_PORTALS.poshAct, OFFICIAL_PORTALS.msmePosh, OFFICIAL_PORTALS.ncw],
      suggestedQuestions: [
        'How to write an interim relief letter under Section 12?',
        'What if the employer itself is threatening me?',
        'How does Local Committee (LC) handle retaliation?'
      ],
    };
  }

  // 3. VISHAKA GUIDELINES VS POSH ACT DISTINCTION
  const isVishakaQuery = /\b(vishaka|vishakha|guidelines\s*1997|difference\s+between\s+vishaka)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(विशाखा|दिशानिर्देश\s*1997)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isVishakaQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**विशाखा दिशानिर्देश (1997) और पॉश अधिनियम (2013) में क्या अंतर है?**\n\n` +
        `ये दोनों एक ही दस्तावेज़ नहीं हैं, बल्कि भारत में कार्यस्थल सुरक्षा की दो महत्वपूर्ण ऐतिहासिक कड़ियां हैं:\n\n` +
        `1. **विशाखा दिशानिर्देश (1997):**\n` +
        `   • यह सुप्रीम कोर्ट का ऐतिहासिक फैसला था (*Vishaka v. State of Rajasthan*).\n` +
        `   • उस समय कार्यस्थल पर यौन उत्पीड़न के लिए कोई संसद द्वारा पारित कानून नहीं था, इसलिए सुप्रीम कोर्ट ने संविधान के अनुच्छेद 32 के तहत अनिवार्य दिशानिर्देश जारी किए।\n\n` +
        `2. **पॉश अधिनियम (2013):**\n` +
        `   • भारतीय संसद द्वारा पारित औपचारिक कानून (Statutory Act) है।\n` +
        `   • इसने 1997 के विशाखा सिद्धांतों को पूर्ण कानूनी रूप दिया और विस्तृत नियम, समयसीमाएं, नियोक्ता पर जुर्माने और स्थानीय समितियां स्थापित कीं।\n\n` +
        `वर्तमान में सभी कार्यस्थल शिकायतें **पॉश अधिनियम, 2013** के तहत संचालित होती हैं।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**Vishaka Guidelines (1997) vs POSH Act (2013) — Clarity Note:**\n\n` +
        `Dhyan rahe ki Vishaka Guidelines aur POSH Act same document nahi hain:\n\n` +
        `1. **Vishaka Guidelines (1997):** Ye Supreme Court of India ka landmark judgment tha (*Vishaka v. State of Rajasthan*). Jab workplace harassment par koi written parliamentary law nahi tha, tab Supreme Court ne Article 32 ke under interim judicial guidelines banayi thi.\n\n` +
        `2. **POSH Act (2013):** Parliament of India ne 2013 mein formal statutory law pass kiya, jisne Vishaka Guidelines ke principles ko expand karke formal legal act (Act No. 14 of 2013) banaya.\n\n` +
        `Aaj ke samay mein workplace complaints officially **POSH Act, 2013** ke according resolve hoti hain.`;
    } else {
      reply = `**Distinction: Vishaka Guidelines (1997) vs. POSH Act (2013):**\n\n` +
        `It is crucial to recognize that the Vishaka Guidelines and the POSH Act are two distinct legal instruments:\n\n` +
        `1. **Vishaka Guidelines (1997):**\n` +
        `   • A landmark judicial ruling by the Supreme Court of India (*Vishaka and Others v. State of Rajasthan, 1997 6 SCC 241*).\n` +
        `   • Delivered under Article 32 to fill a legislative vacuum where no statutory enactment existed, laying down foundational employer obligations.\n\n` +
        `2. **The POSH Act (2013):**\n` +
        `   • A statutory enactment by the Parliament of India (Act No. 14 of 2013).\n` +
        `   • Codified, refined, and superseded the Vishaka Guidelines with concrete statutory mechanisms, penal consequences, time-bound inquiries, and district Local Committees.\n\n` +
        `Today, all workplace grievances in India are formally governed by the statutory POSH Act, 2013.`;
    }

    return {
      reply,
      category: 'legal_history_distinction',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1]],
      officialResources: [OFFICIAL_PORTALS.sciGender, OFFICIAL_PORTALS.poshAct, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'Where can I read the Supreme Court gender judgments?',
        'What are the mandatory duties of an employer under POSH?',
        'Can an employer be fined for not forming an IC?'
      ],
    };
  }

  // 4. ANONYMOUS REPORTING & CONFIDENTIALITY BOUNDARIES
  const isAnonymousQuery = /\b(anonym(ous|ously)?|gumnaam|bina\s*naam\s*ke|confidential(ity|ly)?|pehechan\s*chupana|name\s*reveal)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(गुमनाम|पहचान\s*छुपा|गोपनीयता)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isAnonymousQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**गुमनाम रिपोर्टिंग और कानूनी गोपनीयता के नियम:**\n\n` +
        `1. **सुरक्षा सेतु प्लेटफॉर्म पर:** आप यहां पूरी तरह गुमनाम रहकर शिकायत दर्ज करा सकती हैं। आपको एक गोपनीय केस आईडी और रिकवरी कोड मिलेगा जिससे आप स्थिति ट्रैक कर सकती हैं।\n` +
        `2. **औपचारिक कानूनी स्थिति (POSH Act के तहत):** आंतरिक समिति (IC) में औपचारिक अनुशासनात्मक जांच के लिए कानूनन लिखित और हस्ताक्षरित शिकायत आवश्यक होती है ताकि आरोपी को निष्पक्ष सुनवाई (Natural Justice) का मौका मिल सके।\n` +
        `3. **पहचान की सख्त गोपनीयता (धारा 16):** भले ही शिकायत में आपका नाम IC के पास हो, लेकिन कानूनन आपकी पहचान, पता और जांच की जानकारी किसी भी स्थिति में सार्वजनिक या सहकर्मियों के बीच उजागर नहीं की जा सकती। उल्लंघन करने पर दंड का प्रावधान है।\n\n` +
        `यदि आप अभी अपनी पहचान नहीं बताना चाहतीं, तो पहले हमारे Proof Vault में सबूत सुरक्षित रख सकती हैं या 181 हेल्पलाइन पर परामर्श ले सकती हैं।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**Anonymous Reporting & Confidentiality Reality:**\n\n` +
        `1. **Suraksha Setu Portal Par:** Aap yahan bilkul anonymously report submit kar sakti hain. Aapko ek unique Case ID aur hashed Recovery Code milega jisse aap apni case progress anonymously track kar sakti hain.\n` +
        `2. **Formal POSH IC Inquiry:** Formal workplace investigation ke liye law required karta hai ki IC ke paas written signed complaint ho, kyunki accused ko specific allegations ka reply dena hota hai.\n` +
        `3. **Strict Confidentiality (Section 16):** Law strictly ensure karta hai ki IC ke members ya employer aapka naam, address, identity ya evidence public ya office mein reveal nahi kar sakte. Section 16 breach karne par penalty lagti hai.\n\n` +
        `Agar aap direct formal complaint ke liye abhi tayar nahi hain, toh aap Suraksha Setu ke encrypted Proof Vault mein evidence safe rakh sakti hain.`;
    } else {
      reply = `**Understanding Anonymous Reporting & Statutory Confidentiality:**\n\n` +
        `1. **On Suraksha Setu:** You can submit reports anonymously on this platform without disclosing your name, email, or phone. You will receive a secure Case ID and cryptographic recovery code for tracking.\n` +
        `2. **Statutory Inquiry Requirements (POSH Act):** For an Internal Committee (IC) to conduct a formal statutory inquiry and issue binding disciplinary sanctions, statutory rules require a written, signed complaint so the respondent can respond to specific allegations.\n` +
        `3. **Mandatory Confidentiality (Section 16):** While the IC receives your written statement, Section 16 of the POSH Act strictly prohibits disclosing the identity, address, or proceedings of the complainant or witnesses to the media, public, or colleagues.\n` +
        `4. **Proof Vault Alternative:** If you are not yet ready for a formal inquiry, you can store your evidence with cryptographic tamper-proof timestamps in the Suraksha Setu Zero-Knowledge Proof Vault.`;
    }

    return {
      reply,
      category: 'confidentiality_and_anonymity',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[7]],
      officialResources: [OFFICIAL_PORTALS.poshAct, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'How does Suraksha Setu Proof Vault protect my files?',
        'What details should be included in an IC written complaint?',
        'Can I have a trusted friend assist me in filing?'
      ],
    };
  }

  // 5. COMPANY NOT LISTENING / NO IC / EMPLOYER HARASSER
  const isNoIcQuery = /\b(company\s*nahi\s*sunti|no\s*ic|no\s*internal\s*committee|complaint\s*nahi\s*sunte|employer\s*is\s*the\s*harasser|boss\s*ke\s*khilaaf|kahan\s*complain\s*karein)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(कमेटी\s*नहीं\s*है|कंपनी\s*नहीं\s*सुनती|कहाँ\s*शिकायत\s*करें|मालिक\s*के\s*खिलाफ)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isNoIcQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `यदि आपकी कंपनी में इंटरनल कमेटी (IC) नहीं है, या आरोपी स्वयं कंपनी का मालिक/सीईओ है, तो कानून आपको बाहरी और स्वतंत्र मंच प्रदान करता है:\n\n` +
        `1. **लोकल कमेटी (Local Committee - LC):** प्रत्येक जिले के जिला मजिस्ट्रेट/कलेक्टर द्वारा LC गठित की जाती है। यदि कंपनी में 10 से कम कर्मचारी हैं या शिकायत सीधे नियोक्ता के खिलाफ है, तो आप सीधे जिला LC में शिकायत दर्ज करा सकती हैं।\n` +
        `2. **शी-बॉक्स (SHe-Box Portal):** महिला एवं बाल विकास मंत्रालय का आधिकारिक ऑनलाइन पोर्टल (shebox.wcd.gov.in) जहां केंद्र, राज्य, और निजी क्षेत्र की महिलाएं शिकायत दर्ज करा सकती हैं, जो सीधे संबंधित अधिकारी तक पहुंचती है।\n` +
        `3. **राष्ट्रीय महिला आयोग (NCW):** NCW हेल्पलाइन 7827170170 या ncw.nic.in पर शिकायत दर्ज की जा सकती है।\n` +
        `4. **नियोक्ता पर कानूनी दंड:** 10+ कर्मचारियों वाली कंपनी में IC न बनाने पर नियोक्ता पर ₹50,000 तक का जुर्माना और दोहराने पर व्यापार लाइसेंस रद्द हो सकता है (धारा 26)।\n\n` +
        `क्या आप यह जानना चाहती हैं कि जिला लोकल कमेटी का पता कैसे करें?`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `Agar aapki company complaint nahi sunti, ya organization mein IC nahi hai, ya harasser khud company ka employer/owner hai, toh aapke paas legal external options hain:\n\n` +
        `1. **District Local Committee (LC):** Har district mein District Magistrate/Collector ke under ek Local Committee (LC) hoti hai. Agar company mein <10 workers hain ya complaint employer ke against hai, toh complaint seedhe LC mein jaati hai.\n` +
        `2. **SHe-Box Portal (MWCD):** Ministry of Women & Child Development ka official portal (shebox.wcd.gov.in) par direct online complaint lodge kar sakti hain.\n` +
        `3. **National Commission for Women (NCW):** 24/7 Helpline: **7827170170** ya ncw.nic.in par complaint register karein.\n` +
        `4. **Penalty on Employer:** IC na constitute karne par employer par up to ₹50,000 ka fine aur business license cancel hone ka provision hai under Section 26.\n\n` +
        `Aap bina company par depend kiye directly district level par report kar sakti hain.`;
    } else {
      reply = `If your organization lacks an Internal Committee (IC), dismisses your complaint, or if the employer/head of organization is the respondent, the POSH Act provides independent external remedies:\n\n` +
        `1. **District Local Committee (LC):** Constituted by the District Officer (District Magistrate/Collector) in every district. Aggrieved women can file complaints directly with the LC if the organization has fewer than 10 workers or if the complaint is against the employer.\n` +
        `2. **SHe-Box Central Portal:** The Ministry of Women and Child Development operates the SHe-Box portal (shebox.wcd.gov.in) for central, state, and private workplace sexual harassment complaints.\n` +
        `3. **National Commission for Women (NCW):** Operates a dedicated 24/7 women\'s complaints cell at **7827170170** and ncw.nic.in.\n` +
        `4. **Penalties for Employer Non-Compliance:** Under Section 26 of POSH Act, failure to constitute an IC or act on complaints incurs a statutory fine up to ₹50,000, and repeated violations can lead to cancellation of commercial registrations or licenses.`;
    }

    return {
      reply,
      category: 'external_remedies_no_ic',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[3]],
      officialResources: [OFFICIAL_PORTALS.mwcd, OFFICIAL_PORTALS.ncw, OFFICIAL_PORTALS.poshAct],
      suggestedQuestions: [
        'What is the SHe-Box portal?',
        'How to approach the District Local Committee (LC)?',
        'Can I file a police complaint along with an IC complaint?'
      ],
    };
  }

  // 6. EVIDENCE PRESERVATION & PROOF VAULT
  const isEvidenceQuery = /\b(evidence|preserve|store\s*evidence|screenshot|proof|saboot|record(ing)?|chat\s*backup)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(सबूत|प्रमाण|स्क्रीनशॉट|रिकॉर्डिंग|सुरक्षित\s*रखें)(?:$|[^\u0900-\u097F])/u.test(lower) ||
    /\b(evidence\s*safely\s*kaise|saboot\s*kaise)\b/i.test(lower);

  if (isEvidenceQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**सबूतों को सुरक्षित और मान्य तरीके से सुरक्षित रखने के नियम:**\n\n` +
        `1. **स्क्रीनशॉट लेते समय:** केवल बातचीत नहीं, बल्कि स्क्रीन में तारीख, समय, संपर्क का नाम और फोन नंबर/ईमेल हेडर भी दिखना चाहिए।\n` +
        `2. **ओरिजिनल डिजिटल फाइलें:** ईमेल को '.eml' या '.msg' फॉर्मेट में मूल हेडर सहित डाउनलोड करें। ऑडियो/वीडियो की मूल फाइल को रीनेम किए बिना क्लाउड या सुरक्षित ड्राइव पर रखें।\n` +
        `3. **घटना डायरी (Incident Log):** हर घटना की तारीख, समय, स्थान, क्या हुआ और वहां कौन-कौन उपस्थित था (गवाह), इसे तुरंत अपनी निजी डायरी या फोन में नोट करें।\n` +
        `4. **ऑफिस डिवाइस पर निर्भर न रहें:** कभी भी सबूत केवल ऑफिस के लैपटॉप या कंपनी ईमेल पर न छोड़ें। उनकी कॉपी अपने निजी सुरक्षित डिवाइस पर रखें।\n` +
        `5. **सुरक्षा सेतु प्रूफ़ वॉल्ट:** आप हमारे Zero-Knowledge Proof Vault का उपयोग कर सकती हैं, जहां फाइलें आपके ब्राउज़र में एन्क्रिप्ट होती हैं और डिजिटल हैश से सुरक्षित रहती हैं।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**Evidence Ko Safely & Legally Valid Tareeqe Se Kaise Store Karein:**\n\n` +
        `1. **Timestamps & Headers:** WhatsApp/Slack screenshots lete waqt dhyan rakhein ki date, time aur sender ka number/email header clear visible ho.\n` +
        `2. **Never Keep Evidence Only on Office Devices:** Office laptop ya company email account kisi bhi samay revoke ho sakta hai. Copies hamesha apne personal private device/drive par backup karein.\n` +
        `3. **Chronological Incident Log:** Har incident ki date, exact time, location, kya kaha gaya, aur kaun witnesses the — iska ek private sequence maintain karein.\n` +
        `4. **Original Audio/Files:** Files ko edit ya cut na karein, original unedited media file legal inquiry mein zyada strong evidence banti hai.\n` +
        `5. **Suraksha Setu Proof Vault:** Aap hamare Zero-Knowledge Proof Vault (/vault) mein apni evidence files ko military-grade AES-256 encryption ke saath store kar sakti hain. Iski key sirf aapke paas hoti hai.`;
    } else {
      reply = `**Best Practices for Preserving Digital & Physical Evidence:**\n\n` +
        `1. **Full-Context Screenshots:** Capture screenshots that display the date, exact timestamp, sender handle, and phone number or email header.\n` +
        `2. **Preserve Original Artifacts:** Export full email headers (RFC 822 / .eml format) and avoid editing, trimming, or compressing audio/video recordings.\n` +
        `3. **Do Not Store Only on Work Hardware:** Company devices and corporate accounts can be restricted at any time. Keep an independent, secure backup on a personal encrypted drive.\n` +
        `4. **Detailed Contemporaneous Journal:** Maintain a dated incident log recording what occurred, where, when, and the names of any colleagues who witnessed the interaction or the immediate aftermath.\n` +
        `5. **Suraksha Setu Zero-Knowledge Vault:** Use our built-in Proof Vault (` + '`/vault`' + `) to store encrypted ciphertext with SHA-256 integrity verification. The decryption key remains exclusively with you.`;
    }

    return {
      reply,
      category: 'evidence_preservation',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[5]],
      officialResources: [OFFICIAL_PORTALS.cybercrime, OFFICIAL_PORTALS.poshAct],
      suggestedQuestions: [
        'How does SHA-256 integrity proof work?',
        'Can audio recordings be used as evidence in an IC inquiry?',
        'What if there were no eyewitnesses to the harassment?'
      ],
    };
  }

  // 7. CYBER HARASSMENT & DIGITAL PRIVACY
  const isCyberQuery = /\b(cyber|online|leak|morphed|private\s*photos|nudes|social\s*media|instagram|facebook|whatsapp\s*harass|it\s*act)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(साइबर|फोटो\s*वायरल|ब्लैकमेल|इंटरनेट\s*पर|ऑनलाइन\s*उत्पीड़न)(?:$|[^\u0900-\u097F])/u.test(lower) ||
    /\b(photo\s*viral|video\s*leak|blackmail\s*kar\s*raha)\b/i.test(lower);

  if (isCyberQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**साइबर उत्पीड़न, ब्लैकमेल और डिजिटल गोपनीयता उल्लंघन:**\n\n` +
        `इंटरनेट पर किसी महिला की सहमति के बिना निजी तस्वीरें या वीडियो साझा करना या ब्लैकमेल करना आईटी अधिनियम, 2000 के तहत गैर-जमानती अपराध है।\n\n` +
        `**कानूनी प्रावधान:**\n` +
        `• **धारा 66E (निजता का उल्लंघन):** बिना सहमति निजी अंगों की तस्वीर खींचने या प्रसारित करने पर 3 साल तक की जेल।\n` +
        `• **धारा 67 एवं 67A (अश्लील सामग्री):** इलेक्ट्रॉनिक रूप में यौन रूप से स्पष्ट सामग्री प्रकाशित या प्रसारित करने पर 5 साल तक का कठोर कारावास।\n` +
        `• **सोशल मीडिया कंपनियों का दायित्व:** शिकायत मिलने पर प्लेटफॉर्म को 24 घंटे के भीतर गैर-सहमति वाली अंतरंग सामग्री हटाने का कानूनी आदेश है।\n\n` +
        `**तुरंत क्या करें:**\n` +
        `1. राष्ट्रीय साइबर अपराध हेल्पलाइन **1930** पर कॉल करें।\n` +
        `2. आधिकारिक पोर्टल **cybercrime.gov.in** पर बिना पहचान उजागर किए (Anonymously) शिकायत दर्ज करें।\n` +
        `3. ब्लैकमेल करने वाले को पैसे या अतिरिक्त तस्वीरें कभी न दें।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**Cyber Harassment, Photo Leaks & Blackmail Protections:**\n\n` +
        `Kisi bhi person ki private photos/videos leak karne ki dhamki dena ya social media par circulate karna Information Technology Act ke tehat serious criminal offence hai.\n\n` +
        `**Key Legal Provisions:**\n` +
        `1. **IT Act Section 66E:** Non-consensual capture ya transmission of private images par up to 3 years jail aur fine.\n` +
        `2. **IT Act Section 67A:** Sexually explicit material electronic form mein transmit karne par up to 5 years imprisonment.\n` +
        `3. **24-Hour Takedown Rule:** Social media platforms legally bound hain ki non-consensual intimate media complaint ke 24 hours ke andar remove karein.\n\n` +
        `**Immediate Steps:**\n` +
        `• National Cyber Crime Helpline **1930** par call karein.\n` +
        `• **cybercrime.gov.in** par report file karein (Women/Child section mein anonymous reporting option bhi hota hai).\n` +
        `• Screenshots, profile link aur chat URLs ko preserve karein. Blackmailer ki kisi demand ko accept na karein.`;
    } else {
      reply = `**Cyber Harassment, Privacy Violations & Digital Blackmail:**\n\n` +
        `Transmitting, threatening to leak, or capturing intimate photos or private media without consent is a severe criminal offence under the Information Technology Act, 2000.\n\n` +
        `**Statutory Provisions:**\n` +
        `• **Section 66E (Privacy Violation):** Penalizes intentional capture, publication, or transmission of images of private body areas without consent with up to 3 years imprisonment.\n` +
        `• **Section 67A:** Prescribes rigorous imprisonment up to 5 years and fines for publishing or transmitting sexually explicit conduct electronically.\n` +
        `• **24-Hour Removal Mandate:** Intermediaries and social media platforms are legally obligated under the IT Rules to takedown non-consensual intimate imagery within 24 hours of receiving notice.\n\n` +
        `**Immediate Action Plan:**\n` +
        `1. Dial the **National Cyber Crime Helpline: 1930** immediately.\n` +
        `2. File a report on **cybercrime.gov.in** under the specialized Women and Children Cyber Crime Reporting unit.\n` +
        `3. Preserve digital artifacts (account URLs, message headers, phone numbers, timestamps) before blocking the offender.`;
    }

    return {
      reply,
      category: 'cyber_harassment',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[5], EMERGENCY_HELPLINES[1]],
      officialResources: [OFFICIAL_PORTALS.cybercrime, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'How to report anonymous cyber complaints on cybercrime.gov.in?',
        'How to get non-consensual images taken down from social media?',
        'What evidence is needed for an IT Act cyber FIR?'
      ],
    };
  }

  // 8. STALKING & UNWANTED PHYSICAL/DIGITAL FOLLOWING
  const isStalkingQuery = /\b(stalk(ing)?|follow(ing)?\s+me|peechha|picha|track(ing)?|ghar\s*tak\s*peechha)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(पीछा\s*करना|पीछा\s*कर\s*रहा|स्टॉकिंग)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isStalkingQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**पीछा करना (Stalking) एक संज्ञेय अपराध है:**\n\n` +
        `भारतीय न्याय संहिता (BNS, 2023) की **धारा 78** (पूर्व में IPC 354D) के तहत किसी महिला की स्पष्ट अनिच्छा के बावजूद उसका बार-बार पीछा करना, संपर्क करने का प्रयास करना, या उसके इंटरनेट/सोशल मीडिया उपयोग की निगरानी करना गैर-कानूनी है।\n\n` +
        `**सुरक्षा उपाय:**\n` +
        `1. **मार्ग बदलें और सुरक्षित रहें:** यदि कोई आपका पीछा कर रहा है, तो सीधे अपने घर जाने के बजाय किसी सार्वजनिक स्थान, मेट्रो स्टेशन या सुरक्षा गार्ड के पास जाएं।\n` +
        `2. **पुलिस सहायता (112):** यदि तुरंत खतरा महसूस हो तो 112 डायल करें।\n` +
        `3. **ज़ीरो एफआईआर (Zero FIR):** आप किसी भी नजदीकी पुलिस स्टेशन में ज़ीरो एफआईआर दर्ज करा सकती हैं, भले ही घटना उनके अधिकार क्षेत्र में न हुई हो।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**Stalking & Following — Legal Rights & Safety Steps:**\n\n` +
        `BNS 2023 ke **Section 78** (pehle IPC 354D) ke under kisi woman ka baar-baar peechha karna, disinterest ke baad bhi contact try karna, ya digital monitoring karna punishable criminal offence hai.\n\n` +
        `**Safety Protocol:**\n` +
        `1. **Immediate Safety:** Agar koi actively follow kar raha hai, toh sunsaan jagah ki taraf na jayein. Nearest busy shop, metro station ya guard ke paas rukein.\n` +
        `2. **Call 112 / 1091:** Turant Emergency Helpline 112 par call karein aur apni location batayein.\n` +
        `3. **Zero FIR:** Aap kisi bhi police station par 'Zero FIR' file kar sakti hain; police jurisdiction ka bahana dekar mana nahi kar sakti.\n` +
        `4. **Document Logs:** Dates, locations, vehicle number plates ya digital contact logs note karein.`;
    } else {
      reply = `**Stalking Protections (Legal Rights & Safety Guidance):**\n\n` +
        `Under **Section 78 of the Bharatiya Nyaya Sanhita, 2023** (formerly IPC Section 354D), stalking is a criminal offence punishable by imprisonment and fine. Stalking includes repeatedly following a woman, attempting to foster contact despite clear disinterest, or monitoring her electronic/online activities.\n\n` +
        `**Actionable Safety Protocol:**\n` +
        `1. **Prioritize Immediate Physical Safety:** If being followed, do not head directly to an isolated residence. Head toward a well-lit, populated commercial area, bank, or transit station.\n` +
        `2. **Emergency Contact (112):** Dial 112 or Women in Distress Helpline 1091 immediately.\n` +
        `3. **Zero FIR Right:** Under Indian law, you have the right to register a Zero FIR at any police station regardless of territorial jurisdiction.\n` +
        `4. **Preserve Tracking Logs:** Note timestamps, physical descriptions, vehicle registration details, or electronic contact records.`;
    }

    return {
      reply,
      category: 'stalking_protections',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[0], EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[2]],
      officialResources: [OFFICIAL_PORTALS.bnsAct, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'What is a Zero FIR and how does it work?',
        'What penalties exist for online cyberstalking under BNS 78?',
        'How to create a personal safety plan?'
      ],
    };
  }

  // 9. EMOTIONAL DISTRESS & COUNSELLING
  const isCounsellingQuery = /\b(counsel(ling|or)|mental\s*health|emotional|distress|anxious|depressed|stress|rona\s*aa\s*raha|ghabrahat|baat\s*karni\s*hai)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(परामर्श|काउंसलिंग|मानसिक\s*तनाव|घबराहट|मदद\s*चाहिए)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isCounsellingQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `उत्पीड़न या असुरक्षा की स्थिति से गुजरना मानसिक और भावनात्मक रूप से बहुत भारी हो सकता है। यह सामान्य है कि आप परेशान या तनाव महसूस करें, और आपको यह अकेले नहीं झेलना है।\n\n` +
        `**निःशुल्क एवं गोपनीय मानसिक स्वास्थ्य सहायता:**\n` +
        `• **Tele-MANAS (स्वास्थ्य मंत्रालय):** **14416** या 1800-891-4416 (24 घंटे, 20+ भाषाओं में मुफ्त)\n` +
        `• **KIRAN हेल्पलाइन:** **1800-599-0019** (24/7 सामाजिक न्याय मंत्रालय)\n` +
        `• **iCALL (TISS):** **9152987821** (सोमवार - शनिवार, 10:00 AM – 8:00 PM)\n\n` +
        `आप हमारे **Counselling Support** पेज पर जाकर भी गोपनीय अपॉइंटमेंट स्लॉट बुक कर सकती हैं। आपकी बातचीत पूरी तरह गोपनीय रखी जाएगी।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `Aise situations mein emotional distress, anxiety ya stress feel hona bilkul normal hai. Aap akeli nahi hain aur professionally trained counsellors bina kisi judgment ke aapki baat sunne ke liye 24/7 available hain.\n\n` +
        `**Verified Free & Confidential Helplines:**\n` +
        `• **Tele-MANAS (Govt of India):** Dial **14416** ya 1800-891-4416 (24/7 Free & Multilingual)\n` +
        `• **iCALL Psychosocial Helpline (TISS):** **9152987821** (Mon–Sat, 10 AM – 8 PM)\n` +
        `• **KIRAN Mental Health Helpline:** **1800-599-0019** (24/7)\n\n` +
        `Aap hamare navigation bar mein **Counselling** section par click karke bhi confidential appointment slot book kar sakti hain.`;
    } else {
      reply = `Experiencing harassment or unsafe circumstances takes an immense emotional and psychological toll. Your feelings of distress and anxiety are valid, and you do not have to carry this alone.\n\n` +
        `**Verified Free, Confidential Support Helplines:**\n` +
        `• **Tele-MANAS (National Mental Health Programme):** Dial **14416** or 1800-891-4416 (24/7, Toll-Free, available across Indian regional languages)\n` +
        `• **iCALL Psychosocial Helpline (TISS):** **+91 9152987821** (Monday to Saturday, 10:00 AM – 8:00 PM)\n` +
        `• **KIRAN Helpline (Govt of India):** **1800-599-0019** (24/7 dedicated support)\n\n` +
        `You can also request a confidential support session directly via the **Counselling** section on Suraksha Setu.`;
    }

    return {
      reply,
      category: 'emotional_counselling_support',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[6], EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[7]],
      officialResources: [OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'How do I book a confidential counselling session?',
        'Will my counselling notes remain private?',
        'How to manage acute anxiety after a workplace incident?'
      ],
    };
  }

  // 10. POSH ACT OVERVIEW & STATUTORY COMPLIANCE
  const isPoshActQuery = /\b(posh\s*act|posh\s*kya\s*hai|what\s+is\s+posh|posh\s+kya\s+hota\s+hai|internal\s+committee|icc|workplace\s+act\s+2013)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(पॉश\s*अधिनियम|पॉश\s*क्या\s*है|कार्यस्थल\s*यौन\s*उत्पीड़न)(?:$|[^\u0900-\u097F])/u.test(lower);

  if (isPoshActQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `**पॉश अधिनियम, 2013 (POSH Act, 2013):**\n\n` +
        `इसका पूरा नाम *'कार्यस्थल पर महिलाओं का यौन उत्पीड़न (रोकथाम, निषेध और निवारण) अधिनियम, 2013'* (Act No. 14 of 2013) है।\n\n` +
        `**प्रमुख मुख्य बिंदु:**\n` +
        `• **लागू होने का दायरा:** यह कानून सरकारी, निजी, संगठित एवं असंगठित सभी क्षेत्रों के कार्यस्थलों पर लागू होता है।\n` +
        `• **इंटरनल कमेटी (IC):** 10 या अधिक कर्मचारियों वाले हर संस्थान में IC का गठन अनिवार्य है। इसकी अध्यक्ष एक वरिष्ठ महिला कर्मचारी होती हैं और इसमें कम से कम 50% महिलाएं व 1 स्वतंत्र एनजीओ सदस्य होना जरूरी है।\n` +
        `• **लोकल कमेटी (LC):** 10 से कम कर्मचारियों वाली संस्थाओं या मालिक के खिलाफ शिकायत के लिए जिला स्तर पर LC होती है।\n` +
        `• **शिकायत का समय:** घटना के 3 महीने के अंदर (कारण होने पर 6 महीने तक)।\n` +
        `• **जांच समयसीमा:** 90 दिनों के अंदर पूरी जांच निष्पक्ष रूप से पूरी करना अनिवार्य है।\n` +
        `• **सख्त गोपनीयता (धारा 16):** पीड़िता, आरोपी या गवाहों की पहचान सार्वजनिक करना सख्त मना है।`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `**POSH Act, 2013 Kya Hai?**\n\n` +
        `POSH ka poora naam *Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013* hai.\n\n` +
        `**Key Highlights:**\n` +
        `1. **Har Workplace Par Lagu:** Government, private companies, startups, hospitals, colleges aur even remote/WFH settings par ye law applicable hai.\n` +
        `2. **Internal Committee (IC):** Har organization jisme 10 ya usse zyada workers hain, wahan IC hona mandatory hai. IC ki presiding officer senior woman honi chahiye aur minimum 50% members women hone chahiye, plus 1 external NGO member.\n` +
        `3. **Timelines:** Complaint incident ke 3 months ke andar file karni hoti hai (justifiable delay par 6 months extend hoti hai). Investigation 90 days ke andar complete honi zaroori hai.\n` +
        `4. **Section 16 Confidentiality:** Complainant aur enquiry details ko press ya media mein disclose karna legally prohibited hai.\n\n` +
        `Aap is act ka official gazette MWCD ya India Code portal par verify kar sakti hain.`;
    } else {
      reply = `**The POSH Act, 2013 (Overview & Key Protections):**\n\n` +
        `The *Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013* (Act No. 14 of 2013) is India\'s statutory framework ensuring safe working conditions for women.\n\n` +
        `**Key Statutory Provisions:**\n` +
        `• **Coverage:** Covers all women employees (permanent, temporary, contract, intern, consultant) across public, private, and unorganized sectors, including work-from-home and client visits.\n` +
        `• **Internal Committee (IC):** Mandatory for any workplace with 10 or more employees. Must be headed by a senior woman employee, include peer members, and an independent external member from a women\'s NGO.\n` +
        `• **Local Committee (LC):** Constituted at district level for establishments with fewer than 10 workers or complaints against the employer directly.\n` +
        `• **Timelines:** Complaint to be submitted within 3 months (extendable up to 6 months for sufficient cause). Inquiry must conclude within 90 days.\n` +
        `• **Section 16 (Strict Confidentiality):** Explicitly prohibits publishing or disclosing names, identities, addresses, or inquiry proceedings to press or public.`;
    }

    return {
      reply,
      category: 'posh_compliance',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[7]],
      officialResources: [OFFICIAL_PORTALS.poshAct, OFFICIAL_PORTALS.msmePosh, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'What is the difference between Vishaka Guidelines and POSH Act?',
        'How is an Internal Committee (IC) constituted?',
        'What penalties apply if an employer ignores POSH?'
      ],
    };
  }

  // 11. WORKPLACE HARASSMENT (Manager messages, coworkers, hostile workplace)
  const isWorkplaceQuery = /\b(manager|colleague|boss|supervisor|coworker|office|workplace|uncomfortable\s+message|unwanted\s+touch|harass(ment)?)\b/i.test(lower) ||
    /(?:^|[^\u0900-\u097F])(ऑफिस|कार्यस्थल|सहकर्मी|मैनेजर|अनुचित\s*मैसेज|उत्पीड़न)(?:$|[^\u0900-\u097F])/u.test(lower) ||
    /\b(office\s*mein|uncomfortable\s*messages|baar\s*baar\s*message|harass\s*kare)\b/i.test(lower);

  if (isWorkplaceQuery) {
    let reply = '';
    if (lang === 'hindi') {
      reply = `यह स्थिति अत्यंत असहज और तनावपूर्ण हो सकती है, और आपको इसे अकेले सहने की आवश्यकता नहीं है।\n\n` +
        `**तत्काल करने योग्य कदम:**\n` +
        `1. **सबूत सुरक्षित रखें:** मैनेजर द्वारा भेजे गए सभी अनुचित मैसेज, ईमेल या कॉल लॉग्स के स्क्रीनशॉट लें। स्क्रीनशॉट में तारीख, समय और फोन नंबर/ईमेल आईडी स्पष्ट दिखाई देनी चाहिए।\n` +
        `2. **इंटरनल कमेटी (IC) के बारे में जानें:** कानूनन 10 या उससे अधिक कर्मचारियों वाली प्रत्येक संस्था में आंतरिक शिकायत समिति (IC) होना अनिवार्य है।\n` +
        `3. **मैनेजर से सीधे भिड़ना आवश्यक नहीं:** यदि आपको सीधे मना करना असुरक्षित लगता है, तो ऐसा करने का कोई कानूनी दबाव नहीं है।\n` +
        `4. **शिकायत की समयसीमा:** घटना के 3 महीने के भीतर IC को लिखित शिकायत दर्ज की जा सकती है (उचित कारण होने पर IC इसे और 3 महीने बढ़ा सकती है)।\n\n` +
        `क्या आप यह जानना चाहती हैं कि शिकायत पत्र कैसे तैयार करें या संस्था में IC न होने पर क्या विकल्प हैं?`;
    } else if (lang === 'hinglish' || lang === 'mixed') {
      reply = `Ye situation uncomfortable aur stressful ho sakti hai. Agar safe ho, messages aur unke timestamps ko preserve karo, aur apni organization ki Internal Committee (IC) ya designated complaint channel ke baare mein pata karo. Agar manager se directly baat karna unsafe lagta hai, toh aisa karna zaroori nahi. Main tumhe complaint process aur available support options samjha sakta hoon.\n\n` +
        `**Key Action Steps:**\n` +
        `1. **Screenshots & Timestamps:** Har message ka screenshot lein jisme date, time aur sender name/number clear dikhe.\n` +
        `2. **Internal Committee (IC):** 10+ employees wali har organization mein ek IC hona mandatory hai jiski head ek senior woman presiding officer hoti hain.\n` +
        `3. **Timeline:** Incident ke 3 months ke andar complaint submit karni hoti hai (extendable to 6 months upon reasonable delay).\n` +
        `4. **Proof Vault:** Suraksha Setu ke encrypted Proof Vault mein aap files securely store kar sakti hain.\n\n` +
        `Kya tum workplace complaint file karne ke exact steps jaana chahti ho?`;
    } else {
      reply = `Dealing with unwelcome messages or harassment from a manager is stressful and completely unacceptable under workplace rights.\n\n` +
        `**Recommended Immediate Steps:**\n` +
        `1. **Preserve All Communication:** Take clear screenshots of messages, emails, and call timestamps. Avoid deleting chats, even if distressing.\n` +
        `2. **Know Your Workplace Rights:** Under the POSH Act 2013, any establishment with 10 or more employees must have an Internal Committee (IC) headed by a senior woman presiding officer.\n` +
        `3. **No Obligation to Confront:** You are not required to confront your manager directly if it feels unsafe or uncomfortable.\n` +
        `4. **Filing Timeline:** A complaint should be filed in writing to the IC within 3 months of the incident (extendable up to 6 months with justifiable cause).\n` +
        `5. **Inquiry Protection:** The IC must maintain strict confidentiality (Section 16) and complete the inquiry within 90 days.\n\n` +
        `Would you like guidance on drafting an IC complaint letter or understanding interim transfer/leave protections?`;
    }

    return {
      reply,
      category: 'workplace_sexual_harassment',
      isEmergency: false,
      helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[3]],
      officialResources: [OFFICIAL_PORTALS.poshAct, OFFICIAL_PORTALS.msmePosh, OFFICIAL_PORTALS.mwcd],
      suggestedQuestions: [
        'How to write a formal POSH complaint?',
        'What if my company has no Internal Committee (IC)?',
        'Can I request interim leave or team change under Section 12?'
      ],
    };
  }

  // 12. GENERAL EMPOWERING FALLBACK
  let fallbackReply = '';
  if (lang === 'hindi') {
    fallbackReply = `मैं महिलाओं की सुरक्षा, कार्यस्थल पर अधिकारों (POSH Act), शिकायत दर्ज करने की प्रक्रिया और सहायता सेवाओं से जुड़े प्रश्नों में आपकी मदद कर सकती हूँ।\n\n` +
      `आप मुझसे इन विषयों पर स्पष्ट पूछ सकती हैं:\n` +
      `• ऑफिस में उत्पीड़न या मैनेजर द्वारा असहज किए जाने पर क्या करें?\n` +
      `• शिकायत के बाद नौकरी से निकालने की धमकी का कानूनी समाधान (धारा 12 अंतरिम राहत)\n` +
      `• डिजिटल सबूतों और स्क्रीनशॉट्स को सुरक्षित रखने के तरीके\n` +
      `• संस्था में इंटरनल कमेटी (IC) न होने पर जिला लोकल कमेटी (LC) के विकल्प\n` +
      `• राष्ट्रीय महिला हेल्पलाइन **181** और आपातकालीन पुलिस सेवा **112** की जानकारी\n\n` +
      `कृपया अपनी स्थिति या प्रश्न संक्षेप में साझा करें ताकि मैं सही कानूनी व सहायता मार्गदर्शन प्रदान कर सकूं।`;
  } else if (lang === 'hinglish' || lang === 'mixed') {
    fallbackReply = `Main aapko women safety, workplace POSH rights, complaint filing procedures aur emergency support ke baare mein sahi information provide kar sakti hoon.\n\n` +
      `Aap mujhse specific questions pooch sakti hain jaise:\n` +
      `• "Office mein manager harass kare toh step-by-step kya karun?"\n` +
      `• "Meri complaint ke baad mujhe job se nikalne ki dhamki mil rahi hai."\n` +
      `• "Evidence aur screenshots ko legal format mein kaise preserve karein?"\n` +
      `• "Agar company mein IC committee na ho toh kahan jayein?"\n` +
      `• "POSH Act aur Vishaka Guidelines mein kya antar hai?"\n\n` +
      `Aap apna sawal natural Hindi ya English mein pooch sakti hain. Main aapki madad ke liye tayar hoon.`;
  } else {
    fallbackReply = `I am your Suraksha Setu Safety Assistant, dedicated to providing verified guidance on women's safety, Indian workplace rights (POSH Act), complaint procedures, and legal protections.\n\n` +
      `You can ask me specific questions regarding:\n` +
      `• What to do if facing uncomfortable conduct or messages at work.\n` +
      `• Protections against retaliation and termination threats (Section 12 Interim Relief).\n` +
      `• Safe preservation of digital screenshots, email headers, and incident logs.\n` +
      `• Approaching the District Local Committee (LC) or SHe-Box if your company has no IC.\n` +
      `• Distinction between Vishaka Guidelines and the codified POSH Act, 2013.\n` +
      `• Immediate emergency support numbers (**112**, **181**, **1091**, **1930**).\n\n` +
      `Please feel free to describe your situation or inquiry, and I will provide relevant, actionable guidance.`;
  }

  return {
    reply: fallbackReply,
    category: 'general_guidance',
    isEmergency: false,
    helplines: [EMERGENCY_HELPLINES[1], EMERGENCY_HELPLINES[0], EMERGENCY_HELPLINES[7]],
    officialResources: [OFFICIAL_PORTALS.mwcd, OFFICIAL_PORTALS.poshAct],
    suggestedQuestions: [
      'What should I do if my manager harasses me?',
      'POSH Act kya hai aur ye kahan apply hota hai?',
      'How to safely preserve evidence for inquiry?'
    ],
  };
}
