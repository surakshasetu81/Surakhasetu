import { motion } from 'framer-motion';
import { Users, FileText, Shield, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RespondentPortalPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container-sm" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="icon-container" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <Users size={24} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 8 }}>Respondent Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 520, margin: '0 auto' }}>
            Information for respondents in a complaint process. Understanding your rights and obligations.
          </p>
        </div>

        <div style={{
          padding: '20px 24px', borderRadius: 14, marginBottom: 28,
          background: 'rgba(183, 121, 31, 0.08)', border: '1.5px solid rgba(183, 121, 31, 0.3)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertCircle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Important Notice</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              If you have been named as a respondent in a complaint, you should receive an official notice from the
              Internal Complaints Committee (ICC) or the authority handling the matter. All formal communications
              will come through official channels.
            </p>
          </div>
        </div>

        {[
          {
            icon: Shield,
            title: 'Your Rights as a Respondent',
            items: [
              'Right to receive a written copy of the complaint',
              'Right to be heard and present your account of events',
              'Right to cross-examine witnesses through the committee',
              'Right to representation or support during the inquiry',
              'Right to appeal the committee\'s findings to the appropriate authority',
              'Protection from false or malicious complaints under the POSH Act',
            ],
          },
          {
            icon: FileText,
            title: 'Your Responsibilities',
            items: [
              'Cooperate with the inquiry process',
              'Attend hearings as called by the committee',
              'Not attempt to retaliate against or intimidate the complainant or witnesses',
              'Maintain confidentiality of the proceedings',
              'Comply with interim relief measures ordered by the committee',
              'Provide factual and truthful responses to committee questions',
            ],
          },
        ].map((section, i) => (
          <motion.div key={section.title} className="card" style={{ marginBottom: 20 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="icon-container"><section.icon size={18} /></div>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{section.title}</h2>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 7 }} />
                  <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>Legal Support</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            If you need legal guidance about the complaint process, you may consult a qualified advocate.
            National Legal Services Authority (NALSA) provides free legal aid to eligible individuals.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="tel:15100" className="btn btn-outline-primary btn-sm">NALSA: 15100</a>
            <Link to="/legal" className="btn btn-secondary btn-sm"><LinkIcon size={13} /> Legal Framework</Link>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 12 }}>
            This page provides general information and does not constitute legal advice.
          </p>
        </div>
      </div>
    </main>
  );
}
