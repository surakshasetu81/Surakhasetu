import { useState } from 'react';
import { Phone, MapPin, MessageCircle, Mic, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const FAQS = [
  {
    q: 'What should I do if I feel unsafe right now?',
    a: 'If you are in immediate danger, call 112 (Police Emergency) immediately. Women\'s helpline is 181. Childline is 1098. Move to a safe location if possible and contact a trusted person.',
  },
  {
    q: 'Can I report anonymously?',
    a: 'Yes. The Report page allows you to submit a complaint anonymously. No personal information is collected under anonymous reporting. You will receive a Case ID and Recovery Code to track your complaint.',
  },
  {
    q: 'What is a POSH complaint?',
    a: 'A POSH (Prevention of Sexual Harassment) complaint is a formal complaint filed under the Sexual Harassment of Women at Workplace Act, 2013. It can be filed with your organization\'s Internal Complaints Committee (ICC) or the Local Complaints Committee (LCC) at the district level.',
  },
  {
    q: 'How long do I have to file a complaint under POSH?',
    a: 'Under the POSH Act, you should file a complaint within 3 months of the incident. The committee may extend this to 6 months if there is a sufficient cause for the delay.',
  },
  {
    q: 'What is Childline?',
    a: 'Childline India (1098) is a 24/7 free emergency helpline for children in distress. It provides immediate support and connects children to appropriate services including shelter, counselling and legal aid.',
  },
  {
    q: 'Is this platform a substitute for police or legal services?',
    a: 'No. This platform provides information, complaint documentation, and case tracking support. For legal proceedings, please consult a qualified advocate. For criminal matters, contact the police directly.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 10,
      background: 'var(--color-card)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{q}</span>
        {open ? <ChevronUp size={16} color="var(--color-primary)" /> : <ChevronDown size={16} color="var(--color-text-secondary)" />}
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function SafetyPage() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hello! I\'m here to help answer common questions about your safety rights and available support. What would you like to know?' },
  ]);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');

    // Find matching FAQ answer
    const match = FAQS.find(faq =>
      userMsg.toLowerCase().split(' ').some(word => word.length > 4 && faq.q.toLowerCase().includes(word))
    );

    const reply = match
      ? match.a
      : 'I can answer common questions about your rights and safety options. For your specific situation, please consult a qualified advocate or call the helpline at 181 (Women Helpline) or 1098 (Childline).';

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: userMsg },
      { role: 'assistant', text: reply },
    ]);
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="icon-container" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 8 }}>
            Safety Options
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Quick access to help, information and resources.
          </p>
        </div>

        {/* Emergency Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
          borderRadius: 20,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AlertTriangle size={28} color="#fff" />
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', marginBottom: 2 }}>In Immediate Danger?</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Call emergency services directly. This platform is not an emergency response service.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="tel:112" className="btn" style={{ background: '#fff', color: '#991B1B', fontWeight: 800 }} id="emergency-call-112">
              <Phone size={15} /> 112
            </a>
            <a href="tel:181" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)' }}>
              <Phone size={15} /> 181
            </a>
            <a href="tel:1098" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)' }}>
              <Phone size={15} /> 1098
            </a>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="safety-grid">
          {/* Safety Assistant */}
          <div id="assistant" className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="icon-container">
                <MessageCircle size={20} />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Safety Assistant</h2>
            </div>
            <div style={{
              flex: 1, minHeight: 240, maxHeight: 320, overflowY: 'auto',
              background: 'var(--color-bg-secondary)',
              borderRadius: 12, padding: 14, marginBottom: 12,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-card)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text-main)',
                  padding: '10px 14px', borderRadius: 14,
                  fontSize: '0.85rem', lineHeight: 1.6,
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                }}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about your rights or options…"
                id="chat-input"
              />
              <button onClick={handleChat} className="btn btn-primary btn-sm" id="chat-send-btn">Send</button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>
              This assistant answers from approved FAQ content. For specific legal advice, consult a qualified advocate.
            </p>
          </div>

          {/* Nearby Help */}
          <div id="nearby" className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="icon-container">
                <MapPin size={20} />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Find Nearby Help</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.65 }}>
              Search for verified support services in your area. Contact details are sourced from official directories.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'Women Helpline', number: '181', type: 'National' },
                { name: 'Childline', number: '1098', type: 'National' },
                { name: 'Police Emergency', number: '112', type: 'National' },
                { name: 'NCW Helpline', number: '7827170170', type: 'National' },
                { name: 'iCall (Counselling)', number: '9152987821', type: 'National' },
                { name: 'NALSA (Legal Aid)', number: '15100', type: 'National' },
              ].map(h => (
                <div key={h.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                  gap: 12,
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{h.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{h.type}</p>
                  </div>
                  <a href={`tel:${h.number}`} className="btn btn-primary btn-sm">
                    <Phone size={13} /> {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 24 }}>Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>

        {/* Voice Note */}
        <div style={{
          marginTop: 32, padding: '20px 24px', borderRadius: 16,
          background: 'rgba(124, 58, 237, 0.06)', border: '1.5px solid rgba(124, 58, 237, 0.2)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Mic size={24} color="#7C3AED" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Voice Input</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              When filling out the complaint form, you can dictate your incident description.
              Click the microphone icon in the description field. You will be asked for microphone permission.
              Always review your dictated text before submitting.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .safety-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
