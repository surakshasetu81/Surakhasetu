import { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { sendSafetyChatMessage, type ChatbotMessageItem } from '../services/api';

const FAQS = [
  {
    q: 'What should I do if I feel unsafe right now?',
    a: 'If you are in immediate danger, call 112 (Police Emergency) immediately. Women\'s helpline is 181. Childline is 1098. Move to a safe, populated location if possible and contact a trusted person.',
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
    a: 'Under the POSH Act, you should file a complaint within 3 months of the incident. The committee may extend this to 6 months if there is sufficient cause for the delay.',
  },
  {
    q: 'What is Childline?',
    a: 'Childline India (1098) is a 24/7 free emergency helpline for children in distress. It provides immediate support and connects children to appropriate services including shelter, counselling and legal aid.',
  },
  {
    q: 'Is this platform a substitute for police or legal services?',
    a: 'No. This platform provides legal information, complaint documentation, and case tracking support. For legal proceedings, consult a qualified advocate. For criminal matters, contact the police directly.',
  },
];

const SUGGESTED_QUERIES = [
  'Office mein manager uncomfortable messages bhej raha hai. Kya karun?',
  'What should I do if my manager harasses me?',
  'Meri complaint ke baad mujhe job se nikalne ki dhamki mil rahi hai.',
  'Agar company complaint nahi sunti toh kahan complain karein?',
  'POSH Act kya hai aur ye kahan apply hota hai?',
  'Evidence ko safely kaise store karun?',
  'Difference between Vishaka Guidelines and POSH Act?',
  'Mujhe abhi unsafe feel ho raha hai, kya karun?',
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: '1.5px solid var(--color-border)',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
        background: 'var(--color-card)',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
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
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatbotMessageItem[]>([
    {
      role: 'assistant',
      text:
        'Namaste! I am your Suraksha Setu Safety Assistant.\n\n' +
        'I can assist you in **English**, **Hindi (हिंदी)**, or **Hinglish** with questions regarding:\n' +
        '• Workplace sexual harassment & POSH Act compliance\n' +
        '• Protection against retaliation or job-loss threats (Section 12)\n' +
        '• Safe preservation of digital evidence & timestamps\n' +
        '• Approaching the District Local Committee if company has no IC\n' +
        '• Emergency support helplines (112, 181, 1098)\n\n' +
        'How can I help you today?',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || chatInput).trim();
    if (!text || isLoading) return;

    setChatInput('');
    setLastFailedQuery(null);

    // Append user message immediately
    const newUserMessage: ChatbotMessageItem = { role: 'user', text };
    const updatedHistory = [...chatMessages, newUserMessage];
    setChatMessages(updatedHistory);
    setIsLoading(true);

    try {
      const historyPayload = updatedHistory.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const data = await sendSafetyChatMessage({
        message: text,
        history: historyPayload,
      });

      if (data.success && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply,
            isEmergency: data.isEmergency,
            helplines: data.helplines,
            officialResources: data.officialResources,
            suggestedQuestions: data.suggestedQuestions,
            detectedLanguage: data.detectedLanguage,
            timestamp: data.timestamp,
          },
        ]);
      } else {
        throw new Error(data.message || 'Unable to process response');
      }
    } catch (err: any) {
      console.warn('Safety assistant communication error:', err);
      setLastFailedQuery(text);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            '⚠️ Communication error with Safety Assistant backend. If you are facing an emergency, please dial **112** or Women Helpline **181** directly.\n\n' +
            'You can click the "Retry" button below to attempt sending your message again.',
          isEmergency: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        text:
          'Chat session reset. Aap apna sawal English, Hindi (हिंदी) ya Hinglish mein pooch sakti hain. I am here to help you.',
      },
    ]);
    setChatInput('');
    setLastFailedQuery(null);
  };

  // Voice Input helper (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Supports Hindi / Indian English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            className="icon-container"
            style={{
              margin: '0 auto 16px',
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
            }}
          >
            <Shield size={26} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)' }}>
            Safety & Emergency Support
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
            Instant multilingual assistance, verified statutory rights, safe evidence preservation, and 24x7 national emergency helplines.
          </p>
        </div>

        {/* Emergency Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
            borderRadius: 20,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 32,
            boxShadow: '0 8px 24px rgba(153, 27, 27, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 280, flex: 1 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={26} color="#fff" />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: 3 }}>In Immediate Danger?</p>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Call emergency police and ambulance services directly. This digital assistant is an informational support tool and cannot dispatch rescue units.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="tel:112"
              className="btn"
              style={{
                background: '#fff',
                color: '#991B1B',
                fontWeight: 800,
                fontSize: '0.92rem',
                padding: '10px 18px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
              id="emergency-call-112"
              aria-label="Call 112 National Police Emergency"
            >
              <Phone size={16} /> 112 (Police / Emergency)
            </a>
            <a
              href="tel:181"
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '0.92rem',
                padding: '10px 16px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
              aria-label="Call 181 Women Helpline"
            >
              <Phone size={16} /> 181 (Women Helpline)
            </a>
            <a
              href="tel:1098"
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '0.92rem',
                padding: '10px 16px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
              aria-label="Call 1098 Childline"
            >
              <Phone size={16} /> 1098 (Childline)
            </a>
          </div>
        </div>

        {/* Main Grid: Left Chatbot, Right Directory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: 28 }} className="safety-grid">
          {/* Intelligent Multilingual Safety Assistant */}
          <section
            id="assistant"
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 20,
              padding: 24,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Assistant Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'var(--color-soft-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Intelligent Safety Assistant
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: 'rgba(22, 133, 107, 0.1)',
                        color: '#16856B',
                        border: '1px solid rgba(22, 133, 107, 0.25)',
                      }}
                    >
                      Multilingual
                    </span>
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Understands English, हिंदी, Hinglish & mixed queries
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
                title="Reset conversation"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            {/* Chat Messages Scroll Window */}
            <div
              style={{
                flex: 1,
                minHeight: 380,
                maxHeight: 460,
                overflowY: 'auto',
                background: 'var(--color-bg-secondary)',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                border: '1px solid var(--color-border)',
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.role === 'user' ? '82%' : '90%',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-card)',
                    color: msg.role === 'user' ? '#FFFFFF' : 'var(--color-text-main)',
                    padding: '14px 18px',
                    borderRadius: 18,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 18,
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Emergency Alert Tag inside Assistant bubble */}
                  {msg.isEmergency && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: 'rgba(217, 45, 53, 0.1)',
                        border: '1px solid rgba(217, 45, 53, 0.3)',
                        borderRadius: 8,
                        color: '#D92D35',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        marginBottom: 10,
                      }}
                    >
                      <AlertCircle size={15} /> Urgent Safety Priority Triggered
                    </div>
                  )}

                  {/* Message Text with preserved lines and markdown-like bold formatting */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (!line.trim()) return <div key={lIdx} style={{ height: 8 }} />;

                      // Render bold text parts marked with **
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return (
                        <p key={lIdx} style={{ margin: '0 0 4px 0' }}>
                          {parts.map((p, pIdx) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                              return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
                            }
                            return p;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Immediate Emergency Action Calls inside message */}
                  {msg.isEmergency && (
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a
                        href="tel:112"
                        style={{
                          background: '#D92D35',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          padding: '6px 12px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Phone size={13} /> Call 112 (Police)
                      </a>
                      <a
                        href="tel:181"
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          padding: '6px 12px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Phone size={13} /> Call 181 (Women)
                      </a>
                    </div>
                  )}

                  {/* Official Government Resource Links */}
                  {msg.officialResources && msg.officialResources.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        Verified Official Resources:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {msg.officialResources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontWeight: 600,
                            }}
                          >
                            <ExternalLink size={12} /> {res.name} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Question Prompts */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px dashed var(--color-border)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>
                        Related follow-up questions:
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {msg.suggestedQuestions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSend(q)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '4px 10px',
                              borderRadius: 9999,
                              background: 'var(--color-soft-pink)',
                              color: 'var(--color-primary)',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing / Loading indicator */}
              {isLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--color-card)',
                    padding: '12px 16px',
                    borderRadius: 16,
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.82rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Sparkles size={16} color="var(--color-primary)" className="animate-spin" />
                  <span>Thinking & verifying safety guidelines…</span>
                </div>
              )}

              {/* Retry button if network failure occurred */}
              {lastFailedQuery && (
                <div style={{ alignSelf: 'center', margin: '4px 0' }}>
                  <button
                    onClick={() => handleSend(lastFailedQuery)}
                    style={{
                      background: 'var(--color-card)',
                      border: '1.5px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderRadius: 10,
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={14} /> Retry: "{lastFailedQuery.slice(0, 30)}..."
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Query Chips */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Common questions you can ask:
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  scrollbarWidth: 'none',
                }}
              >
                {SUGGESTED_QUERIES.map((query, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(query)}
                    disabled={isLoading}
                    style={{
                      whiteSpace: 'nowrap',
                      fontSize: '0.76rem',
                      padding: '6px 12px',
                      borderRadius: 9999,
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-main)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-main)';
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Send Form */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder="Ask in English, हिंदी, or Hinglish (e.g. 'Manager harass kare toh?')..."
                id="chat-input"
                style={{
                  flex: 1,
                  fontSize: '0.9rem',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-main)',
                }}
              />

              {/* Speech-to-text mic button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                style={{
                  background: isListening ? '#D92D35' : 'var(--color-bg-secondary)',
                  color: isListening ? '#FFFFFF' : 'var(--color-text-main)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isListening ? 'Listening... click to stop' : 'Click to speak (Voice input)'}
                aria-label="Voice input"
              >
                <Mic size={18} />
              </button>

              <button
                onClick={() => handleSend()}
                disabled={isLoading || !chatInput.trim()}
                className="btn btn-primary"
                id="chat-send-btn"
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isLoading || !chatInput.trim() ? 0.6 : 1,
                  cursor: isLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
              🔒 <strong>Confidentiality Note:</strong> Conversations are not shared with employers. For binding formal legal representation, consult a qualified advocate or the National Legal Services Authority (**15100**).
            </p>
          </section>

          {/* Right Column: Verified Emergency Helplines & Support Directory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Nearby Help / National Helplines Card */}
            <section
              id="nearby"
              className="card"
              style={{
                borderRadius: 20,
                padding: 24,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--color-soft-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <MapPin size={19} />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--color-text-main)' }}>
                  Verified National Helplines
                </h2>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.55 }}>
                Directly connect to 24/7 toll-free emergency and legal-aid helplines across India:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'National Emergency (Police/Medical)', number: '112', desc: 'All Emergency Services' },
                  { name: 'National Women Helpline', number: '181', desc: '24/7 Toll-Free Support' },
                  { name: 'Women in Distress (Police Special Cell)', number: '1091', desc: 'Immediate Police Assistance' },
                  { name: 'National Commission for Women (NCW)', number: '7827170170', desc: 'Harassment & Complaints Cell' },
                  { name: 'Childline India (Minors below 18)', number: '1098', desc: 'Protection of Children' },
                  { name: 'National Cyber Crime Helpline', number: '1930', desc: 'Financial/Cyber Harassment' },
                  { name: 'Tele-MANAS (Mental Health Support)', number: '14416', desc: '24/7 Emotional Counselling' },
                  { name: 'NALSA (National Legal Aid)', number: '15100', desc: 'Free Statutory Legal Counsel' },
                ].map((h) => (
                  <div
                    key={h.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-text-main)', margin: '0 0 2px' }}>
                        {h.name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {h.desc}
                      </p>
                    </div>
                    <a
                      href={`tel:${h.number}`}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: 8,
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      aria-label={`Call ${h.name} at ${h.number}`}
                    >
                      <Phone size={13} /> {h.number}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Proof Vault Quick Access */}
            <div
              style={{
                borderRadius: 18,
                padding: '20px 22px',
                background: 'var(--color-pale-pink)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <CheckCircle2 size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Encrypted Proof Vault
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                Store screenshots, voice notes, and incident records safely before formal filing. Uses browser-side AES-256 zero-knowledge encryption.
              </p>
              <a
                href="/vault"
                className="btn btn-sm"
                style={{
                  background: 'var(--color-card)',
                  color: 'var(--color-primary)',
                  border: '1.5px solid var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '7px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Open Proof Vault ↗
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section style={{ marginTop: 48 }} aria-label="Frequently Asked Questions">
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 20, color: 'var(--color-text-main)' }}>
            Frequently Asked Questions
          </h2>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </section>

        {/* Voice Note Info Box */}
        <div
          style={{
            marginTop: 32,
            padding: '20px 24px',
            borderRadius: 16,
            background: 'rgba(124, 58, 237, 0.06)',
            border: '1.5px solid rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Mic size={24} color="#7C3AED" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--color-text-main)' }}>Voice & Multilingual Input Support</p>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              You can dictate inquiries in both Hindi and English using the microphone button in the Safety Assistant or when filing formal complaints on the Report page. Always verify dictated transcriptions before submission.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .safety-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
