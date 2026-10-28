import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartHandshake, ShieldCheck, Scale, Phone, ExternalLink,
  CheckCircle2, Lock, Heart, ArrowRight,
  Info, Sparkles, AlertCircle, Search
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
    description: 'Comprehensive 24/7 tele-mental health services providing psychological first-aid, crisis intervention, and distress counselling in multiple Indian languages.',
    availability: '24 Hours / 7 Days a week • Free & Toll-Free',
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
    notes: 'Operates with mental health professionals across 13 Indian languages.',
  },
  {
    id: 'ncw-helpline',
    name: 'National Commission for Women Helpline',
    organization: 'NCW (National Commission for Women)',
    category: 'workplace',
    categoryLabel: 'Workplace & Harassment Support',
    description: 'Specialized 24/7 helpline for women facing sexual harassment, domestic violence, workplace discrimination, or distress, facilitating institutional intervention.',
    availability: '24/7 Helpline',
    phone: '7827170170',
    phoneDisplay: '7827170170 / 181 (Women Helpline)',
    website: 'https://ncw.nic.in/',
    isGovernmentOrVerified: true,
    notes: 'Provides formal grievance registration and direct counselling facilitation.',
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
    notes: 'Run by certified psychologists and professional counsellors.',
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
    categoryLabel: 'Legal & Professional Guidance',
    description: 'Free legal advice and state-sponsored legal representation for women under Section 12 of the Legal Services Authorities Act, 1987.',
    availability: 'Toll-free Legal Aid: 15100',
    phone: '15100',
    phoneDisplay: '15100 (National Legal Helpline)',
    website: 'https://nalsa.gov.in/',
    isGovernmentOrVerified: true,
    notes: 'Connects to District Legal Services Authorities (DLSA) in every district.',
  },
];

