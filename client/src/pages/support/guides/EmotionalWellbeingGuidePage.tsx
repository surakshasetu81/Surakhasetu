import { Link } from 'react-router-dom';
import {
  Heart, ArrowLeft, CheckCircle2, Phone
} from 'lucide-react';

export default function EmotionalWellbeingGuidePage() {
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
              <Heart size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Educational Curriculum
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: 800, margin: '2px 0 0' }}>
                Full Guide: Emotional Wellbeing & Distress Recovery
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
            This educational resource outlines physiological stabilization, cognitive processing of workplace hostility, self-advocacy without emotional burnout, and how to access free national psychological support.
          </p>
        </div>

        {/* Numbered Step-by-Step Educational Curriculum */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 1: Normalizing the Acute Trauma Response
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              When boundaries are breached in a professional setting, the brain's autonomic nervous system enters fight-or-flight mode. You may experience involuntary shaking, nausea, sudden weeping, or numbness.
            </p>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '14px 18px', borderRadius: 10, fontSize: '0.86rem', lineHeight: 1.6 }}>
              <strong>Clinical Insight:</strong> Numbness and emotional detachment are protective psychological defenses, not signs that "it was not serious." Give yourself grace and avoid forcing immediate stoicism.
            </div>
          </div>

          <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
              Step 2: Somatic Reset & Emotional Grounding
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Trauma locks energy into muscles and alters hormonal balance. Re-establishing somatic grounding is essential before undertaking complex verbal statements or inquiries:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Temperature Modulation: Splashing cold water on your face stimulates the vagus nerve, reducing rapid heart rate.',
                'Progressive Muscle Relaxation: Systematically clench and release muscle groups from feet up to shoulders.',
                'Physical Boundary Reaffirmation: Walk outside, change physical environments, or touch familiar stabilizing objects.',
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
              Step 3: Creating a Safe Emotional Buffer at Work
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              If you must remain in the physical or digital workplace while deliberating on formal complaints:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Cease 1-on-1 unrecorded meetings: Request all communications via official email or in open conference rooms with third parties.',
                'Establish a trusted ally: Inform one discreet confidant who can accompany you in common office spaces.',
                'Separate identity from the organization: Recognize that harassment reflects the misconduct of the offender, not your worth or competency.',
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
              Step 4: Accessing Certified Tele-Therapy
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              You do not need to wait for a formal complaint finding to seek help. Connect with public tele-mental health services:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a href="tel:14416" className="btn btn-primary btn-sm">
                <Phone size={13} /> Tele-MANAS: Call 14416
              </a>
              <a href="tel:18005990019" className="btn btn-secondary btn-sm">
                <Phone size={13} /> KIRAN: 1800-599-0019
              </a>
            </div>
          </div>

        </div>

        {/* Footer Return */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/counselling-support" className="btn btn-secondary">
            Return to Support Directory
          </Link>
        </div>

      </div>
    </main>
  );
}
