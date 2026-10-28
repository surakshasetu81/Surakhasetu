import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
  FileText,
  ShieldCheck,
  Info,
  Award
} from 'lucide-react';

interface LegalSource {
  name: string;
  url: string;
  type: 'portal' | 'statute' | 'judgment' | 'guideline';
  isPrimary?: boolean;
}

interface LawItem {
  id: string;
  title: string;
  titleHindi: string;
  fullTitle: string;
  year: number;
  category: string;
  color: string;
  summary: string;
  relationshipNote?: string;
  keyProvisions: string[];
  primarySource: LegalSource;
  additionalSources?: LegalSource[];
  disclaimer: string;
}

const laws: LawItem[] = [
  {
    id: 'posh',
    title: 'POSH Act, 2013',
    titleHindi: 'यौन उत्पीड़न अधिनियम, 2013',
    fullTitle: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (Act No. 14 of 2013)',
    year: 2013,
    category: 'Act of Parliament',
    color: '#C2185B',
    summary:
      'This statutory Act provides legal protection against sexual harassment of women at all workplaces in India. It mandates every employer with 10 or more employees to constitute an Internal Complaints Committee (ICC) and establishes Local Complaints Committees (LCC) at district levels. It covers government, private, and unorganized sectors.',
    relationshipNote:
      'Statutory Law: Enacted by the Parliament of India in 2013, superseding and codifying the principles of the 1997 Supreme Court Vishaka Guidelines into a comprehensive, enforceable statutory framework.',
    keyProvisions: [
      'Definition of sexual harassment under Section 2(n): unwelcome physical contact, demand/request for sexual favours, making sexually-coloured remarks, showing pornography, or any other unwelcome conduct of sexual nature.',
      'Section 4: Mandatory constitution of an Internal Complaints Committee (ICC) headed by a senior woman presiding officer, with employee members and an independent external member from an NGO/association.',
      'Section 6: Local Complaints Committee (LCC) constituted at district level for organizations with fewer than 10 employees or where the complaint is against the employer.',
      'Section 9: Statutory timeline for filing a complaint within 3 months of the incident (extendable by an additional 3 months for justifiable delay).',
      'Section 11: Formal inquiry to be completed within a strict timeline of 90 days.',
      'Section 12: Complainant may request interim relief during inquiry (transfer, leave up to 3 months, or performance review protection).',
      'Section 16: Strict confidentiality: prohibition on publishing or publicizing the identity of the complainant, respondent, or witnesses.',
      'Section 26: Penalties for employer non-compliance, including monetary fines and revocation/cancellation of business license.',
    ],
    primarySource: {
      name: 'Ministry of Women and Child Development (MWCD Legislations)',
      url: 'https://www.wcd.gov.in/documents/legislations',
      type: 'portal',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'India Code — POSH Act 2013 (Official Statute)',
        url: 'https://www.indiacode.nic.in/handle/123456789/2104',
        type: 'statute',
      },
      {
        name: 'Ministry of MSME — Official POSH Act 2013 Information',
        url: 'https://www.dcmsme.gov.in/POSHACT2013.aspx',
        type: 'guideline',
      },
      {
        name: 'MWCD Women Legislations Portal',
        url: 'https://wcd.gov.in/women/legislations',
        type: 'portal',
      },
    ],
    disclaimer:
      'This summary is provided for general educational purposes. For workplace grievance inquiries, consult your institution\'s Internal Committee (IC) or a qualified legal advocate.',
  },
  {
    id: 'pocso',
    title: 'POCSO Act, 2012',
    titleHindi: 'पॉक्सो अधिनियम, 2012',
    fullTitle: 'Protection of Children from Sexual Offences Act, 2012 (Act No. 32 of 2012)',
    year: 2012,
    category: 'Act of Parliament',
    color: '#7C3AED',
    summary:
      'The POCSO Act provides a specialized legal safeguard protecting any individual below 18 years of age against sexual assault, sexual harassment, and pornography. The legislation is completely gender-neutral and establishes strict mandatory reporting requirements for individuals and institutions.',
    keyProvisions: [
      'Statutory protection for all children under 18 years of age, without distinction of sex or gender.',
      'Sections 7 & 8: Defines and penalizes sexual assault involving non-penetrative sexual contact.',
      'Sections 11 & 12: Defines and penalizes sexual harassment, including sexually explicit remarks, stalking, exhibitionism, or unwanted physical contact.',
      'Sections 19 & 21: Mandatory reporting obligation — any person or institution having apprehension or knowledge of an offence against a child MUST report it to the Special Juvenile Police Unit (SJPU) or local police. Failure to report is a punishable offence.',
      'Child-friendly investigation and judicial procedures — testimony recorded at child\'s residence or place of choice without police in uniform.',
      'Presumption of statutory guilt (Sections 29 & 30): Burden of proof shifts to the accused to prove innocence.',
      'Stringent privacy protections: Strict statutory ban on revealing the child\'s identity or identifying details in media or public.',
      'Mandatory time-bound trial: Special Courts designated to complete trial within 1 year from taking cognizance.',
    ],
    primarySource: {
      name: 'MWCD Official Legislations Portal',
      url: 'https://www.wcd.gov.in/documents/legislations',
      type: 'portal',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'India Code — POCSO Act 2012 (Official Statute)',
        url: 'https://www.indiacode.nic.in/handle/123456789/2079',
        type: 'statute',
      },
      {
        name: 'National Commission for Protection of Child Rights (NCPCR)',
        url: 'https://ncpcr.gov.in/',
        type: 'portal',
      },
      {
        name: 'MWCD Child Protection Portal',
        url: 'https://wcd.gov.in/women/legislations',
        type: 'portal',
      },
    ],
    disclaimer:
      'Offences against minors under 18 trigger mandatory statutory reporting under POCSO Section 19. Contact Childline 1098 or the nearest Special Juvenile Police Unit immediately.',
  },
  {
    id: 'vishaka',
    title: 'Vishaka Guidelines, 1997',
    titleHindi: 'विशाखा दिशानिर्देश, 1997',
    fullTitle: 'Vishaka & Others v. State of Rajasthan (1997) 6 SCC 241 — Supreme Court of India',
    year: 1997,
    category: 'Supreme Court Landmark Judgment',
    color: '#0891B2',
    summary:
      'The landmark Supreme Court of India ruling that first recognized workplace sexual harassment as a violation of women\'s fundamental constitutional rights to gender equality (Article 14) and life with dignity (Article 21). In the absence of enacted legislation at the time, the Supreme Court exercised its powers under Article 32 to lay down binding guidelines that remained in force until the POSH Act was enacted in 2013.',
    relationshipNote:
      'Historical Judicial Landmark: The Vishaka Guidelines and the POSH Act 2013 are NOT the same document. The Vishaka Guidelines were interim judicial norms created by the Supreme Court in 1997. They provided the jurisprudential foundation that Parliament later codified into the formal POSH Act of 2013.',
    keyProvisions: [
      'First judicial definition in India recognizing sexual harassment as a violation of fundamental rights under Articles 14, 19(1)(g), and 21.',
      'Laid down the employer\'s affirmative duty to prevent sexual harassment and provide resolution procedures.',
      'Mandated the creation of a Complaints Committee with an independent third-party external member to prevent undue internal influence.',
      'Mandated proactive workplace awareness and disciplinary measures.',
      'Established third-party harassment protections for women facing harassment at the workplace by non-employees.',
      'Served as binding law of the land under Article 141 of the Constitution until statutory codification by Parliament in 2013.',
    ],
    primarySource: {
      name: 'Supreme Court of India — Judgments & Gender Portal',
      url: 'https://www.sci.gov.in/document/judgments-and-gender/',
      type: 'judgment',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'Supreme Court of India (Official Portal)',
        url: 'https://www.sci.gov.in/',
        type: 'portal',
      },
      {
        name: 'MWCD Official Documents & Historical Context',
        url: 'https://www.wcd.gov.in/documents/legislations',
        type: 'statute',
      },
    ],
    disclaimer:
      'The Vishaka Guidelines are historically foundational and laid the jurisprudential groundwork for workplace equality. Today, workplace complaints are governed by the codified POSH Act, 2013.',
  },
  {
    id: 'pwdva',
    title: 'PWDVA, 2005',
    titleHindi: 'घरेलू हिंसा अधिनियम, 2005',
    fullTitle: 'Protection of Women from Domestic Violence Act, 2005 (Act No. 43 of 2005)',
    year: 2005,
    category: 'Act of Parliament',
    color: '#D97706',
    summary:
      'A civil and quasi-criminal enactment to provide immediate, effective protection for women facing domestic violence within a domestic relationship or shared household. It covers physical, emotional, verbal, sexual, and economic abuse.',
    keyProvisions: [
      'Broad definition of domestic violence under Section 3: physical, verbal, emotional, sexual, and economic abuse.',
      'Right to reside in a shared household (Section 17), regardless of title or ownership.',
      'Protection Orders (Section 18) restraining the respondent from committing or aiding acts of violence.',
      'Residence Orders (Section 19) preventing dispossession or restraining respondent from entering shared residence.',
      'Monetary relief and compensation orders (Sections 20 & 22) for medical expenses, loss of earnings, and maintenance.',
      'Emergency custody orders for children (Section 21) and interim ex-parte relief (Section 23).',
    ],
    primarySource: {
      name: 'Ministry of Women and Child Development (MWCD Legislations)',
      url: 'https://www.wcd.gov.in/documents/legislations',
      type: 'portal',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'India Code — PWDVA 2005 (Official Statute)',
        url: 'https://www.indiacode.nic.in/handle/123456789/2021',
        type: 'statute',
      },
      {
        name: 'MWCD Women Legislations Portal',
        url: 'https://wcd.gov.in/women/legislations',
        type: 'portal',
      },
    ],
    disclaimer:
      'Aggrieved women may approach Protection Officers, Service Providers, or the Judicial Magistrate directly. Women Helpline 181 provides 24x7 immediate emergency assistance.',
  },
  {
    id: 'it_act',
    title: 'IT Act, 2000 (Cyber Protections)',
    titleHindi: 'सूचना प्रौद्योगिकी अधिनियम, 2000',
    fullTitle: 'Information Technology Act, 2000 (Sections 66E, 67, 67A — Privacy & Cyber Offences)',
    year: 2000,
    category: 'Act of Parliament',
    color: '#0284C7',
    summary:
      'Provides statutory penal remedies against online harassment, cyberstalking, non-consensual image sharing, digital voyeurism, and sexually explicit online content transmitted through electronic devices or communication systems.',
    keyProvisions: [
      'Section 66E: Violation of bodily privacy — penalizes capturing, publishing, or transmitting images of private body areas without consent.',
      'Section 67: Penalizes publishing or transmitting obscene material in electronic form.',
      'Section 67A: Stringent imprisonment up to 5 years for publishing or transmitting sexually explicit acts or pornographic media electronically.',
      'Section 67B: Stringent penalties for publishing or transmitting child sexual abuse material (CSAM) electronically.',
      'Statutory obligations for social media platforms and intermediaries to remove non-consensual intimate media within 24 hours of notification.',
    ],
    primarySource: {
      name: 'India Code — Information Technology Act, 2000',
      url: 'https://www.indiacode.nic.in/handle/123456789/1999',
      type: 'statute',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'National Cyber Crime Reporting Portal (MHA)',
        url: 'https://cybercrime.gov.in/',
        type: 'portal',
      },
      {
        name: 'Ministry of Electronics and Information Technology (MeitY)',
        url: 'https://www.meity.gov.in/',
        type: 'portal',
      },
    ],
    disclaimer:
      'For cyber harassment, preserve electronic evidence (screenshots, URLs, headers, timestamps) and report directly to the National Cyber Crime Portal (cybercrime.gov.in) or call 1930.',
  },
  {
    id: 'bns',
    title: 'Bharatiya Nyaya Sanhita, 2023',
    titleHindi: 'भारतीय न्याय संहिता, 2023',
    fullTitle: 'Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023 — Chapter V: Offences Against Women & Children)',
    year: 2023,
    category: 'Act of Parliament',
    color: '#4F46E5',
    summary:
      'India\'s modern substantive criminal penal code (repealing and replacing the Indian Penal Code, 1860). Chapter V consolidates and modernizes criminal penal offences against women and children, including sexual assault, stalking, voyeurism, and outraging modesty.',
    keyProvisions: [
      'Section 64: Stringent rigorous imprisonment for rape, with heightened penalties for aggravated and custodial offences (Section 65).',
      'Section 74: Assault or criminal force to a woman with intent to outrage her modesty.',
      'Section 75: Statutory criminal offence of Sexual Harassment punishable with rigorous imprisonment.',
      'Section 77: Voyeurism — capturing, viewing, or distributing images of a woman engaged in private acts without consent.',
      'Section 78: Stalking — repeatedly following, contacting despite clear disinterest, or monitoring digital/electronic communications.',
      'Section 79: Words, sounds, gestures, or exhibitionism intended to insult the modesty of a woman or intrude upon her privacy.',
      'Section 351: Criminal intimidation — threatening harm to person, reputation, or property.',
    ],
    primarySource: {
      name: 'India Code — Bharatiya Nyaya Sanhita, 2023',
      url: 'https://www.indiacode.nic.in/handle/123456789/20062',
      type: 'statute',
      isPrimary: true,
    },
    additionalSources: [
      {
        name: 'Ministry of Home Affairs (MHA Portal)',
        url: 'https://www.mha.gov.in/',
        type: 'portal',
      },
      {
        name: 'Legislative Department (Ministry of Law and Justice)',
        url: 'https://legislative.gov.in/',
        type: 'portal',
      },
    ],
    disclaimer:
      'Criminal complaints under BNS may be lodged at any police station as a Zero FIR or through the National Cyber Crime / Emergency Response Support System (112).',
  },
];

