import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, CheckCircle2
} from 'lucide-react';

export default function WorkplacePreparednessGuidePage() {
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
              <ShieldCheck size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Educational Curriculum
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: 800, margin: '2px 0 0' }}>
                Full Guide: Workplace Preparedness & POSH Dossier
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
            Step-by-step guidance on constructing an unalterable evidence trail, framing a formal written complaint under the POSH Act 2013, and invoking interim safeguards against workplace reprisal.
          </p>
        </div>

        {/* Numbered Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 1: Documenting Contemporaneous Facts
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Inquiry committees evaluate contemporary documentation (notes taken right after incidents) with high evidential weight:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Keep personal off-system records: Do not store evidence exclusively on company laptops or office servers that can be wiped remotely.',
                'Export raw emails with headers: Forward pertinent messages to personal email accounts or save .eml copies.',
                'Record witnesses & bystanders: Note who was present in the meeting room, hallway, or digital channel when remarks were made.',
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
              Step 2: Structuring the Formal Written Complaint
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              A concise, well-structured submission expedites committee review and prevents procedural delays:
            </p>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, fontSize: '0.86rem', lineHeight: 1.6 }}>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>Complainant details:</strong> Name, department, designation, employee ID, and contact details (or anonymous reference).</li>
                <li><strong>Respondent details:</strong> Name, role, reporting hierarchy, and relationship to the complainant.</li>
                <li><strong>Chronological narrative:</strong> Date-wise recount of specific incidents with quoted statements where recalled.</li>
                <li><strong>Impact description:</strong> Impact on health, work performance, or fear of retaliation.</li>
                <li><strong>Relief requested:</strong> Inquiry under POSH Act, interim transfer, or specific corrective actions.</li>
              </ol>
            </div>
          </div>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 3: Exercising Interim Relief Rights
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              You do not have to endure continued interactions with the respondent during an active inquiry. Under Section 12, submit a written interim relief application to the Presiding Officer requesting:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Transfer of the aggrieved woman or respondent to another office or business vertical.',
                'Grant of paid leaves up to a period of 3 months in addition to statutory leaves.',
                'Formal restraint on the respondent evaluating your work or submitting appraisal notes.',
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Action Controls */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link to="/counselling-support" className="btn btn-secondary">
            Return to Support Directory
          </Link>
          <Link to="/report" className="btn btn-primary">
            Start Complaint on Suraksha Setu
          </Link>
        </div>

      </div>
    </main>
  );
}
