import express from 'express';
import SurveySubmission from '../models/SurveySubmission.js';
import { isDatabaseConnected } from '../config/database.js';

const router = express.Router();

const AWARENESS_ARTICLES = [
  {
    id: 'understanding-posh-ic',
    title: 'Understanding the Internal Committee (IC) under the POSH Act',
    titleHindi: 'कार्यस्थल आंतरिक समिति (IC) की भूमिका एवं अधिकार',
    category: 'Workplace Rights',
    publishedDate: '2026-01-15',
    readTimeMinutes: 5,
    summary: 'Every organization with 10 or more employees must form an Internal Committee headed by a senior woman presiding officer to address grievances in a confidential and time-bound manner.',
    content: `Under Section 4 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013, employers must constitute an Internal Committee (IC) at each administrative unit or office where 10 or more employees are employed.

Key Requirements:
1. Presiding Officer: A senior level woman employee.
2. Employee Members: Not less than two members committed to the cause of women or having legal knowledge.
3. External Member: One member from an NGO or association committed to women rights or familiar with issues relating to sexual harassment.
4. Quorum: At least one-half of the total members must be women.
5. Inquiries: Must be completed within 90 days of receiving the complaint.`,
    officialReference: 'https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf',
  },
  {
    id: 'digital-safety-privacy',
    title: 'Digital Safety & Online Harassment Protections in India',
    titleHindi: 'डिजिटल सुरक्षा एवं साइबर उत्पीड़न संरक्षण कानून',
    category: 'Cyber Safety',
    publishedDate: '2026-02-10',
    readTimeMinutes: 4,
    summary: 'Provisions under the Information Technology Act, 2000 and BNS, 2023 strictly penalize non-consensual image transmission, voyeurism, and cyber-stalking.',
    content: `With workplaces operating increasingly in hybrid and remote settings, digital harassment—including non-consensual sharing of intimate images, unwanted messages, and online stalking—is addressed under multiple legal frameworks:

- Section 66E of the IT Act: Penalizes capturing or transmitting private bodily images without consent.
- Section 67 & 67A of the IT Act: Criminalizes transmitting sexually explicit material electronically.
- Section 78 of BNS, 2023: Penalizes electronic stalking and online monitoring of a woman without legitimate cause.`,
    officialReference: 'https://cybercrime.gov.in/',
  },
  {
    id: 'pocso-safeguarding-norms',
    title: 'Child Safeguarding & Mandatory Reporting Obligations under POCSO',
    titleHindi: 'पॉक्सो कानून के अंतर्गत बाल संरक्षण एवं अनिवार्य रिपोर्टिंग',
    category: 'Child Protection',
    publishedDate: '2026-03-01',
    readTimeMinutes: 6,
    summary: 'POCSO Act, 2012 provides a gender-neutral statutory framework protecting anyone under 18 years from sexual offences, imposing affirmative reporting duties.',
    content: `The Protection of Children from Sexual Offences (POCSO) Act, 2012 defines a child as any person below 18 years of age.

Key Principles:
- Mandatory Reporting (Section 19): Any person who knows or has apprehension of an offence against a child is legally obligated to report it to the Special Juvenile Police Unit (SJPU) or local police.
- Strict Confidentiality: Media and individuals are prohibited from disclosing the child's identity or identifying details.`,
    officialReference: 'https://ncpcr.gov.in/',
  },
];

// GET /api/awareness/articles - Curated legal & safety awareness guides
router.get('/articles', (req, res) => {
  res.json({
    success: true,
    count: AWARENESS_ARTICLES.length,
    articles: AWARENESS_ARTICLES,
  });
});

// GET /api/awareness/articles/:id - Individual article
router.get('/articles/:id', (req, res) => {
  const article = AWARENESS_ARTICLES.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }
  res.json({ success: true, article });
});

// POST /api/awareness/surveys/submit - Submit workplace safety survey
router.post('/surveys/submit', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { topic, responses } = req.body;
    if (!topic || !responses) {
      return res.status(400).json({ success: false, message: 'Topic and responses required' });
    }

    const submission = await SurveySubmission.create({
      topic,
      responses,
    });

    res.status(201).json({
      success: true,
      message: 'Survey submitted anonymously and registered for institutional review',
      surveyId: submission._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record survey response' });
  }
});

export default router;
