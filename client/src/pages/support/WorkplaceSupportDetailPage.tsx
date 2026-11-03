import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Phone, ExternalLink, CheckCircle2,
  FileText, Lock, Building, Scale
} from 'lucide-react';

export default function WorkplaceSupportDetailPage() {
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
              <ShieldCheck size={28} />
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
                Workplace Harassment Redressal
              </span>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, margin: '2px 0 0', lineHeight: 1.2 }}>
                Workplace Harassment Counselling & Support
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.96rem', lineHeight: 1.7, margin: '0 0 16px' }}>
            Workplace safety and equal opportunity are fundamental statutory rights. Navigating unprofessional behavior, hostility, or sexual harassment can feel isolating. This comprehensive guide outlines your rights under the POSH Act 2013, how to build an objective evidence dossier, and how to interface with your employer's Internal Complaints Committee (ICC).
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
            <Lock size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              All advice conforms strictly to the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.
            </span>
          </div>
        </div>

        {/* Actionable Steps & Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building size={20} color="var(--color-primary)" />
              1. Understanding What Constitutes Workplace Harassment
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Under Indian statutory law, workplace sexual harassment encompasses both direct demands and subtle hostile environments created within the organization:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Physical contact and advances: Unwelcome touch, cornering, blocking movement, or invasion of physical space.',
                'Quid Pro Quo: Explicit or implied promises of preferential employment (promotions, ratings) or threats of detrimental treatment (dismissal, negative appraisals).',
                'Hostile Work Environment: Unsolicited sexually colored remarks, inappropriate jokes, sharing explicit digital media, or systematic intimidation.',
                'Extended Workplace Definition: Covers office premises, client sites, off-site workshops, transport provided by the employer, and remote digital channels (Slack, Teams, WhatsApp, Zoom).',
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
              <FileText size={20} color="var(--color-primary)" />
              2. How to Build an Objective Chronological Record
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Clear documentation creates an unassailable foundation for internal committee inquiries or legal representation:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Record Exact Timestamps</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Log exact dates, times, conference room numbers, or digital platforms where each interaction occurred.
                </p>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Export Unaltered Evidence</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Save full screenshots showing sender headers, email headers, chat transcripts, and CCTV references to your Proof Vault.
                </p>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={20} color="var(--color-primary)" />
              3. Protection Against Workplace Retaliation
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              The law recognizes that fear of workplace repercussions often silences complainants. Section 12 of the POSH Act grants you enforceable rights during the inquiry:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Interim Relief: You may request transfer of the aggrieved woman or the respondent to another department.',
                'Paid Leave: You can request up to 3 months of paid administrative leave that will not be deducted from your regular earned leaves.',
                'Restraining Orders: The committee can restrain the respondent from reporting on or evaluating your annual appraisal.',
                'Strict Confidentiality: Section 16 prohibits publication of the names or identities of the complainant and witnesses.',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

        </div>

        {/* Institutional Resource Contact Cards */}
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
            Verified Workplace Support Resources
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Official statutory bodies providing grievance registration and oversight across India:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>NCW Violence Helpline</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    Statutory Body • 24/7
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Round-the-clock national helpline operated by the National Commission for Women handling formal complaints regarding workplace harassment and gender discrimination.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:7827170170" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 7827170170
                </a>
                <a href="https://ncw.nic.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> NCW Portal
                </a>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Women Helpline (WHL)</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    MoWCD • 24/7 Toll-Free
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Scheme under Mission Shakti providing emergency crisis response and referral to One Stop Centres (OSCs), legal aid, and police liaison.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:181" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 181
                </a>
                <a href="https://wcd.nic.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> MoWCD Portal
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
          <Link to="/report" className="btn btn-primary">
            File a Confidential Complaint on Suraksha Setu
          </Link>
          <Link to="/legal" className="btn btn-secondary">
            View Complete Legal Framework
          </Link>
        </div>

      </div>
    </main>
  );
}
