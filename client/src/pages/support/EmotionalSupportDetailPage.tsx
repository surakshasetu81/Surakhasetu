import { Link } from 'react-router-dom';
import {
  Heart, ArrowLeft, Phone, ExternalLink, CheckCircle2,
  Shield, AlertCircle, Compass, LifeBuoy
} from 'lucide-react';

export default function EmotionalSupportDetailPage() {
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
              <Heart size={28} />
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
                Comprehensive Emotional Care
              </span>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, margin: '2px 0 0', lineHeight: 1.2 }}>
                Emotional Support & Wellbeing
              </h1>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.96rem', lineHeight: 1.7, margin: '0 0 16px' }}>
            Experiencing harassment, intimidation, or interpersonal distress can significantly impact mental health, self-confidence, and daily life. You do not have to carry this burden alone. This guide details practical coping tools, trauma responses, and direct connections to qualified mental health practitioners.
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
              All information on this page is free to read privately. Suraksha Setu does not track your identity or mandate disclosure.
            </span>
          </div>
        </div>

        {/* Core Topics Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          
          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Compass size={20} color="var(--color-primary)" />
              1. Understanding Emotional Distress & Trauma Responses
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Distress manifests in many forms. Recognizing that these symptoms are normal biological and psychological responses to abnormal stress helps demystify the experience:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Physical symptoms: Tension headaches, fatigue, shallow breathing, chest tightness, or gastrointestinal discomfort.',
                'Cognitive symptoms: Brain fog, intrusive memories of the incident, racing thoughts, or difficulty focusing on work.',
                'Emotional symptoms: Heightened vigilance, feelings of helplessness, fear of retaliation, anger, or unjustified self-blame.',
                'Relational symptoms: Withdrawing from colleagues, mistrusting supervisors, or avoiding shared public and office spaces.',
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <LifeBuoy size={20} color="var(--color-primary)" />
              2. Immediate Grounding & Stabilization Techniques
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              When experiencing an acute emotional trigger, use these clinically backed grounding exercises to regulate your nervous system:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>The 5-4-3-2-1 Sensory Anchor</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Acknowledge 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste to bring your awareness back to the present room.
                </p>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Box Breathing (4-4-4-4)</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Inhale slowly for 4 seconds, hold gently for 4 seconds, exhale steadily for 4 seconds, and hold empty for 4 seconds. Repeat 4 times to calm heart rate.
                </p>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={20} color="var(--color-primary)" />
              3. When to Seek Professional Counselling
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
              Therapy is not an indicator of weakness; it is a clinical intervention that protects cognitive clarity and emotional resilience. Consider scheduling a session if:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Distress or hypervigilance persists for more than two consecutive weeks.',
                'You find yourself dreading office hours or experiencing severe panic attacks before meetings.',
                'Feelings of isolation or cynicism begin hindering personal relationships and family life.',
                'You need a neutral, legally confidential professional to help process traumatic interactions.',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

        </div>

        {/* Verified Official Helplines Directory */}
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
            Verified National Emotional Support Helplines
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            These public services are free, confidential, toll-free, and operated by recognized government ministries or statutory bodies:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Tele-MANAS */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Tele-MANAS</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    Govt of India • 24/7
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Comprehensive tele-mental health helpline under the Ministry of Health & Family Welfare providing psychological first-aid in 20+ regional languages.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:14416" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 14416
                </a>
                <a href="https://telemanas.mohfw.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> Portal
                </a>
              </div>
            </div>

            {/* KIRAN Helpline */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>KIRAN Mental Health</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    MSJE • 24/7
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  National 24/7 mental health rehabilitation helpline by the Department of Empowerment of Persons with Disabilities offering crisis intervention and distress management.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:18005990019" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 1800-599-0019
                </a>
                <a href="https://disabilityaffairs.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> Portal
                </a>
              </div>
            </div>

            {/* iCALL Psychosocial Helpline */}
            <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>iCALL (TISS)</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-soft-pink)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                    Mon–Sat 10AM–8PM
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Professional free psychosocial counselling initiative by the Tata Institute of Social Sciences addressing relationship stress, trauma, and workplace pressure.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a href="tel:9152987821" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <Phone size={13} /> Call 9152987821
                </a>
                <a href="https://icallhelpline.org/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <ExternalLink size={13} /> Portal
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Notice */}
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#DC2626' }}>Urgent Danger / Crisis:</strong> If you are experiencing suicidal thoughts or immediate physical harm, dial <strong>112 (National Emergency Support)</strong> or <strong>181 (Women Helpline)</strong> immediately.
          </div>
        </div>

      </div>
    </main>
  );
}
