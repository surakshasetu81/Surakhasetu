import { Link } from 'react-router-dom';
import {
  Scale, ArrowLeft, Phone, ExternalLink, CheckCircle2,
  FileCheck, Shield, BookOpen
} from 'lucide-react';

export default function LegalGuidanceDetailPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '32px 16px 80px', color: 'var(--color-text-main)' }}>
      <div className="container" style={{ maxWidth: 880, margin: '0 auto' }}>
        
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Link
            to="/counselling-support"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <ArrowLeft size={15} /> Return to Counselling & Support
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Dedicated Support Category
          </span>
        </div>

        {/* Hero Card */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(24px, 4vw, 36px)',
            marginBottom: 28,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
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
              <Scale size={28} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-primary)',
                }}
              >
                Statutory Rights & Procedural Justice
              </span>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, margin: '2px 0 0', lineHeight: 1.2 }}>
                Legal & Institutional Guidance
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.96rem', lineHeight: 1.7, margin: '0 0 16px' }}>
            Understanding your legal standing demystifies institutional processes and empowers informed decision-making. This guide outlines the key provisions of the POSH Act 2013, the functioning of Internal and Local Committees, statutory limitation periods, and how women in India can access state-funded legal aid through NALSA.
          </p>

          <div
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.84rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Shield size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              Disclaimer: This guide provides legal information and awareness. For representation in court or formal inquiries, consult an advocate or legal aid counsel.
            </span>
          </div>
        </div>

        {/* Detailed Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileCheck size={20} color="var(--color-primary)" />
              1. The POSH Act 2013: Core Framework
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              The Act provides a civil redressal mechanism designed to resolve complaints swiftly without the formal complexities of police criminal trials (unless criminal assault has occurred):
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Universal Protection: Protects all women at a workplace regardless of age, employment status (permanent, contract, intern, volunteer, domestic worker).',
                'Internal Committee (IC): Mandatory for every workplace with 10 or more employees. Must be headed by a senior woman Presiding Officer, consist of over 50% women members, and include an external NGO/legal expert.',
                'Local Committee (LC): Formed at the district level by the District Officer to hear complaints from workplaces with fewer than 10 employees or where the complaint is against the employer directly.',
                'Conciliation Option: Under Section 10, the complainant can request the committee to settle the matter through conciliation before an inquiry begins (monetary settlement cannot be the basis of conciliation).',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={20} color="var(--color-primary)" />
              2. Statutory Inquiry Timelines & Standards
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Strict timelines are enforced by law under Section 11(4) to ensure accountability:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Limitation Period</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Complaint must be filed within 3 months of the incident. The committee has statutory discretion to extend this by another 3 months if circumstances prevented earlier filing.
                </p>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>90-Day Statutory Inquiry Limit</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  The committee must complete its inquiry within 90 days. The formal findings report must be submitted to the employer and parties within 10 days of completion.
                </p>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={20} color="var(--color-primary)" />
              3. Free State Legal Aid (NALSA & DLSA)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Under Section 12 of the Legal Services Authorities Act, 1987, <strong>all women in India are unconditionally entitled to free legal aid</strong>, irrespective of their income or economic status.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Free Legal Consultation: Access to certified panel advocates for drafting legal notices, complaints, and replies.',
                'Free Court Representation: Assignment of a court-appointed advocate to represent you in labor tribunals, civil courts, or High Courts.',
                'Payment of Court Fees: All associated court filing fees and drafting charges are borne entirely by the state.',
                'District Legal Services Authority (DLSA): Offices exist in every district court complex across India to provide walk-in counsel.',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

        </div>

        {/* Legal Aid Contacts Directory */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>
            Verified Statutory Legal Aid Contacts
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Connect with certified government legal services authorities for free representation:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>NALSA (National Legal Services)</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    Supreme Court of India
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Toll-free national legal aid helpline connecting citizens with District Legal Services Authorities across India for free representation.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:15100" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 15100
                </a>
                <a href="https://nalsa.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> NALSA Portal
                </a>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>India Code Legislative Repository</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    Ministry of Law & Justice
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Official digital repository of all Central and State statutes, including the full authentic text of the POSH Act 2013 and POCSO Act 2012.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="https://www.indiacode.nic.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                  <ExternalLink size={13} /> Access India Code Repository
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
          <Link to="/legal" className="btn btn-primary">
            Browse Interactive Legal Framework
          </Link>
          <Link to="/report" className="btn btn-secondary">
            File a Complaint
          </Link>
        </div>

      </div>
    </main>
  );
}