function LawCard({ law, index }: { law: LawItem; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      aria-labelledby={`law-title-${law.id}`}
      style={{
        background: 'var(--color-card)',
        border: `1.5px solid ${law.color}35`,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${law.color}15, ${law.color}05)`,
          padding: '24px 28px',
          borderBottom: `1px solid ${law.color}25`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  background: `${law.color}20`,
                  color: law.color,
                  border: `1px solid ${law.color}40`,
                }}
              >
                {law.year}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {law.category}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(22, 133, 107, 0.1)',
                  color: '#16856B',
                  border: '1px solid rgba(22, 133, 107, 0.25)',
                }}
              >
                <ShieldCheck size={12} /> Verified Official Source
              </span>
            </div>

            {/* Clickable Law Title */}
            <a
              href={law.primarySource.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Read official ${law.title} at ${law.primarySource.name} (Opens in new tab)`}
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <h2
                id={`law-title-${law.id}`}
                style={{
                  fontSize: 'clamp(1.2rem, 3vw, 1.45rem)',
                  fontWeight: 800,
                  color: law.color,
                  margin: 0,
                  lineHeight: 1.3,
                  cursor: 'pointer',
                  borderBottom: '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = law.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
              >
                {law.title}
              </h2>
              <ExternalLink size={16} color={law.color} style={{ opacity: 0.85 }} />
            </a>

            <p className="hindi-text" style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', margin: '6px 0 4px', fontWeight: 500 }}>
              {law.titleHindi}
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
              {law.fullTitle}
            </p>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: `${law.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={32} color={law.color} />
          </div>
        </div>

        {/* Distinct relationship callout for Vishaka vs POSH */}
        {law.relationshipNote && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--color-card)',
              border: `1.5px solid ${law.color}35`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.8rem',
              color: 'var(--color-text-main)',
              lineHeight: 1.55,
            }}
          >
            <Award size={16} color={law.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Legal Note: </strong>
              {law.relationshipNote}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px' }}>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.75, marginBottom: 20 }}>
          {law.summary}
        </p>

        {/* Key Provisions Toggle Button */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`provisions-${law.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: `1px solid ${law.color}35`,
            borderRadius: 8,
            cursor: 'pointer',
            color: law.color,
            fontWeight: 700,
            fontSize: '0.86rem',
            padding: '8px 14px',
            marginBottom: expanded ? 18 : 20,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${law.color}10`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Hide' : 'Show'} Key Legal Provisions ({law.keyProvisions.length})
        </button>

        {/* Collapsible Key Provisions */}
        {expanded && (
          <motion.div
            id={`provisions-${law.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ marginBottom: 24 }}
          >
            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                margin: 0,
                padding: '16px 18px',
                background: 'var(--color-bg-secondary)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
              }}
            >
              {law.keyProvisions.map((pt, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.86rem' }}>
                  <CheckCircle size={15} color={law.color} style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ color: 'var(--color-text-main)', lineHeight: 1.6 }}>{pt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Official Source Links & Action Buttons */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: `linear-gradient(to right, ${law.color}08, transparent)`,
            border: `1px solid ${law.color}25`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: law.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={15} /> Official Government Sources & Legal Text:
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
              Opens official .gov.in / .nic.in portals in new tab
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Primary "Read Official Act" / "View Law" Button */}
            <a
              href={law.primarySource.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read official act for ${law.title} at ${law.primarySource.name}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: law.color,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                padding: '9px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <FileText size={15} /> Read Official Act ↗
            </a>

            {/* Additional Verified Government Source Links */}
            {law.additionalSources &&
              law.additionalSources.map((source, sIdx) => (
                <a
                  key={sIdx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${source.name} for ${law.title}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--color-card)',
                    color: 'var(--color-text-main)',
                    border: `1.5px solid ${law.color}40`,
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    padding: '8px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${law.color}15`;
                    e.currentTarget.style.borderColor = law.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-card)';
                    e.currentTarget.style.borderColor = `${law.color}40`;
                  }}
                >
                  <ExternalLink size={13} color={law.color} /> {source.name} ↗
                </a>
              ))}
          </div>
        </div>

        {/* Individual Law Educational Disclaimer */}
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            padding: '10px 14px',
            borderRadius: 10,
            lineHeight: 1.6,
            margin: 0,
            border: '1px solid var(--color-border)',
          }}
        >
          ℹ️ {law.disclaimer}
        </p>
      </div>
    </motion.article>
  );
}

