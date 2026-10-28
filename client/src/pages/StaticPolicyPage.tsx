import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StaticPolicyPage() {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Privacy Policy & Data Protection';
  let badge = 'Privacy';
  let content = (
    <div>
      <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
        <strong>Suraksha Setu</strong> is committed to ensuring confidentiality, dignity, and absolute data protection for complainants, respondents, and committee members.
      </p>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>1. Anonymous Reporting & Confidentiality</h3>
      <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
        If you file an anonymous complaint, no personal information (name, email, or telephone) is required or stored. Your filing is identified solely through a cryptographically random Case ID and a one-way hashed Recovery Code.
      </p>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>2. Data Encryption & Access Control</h3>
      <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
        All transmitted complaint narratives and evidence records are encrypted in transit via TLS 1.3 and stored in secure, access-controlled repositories strictly in accordance with Indian statutory safeguards under the POSH Act, 2013 and Information Technology Act, 2000.
      </p>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>3. Evidence Integrity</h3>
      <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
        Uploaded proof files are tagged with cryptographic SHA-256 digests to ensure immutability and tamper detection throughout internal committee inquiries.
      </p>
    </div>
  );

  if (path === '/terms') {
    title = 'Terms of Use';
    badge = 'Terms';
    content = (
      <div>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          By accessing and using <strong>Suraksha Setu</strong>, you agree to submit truthful information to the best of your knowledge and to use this platform in accordance with applicable laws.
        </p>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>1. Lawful & Authorized Use</h3>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          This platform is established to support workplace safety, grievance redressal, and statutory inquiry proceedings under the POSH Act, 2013 and related safety frameworks.
        </p>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>2. Non-Interference</h3>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          Users agree not to attempt unauthorized access to restricted staff portals, other complainants' records, or administrative telemetry.
        </p>
      </div>
    );
  } else if (path === '/disclaimer') {
    title = 'Legal Information Disclaimer';
    badge = 'Disclaimer';
    content = (
      <div>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          <strong>Statutory Disclaimer:</strong> Information and preliminary assessments provided on this platform are for educational, informational, and triage support purposes only.
        </p>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          AI/ML-assisted category suggestions and legal framework references do not determine whether an offence has occurred, establish liability, or substitute for formal proceedings before an authorized Internal Committee, Local Committee, or court of law.
        </p>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          For statutory legal counsel or representation, complainants are encouraged to consult a qualified legal advocate or national legal aid authority (NALSA Helpline: 15100).
        </p>
      </div>
    );
  } else if (path === '/accessibility') {
    title = 'Accessibility Statement';
    badge = 'Accessibility';
    content = (
      <div>
        <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
          <strong>Suraksha Setu</strong> is designed with inclusive accessibility principles to ensure every person can seek safety and redressal without barriers.
        </p>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 10px' }}>Accessibility Features</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8, marginBottom: 16 }}>
          <li>Multilingual interface support (English & Hindi)</li>
          <li>Voice-to-text dictation assistance for narrative submission</li>
          <li>High-contrast text and accessible color palettes</li>
          <li>Keyboard navigability and screen-reader compliant ARIA labels</li>
          <li>Quick Emergency Exit button available from any page</li>
        </ul>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '80vh', padding: '48px 20px', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--color-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: 24,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Return to Home
        </Link>

        <div className="card" style={{ padding: '36px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(194, 24, 91, 0.1)',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '0.78rem',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {badge}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 20, color: 'var(--color-text-main)' }}>
            {title}
          </h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            {content}
          </div>
        </div>
      </div>
    </main>
  );
}
