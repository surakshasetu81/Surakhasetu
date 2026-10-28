import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Search, Lock, FileText, Scale, HeadphonesIcon,
  MessageCircle, Phone, CheckCircle, Eye, Clock, BookOpen,
  Users, Heart, HeartHandshake, ArrowRight
} from 'lucide-react';
import AwarenessTicker from '../components/AwarenessTicker';

// ─── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="hero-section" aria-label="Welcome to Suraksha Setu">
      <div className="container" style={{ width: '100%' }}>
        <div className="hero-grid">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="hero-text-column"
          >
            {/* Badge */}
            <div style={{ marginBottom: 18 }}>
              <span
                className="badge badge-primary"
                style={{
                  fontSize: 'clamp(0.75rem, 2.2vw, 0.82rem)',
                  padding: '6px 14px',
                  letterSpacing: '0.01em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  maxWidth: '100%',
                  lineHeight: 1.3,
                }}
              >
                <Shield size={14} style={{ flexShrink: 0 }} />
                <span>Women • Safety • Workplace Dignity</span>
              </span>
            </div>

            {/* Main heading */}
            <h1 style={{
              fontSize: 'clamp(2.3rem, 4.5vw, 3.5rem)',
              fontWeight: 900,
              color: 'var(--color-text-main)',
              lineHeight: 1.15,
              marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>
              Suraksha Setu
            </h1>

            {/* Hindi tagline */}
            <p className="hindi-text" style={{
              fontSize: 'clamp(1.02rem, 2vw, 1.25rem)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              marginBottom: 18,
              lineHeight: 1.5,
            }}>
              समान अवसर, समान सम्मान — यही है सुरक्षित कार्यस्थल की पहचान
            </p>

            {/* Supporting text */}
            <p style={{
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.75,
              marginBottom: 28,
              maxWidth: 520,
            }}>
              A secure, confidential bridge between people seeking support and the
              resources that can help them. Report incidents, track case progress
              and understand your rights.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 30 }}>
              <Link to="/report" className="btn btn-primary btn-lg" id="hero-report-btn">
                <Shield size={18} />
                Report an Incident
              </Link>
              <Link to="/track" className="btn btn-secondary btn-lg" id="hero-track-btn">
                <Search size={18} />
                Track My Case
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="hero-trust-indicators">
              {[
                { icon: Lock, label: 'Confidential Reporting' },
                { icon: Shield, label: 'Secure Evidence Records' },
                { icon: Scale, label: 'Legal Awareness' },
                { icon: Clock, label: 'Case Progress Tracking' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="trust-item">
                  <Icon size={15} color="var(--color-primary)" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column – Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="hero-image-column"
          >
            <div className="hero-image-wrapper">
              <img
                src="/hero-illustration.png"
                alt="Diverse Indian women from different professions standing together confidently, representing solidarity, safety and empowerment"
                className="hero-illustration-img"
              />
            </div>
            {/* Caption */}
            <div className="hero-caption hindi-text">
              सुरक्षित कार्यस्थल, सम्मानित नारी, सशक्त समाज
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: FileText,
      title: 'Report an Incident',
      desc: 'Submit a complaint using a simple guided form. Choose anonymous or identified reporting based on your comfort.',
      color: 'var(--color-primary)',
    },
    {
      step: '02',
      icon: Eye,
      title: 'Track Your Case',
      desc: 'Check the current status and available updates using your case ID and recovery code.',
      color: '#7C3AED',
    },
    {
      step: '03',
      icon: Heart,
      title: 'Access Support',
      desc: 'Explore verified legal information, counselling resources and support organizations.',
      color: 'var(--color-success)',
    },
  ];

  return (
    <section className="section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title">From Concern to Support</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Three simple steps to get the help and information you need.
          </p>
        </div>
        <div className="grid-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: `${s.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <s.icon size={24} color={s.color} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, letterSpacing: '0.08em', marginBottom: 8 }}>
                STEP {s.step}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Key Features ─────────────────────────────────────────────────────────────
function KeyFeatures() {
  const features = [
    {
      icon: FileText,
      title: 'Confidential Complaint Reporting',
      desc: 'Submit complaints with an option for anonymous reporting. Your identity is protected according to your choice.',
      to: '/report',
      cta: 'Report Now',
    },
    {
      icon: Eye,
      title: 'Case Tracking',
      desc: 'Follow up on your submitted complaint using a unique case ID and secure recovery code.',
      to: '/track',
      cta: 'Track Case',
    },
    {
      icon: Lock,
      title: 'Secure Evidence Vault',
      desc: 'Upload photos, documents and audio evidence securely linked to your complaint.',
      to: '/proof-vault',
      cta: 'Upload Evidence',
    },
    {
      icon: Scale,
      title: 'Legal Rights Information',
      desc: 'Understand the POSH Act, POCSO Act and Vishaka Guidelines with clear, accessible summaries.',
      to: '/legal',
      cta: 'Learn More',
    },
    {
      icon: Heart,
      title: 'Safety Support Resources',
      desc: 'Access counselling, legal aid and support organizations. Verified helpline numbers included.',
      to: '/safety',
      cta: 'Get Support',
    },
    {
      icon: MessageCircle,
      title: 'AI-Assisted Guidance',
      desc: 'Get answers to common questions about your rights and options through our guidance assistant.',
      to: '/safety#assistant',
      cta: 'Ask Assistant',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A complete platform designed for safety, privacy, and dignity at every step.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card-feature"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="icon-container" style={{ marginBottom: 16 }}>
                <f.icon size={22} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
              <Link to={f.to} className="btn btn-outline-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                {f.cta} <ArrowRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Know Your Rights ─────────────────────────────────────────────────────────
function KnowYourRights() {
  const laws = [
    {
      id: 'posh',
      title: 'POSH Act, 2013',
      titleHindi: 'यौन उत्पीड़न अधिनियम',
      year: 2013,
      desc: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act protects women from sexual harassment at work. Every employer with 10+ employees must form an Internal Complaints Committee (ICC).',
      points: ['Applies to all workplaces', 'ICC mandatory for 10+ employees', 'Complaint within 3 months of incident', 'Inquiry within 90 days'],
      color: '#C2185B',
      href: 'https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf',
    },
    {
      id: 'pocso',
      title: 'POCSO Act, 2012',
      titleHindi: 'पॉक्सो अधिनियम',
      year: 2012,
      desc: 'The Protection of Children from Sexual Offences Act provides a robust legal framework to protect children under 18 from sexual assault, harassment and pornography. Reporting is mandatory.',
      points: ['Protects children below 18 years', 'Gender-neutral protection', 'Mandatory reporting obligation', 'Special child-friendly courts'],
      color: '#7C3AED',
      href: 'https://wcd.nic.in/sites/default/files/POCSO-ACT.pdf',
    },
    {
      id: 'vishaka',
      title: 'Vishaka Guidelines, 1997',
      titleHindi: 'विशाखा दिशानिर्देश',
      year: 1997,
      desc: 'Landmark Supreme Court guidelines that first defined sexual harassment at the workplace in India, placing employer obligations. These guidelines laid the foundation for the POSH Act.',
      points: ['First legal definition of workplace harassment', 'Employer awareness obligations', 'Complaints committee framework', 'Foundation for POSH Act 2013'],
      color: '#0891B2',
      href: 'https://main.sci.gov.in/',
    },
  ];

  return (
    <section className="section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title">Know Your Rights</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Understanding the law is the first step to protecting yourself and others.
          </p>
        </div>
        <div className="grid-3">
          {laws.map((law, i) => (
            <motion.div
              key={law.id}
              className="legal-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14
              }}>
                <div>
                  <div style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 9999,
                    background: `${law.color}18`, color: law.color,
                    fontSize: '0.72rem', fontWeight: 700, marginBottom: 6,
                  }}>
                    {law.year}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: law.color }}>{law.title}</h3>
                  <p className="hindi-text" style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{law.titleHindi}</p>
                </div>
                <Scale size={28} color={law.color} style={{ opacity: 0.4, flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{law.desc}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {law.points.map(pt => (
                  <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.84rem' }}>
                    <CheckCircle size={14} color={law.color} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: 'var(--color-text-main)' }}>{pt}</span>
                  </li>
                ))}
              </ul>
              <a
                href={law.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{ background: `${law.color}18`, color: law.color, border: `1.5px solid ${law.color}40` }}
              >
                <BookOpen size={13} /> Official Source
              </a>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 10 }}>
                * This is an informational summary. For legal advice, consult a qualified advocate.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Counselling & Emotional Support ───────────────────────────────────────────
// ─── Counselling & Emotional Support (CTA) ──────────────────────────────────
function CounsellingSupportCTA() {
  return (
    <section className="section" id="counselling" aria-label="Counselling and Emotional Support">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(28px, 4vw, 44px)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: 1040,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 28,
              alignItems: 'center',
            }}
          >
            {/* Left column: Text & Heading */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HeartHandshake size={20} />
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  Emotional Wellbeing & Dignity
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  lineHeight: 1.25,
                  marginBottom: 8,
                }}
              >
                Counselling & Emotional Support
              </h2>

              <p
                className="hindi-text"
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                आपकी बात सुनने, समझने और सहयोग देने के लिए सहायता उपलब्ध है।
              </p>

              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: 20,
                  maxWidth: 540,
                }}
              >
                Find information about emotional support, workplace harassment counselling, and professional guidance in a safe and respectful environment.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {['Emotional Wellbeing', 'Workplace Support', 'Legal Guidance', 'Verified Helplines'].map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    • {tag}
                  </span>
                ))}
              </div>

              <div>
                <Link
                  to="/counselling-support"
                  className="btn btn-primary btn-lg"
                  id="explore-counselling-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 700,
                    padding: '12px 24px',
                  }}
                >
                  <HeartHandshake size={20} />
                  Explore Counselling Support
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right column: Subtle highlights card */}
            <div
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                What You Will Find:
              </h3>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--color-text-main)' }}>Emotional Distress Care:</strong> Practical grounding techniques and understanding when professional therapy helps.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--color-text-main)' }}>Workplace Harassment Guidance:</strong> Documenting incidents, navigating ICC procedures, and retaliation protections.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--color-text-main)' }}>Verified Directory:</strong> 24/7 toll-free mental health and women helplines verified by authorities.
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                No login required to read support guides.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Community Support ────────────────────────────────────────────────────────
function CommunitySupport() {
  const resources = [
    { icon: HeadphonesIcon, label: 'Counselling', desc: 'iCall: 9152987821 · Vandrevala Foundation: 1860-2662-345', color: '#7C3AED' },
    { icon: Scale, label: 'Legal Aid', desc: 'National Legal Services Authority: 15100 · District Legal Services Authorities', color: '#0891B2' },
    { icon: Users, label: 'ICC / LCC', desc: 'Internal Complaints Committees at your workplace or Local Complaints Committee at district level', color: 'var(--color-primary)' },
    { icon: Phone, label: 'Support Helplines', desc: 'Women Helpline: 181 · Childline: 1098 · NCW: 7827170170', color: 'var(--color-success)' },
  ];

  return (
    <section className="section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title">Community Support</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            You are not alone. These organizations offer verified support and assistance.
          </p>
        </div>
        <div className="grid-2" style={{ maxWidth: 860, margin: '0 auto' }}>
          {resources.map((r, i) => (
            <motion.div
              key={r.label}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <r.icon size={20} color={r.color} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{r.label}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <AwarenessTicker />
      <HowItWorks />
      <KeyFeatures />
      <KnowYourRights />
      <CounsellingSupportCTA />
      <CommunitySupport />
    </main>
  );
}
