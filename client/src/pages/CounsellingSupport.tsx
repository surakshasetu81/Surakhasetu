import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartHandshake, ShieldCheck, Scale, Phone, ExternalLink,
  CheckCircle2, Lock, Heart, ArrowRight,
  Info, Sparkles, AlertCircle, Search, HelpCircle, Shield,
  ChevronDown, PhoneCall
} from 'lucide-react';

interface SupportResource {
  id: string;
  name: string;
  organization: string;
  category: 'emotional' | 'workplace' | 'legal';
  categoryLabel: string;
  description: string;
  availability: string;
  phone: string;
  phoneDisplay: string;
  website: string;
  isGovernmentOrVerified: boolean;
  notes: string;
}

const VERIFIED_RESOURCES: SupportResource[] = [
  {
    id: 'tele-manas',
    name: 'Tele-MANAS (Mental Health Helpline)',
    organization: 'Ministry of Health & Family Welfare, Govt. of India',
    category: 'emotional',
    categoryLabel: 'Emotional Wellbeing',
    description: 'Comprehensive 24/7 tele-mental health services providing psychological first-aid, crisis intervention, and distress counselling in 20+ regional Indian languages.',
    availability: '24 Hours / 7 Days a week • Free Toll-Free',
    phone: '14416',
    phoneDisplay: '14416 or 1800-891-4416',
    website: 'https://telemanas.mohfw.gov.in/',
    isGovernmentOrVerified: true,
    notes: 'Multilingual assistance across all Indian states and union territories.',
  },
  {
    id: 'kiran-mental-health',
    name: 'KIRAN Helpline',
    organization: 'Department of Empowerment of Persons with Disabilities, MSJE',
    category: 'emotional',
    categoryLabel: 'Emotional Wellbeing',
    description: 'Dedicated national helpline offering early screening, first-aid, psychological support, distress management, and mental health referral assistance.',
    availability: '24 Hours / 7 Days a week • Free Toll-Free',
    phone: '18005990019',
    phoneDisplay: '1800-599-0019',
    website: 'https://disabilityaffairs.gov.in/',
    isGovernmentOrVerified: true,
    notes: 'Operates with certified mental health professionals across 13 Indian languages.',
  },
  {
    id: 'ncw-helpline',
    name: 'National Commission for Women Helpline',
    organization: 'NCW (National Commission for Women)',
    category: 'workplace',
    categoryLabel: 'Workplace & Harassment Support',
    description: 'Specialized 24/7 helpline for women facing sexual harassment, domestic violence, workplace discrimination, or distress, facilitating institutional intervention.',
    availability: '24/7 Active Helpline',
    phone: '7827170170',
    phoneDisplay: '07827170170',
    website: 'https://ncw.nic.in/',
    isGovernmentOrVerified: true,
    notes: 'Provides formal grievance registration and direct counselling facilitation.',
  },
  {
    id: 'women-helpline-181',
    name: 'Women Helpline (WHL) — Mission Shakti',
    organization: 'Ministry of Women and Child Development (MoWCD)',
    category: 'workplace',
    categoryLabel: 'Workplace & Harassment Support',
    description: '24-hour emergency and non-emergency response for women affected by violence or workplace harassment, integrated directly with One Stop Centres (OSCs).',
    availability: '24 Hours / 7 Days a week • Free Toll-Free',
    phone: '181',
    phoneDisplay: '181 (Toll-Free All India)',
    website: 'https://wcd.nic.in/',
    isGovernmentOrVerified: true,
    notes: 'Direct connection to local protection officers, emergency shelter, and legal aid.',
  },
  {
    id: 'icall-tiss',
    name: 'iCALL Psychosocial Helpline',
    organization: 'Tata Institute of Social Sciences (TISS)',
    category: 'emotional',
    categoryLabel: 'Emotional Wellbeing',
    description: 'Free psychosocial counselling by qualified mental health professionals addressing emotional distress, relationship concerns, work stress, and trauma.',
    availability: 'Monday – Saturday: 10:00 AM – 8:00 PM',
    phone: '9152987821',
    phoneDisplay: '+91 9152987821',
    website: 'https://icallhelpline.org/',
    isGovernmentOrVerified: true,
    notes: 'Run by certified psychologists and professional academic counsellors.',
  },
  {
    id: 'vandrevala-foundation',
    name: 'Vandrevala Foundation Mental Health Support',
    organization: 'Vandrevala Foundation',
    category: 'emotional',
    categoryLabel: 'Emotional Wellbeing',
    description: '24/7 emotional support and mental health crisis response by trained psychological counsellors for acute stress, anxiety, and traumatic experiences.',
    availability: '24 Hours / 7 Days a week',
    phone: '9999666555',
    phoneDisplay: '+91 9999 666 555',
    website: 'https://www.vandrevalafoundation.com/',
    isGovernmentOrVerified: true,
    notes: 'Free, confidential telephonic counselling across India.',
  },
  {
    id: 'nalsa-legal-aid',
    name: 'National Legal Services Authority (NALSA)',
    organization: 'Supreme Court of India / Statutory Body',
    category: 'legal',
    categoryLabel: 'Legal Aid & Guidance',
    description: 'Free legal advice and state-sponsored advocate representation for women under Section 12 of the Legal Services Authorities Act, 1987.',
    availability: 'Toll-Free National Legal Aid: 15100',
    phone: '15100',
    phoneDisplay: '15100 (National Legal Helpline)',
    website: 'https://nalsa.gov.in/',
    isGovernmentOrVerified: true,
    notes: 'Connects to District Legal Services Authorities (DLSA) in every district across India.',
  },
];

