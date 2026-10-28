import express from 'express';

const router = express.Router();

// Static legal resources (can be moved to DB later)
const legalResources = [
  {
    id: 'posh-2013',
    title: 'POSH Act, 2013',
    titleHindi: 'यौन उत्पीड़न अधिनियम, 2013',
    category: 'act',
    description: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 provides protection against sexual harassment of women at the workplace and for the prevention and redressal of complaints.',
    officialSource: 'https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf',
    year: 2013,
    keyPoints: [
      'Applies to all workplaces including domestic workers',
      'Every employer with 10+ employees must constitute an Internal Complaints Committee (ICC)',
      'Complaint to be filed within 3 months of the incident',
      'Inquiry to be completed within 90 days',
      'Penalties for employer non-compliance',
    ],
  },
  {
    id: 'pocso-2012',
    title: 'POCSO Act, 2012',
    titleHindi: 'पॉक्सो अधिनियम, 2012',
    category: 'act',
    description: 'The Protection of Children from Sexual Offences Act, 2012 provides a robust legal framework for the protection of children from offences of sexual assault, harassment and pornography.',
    officialSource: 'https://wcd.nic.in/sites/default/files/POCSO-ACT.pdf',
    year: 2012,
    keyPoints: [
      'Protects children below 18 years from sexual offences',
      'Gender-neutral — protects all children',
      'Mandatory reporting: any person aware of an offence must report it',
      'Child-friendly court procedures',
      'Speedy trials in special courts',
    ],
  },
  {
    id: 'vishaka-1997',
    title: 'Vishaka Guidelines, 1997',
    titleHindi: 'विशाखा दिशानिर्देश, 1997',
    category: 'guideline',
    description: 'The Vishaka guidelines were laid down by the Supreme Court of India in 1997, defining sexual harassment and placing obligations on employers. They formed the foundation for the POSH Act 2013.',
    officialSource: 'https://main.sci.gov.in/',
    year: 1997,
    keyPoints: [
      'First legal framework defining sexual harassment in India',
      'Mandated awareness programs at workplaces',
      'Required employer-level complaints committees',
      'Set the precedent for POSH Act 2013',
    ],
  },
];

const supportResources = [
  { id: 'ncw', name: 'National Commission for Women', contact: '7827170170', website: 'http://ncw.nic.in', description: 'National statutory body for women rights and welfare' },
  { id: 'childline', name: 'Childline India', contact: '1098', website: 'https://www.childlineindia.org', description: '24/7 emergency helpline for children in distress' },
  { id: 'women-helpline', name: 'Women Helpline', contact: '181', website: null, description: 'National women helpline — available 24/7' },
  { id: 'emergency', name: 'Police Emergency', contact: '112', website: null, description: 'National emergency services number' },
];

router.get('/legal', (req, res) => {
  res.json({ success: true, resources: legalResources });
});

router.get('/support', (req, res) => {
  res.json({ success: true, resources: supportResources });
});

export default router;
