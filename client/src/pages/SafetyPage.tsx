import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Phone,
  MapPin,
  MessageCircle,
  Mic,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Send,
  Loader2,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { sendAssistantMessage, type OfficialResource } from '../services/api';

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isEmergency?: boolean;
  resources?: OfficialResource[];
  suggestedActions?: string[];
}

const QUICK_PROMPTS = [
  'POSH Act kya hai?',
  'Office mein complaint kaise karein?',
  'Job se nikalne ki dhamki',
  'Evidence ko safely kaise store karun?',
  'Agar company complaint nahi sunti toh?',
];

export default function SafetyPage() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste & Hello! I am your Suraksha Setu Women-Safety & Legal Assistant. I can answer questions about workplace harassment, POSH Act compliance, complaint procedures, retaliation protections, evidence storage, and verified national helplines.\n\nYou can ask in English, Hindi (हिन्दी), or Hinglish.',
      suggestedActions: [
        'POSH Act kya hai?',
        'Office mein complaint kaise karein?',
        'Evidence ko safely kaise store karun?',
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  const executeSend = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || loading) return;

    setError(null);
    setLastFailedMessage(null);
    setChatInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setLoading(true);

    try {
      const history = nextMessages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const response = await sendAssistantMessage(text, history);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        isEmergency: response.isEmergency,
        resources: response.officialResources,
        suggestedActions: response.suggestedActions,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[SafetyAssistant] Error:', err);
      setError(err?.response?.data?.message || 'Unable to connect to assistant service. Please check your connection or retry.');
      setLastFailedMessage(text);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (e?: FormEvent) => {
    if (e) e.preventDefault();
    executeSend(chatInput);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      executeSend(lastFailedMessage);
    }
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="icon-container" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 8 }}>
            Safety Options & Guidance
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Instant multilingual safety advice, verified legal frameworks, and 24/7 national helplines.
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }} className="safety-grid">
          {/* Safety Assistant Card */}
          <div id="assistant" className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-container" style={{ width: 40, height: 40, background: 'rgba(194, 24, 91, 0.1)', color: 'var(--color-primary)' }}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Suraksha Setu Safety Assistant</h2>
                  <p style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Multilingual • English, हिन्दी, Hinglish
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'rgba(194, 24, 91, 0.08)',
                padding: '4px 8px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Sparkles size={12} /> Verified Legal Knowledge
              </span>
            </div>

            {/* Quick Prompts Bar */}
            <div style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 10,
              marginBottom: 10,
              scrollbarWidth: 'none',
            }}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => executeSend(prompt)}
                  disabled={loading}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '5px 11px',
                    borderRadius: 16,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div style={{
              flex: 1,
              minHeight: 280,
              maxHeight: 380,
              overflowY: 'auto',
              background: 'var(--color-bg-secondary)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.role === 'user' ? '82%' : '92%',
                    background: msg.role === 'user'
                      ? 'var(--color-primary)'
                      : msg.isEmergency
                        ? '#FFF1F2'
                        : 'var(--color-card)',
                    color: msg.role === 'user'
                      ? '#fff'
                      : msg.isEmergency
                        ? '#881337'
                        : 'var(--color-text-main)',
                    padding: '12px 16px',
                    borderRadius: 16,
                    fontSize: '0.86rem',
                    lineHeight: 1.65,
                    border: msg.role === 'user'
                      ? 'none'
                      : msg.isEmergency
                        ? '1.5px solid #FDA4AF'
                        : '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Emergency Icon header if emergency */}
                  {msg.isEmergency && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#BE123C', fontWeight: 700 }}>
                      <ShieldAlert size={18} />
                      <span>Immediate Safety Alert</span>
                    </div>
                  )}

                  {/* Message Text with preserved paragraphs */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>

                  {/* Official Resources Links */}
                  {msg.resources && msg.resources.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <p style={{ fontSize: '0.74rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Official Statutory Sources & Portals:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {msg.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: 'rgba(194, 24, 91, 0.05)',
                              border: '1px solid rgba(194, 24, 91, 0.15)',
                            }}
                          >
                            <span>{res.name}</span>
                            <ExternalLink size={13} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emergency call buttons if emergency */}
                  {msg.isEmergency && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <a
                        href="tel:112"
                        className="btn btn-sm"
                        style={{ background: '#BE123C', color: '#fff', fontWeight: 800, padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Phone size={13} /> Call 112 (Police)
                      </a>
                      <a
                        href="tel:181"
                        className="btn btn-sm"
                        style={{ background: '#9F1239', color: '#fff', fontWeight: 800, padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Phone size={13} /> Call 181 (Women Helpline)
                      </a>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && !msg.isEmergency && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => executeSend(action)}
                          style={{
                            background: 'none',
                            border: '1px dashed var(--color-primary)',
                            color: 'var(--color-primary)',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          → {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing / Loading indicator */}
              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: 'var(--color-card)',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  <Loader2 size={16} className="spin" color="var(--color-primary)" />
                  <span>Suraksha Setu assistant is preparing verified guidance…</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error & Retry Banner */}
            {error && (
              <div style={{
                padding: '8px 12px',
                marginBottom: 8,
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <span>{error}</span>
                {lastFailedMessage && (
                  <button
                    onClick={handleRetry}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#991B1B',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                    }}
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                )}
              </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleChat} style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about rights, POSH, IC, evidence, threats (in English, हिन्दी, or Hinglish)…"
                id="chat-input"
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                id="chat-send-btn"
                disabled={!chatInput.trim() || loading}
                style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {loading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                <span>Send</span>
              </button>
            </form>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center' }}>
              Guidance is based on verified Indian statutory frameworks (POSH Act 2013, BNS 2023). For legal advocacy, consult a qualified advocate.
            </p>
          </div>

          {/* Nearby Help Section */}
          <div id="nearby" className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="icon-container">
                <MapPin size={20} />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Verified National Helplines</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Direct government emergency and support directories available 24/7 across India.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Police Emergency', number: '112', type: 'All-in-one Emergency (24/7)', highlight: true },
                { name: 'Women Helpline', number: '181', type: 'National Women Support (24/7)', highlight: true },
                { name: 'NCW Helpline', number: '7827170170', type: 'National Commission for Women' },
                { name: 'National Cyber Crime', number: '1930', type: 'Online Harassment & Fraud' },
                { name: 'Tele-MANAS', number: '14416', type: 'Free Mental Health Counselling' },
                { name: 'Childline India', number: '1098', type: 'Children in Distress (24/7)' },
                { name: 'NALSA Legal Aid', number: '15100', type: 'Free Legal Assistance for Women' },
              ].map(h => (
                <div key={h.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 10,
                  background: h.highlight ? 'rgba(194, 24, 91, 0.05)' : 'var(--color-bg-secondary)',
                  border: h.highlight ? '1px solid rgba(194, 24, 91, 0.2)' : '1px solid var(--color-border)',
                  gap: 12,
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{h.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>{h.type}</p>
                  </div>
                  <a href={`tel:${h.number}`} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    <Phone size={12} /> {h.number}
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
        @media (max-width: 900px) {
          .safety-grid { grid-template-columns: 1fr !important; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