const FAQS = [
  {
    q: 'Do I need to sign up or create an account to access counselling support?',
    a: 'No. All educational guidance, rights summaries, and verified helpline contact numbers are 100% public and free to browse without creating an account or providing identification.',
  },
  {
    q: 'Are the phone helplines listed on this page free of cost?',
    a: 'Yes. National helplines such as Tele-MANAS (14416), KIRAN (1800-599-0019), Women Helpline (181), and NALSA Legal Aid (15100) are completely toll-free public services funded by the Government of India.',
  },
  {
    q: 'Is Suraksha Setu an emergency dispatch service?',
    a: 'No. Suraksha Setu is an educational and confidential grievance intake platform. If you or someone you know is in immediate physical danger, dial 112 (National Emergency Support System) immediately.',
  },
  {
    q: 'Can my employer or supervisor see which guides I view on this page?',
    a: 'No. Your browsing activity on this support hub is completely private and processed locally on your device. We do not store tracking cookies or share visitor data with corporate employers.',
  },
  {
    q: 'What is the difference between emotional support and formal POSH complaints?',
    a: 'Emotional support focuses on psychological wellbeing, distress management, and trauma recovery. A formal POSH complaint initiates a statutory inquiry by the workplace Internal Committee (IC) to investigate misconduct.',
  },
];

