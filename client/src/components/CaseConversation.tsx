import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  Send, Paperclip, Shield, Lock, CheckCircle2, FileText,
  RefreshCw, AlertCircle, X, Clock, Download
} from 'lucide-react';
import {
  getConversation,
  sendConversationMessage,
  markConversationRead,
  uploadConversationAttachment,
  requestConversationEvidence,
  updateConversationStatus as apiUpdateStatus,
  type ConversationItem,
  type MessageItem,
  type MessageAttachment
} from '../services/api';

interface CaseConversationProps {
  caseId: string;
  isStaffMode?: boolean;
  complainantToken?: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function CaseConversation({
  caseId,
  isStaffMode = false,
  complainantToken,
  onStatusChange,
}: CaseConversationProps) {
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Composer states
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);

  // Evidence request modal for staff
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceInstructions, setEvidenceInstructions] = useState('');
  const [requestingEvidence, setRequestingEvidence] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── SCROLL TO BOTTOM ───────────────────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── FETCH CONVERSATION ────────────────────────────────────────────────────
  const loadConversation = async (isBackground = false) => {
    if (!caseId) return;
    if (!isBackground) setRefreshing(true);

    try {
      const data = await getConversation(caseId, complainantToken);
      if (data?.success) {
        setConversation(data.conversation);
        setMessages(data.messages || []);
        setError(null);

        // Mark as read if unread count > 0
        const unreadCount = isStaffMode
          ? data.conversation.unreadStaffCount
          : data.conversation.unreadComplainantCount;

        if (unreadCount > 0) {
          markConversationRead(caseId, complainantToken).catch(() => {});
        }
      }
    } catch (err: any) {
      if (!isBackground) {
        setError(err.response?.data?.message || 'Unable to load conversation messages.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversation();
  }, [caseId, complainantToken]);

  // Periodic polling every 5 seconds for real-time conversation updates
  useEffect(() => {
    if (!caseId) return;
    const interval = setInterval(() => {
      loadConversation(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [caseId, complainantToken]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // ─── SEND MESSAGE HANDLER ──────────────────────────────────────────────────
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const cleanContent = inputMessage.trim();
    if ((!cleanContent && pendingAttachments.length === 0) || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await sendConversationMessage(
        caseId,
        cleanContent,
        pendingAttachments.length > 0 ? 'evidence_submission' : 'text',
        pendingAttachments,
        complainantToken
      );

      if (res?.success) {
        setMessages(prev => [...prev, res.message]);
        setInputMessage('');
        setPendingAttachments([]);
        scrollToBottom();
        // Refresh conversation state
        loadConversation(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  // ─── ATTACHMENT UPLOAD HANDLER ─────────────────────────────────────────────
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected file exceeds maximum limit of 10MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await uploadConversationAttachment(caseId, file, complainantToken);
      if (res?.success && res.attachment) {
        setPendingAttachments(prev => [...prev, res.attachment]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove pending attachment
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // ─── STAFF: REQUEST EVIDENCE ───────────────────────────────────────────────
  const handleRequestEvidenceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!evidenceInstructions.trim() || requestingEvidence) return;

    setRequestingEvidence(true);
    setError(null);

    try {
      const res = await requestConversationEvidence(caseId, evidenceInstructions.trim());
      if (res?.success) {
        setShowEvidenceModal(false);
        setEvidenceInstructions('');
        loadConversation();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch evidence request.');
    } finally {
      setRequestingEvidence(false);
    }
  };

  // ─── STAFF: UPDATE STATUS ──────────────────────────────────────────────────
  const handleStatusChange = async (newStatus: string) => {
    if (!newStatus || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await apiUpdateStatus(caseId, newStatus);
      if (res?.success) {
        if (onStatusChange) onStatusChange(newStatus);
        loadConversation();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update conversation status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
        <p style={{ fontSize: '0.9rem', margin: 0 }}>Connecting to secure communication channel...</p>
      </div>
    );
  }

  const isClosed = conversation?.status === 'closed' || conversation?.status === 'archived';

  return (
    <div
      className="case-conversation-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 520,
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--color-text-main)' }}>
                {caseId}
              </span>
              {conversation?.isAnonymous && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(194, 24, 91, 0.1)',
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Lock size={10} /> Anonymous Case Channel
                </span>
              )}
              {conversation?.priority && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background:
                      conversation.priority === 'HIGH'
                        ? 'rgba(217, 45, 53, 0.12)'
                        : conversation.priority === 'MEDIUM'
                        ? 'rgba(217, 119, 6, 0.12)'
                        : 'rgba(22, 133, 107, 0.12)',
                    color:
                      conversation.priority === 'HIGH'
                        ? '#D92D35'
                        : conversation.priority === 'MEDIUM'
                        ? '#D97706'
                        : '#16856B',
                  }}
                >
                  {conversation.priority} PRIORITY
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
              {isStaffMode ? (
                <>Complainant Pseudonym: <strong>{conversation?.complainantPseudonym}</strong> | Identity strictly shielded</>
              ) : (
                <>Assigned Support: <strong>{conversation?.assignedStaffName || 'Internal Committee Officer'}</strong></>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isStaffMode && (
            <>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.76rem', padding: '6px 10px' }}
                title="Request additional evidence or document clarification"
              >
                <FileText size={13} /> Request Evidence
              </button>

              <select
                value={conversation?.status || 'active'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                style={{
                  fontSize: '0.76rem',
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-card)',
                  color: 'var(--color-text-main)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="active">Status: Active</option>
                <option value="awaiting_complainant">Status: Awaiting Complainant</option>
                <option value="awaiting_staff">Status: Awaiting Staff</option>
                <option value="evidence_requested">Status: Evidence Requested</option>
                <option value="closed">Status: Concluded / Closed</option>
                <option value="archived">Status: Archived</option>
              </select>
            </>
          )}

          <button
            type="button"
            onClick={() => loadConversation()}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px' }}
            title="Refresh messages"
          >
            <RefreshCw size={13} className={refreshing ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* Evidence Requested Notification Banner */}
      {conversation?.evidenceRequested && !isClosed && (
        <div
          style={{
            padding: '10px 18px',
            background: 'rgba(217, 119, 6, 0.08)',
            borderBottom: '1px solid rgba(217, 119, 6, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.82rem',
            color: '#B45309',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>Evidence Requested:</strong> The committee has requested additional supporting documents or incident clarification.
            </span>
          </div>
          {!isStaffMode && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm"
              style={{
                background: '#D97706',
                color: '#FFFFFF',
                padding: '4px 10px',
                fontSize: '0.74rem',
                border: 'none',
              }}
            >
              Upload Evidence Now
            </button>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(217, 45, 53, 0.08)',
            borderBottom: '1px solid rgba(217, 45, 53, 0.25)',
            color: 'var(--color-emergency)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── MESSAGES STREAM ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--color-bg)',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              padding: '36px 20px',
              maxWidth: 420,
              color: 'var(--color-text-secondary)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-soft-pink)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Lock size={22} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 700 }}>
              Secure Case Communication
            </h4>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
              {isStaffMode
                ? 'No messages on this case yet. You can send an initial acknowledgment, case update, or request evidence below.'
                : 'Your identity is strictly protected. You can securely message your assigned inquiry committee, provide additional statements, or upload evidence without disclosing your personal details.'}
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.isOwnMessage;
            const isSystem = msg.senderType === 'system';
            const isEvidenceReq = msg.messageType === 'evidence_request';

            if (isSystem) {
              return (
                <div
                  key={msg._id}
                  style={{
                    textAlign: 'center',
                    margin: '8px 0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Clock size={11} /> {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                }}
              >
                {/* Sender label & Timestamp */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                    fontSize: '0.72rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: isOwn ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                    {msg.senderDisplayName}
                  </span>
                  <span>|</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.isRead && isOwn && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--color-success)', marginLeft: 2 }}>
                      <CheckCircle2 size={11} /> Read
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    borderBottomRightRadius: isOwn ? 3 : 14,
                    borderBottomLeftRadius: !isOwn ? 3 : 14,
                    background: isEvidenceReq
                      ? 'rgba(217, 119, 6, 0.1)'
                      : isOwn
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                      : 'var(--color-card)',
                    color: isEvidenceReq
                      ? '#92400E'
                      : isOwn
                      ? '#FFFFFF'
                      : 'var(--color-text-main)',
                    border: isEvidenceReq
                      ? '1px solid rgba(217, 119, 6, 0.3)'
                      : isOwn
                      ? 'none'
                      : '1px solid var(--color-border)',
                    boxShadow: isOwn
                      ? '0 2px 8px rgba(194, 24, 91, 0.2)'
                      : 'var(--shadow-sm)',
                    wordBreak: 'break-word',
                  }}
                >
                  {isEvidenceReq && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: '0.76rem', marginBottom: 4 }}>
                      <FileText size={13} /> Official Evidence / Clarification Request
                    </div>
                  )}

                  <div style={{ fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Attachments inside message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.attachments.map((att, attIdx) => (
                        <a
                          key={attIdx}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: isOwn ? 'rgba(255, 255, 255, 0.18)' : 'var(--color-bg-secondary)',
                            color: isOwn ? '#FFFFFF' : 'var(--color-text-main)',
                            textDecoration: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            border: isOwn ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--color-border)',
                          }}
                        >
                          <Paperclip size={13} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {att.originalName}
                          </span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            ({Math.round(att.sizeBytes / 1024)} KB)
                          </span>
                          <Download size={12} style={{ marginLeft: 'auto' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── PENDING ATTACHMENTS PREVIEW ─────────────────────────────────────── */}
      {pendingAttachments.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--color-bg-secondary)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                fontSize: '0.75rem',
                color: 'var(--color-text-main)',
              }}
            >
              <Paperclip size={12} color="var(--color-primary)" />
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.originalName}
              </span>
              <button
                type="button"
                onClick={() => removePendingAttachment(idx)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── COMPOSER BAR ────────────────────────────────────────────────────── */}
      {isClosed ? (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-secondary)',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '0.84rem',
          }}
        >
          <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          This case conversation is closed. New messages cannot be sent.
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          {/* File attachment input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.mp3,.wav"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              flexShrink: 0,
            }}
            title="Attach evidence document or image (Max 10MB)"
          >
            <Paperclip size={17} className={uploading ? 'spin-animation' : ''} />
          </button>

          {/* Text input area */}
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSendMessage(e);
              }
            }}
            placeholder={
              isStaffMode
                ? 'Type confidential reply to complainant... (Ctrl+Enter to send)'
                : 'Type your message to the committee... (Ctrl+Enter to send)'
            }
            rows={2}
            style={{
              flex: 1,
              minWidth: 0,
              resize: 'none',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-main)',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              outline: 'none',
            }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || (!inputMessage.trim() && pendingAttachments.length === 0)}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>
      )}

      {/* ─── MODAL: STAFF EVIDENCE REQUEST ──────────────────────────────────── */}
      {showEvidenceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: 'clamp(16px, 4vw, 24px)',
              maxWidth: 'min(520px, 95vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  Request Additional Evidence
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Provide clear guidance to the complainant specifying what documentation, digital records, or statements the committee requires for proceeding with the inquiry.
            </p>

            <form onSubmit={handleRequestEvidenceSubmit}>
              <textarea
                value={evidenceInstructions}
                onChange={(e) => setEvidenceInstructions(e.target.value)}
                placeholder="Example: Please provide email communication logs, meeting invitation records, or relevant digital correspondence between June 10 and June 15."
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  marginBottom: 16,
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingEvidence || !evidenceInstructions.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {requestingEvidence ? 'Dispatching...' : 'Dispatch Evidence Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
