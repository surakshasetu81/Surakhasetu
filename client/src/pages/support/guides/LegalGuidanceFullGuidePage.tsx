import { Link } from 'react-router-dom';
import {
  Scale, ArrowLeft, CheckCircle2
} from 'lucide-react';

export default function LegalGuidanceFullGuidePage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '36px 16px 80px', color: 'var(--color-text-main)' }}>
      <div className="container" style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Link
            to="/counselling-support"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <ArrowLeft size={15} /> Return to Counselling & Support
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Full Educational Guide
          </span>
        </div>

        {/* Header */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            marginBottom: 28,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
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
              }}
            >
              <Scale size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Educational Curriculum
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: 800, margin: '2px 0 0' }}>
                Full Guide: Legal & Institutional Statutory Guidance
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
            Comprehensive analysis of statutory rights under the POSH Act 2013, the composition and powers of Internal Complaints Committees (ICCs), civil inquiry rules, and access to free state legal counsel via NALSA.
          </p>
        </div>

        {/* Step-by-Step Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 1: Statutory Powers of the Internal Committee
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Under Section 11(3) of the POSH Act, the Internal Committee is vested with the same powers as a <strong>Civil Court under the Code of Civil Procedure, 1908</strong>:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Summoning and enforcing the attendance of any person and examining them on oath.',
                'Requiring the discovery and production of documents, internal emails, and electronic files.',
                'Issuing commissions for the examination of witnesses.',
                'Civil Court Status: False evidence or deliberate destruction of documents during an inquiry is punishable under statutory civil contempt laws.',
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 2: Principles of Natural Justice
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              The committee must follow strict fairness protocols during hearings:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Notice to Respondent: A copy of the formal complaint must be furnished to the respondent within 7 working days.',
                'Right of Cross-Examination: Cross-examination is permitted through written questionnaires administered by the committee to prevent intimidation.',
                'No Legal Practitioners Allowed: Section 11(1) stipulates that neither party can bring external advocates or lawyers to represent them directly during internal committee proceedings.',
                'Right to a Copy of the Report: Both complainant and respondent are entitled to receive a complete copy of the inquiry report.',
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 3: Appellate Remedies (Section 18)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              If you or the respondent are aggrieved by the final recommendations of the Internal Committee, or if the employer fails to implement the findings:
            </p>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, fontSize: '0.86rem', lineHeight: 1.6 }}>
              You have the right to file an appeal before the statutory Appellate Authority (Industrial Tribunal or Labour Court) within <strong>90 days</strong> of the date of the recommendation report.
            </div>
          </div>

        </div>

        {/* Footer Return */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link to="/counselling-support" className="btn btn-secondary">
            Return to Support Directory
          </Link>
          <Link to="/legal" className="btn btn-primary">
            Explore Full Legal Framework
          </Link>
        </div>

      </div>
    </main>
  );
}