export default function CounsellingSupport() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredResources = VERIFIED_RESOURCES.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="counselling-page" style={{ paddingBottom: 80, background: 'var(--color-bg)' }}>
      
      {/* ─── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Counselling & Emotional Support</span>
        </div>
      </div>

      {/* ─── Safety & Non-Emergency Advisory Note ─────────────────────────────── */}
      <div className="container" style={{ marginTop: 20 }}>
        <div
          role="note"
          aria-label="Safety advice"
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-soft-pink)',
            border: '1.5px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            fontSize: '0.86rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
            <AlertCircle size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: 'var(--color-text-main)' }}>Safety Note:</strong> Suraksha Setu is an educational and support directory, not an immediate emergency dispatch service. If you are in immediate danger, contact emergency services directly.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="tel:112"
              className="btn btn-sm"
              style={{ background: '#DC2626', color: '#FFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <PhoneCall size={13} /> Call 112 (Emergency)
            </a>
            <a
              href="tel:181"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Phone size={13} /> Call 181 (Women Helpline)
            </a>
          </div>
        </div>
      </div>

      {/* ─── Improved Hero Section ───────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 32, paddingBottom: 40 }} aria-labelledby="counselling-hero-title">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 36,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Heading & CTAs */}
            <div>
              <div style={{ marginBottom: 14 }}>
                <span
                  className="badge badge-primary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  <HeartHandshake size={15} />
                  Safe • Respectful • Dignified Support
                </span>
              </div>

              <h1
                id="counselling-hero-title"
                style={{
                  fontSize: 'clamp(2.1rem, 4vw, 3rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  lineHeight: 1.2,
                  marginBottom: 12,
                  letterSpacing: '-0.02em',
                }}
              >
                Counselling & Emotional Support
              </h1>

              <p
                className="hindi-text"
                style={{
                  fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}
              >
                आप अकेले नहीं हैं — सहायता माँगना आपका अधिकार है।
              </p>

              <p
                style={{
                  fontSize: '0.98rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  maxWidth: 580,
                  marginBottom: 20,
                }}
              >
                Every person deserves to be heard with compassion and supported through stressful workplace or personal experiences. Browse verified distress helplines, institutional resolution steps, and rights guides at your own pace without registration.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => scrollToSection('support-types')}
                  className="btn btn-primary"
                  style={{ padding: '12px 22px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  id="hero-explore-support-options-btn"
                >
                  <Sparkles size={16} />
                  Explore Support Options
                </button>
                <button
                  onClick={() => scrollToSection('counselling-directory')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 22px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  id="hero-find-verified-helplines-btn"
                >
                  <Phone size={16} />
                  Find Verified Helplines
                </button>
              </div>

              {/* Privacy Assurance Pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: '6px 14px', borderRadius: 999, border: '1px solid var(--color-border)' }}>
                <Shield size={14} color="var(--color-primary)" />
                <span>100% Private: Browse resources freely without logging in or entering personal details.</span>
              </div>
            </div>

            {/* Right Column: Reassuring Feature Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-card)',
                border: '1.5px solid var(--color-border)',
                padding: 'clamp(24px, 4vw, 36px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <HeartHandshake size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Supportive Conversations
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    Safe, respectful space for emotional wellbeing & workplace dignity
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'No judgment or pressure', desc: 'Read and navigate support guides privately at your own speed.' },
                  { title: 'Workplace dignity focus', desc: 'Understanding your options under institutional and legal frameworks.' },
                  { title: 'Verified national helplines', desc: 'Direct access to government and academic mental health services.' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section: Not Sure Where to Start? Helper ─────────────────────────── */}
      <section className="section" style={{ paddingTop: 10, paddingBottom: 24 }}>
        <div className="container">
          <div
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--color-text-main)' }}>
                  Not sure where to start?
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  If you need immediate listening support, call Tele-MANAS (14416). If you are preparing to address workplace misconduct, explore our guided dossier steps.
                </p>
              </div>
            </div>
            <button
              onClick={() => scrollToSection('counselling-directory')}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Browse Helplines Directory
            </button>
          </div>
        </div>
      </section>

      {/* ─── Section: Types of Support (OPENS DEDICATED NEW TABS) ─────────────── */}
      <section id="support-types" className="section-alt" style={{ padding: '48px 0' }} aria-labelledby="support-types-heading">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 id="support-types-heading" className="section-title">Types of Support</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
              Tailored guidance designed to help you navigate emotional distress, workplace challenges, and legal protections.
            </p>
          </div>

          <div className="grid-3">
            {/* Card 1: Emotional Support */}
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Heart size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                  Emotional Support
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                  Explore information about emotional wellbeing, coping with difficult experiences, and finding appropriate mental health support.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, padding: 0 }}>
                  {[
                    'Emotional distress and trauma responses',
                    'Practical grounding and breathing tools',
                    'Finding certified psychological counsellors',
                    'Understanding when professional therapy helps',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirement: Opens dedicated detail page in NEW tab */}
              <a
                href="/support/emotional"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                id="btn-explore-emotional"
              >
                <span>Explore Emotional Support</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Card 2: Workplace Harassment Counselling */}
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                  Workplace Harassment Counselling
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                  Understand support options available when facing workplace harassment, discrimination, hostile conditions, or professional intimidation.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, padding: 0 }}>
                  {[
                    'Identifying statutory workplace harassment',
                    'Building an objective chronological dossier',
                    'POSH complaint submission procedures',
                    'Interim relief & anti-retaliation protections',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirement: Opens dedicated detail page in NEW tab */}
              <a
                href="/support/workplace"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                id="btn-explore-workplace"
              >
                <span>Explore Workplace Support</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Card 3: Legal & Professional Guidance */}
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Scale size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                  Legal & Professional Guidance
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                  Find information about legal awareness, institutional committee powers, statutory timelines, and free government legal representation.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, padding: 0 }}>
                  {[
                    'POSH Act & Vishaka guidelines awareness',
                    'Powers of Internal & Local Committees',
                    'Statutory limitation periods (3–6 months)',
                    'Free state legal aid through NALSA & DLSA',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirement: Opens dedicated detail page in NEW tab */}
              <a
                href="/support/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                id="btn-explore-guidance"
              >
                <span>Explore Guidance</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Improved Support Resources Section (Search & Filter Directory) ──── */}
      <section id="counselling-directory" className="section" style={{ scrollMarginTop: 80, padding: '54px 0' }} aria-labelledby="directory-title">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 id="directory-title" className="section-title">Support Resources Directory</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 660 }}>
              Official helplines and national support services verified through Government of India ministries, statutory commissions, and recognized academic institutions.
            </p>
          </div>

          {/* Functional Search and Category Filters */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: 28,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Filter buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'all', label: 'All Resources' },
                { id: 'emotional', label: 'Emotional Wellbeing' },
                { id: 'workplace', label: 'Workplace & Harassment' },
                { id: 'legal', label: 'Legal Aid' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: selectedCategory === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                    background: selectedCategory === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: selectedCategory === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', minWidth: 260, flex: '1 1 auto', maxWidth: 380 }}>
              <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search helplines by name, topic, or ministry..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Resources Cards Grid */}
          {filteredResources.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                        {resource.categoryLabel}
                      </span>
                      {resource.isGovernmentOrVerified && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Verified Official
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: 4, color: 'var(--color-text-main)' }}>
                      {resource.name}
                    </h3>

                    <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 10 }}>
                      {resource.organization}
                    </p>

                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                      {resource.description}
                    </p>

                    <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <div><strong>Operating Hours:</strong> {resource.availability}</div>
                      <div style={{ marginTop: 4 }}><strong>Helpline:</strong> <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{resource.phoneDisplay}</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <a
                      href={`tel:${resource.phone}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: '1 1 auto', justifyContent: 'center', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Phone size={14} /> Call {resource.phone}
                    </a>
                    <a
                      href={resource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 auto', justifyContent: 'center', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <ExternalLink size={14} /> Visit Official Website
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--color-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <Info size={36} color="var(--color-text-secondary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>No resources found matching "{searchQuery}"</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
                We could not locate verified resources matching your current search criteria. Try a broader keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Directory Verification Standards Disclaimer */}
          <div
            style={{
              marginTop: 28,
              padding: '16px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--color-text-main)' }}>Directory Verification Standards:</strong> All phone helplines and web portals listed above are public emergency and counselling services operated by Government of India ministries, statutory commissions, or recognized national academic institutions. Suraksha Setu does not publish unverified private listings or charge any fees.
          </div>
        </div>
      </section>

      {/* ─── Improved Educational Guidance Sections (Numbered Steps & NEW Tab Full Guides) ─── */}
      <section className="section-alt" style={{ padding: '54px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 className="section-title">Educational Support Guides</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
              Comprehensive step-by-step guidance designed to empower informed, dignified decisions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            
            {/* Guide A: Emotional Support & Distress Management */}
            <div
              className="card"
              style={{
                background: 'var(--color-card)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Heart size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      Emotional Support & Distress Management
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      Recognizing psychological trauma impacts and practical grounding techniques.
                    </p>
                  </div>
                </div>

                {/* Requirement: Read Full Guide in NEW Tab */}
                <a
                  href="/support/guides/emotional-wellbeing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Read Full Guide</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    1. Recognizing Distress
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Physical tension, insomnia, brain fog, and self-doubt are biological responses to acute stress. Acknowledging feelings without self-judgment is the first step.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    2. Paced Grounding
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Practice the 5-4-3-2-1 sensory anchor and box breathing to calm the nervous system before taking consequential professional or personal decisions.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    3. Professional Counselling
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Trained psychological counsellors provide a legally confidential space to decompress and formulate sustainable coping mechanisms.
                  </p>
                </div>
              </div>
            </div>

            {/* Guide B: Workplace Harassment Support & Preparedness */}
            <div
              className="card"
              style={{
                background: 'var(--color-card)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      Workplace Harassment Support & Preparedness
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      Constructive steps for documenting concerns and navigating the Internal Committee.
                    </p>
                  </div>
                </div>

                {/* Requirement: Read Full Guide in NEW Tab */}
                <a
                  href="/support/guides/workplace-preparedness"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Read Full Guide</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    1. Identifying Harassment
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Covers physical advances, quid-pro-quo demands, sexually colored remarks, and hostile environments extending across physical and digital workspaces.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    2. Chronological Dossier
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Preserve unedited chat exports, calendar invites, and email headers outside corporate laptops to maintain an immutable evidence timeline.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    3. Anti-Retaliation Relief
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Under Section 12 of the POSH Act, you have the right to request interim department transfers, restraining orders, and up to 3 months paid leave.
                  </p>
                </div>
              </div>
            </div>

            {/* Guide C: Legal & Institutional Guidance */}
            <div
              className="card"
              style={{
                background: 'var(--color-card)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      Legal & Institutional Guidance
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      Statutory rights, committee powers, timelines, and free legal aid.
                    </p>
                  </div>
                </div>

                {/* Requirement: Read Full Guide in NEW Tab */}
                <a
                  href="/support/guides/legal-guidance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Read Full Guide</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    1. Committee Powers
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    The Internal Committee holds Civil Court powers to summon witnesses, take evidence on oath, and order production of confidential employer records.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    2. 90-Day Inquiry Window
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Formal inquiry proceedings must conclude within 90 days. The findings report must be submitted to both parties within 10 days of completion.
                  </p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    3. Free Legal Representation
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Under Section 12 of the Legal Services Authorities Act, all women in India are entitled to free state-funded advocate representation via NALSA & DLSA.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FAQ Section ────────────────────────────────────────────────────── */}
      <section className="section" style={{ padding: '54px 0' }} aria-labelledby="faq-title">
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 id="faq-title" className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Clear answers to common questions about seeking counselling and support on Suraksha Setu.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-card)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: 12,
                      color: 'var(--color-text-main)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        color: 'var(--color-primary)',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 16px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Privacy & Confidentiality Section ──────────────────────────────── */}
      <section className="section-alt" style={{ padding: '54px 0' }} aria-labelledby="comfort-heading">
        <div className="container">
          <div
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 32px' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Lock size={24} />
              </div>
              <h2 id="comfort-heading" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 10 }}>
                Privacy & Confidentiality Guarantee
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                You remain in full control of your journey. You can explore general counselling guidance and educational support information freely without any obligation to disclose personal details.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>No Sign-Up Mandated</h3>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  All educational resources, rights awareness summaries, and helpline directories are publicly accessible without creating an account or providing identification.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>No Unsolicited Tracking</h3>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  We do not automatically initiate chat sessions, record voice audio without permission, or compel you to recount sensitive experiences.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>Statutory Data Boundaries</h3>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  Suraksha Setu does not sell or share complaint data with external commercial third parties. If you choose to file a formal case, your data remains secured under statutory guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Navigation Actions ──────────────────────────────────────── */}
      <div className="container" style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {/* Requirement: Return/Home navigation opens in new tab if clicked here */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Return to Home</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="/report"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Report an Incident</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </div>

    </main>
  );
}