export default function CounsellingSupport() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    <main className="counselling-page" style={{ paddingBottom: 80 }}>
      {/* ─── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--color-text-secondary)' }}>Home</Link>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Counselling & Emotional Support</span>
        </div>
      </div>

      {/* ─── Safety Note ─────────────────────────────────────────────────────── */}
      <div className="container" style={{ marginTop: 24 }}>
        <div
          role="note"
          aria-label="Safety advice"
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: '0.86rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <AlertCircle size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--color-text-main)' }}>Safety Note:</strong> If you are in immediate danger, contact the appropriate emergency service directly. Suraksha Setu provides information and support resources; it is not a substitute for emergency response or professional medical care.
          </span>
        </div>
      </div>

      {/* ─── Section A: Page Hero ───────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 36, paddingBottom: 48 }} aria-labelledby="counselling-hero-title">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 36,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ marginBottom: 14 }}>
                <span
                  className="badge badge-primary"
                  style={{
                    fontSize: '0.82rem',
                    padding: '6px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <HeartHandshake size={15} />
                  Safe • Respectful • Dignified
                </span>
              </div>

              <h1
                id="counselling-hero-title"
                style={{
                  fontSize: 'clamp(2.1rem, 4vw, 3rem)',
                  fontWeight: 900,
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
                  fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                आप अकेले नहीं हैं — सहायता माँगना आपका अधिकार है।
              </p>

              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.75,
                  maxWidth: 580,
                  marginBottom: 24,
                }}
              >
                Every person deserves to be heard, treated with dignity, and supported when facing difficult situations. Explore available counselling information and support options at your own pace.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={() => scrollToSection('support-types')}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontWeight: 600 }}
                  id="hero-explore-types-btn"
                >
                  <Sparkles size={16} />
                  Explore Support Types
                </button>
                <button
                  onClick={() => scrollToSection('counselling-directory')}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontWeight: 600 }}
                  id="hero-find-resources-btn"
                >
                  <Phone size={16} />
                  Find Support Resources
                </button>
              </div>
            </div>

            {/* Dignified Hero Graphic Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
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
                  }}
                >
                  <HeartHandshake size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Supportive Conversations
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
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
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section B: Types of Support ───────────────────────────────────── */}
      <section id="support-types" className="section-alt" style={{ padding: '60px 0' }} aria-labelledby="support-types-heading">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 id="support-types-heading" className="section-title">Types of Support</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
              Tailored guidance designed to help you navigate emotional distress, workplace challenges, and legal protections.
            </p>
          </div>

          <div className="grid-3">
            {/* Card 1: Emotional Support */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10 }}>
                  Emotional Support
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>
                  Explore information about emotional wellbeing, coping with difficult experiences, and finding appropriate support.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    'Emotional distress and wellbeing',
                    'Handling stress related to difficult experiences',
                    'Finding appropriate counselling resources',
                    'Understanding when professional support may help',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => scrollToSection('emotional-support-detail')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                id="btn-explore-emotional"
              >
                Explore Emotional Support <ArrowRight size={15} />
              </button>
            </motion.div>

            {/* Card 2: Workplace Harassment Counselling */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10 }}>
                  Workplace Harassment Counselling
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>
                  Understand support options available to people experiencing workplace harassment, discrimination, intimidation, or other difficult professional situations.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    'Understanding workplace concerns',
                    'Preparing to discuss a difficult experience',
                    'Learning about workplace complaint procedures',
                    'Finding relevant institutional support resources',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => scrollToSection('workplace-support-detail')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                id="btn-explore-workplace"
              >
                Explore Workplace Support <ArrowRight size={15} />
              </button>
            </motion.div>

            {/* Card 3: Legal and Professional Guidance */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10 }}>
                  Legal & Professional Guidance
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>
                  Find information about legal awareness, institutional support mechanisms, and appropriate professional guidance.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    'POSH-related awareness',
                    'Internal Complaints Committee information',
                    'General information about complaint procedures',
                    'Finding appropriate legal aid resources',
                  ].map((topic, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-main)' }}>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => scrollToSection('legal-guidance-detail')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                id="btn-explore-guidance"
              >
                Explore Guidance <ArrowRight size={15} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Detailed Section 1: Emotional Support Detail ───────────────────── */}
      <section id="emotional-support-detail" className="section" style={{ scrollMarginTop: 80 }} aria-labelledby="emotional-detail-heading">
        <div className="container">
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={22} />
              </div>
              <div>
                <h3 id="emotional-detail-heading" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Emotional Support & Distress Management
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Recognizing psychological impacts and practical steps toward emotional grounding.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  1. Recognizing Distress
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Difficult experiences at work or in daily life often lead to stress, sleep disruption, anxiety, self-doubt, or isolation. Acknowledging these emotional responses is a healthy first step.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  2. Handling Overwhelming Feelings
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Grounding techniques (such as sensory focus exercises and paced breathing) help regulate acute emotional responses. Prioritize your physical safety and pause before making urgent decisions.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  3. When Professional Support Helps
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  When stress affects your sleep, work, or health persistently, trained psychological counsellors offer an empathetic space to process trauma and formulate healthy coping mechanisms.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                onClick={() => {
                  setSelectedCategory('emotional');
                  scrollToSection('counselling-directory');
                }}
                className="btn btn-secondary btn-sm"
              >
                View Emotional Support Helplines <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detailed Section 2: Workplace Support Detail ───────────────────── */}
      <section id="workplace-support-detail" className="section-alt" style={{ scrollMarginTop: 80, padding: '50px 0' }} aria-labelledby="workplace-detail-heading">
        <div className="container">
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 id="workplace-detail-heading" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Workplace Harassment Support & Preparedness
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Constructive steps for documenting concerns and exploring institutional resolution.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  1. Identifying Workplace Concerns
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Workplace harassment includes unwelcome physical, verbal, or electronic conduct, demands for favors, or creating an intimidating, hostile, or humiliating work environment.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  2. Preparing a Chronological Record
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Keep notes of dates, times, locations, words spoken, emails, messages, and any witnesses. Having an objective timeline helps articulate your experience with clarity and confidence.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  3. Workplace Complaint Channels
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Under the POSH Act, organizations with 10+ employees must maintain an Internal Committee (IC). You have the right to request interim relief, including leaves or team transfers during inquiry.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link to="/report" className="btn btn-secondary btn-sm">
                File a Complaint on Suraksha Setu <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detailed Section 3: Legal Guidance Detail ─────────────────────── */}
      <section id="legal-guidance-detail" className="section" style={{ scrollMarginTop: 80 }} aria-labelledby="legal-detail-heading">
        <div className="container">
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Scale size={22} />
              </div>
              <div>
                <h3 id="legal-detail-heading" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Legal & Institutional Guidance
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Statutory rights, committee processes, and access to free legal aid.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  1. POSH Act Protections
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  The POSH Act 2013 safeguards women at all workplaces (formal and unorganized). Complaints are handled with strict statutory confidentiality to safeguard all parties involved.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  2. Inquiry Timeline & Rights
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  A formal complaint should generally be submitted within 3 months (extendable up to 6 months for sufficient cause). Committees must conclude inquiries within 90 days.
                </p>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  3. Free State Legal Aid
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  Under Section 12 of the Legal Services Authorities Act, women are entitled to free legal counsel through the National Legal Services Authority (NALSA) and District Legal Services Authorities (DLSA).
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link to="/legal" className="btn btn-secondary btn-sm">
                Explore Complete Legal Framework <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Find Support Resources (Resource Directory) ───────── */}
      <section id="counselling-directory" className="section-alt" style={{ scrollMarginTop: 80, padding: '60px 0' }} aria-labelledby="directory-title">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 id="directory-title" className="section-title">Find Support Resources</h2>
            <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 660 }}>
              Explore verified official helplines and national support services. All contact information is verified through official government and recognized institutional portals.
            </p>
          </div>

          {/* Search and Category Filter */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: 32,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              alignItems: 'center',
              justifyContent: 'space-between',
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
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
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
            <div style={{ position: 'relative', minWidth: 240, flex: '1 1 auto', maxWidth: 360 }}>
              <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search resources by name or topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
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

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
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
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
                        {resource.categoryLabel}
                      </span>
                      {resource.isGovernmentOrVerified && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Verified
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, color: 'var(--color-text-main)' }}>
                      {resource.name}
                    </h3>

                    <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10 }}>
                      {resource.organization}
                    </p>

                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                      {resource.description}
                    </p>

                    <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <div><strong>Hours:</strong> {resource.availability}</div>
                      <div style={{ marginTop: 4 }}><strong>Helpline:</strong> <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{resource.phoneDisplay}</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <a
                      href={`tel:${resource.phone}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: '1 1 auto', justifyContent: 'center' }}
                    >
                      <Phone size={14} /> Call {resource.phone}
                    </a>
                    <a
                      href={resource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 auto', justifyContent: 'center' }}
                    >
                      <ExternalLink size={14} /> Official Site
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
                border: '1px solid var(--color-border)',
              }}
            >
              <Info size={36} color="var(--color-text-secondary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>No resources found matching "{searchQuery}"</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Verified counselling resources are being prepared. Please check the available official support resources.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Data Integrity / Verified Resource Notice */}
          <div
            style={{
              marginTop: 36,
              padding: '18px 24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: 'var(--color-text-main)' }}>Directory Standards & Verification:</strong> All contact numbers and web portals listed above are public emergency and counselling services operated by Government of India ministries, statutory commissions, or recognized national academic institutions. Suraksha Setu does not publish unverified private listings or charge any fees. Independent certified private counsellor directories are currently in review for quality assurance.
          </div>
        </div>
      </section>

      {/* ─── Section 5: Your Comfort Matters ────────────────────────────────── */}
      <section className="section" style={{ padding: '60px 0' }} aria-labelledby="comfort-heading">
        <div className="container">
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
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
                Your Comfort Matters
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                You are in control of your journey. You can explore general counselling guidance and educational support information freely without any obligation to disclose personal details.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>No Login Required to Read</h3>
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
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>Transparent Data Boundaries</h3>
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
      <div className="container" style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            Return to Home
          </Link>
          <Link to="/report" className="btn btn-primary">
            Report an Incident <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}