export default function LegalPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container-sm" style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px' }}>
        {/* Page Title & Intro */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            className="icon-container"
            style={{
              margin: '0 auto 16px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
            }}
          >
            <Scale size={28} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 10 }}>
            Legal Framework
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
            Verified statutory laws and landmark judicial guidelines protecting women and children in India. Knowledge of your statutory rights is your first defense.
          </p>
        </div>

        {/* Official Government Portals Directory Box */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 18,
            background: 'var(--color-pale-pink)',
            border: '1.5px solid var(--color-border)',
            marginBottom: 32,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Building2 size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              Official Government Legislation Portals
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>
            Access verified statutory enactments and official gazettes directly from government ministry repositories:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <a
              href="https://www.wcd.gov.in/documents/legislations"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MWCD Legislations Portal (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>🏛️ MWCD Legislations Portal</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>

            <a
              href="https://wcd.gov.in/women/legislations"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MWCD Women Legislations (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>👩 MWCD Women Legislations</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>

            <a
              href="https://www.dcmsme.gov.in/POSHACT2013.aspx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ministry of MSME POSH Act Information (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>🏢 Govt POSH Act 2013 Guide</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>

            <a
              href="https://www.sci.gov.in/document/judgments-and-gender/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Supreme Court of India Judgments & Gender (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>⚖️ Supreme Court Gender Judgments</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>

            <a
              href="https://www.indiacode.nic.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="India Code Digital Repository of Acts (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>📜 India Code Digital Repository</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>

            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="National Cyber Crime Reporting Portal (opens in a new tab)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>🛡️ National Cyber Crime Portal</span>
              <ExternalLink size={13} color="var(--color-primary)" />
            </a>
          </div>
        </div>

        {/* Laws List */}
        <section aria-label="Statutory and Judicial Frameworks">
          {laws.map((law, i) => (
            <LawCard key={law.id} law={law} index={i} />
          ))}
        </section>

        {/* Comprehensive Important Legal Disclaimer */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: 18,
            background: 'var(--color-soft-pink)',
            border: '1.5px solid var(--color-border)',
            marginTop: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Info size={20} color="var(--color-primary)" />
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              Statutory Notice & Legal Disclaimer
            </h4>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
            The summaries, provisions, and resources published on this page are provided strictly for general public awareness and educational purposes and do not constitute formal legal counsel or legal representation. Statutory provisions are subject to legislative amendment, administrative notification, and judicial interpretation.
            <br /><br />
            For confidential legal advice regarding a specific dispute or incident, please consult a qualified advocate, your institution\'s Internal Committee (IC), or contact the <strong>National Legal Services Authority (NALSA)</strong> helpline at <strong>15100</strong> or Women Helpline at <strong>181</strong>.
            <br /><br />
            <em>Note on External Government Portals:</em> All external links provided above direct to verified official Government of India (.gov.in / .nic.in) domains or the Supreme Court of India. These external sites are managed by their respective government departments.
          </p>
        </div>
      </div>
    </main>
  );
}
