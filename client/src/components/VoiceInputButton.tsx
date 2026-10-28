import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Square, RotateCcw, Globe, Info, AlertCircle, Check, X
} from 'lucide-react';

// ─── Web Speech API TypeScript Definitions ───────────────────────────────────
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export interface VoiceInputButtonProps {
  /** Current text value of the target field */
  value: string;
  /** Callback fired when text changes via speech recognition */
  onChange: (newValue: string) => void;
  /** Descriptive name of the field for accessibility & labels */
  fieldName?: string;
  /** Default language code (e.g., 'en-IN' or 'hi-IN') */
  defaultLanguage?: string;
  /** Append mode ('append' adds space and text; 'replace' replaces entire text) */
  defaultAppendMode?: 'append' | 'replace';
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Compact mode (renders just the mic button with dropdown, ideal for small inputs) */
  compact?: boolean;
  /** Optional custom CSS class */
  className?: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)', native: 'English (India)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', native: 'हिन्दी (भारत)' },
  { code: 'hinglish', label: 'Hinglish (Mixed)', native: 'Hinglish (English/Hindi)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', native: 'मराठी (भारत)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', native: 'ગુજરાતી' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', native: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', native: 'తెలుగు' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', native: 'বাংলা' },
];

export default function VoiceInputButton({
  value,
  onChange,
  fieldName = 'description',
  defaultLanguage = 'en-IN',
  defaultAppendMode = 'append',
  disabled = false,
  size = 'md',
  compact = false,
  className = '',
}: VoiceInputButtonProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [appendMode, setAppendMode] = useState<'append' | 'replace'>(defaultAppendMode);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  // Snapshot of text before recording started for single-click Undo
  const previousValueRef = useRef<string>(value);
  const [canUndo, setCanUndo] = useState<boolean>(false);

  // Recognition instance ref
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Keep latest value in ref for accurate result appending without stale closures
  const valueRef = useRef<string>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Check browser Web Speech API availability on mount
  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount: ensure microphone is released
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const handleStop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [isListening]);

  const handleStart = useCallback(() => {
    if (disabled) return;
    setErrorMessage('');
    setSuccessNotice('');

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setIsSupported(false);
      setErrorMessage('Voice input is not supported in this browser. You can still type your report.');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      // Save snapshot for Undo
      previousValueRef.current = valueRef.current;
      setCanUndo(false);

      const recognition = new SpeechAPI();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Hinglish uses en-IN acoustic engine as recommended for Romanized/mixed vocabulary
      const recognitionLang = selectedLanguage === 'hinglish' ? 'en-IN' : selectedLanguage;
      recognition.lang = recognitionLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        setInterimTranscript(interimChunk);

        if (finalChunk.trim()) {
          const trimmedFinal = finalChunk.trim();
          let nextValue = '';
          const currentText = valueRef.current;

          if (appendMode === 'replace') {
            nextValue = trimmedFinal;
          } else {
            nextValue = currentText ? `${currentText.trim()} ${trimmedFinal}` : trimmedFinal;
          }

          onChange(nextValue);
          setCanUndo(true);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setInterimTranscript('');

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage('Microphone access denied. Please click the lock or camera/mic icon in your browser URL bar to allow microphone access.');
            break;
          case 'no-speech':
            setErrorMessage('No speech was detected. Please speak closer to your microphone and try again.');
            break;
          case 'network':
            setErrorMessage('Network connection lost during speech recognition. Please check your connection or continue typing.');
            break;
          case 'audio-capture':
            setErrorMessage('No microphone found on this device. Please connect a microphone or type your report.');
            break;
          case 'aborted':
            // user stopped intentionally
            break;
          default:
            setErrorMessage(`Speech recognition error (${event.error}). You can retry or type your report.`);
            break;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        if (valueRef.current !== previousValueRef.current) {
          setSuccessNotice('Voice input captured. Review or edit the text before continuing.');
          setTimeout(() => setSuccessNotice(''), 4500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage(err?.message || 'Unable to start speech recognition. You can continue typing.');
    }
  }, [disabled, selectedLanguage, appendMode, onChange]);

  const handleToggle = () => {
    if (isListening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const handleUndo = () => {
    onChange(previousValueRef.current);
    setCanUndo(false);
    setSuccessNotice('Restored previous text.');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`voice-input-container ${className}`} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column' }}>
      {/* ─── Main Voice Action Bar ─── */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Primary Mic / Stop Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || !isSupported}
          aria-label={
            isListening
              ? `Stop voice input for ${fieldName}`
              : `Start voice input for ${fieldName} (${currentLangMeta.label})`
          }
          title={
            !isSupported
              ? 'Voice input is not supported in this browser. You can still type.'
              : isListening
              ? 'Click to stop recording'
              : `Click to speak your ${fieldName}`
          }
          className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: size === 'sm' ? '4px 10px' : '6px 12px',
            fontSize: size === 'sm' ? '0.74rem' : '0.8rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            background: isListening ? 'var(--color-emergency)' : undefined,
            color: isListening ? '#ffffff' : 'var(--color-primary)',
            borderColor: isListening ? 'var(--color-emergency)' : 'rgba(194, 24, 91, 0.3)',
            boxShadow: isListening ? '0 0 12px rgba(217, 45, 53, 0.45)' : undefined,
            transition: 'all 0.2s ease',
            cursor: disabled || !isSupported ? 'not-allowed' : 'pointer',
          }}
        >
          {isListening ? (
            <>
              <Square size={size === 'sm' ? 12 : 14} fill="currentColor" />
              <span>Stop Speaking</span>
              {/* Subtle Pulsing Recording Ring */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'inline-block',
                  animation: 'pulse 1.2s infinite ease-in-out',
                }}
              />
            </>
          ) : (
            <>
              {isSupported ? (
                <Mic size={size === 'sm' ? 13 : 15} color="var(--color-primary)" />
              ) : (
                <MicOff size={size === 'sm' ? 13 : 15} color="var(--color-text-secondary)" />
              )}
              <span>{isSupported ? 'Speak' : 'Voice Unavailable'}</span>
            </>
          )}
        </button>

        {/* Language Selector Toggle */}
        {isSupported && !compact && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              disabled={disabled || isListening}
              aria-label="Select speech recognition language"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: size === 'sm' ? '4px 8px' : '6px 10px',
                fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-main)',
              }}
            >
              <Globe size={13} color="var(--color-primary)" />
              <span>{currentLangMeta.code === 'hinglish' ? 'Hinglish' : currentLangMeta.code.slice(0, 2).toUpperCase()}</span>
            </button>

            {/* Language Dropdown Menu */}
            {showLangMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 6,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: 6,
                  zIndex: 200,
                  minWidth: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', padding: '4px 8px' }}>
                  Recognition Language
                </div>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '6px 10px',
                      background: selectedLanguage === lang.code ? 'var(--color-soft-pink)' : 'transparent',
                      color: selectedLanguage === lang.code ? 'var(--color-primary)' : 'var(--color-text-main)',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: selectedLanguage === lang.code ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{lang.label}</span>
                    {selectedLanguage === lang.code && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Append vs Replace Toggle (Only on non-compact) */}
        {!compact && (
          <button
            type="button"
            onClick={() => setAppendMode(appendMode === 'append' ? 'replace' : 'append')}
            disabled={disabled || isListening}
            title={appendMode === 'append' ? 'Currently appending to existing text. Click to switch to replace mode.' : 'Currently replacing existing text. Click to switch to append mode.'}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: size === 'sm' ? '3px 8px' : '4px 9px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Mode: <strong style={{ color: 'var(--color-primary)' }}>{appendMode === 'append' ? 'Append' : 'Replace'}</strong>
          </button>
        )}

        {/* Undo Button (appears when speech input modified text) */}
        {canUndo && !isListening && (
          <button
            type="button"
            onClick={handleUndo}
            title="Undo last voice input and restore prior text"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: size === 'sm' ? '3px 8px' : '4px 10px',
              fontSize: '0.72rem',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <RotateCcw size={12} /> Undo Voice
          </button>
        )}

        {/* Privacy Info Trigger */}
        <button
          type="button"
          onClick={() => setShowPrivacyModal(true)}
          title="Voice privacy and browser processing notice"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: 3,
            display: 'inline-flex',
            alignItems: 'center',
          }}
          aria-label="View voice privacy and speech processing notice"
        >
          <Info size={14} />
        </button>
      </div>

      {/* ─── Live Listening Indicator & Interim Transcript Preview ─── */}
      {isListening && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 8,
            padding: '8px 12px',
            background: 'rgba(194, 24, 91, 0.08)',
            border: '1px solid rgba(194, 24, 91, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.8rem',
            color: 'var(--color-primary-dark)',
          }}
        >
          {/* Animated sound wave bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
            <span style={{ width: 3, height: '100%', background: 'var(--color-primary)', borderRadius: 2, animation: 'soundwave 0.8s infinite ease-in-out' }} />
            <span style={{ width: 3, height: '60%', background: 'var(--color-primary)', borderRadius: 2, animation: 'soundwave 0.6s infinite ease-in-out 0.2s' }} />
            <span style={{ width: 3, height: '85%', background: 'var(--color-primary)', borderRadius: 2, animation: 'soundwave 0.9s infinite ease-in-out 0.4s' }} />
          </div>

          <div style={{ flex: 1 }}>
            <strong>Listening ({currentLangMeta.label})…</strong>{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--color-text-main)' }}>
              {interimTranscript || 'Speak clearly into your microphone…'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleStop}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
          >
            Done
          </button>
        </div>
      )}

      {/* ─── Error Notification ─── */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: 6,
            padding: '8px 12px',
            background: 'rgba(217, 45, 53, 0.08)',
            border: '1px solid rgba(217, 45, 53, 0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem',
            color: 'var(--color-emergency)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} flex-shrink="0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            style={{ background: 'none', border: 'none', color: 'var(--color-emergency)', cursor: 'pointer', padding: 2 }}
            aria-label="Dismiss error"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ─── Success Confirmation Notice ─── */}
      {successNotice && !errorMessage && !isListening && (
        <div
          role="status"
          style={{
            marginTop: 6,
            fontSize: '0.76rem',
            color: 'var(--color-success)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Check size={12} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ─── Privacy & Browser Processing Notice Modal ─── */}
      {showPrivacyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 24,
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mic size={18} color="var(--color-primary)" /> Voice Input & Privacy
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0 }}>
                • <strong>Optional Feature:</strong> Voice-to-text is entirely voluntary. You can always type your complaint manually.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Browser Speech Processing:</strong> Recognition is handled locally or via your browser's configured speech service (e.g., Google Web Speech in Chrome).
              </p>
              <p style={{ margin: 0 }}>
                • <strong>No Audio Storage on Suraksha Setu:</strong> Suraksha Setu does not record, retain, or upload raw voice audio files to its backend servers.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Full Complainant Control:</strong> Recognized words are inserted directly into the editable text box. You can freely review, edit, append, or delete any text before submitting your report.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>No Credibility Inference:</strong> Voice input is purely a typing convenience. It is never used to infer tone, emotional distress, or complaint credibility.
              </p>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPrivacyModal(false)}
                style={{ padding: '6px 16px' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
