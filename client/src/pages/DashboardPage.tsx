import { useState, useEffect, Fragment } from 'react';
import {
  LayoutDashboard, FileText, Clock, CheckCircle, AlertCircle, RefreshCw,
  ShieldAlert, ShieldCheck, Scale, History, AlertTriangle, ChevronDown, ChevronUp, Eye,
  ExternalLink, Phone, MessageSquare, Check, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { api as axios } from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  under_review: 'Under Review',
  additional_info_required: 'Additional Info',
  decision_recorded: 'Decision Recorded',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: '#6B7280',
  acknowledged: '#3B82F6',
  under_review: '#B7791F',
  additional_info_required: '#8B5CF6',
  decision_recorded: '#C2185B',
  closed: '#16856B',
};

const PRIORITY_CONFIG: Record<string, { label: string; desc: string; bg: string; color: string; border: string }> = {
  HIGH: {
    label: 'HIGH',
    desc: 'Urgent review recommended',
    bg: 'rgba(217, 45, 53, 0.12)',
    color: '#D92D35',
    border: 'rgba(217, 45, 53, 0.4)',
  },
  MEDIUM: {
    label: 'MEDIUM',
    desc: 'Prompt review recommended',
    bg: 'rgba(217, 119, 6, 0.12)',
    color: '#D97706',
    border: 'rgba(217, 119, 6, 0.4)',
  },
  LOW: {
    label: 'LOW',
    desc: 'Standard informational workflow',
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#2563EB',
    border: 'rgba(59, 130, 246, 0.3)',
  },
};

const VERIFICATION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CLEAR: { label: 'Clear', bg: 'rgba(22, 133, 107, 0.12)', color: '#16856B' },
  NOT_CHECKED: { label: 'Not Checked', bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280' },
  NEEDS_REVIEW: { label: 'Needs Review', bg: 'rgba(217, 119, 6, 0.12)', color: '#D97706' },
  POSSIBLE_DUPLICATE: { label: 'Possible Duplicate', bg: 'rgba(217, 119, 6, 0.16)', color: '#B45309' },
  EVIDENCE_INTEGRITY_CHECK_FAILED: { label: 'Integrity Mismatch', bg: 'rgba(217, 45, 53, 0.16)', color: '#D92D35' },
  SPAM_SUSPECTED: { label: 'Spam Suspected', bg: 'rgba(217, 45, 53, 0.12)', color: '#D92D35' },
  CLARIFICATION_REQUIRED: { label: 'Clarification Required', bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED' },
};

interface VerificationFlag {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  matchedCaseId?: string;
  detectedAt: string;
  resolved: boolean;
  resolutionNote?: string;
}

interface LegalResource {
  frameworkId: string;
  title: string;
  statute: string;
  rationale: string;
  relevanceScore: number;
  keyProvisions: string[];
  officialSource?: string;
}

interface PotentiallyRelevantFramework {
  actName: string;
  shortName: string;
  candidateSections?: string[];
  candidateProvisions?: Array<{
    section: string;
    title: string;
    summary: string;
    officialSource?: string;
  }>;
  supportingReportedFacts?: string[];
  elementsToVerify?: string[];
  reason?: string;
  applicabilityStatus?: string;
  reviewNote?: string;
  officialSources?: Array<string | { title: string; url: string }>;
}

interface AuditEntry {
  action: string;
  originalPriority?: string;
  newPriority?: string;
  reason: string;
  reviewerName?: string;
  reviewerRole?: string;
  timestamp: string;
}

interface EvidenceItem {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  sha256Hash?: string;
  integrityStatus?: string;
  lastVerifiedAt?: string;
}

interface CaseItem {
  _id: string;
  caseId: string;
  incidentCategory: string;
  status: string;
  isUrgent: boolean;
  createdAt: string;
  isAnonymous: boolean;
  description?: string;
  supportRequired?: string[];
  classification?: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    priorityReasons: string[];
    recommendedActions: string[];
    classificationMethod: string;
    ruleVersion?: string;
    modelVersion?: string;
    isDemoModel?: boolean;
    reviewStatus: string;
    currentEmergency?: string;
    safetyFlags?: string[];
    mlConfidence?: number;
    classifiedAt?: string;
  };
  escalation?: {
    internalReviewRequired?: boolean;
    internalReviewStatus?: string;
    internalNotificationStatus?: string;
    externalReportingStatus?: string;
    emergencyGuidance?: string;
    safeguardingPathway?: string;
  };
  verification?: {
    status: string;
    similarityScore?: number;
    matchedCaseId?: string;
    flags: VerificationFlag[];
  };
  legalAdvisory?: {
    incidentCategory?: {
      label: string;
      explanation: string;
    };
    potentiallyRelevantFrameworks?: PotentiallyRelevantFramework[];
    applicableResources?: LegalResource[];
    disclaimer: string;
    knowledgeBaseVersion?: string;
  };
  auditHistory?: AuditEntry[];
  evidence?: EvidenceItem[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  // Expand case drawer
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Override priority modal state
  const [overrideTargetCase, setOverrideTargetCase] = useState<CaseItem | null>(null);
  const [overridePriorityChoice, setOverridePriorityChoice] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  // Evidence verification state
  const [verifyingEvidenceId, setVerifyingEvidenceId] = useState<string | null>(null);

  // Clarification request modal state
  const [clarificationTargetCase, setClarificationTargetCase] = useState<CaseItem | null>(null);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);
  const [clarificationError, setClarificationError] = useState('');

  const fetchCases = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;
      const res = await axios.get('/api/cases', { params, withCredentials: true });
      setCases(res.data.cases);
      setTotal(res.data.total);
    } catch {
      setCases([]);
      setFetchError('Service is currently unavailable. Backend connection offline.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchCases();
    }
  }, [loading, user, statusFilter, priorityFilter, verificationFilter]);

  if (!loading && !user) return <Navigate to="/staff-login" replace />;

  const handleUpdateStatus = async (caseId: string) => {
    if (!newStatus) return;
    setUpdatingStatus(caseId);
    try {
      await axios.patch(`/api/cases/${caseId}/status`, {
        status: newStatus,
        message: statusNote || `Status updated to ${newStatus}`,
      }, { withCredentials: true });
      setUpdatingStatus(null);
      setNewStatus('');
      setStatusNote('');
      fetchCases();
    } catch {
      alert('Failed to update status');
      setUpdatingStatus(null);
    }
  };

  const handleOverridePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTargetCase) return;
    if (!overrideReason || overrideReason.trim().length < 10) {
      setOverrideError('A detailed justification reason (minimum 10 characters) is required to override priority.');
      return;
    }
    setOverrideSubmitting(true);
    setOverrideError('');
    try {
      await axios.patch(`/api/cases/${overrideTargetCase.caseId}/priority`, {
        newPriority: overridePriorityChoice,
        reason: overrideReason.trim(),
      }, { withCredentials: true });

      setOverrideTargetCase(null);
      setOverrideReason('');
      fetchCases();
    } catch (err: any) {
      setOverrideError(err?.response?.data?.message || 'Failed to override priority');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleMarkUrgentReview = async (caseItem: CaseItem) => {
    if (!window.confirm(`Escalate Case ${caseItem.caseId} to HIGH priority for urgent human review?`)) return;
    try {
      await axios.patch(`/api/cases/${caseItem.caseId}/priority`, {
        newPriority: 'HIGH',
        reason: 'Reviewer escalated case to urgent priority for immediate safety and committee review.',
      }, { withCredentials: true });
      fetchCases();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to mark for urgent review');
    }
  };

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationTargetCase || clarificationMessage.trim().length < 10) {
      setClarificationError('Clarification request message (minimum 10 characters) is required.');
      return;
    }
    setClarificationSubmitting(true);
    setClarificationError('');
    try {
      await axios.post(`/api/cases/${clarificationTargetCase.caseId}/clarification`, {
        message: clarificationMessage.trim(),
      }, { withCredentials: true });
      setClarificationTargetCase(null);
      setClarificationMessage('');
      fetchCases();
    } catch (err: any) {
      setClarificationError(err?.response?.data?.message || 'Failed to submit clarification request');
    } finally {
      setClarificationSubmitting(false);
    }
  };

  const handleReviewLegalRecommendation = async (caseId: string, frameworkIndex: number, action: 'CONFIRMED_RELEVANT' | 'MARK_NOT_RELEVANT') => {
    const promptReason = window.prompt(action === 'MARK_NOT_RELEVANT'
      ? 'Enter mandatory reason why this statutory recommendation is not relevant for audit record:'
      : 'Enter optional review note for confirming this statutory provision:');
    if (promptReason === null) return;
    try {
      await axios.patch(`/api/cases/${caseId}/legal-review`, {
        frameworkIndex,
        action: action === 'MARK_NOT_RELEVANT' ? 'MARK_NOT_RELEVANT' : 'ACCEPT',
        note: promptReason || (action === 'MARK_NOT_RELEVANT' ? 'Dismissed upon reviewer evaluation' : 'Confirmed relevant for statutory review'),
      }, { withCredentials: true });
      fetchCases();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update legal recommendation review');
    }
  };

  const handleVerifyEvidence = async (evidenceId: string) => {
    setVerifyingEvidenceId(evidenceId);
    try {
      const res = await axios.get(`/api/evidence/${evidenceId}/verify`, { withCredentials: true });
      alert(res.data.verified
        ? '✓ Cryptographic SHA-256 Checksum Verified: File content matches registration digest.'
        : '⚠️ CHECKSUM MISMATCH: Stored file does not match recorded SHA-256 hash.');
      fetchCases();
    } catch {
      alert('Failed to verify evidence file integrity.');
    } finally {
      setVerifyingEvidenceId(null);
    }
  };

  const handleResolveFlag = async (caseId: string, flagIndex: number) => {
    const note = window.prompt('Enter resolution note for this verification flag:');
    if (note === null) return;
    try {
      await axios.patch(`/api/cases/${caseId}/verification-flag`, {
        flagIndex,
        resolutionNote: note || 'Resolved by reviewer',
      }, { withCredentials: true });
      fetchCases();
    } catch {
      alert('Failed to resolve flag');
    }
  };

  const stats = {
    total,
    high: cases.filter(c => c.classification?.priority === 'HIGH' || c.isUrgent).length,
    medium: cases.filter(c => c.classification?.priority === 'MEDIUM').length,
    low: cases.filter(c => c.classification?.priority === 'LOW').length,
    duplicateReview: cases.filter(c => c.verification?.status === 'POSSIBLE_DUPLICATE' || c.verification?.status === 'NEEDS_REVIEW').length,
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '32px 0 60px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutDashboard size={24} color="var(--color-primary)" />
              Authorized Staff Triage Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Welcome, <strong>{user?.name}</strong> · Role: <span style={{ textTransform: 'capitalize' }}>{user?.role}</span> · Explainable Safety Triage & Integrity Verification
            </p>
          </div>
          <button onClick={fetchCases} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>

        {/* Top Triage Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Reports', value: stats.total, icon: FileText, color: 'var(--color-primary)' },
            { label: 'HIGH (Urgent)', value: stats.high, icon: ShieldAlert, color: '#D92D35' },
            { label: 'MEDIUM (Prompt)', value: stats.medium, icon: Clock, color: '#D97706' },
            { label: 'LOW (Standard)', value: stats.low, icon: CheckCircle, color: '#2563EB' },
            { label: 'Flagged for Review', value: stats.duplicateReview, icon: AlertTriangle, color: '#9333EA' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '18px 16px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${stat.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px',
              }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Priority:</label>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ minWidth: 140, padding: '6px 10px', fontSize: '0.84rem' }}
            >
              <option value="">All Priorities</option>
              <option value="HIGH">HIGH (Urgent)</option>
              <option value="MEDIUM">MEDIUM (Prompt)</option>
              <option value="LOW">LOW (Standard)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Status:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ minWidth: 160, padding: '6px 10px', fontSize: '0.84rem' }}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Verification:</label>
            <select
              className="form-select"
              value={verificationFilter}
              onChange={e => setVerificationFilter(e.target.value)}
              style={{ minWidth: 180, padding: '6px 10px', fontSize: '0.84rem' }}
            >
              <option value="">All Integrity Statuses</option>
              <option value="CLEAR">Clear</option>
              <option value="POSSIBLE_DUPLICATE">Possible Duplicate</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="EVIDENCE_INTEGRITY_CHECK_FAILED">Integrity Check Failed</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Case ID', 'Category', 'Safety Priority', 'Integrity Status', 'Workflow Status', 'Submitted', 'Review & Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--color-text-secondary)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading triage queue…</td></tr>
                ) : fetchError ? (
                  <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--color-emergency)', fontWeight: 600 }}>{fetchError}</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No matching reports found.</td></tr>
                ) : cases.map((c, i) => {
                  const priority = c.classification?.priority || (c.isUrgent ? 'HIGH' : 'MEDIUM');
                  const pConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
                  const vStatus = c.verification?.status || 'NOT_CHECKED';
                  const vConfig = VERIFICATION_CONFIG[vStatus] || VERIFICATION_CONFIG.NOT_CHECKED;
                  const isExpanded = expandedCaseId === c.caseId;

                  return (
                    <Fragment key={c._id}>
                      <tr style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: isExpanded ? 'var(--color-soft-pink)' : i % 2 === 0 ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                        transition: 'background 0.2s',
                      }}>
                        {/* Case ID */}
                        <td style={{ padding: '14px 16px' }}>
                          <code style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-primary)' }}>{c.caseId}</code>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {c.isAnonymous ? '🔒 Anonymous' : '👤 Identified'}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {c.incidentCategory.replace(/_/g, ' ')}
                        </td>

                        {/* Priority Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            gap: 2,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: pConfig.bg,
                            border: `1px solid ${pConfig.border}`,
                            color: pConfig.color,
                          }}>
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
                              {pConfig.label}
                            </span>
                            <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>
                              {pConfig.desc}
                            </span>
                          </span>
                        </td>

                        {/* Verification Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 9999,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: vConfig.bg,
                            color: vConfig.color,
                          }}>
                            {vConfig.label}
                          </span>
                        </td>

                        {/* Workflow Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: '0.76rem', fontWeight: 700,
                            color: STATUS_COLORS[c.status] || '#6B7280',
                            background: `${STATUS_COLORS[c.status] || '#6B7280'}18`,
                            padding: '3px 9px', borderRadius: 9999,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[c.status] || '#6B7280' }} />
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setExpandedCaseId(isExpanded ? null : c.caseId)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} />
                              {isExpanded ? 'Collapse' : 'Explain Triage'}
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setOverrideTargetCase(c);
                                setOverridePriorityChoice(priority);
                                setOverrideReason('');
                                setOverrideError('');
                              }}
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              Adjust Priority
                            </button>
                            {priority !== 'HIGH' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleMarkUrgentReview(c)}
                                title="Escalate to urgent priority for human review"
                                style={{ padding: '6px 10px', fontSize: '0.76rem', color: '#D92D35', borderColor: 'rgba(217, 45, 53, 0.4)' }}
                              >
                                Urgent Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ═════════════════════════════════════════════════════════
                          EXPANDED EXPLAINABILITY PANEL
                          ═════════════════════════════════════════════════════════ */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: '24px', background: 'var(--color-card)', borderBottom: '2px solid var(--color-border)' }}>
                            {/* Emergency & Safeguarding Banner */}
                            {priority === 'HIGH' && (
                              <div style={{
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(217, 45, 53, 0.1)',
                                border: '1px solid rgba(217, 45, 53, 0.3)',
                                marginBottom: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 10,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <ShieldAlert size={20} color="#D92D35" />
                                  <div style={{ fontSize: '0.84rem', color: '#D92D35', fontWeight: 700 }}>
                                    Urgent Human Review Required — Severe safety indicators or serious allegation reported.
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Phone size={14} color="#D92D35" />
                                  <span>Emergency Guidance: <strong>112</strong> (National Emergency) | <strong>181</strong> (Women Helpline)</span>
                                </div>
                              </div>
                            )}

                            {c.escalation?.safeguardingPathway === 'POCSO_STATUTORY_SAFEGUARDING_REVIEW' && (
                              <div style={{
                                padding: '10px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(147, 51, 234, 0.08)',
                                border: '1px solid rgba(147, 51, 234, 0.3)',
                                marginBottom: 18,
                                fontSize: '0.82rem',
                                color: '#7E22CE',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                                <AlertTriangle size={16} />
                                <span><strong>Child Safeguarding Pathway:</strong> Minor involved. POCSO Act, 2012 reporting protocol requires qualified legal review (Section 19). Identity protected.</span>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

                              {/* Card 1: Task A — Classification & Safety Triage Explainability */}
                              <div style={{
                                padding: '18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <ShieldCheck size={18} color="var(--color-primary)" />
                                    Task A: Safety Risk Priority
                                  </div>
                                  <span style={{
                                    fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: 4,
                                    background: pConfig.bg, color: pConfig.color, border: `1px solid ${pConfig.border}`,
                                  }}>
                                    {pConfig.label}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 12 }}>
                                  <div><strong>Classification Method:</strong> <code>{c.classification?.classificationMethod || 'DETERMINISTIC_SAFETY_RULE'}</code></div>
                                  <div><strong>Safety Rule Engine:</strong> v{c.classification?.ruleVersion || '2026.3'}</div>
                                  <div><strong>ML Model Artifact:</strong> {c.classification?.modelVersion || 'v2026.3-multilingual'}</div>
                                  <div><strong>Review Status:</strong> <code>{c.classification?.reviewStatus || 'PENDING_HUMAN_REVIEW'}</code></div>
                                  {c.classification?.mlConfidence !== undefined && (
                                    <div><strong>Calibrated ML Confidence:</strong> {(c.classification.mlConfidence * 100).toFixed(1)}%</div>
                                  )}
                                </div>

                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--color-text-main)' }}>Priority Reasons:</div>
                                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                    {(c.classification?.priorityReasons || ['Standard intake triage']).map((r, ri) => (
                                      <li key={ri}>{r}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--color-text-main)' }}>Reported Safety Indicators:</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: c.classification?.safetyFlags?.includes('SEVERE_SEXUAL_VIOLENCE_TRIGGER') ? 'rgba(217, 45, 53, 0.15)' : 'var(--color-card)', color: c.classification?.safetyFlags?.includes('SEVERE_SEXUAL_VIOLENCE_TRIGGER') ? '#D92D35' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                      Severe Sexual Violence: {c.classification?.safetyFlags?.includes('SEVERE_SEXUAL_VIOLENCE_TRIGGER') ? '⚠️ Alleged' : 'Not Detected'}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: c.classification?.safetyFlags?.includes('IMMEDIATE_DANGER_TRIGGER') ? 'rgba(217, 45, 53, 0.15)' : 'var(--color-card)', color: c.classification?.safetyFlags?.includes('IMMEDIATE_DANGER_TRIGGER') ? '#D92D35' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                      Immediate Danger: {c.classification?.safetyFlags?.includes('IMMEDIATE_DANGER_TRIGGER') ? '⚠️ Reported' : 'Not Reported'}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: c.classification?.safetyFlags?.includes('SELF_HARM_CRISIS_TRIGGER') ? 'rgba(217, 45, 53, 0.15)' : 'var(--color-card)', color: c.classification?.safetyFlags?.includes('SELF_HARM_CRISIS_TRIGGER') ? '#D92D35' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                      Crisis/Self-Harm: {c.classification?.safetyFlags?.includes('SELF_HARM_CRISIS_TRIGGER') ? '⚠️ Active (Tele-MANAS 14416)' : 'None'}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--color-text-main)' }}>Support Needs:</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                    Counselling / Emotional Support: <strong>{c.supportRequired?.includes('counselling') ? 'Requested' : 'Not Requested'}</strong> | Immediate Safety Support: <strong>{c.supportRequired?.includes('urgent_safety') || c.isUrgent ? 'Requested' : 'Not Requested'}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Card 2: Task B — Candidate Statutory Provisions & Legal Knowledge Base */}
                              <div style={{
                                padding: '18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--color-text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Scale size={18} color="var(--color-primary)" />
                                  Task B: Candidate Legal Provisions
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                                  Derived from verified legal library. Independent of risk priority. Does not constitute a final legal determination.
                                </div>

                                {c.legalAdvisory?.potentiallyRelevantFrameworks && c.legalAdvisory.potentiallyRelevantFrameworks.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {c.legalAdvisory.potentiallyRelevantFrameworks.map((fw, fwi) => (
                                      <div key={fwi} style={{
                                        padding: '12px',
                                        background: 'var(--color-card)',
                                        borderRadius: 6,
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.8rem',
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                          <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{fw.actName}</div>
                                          <span style={{
                                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                            background: fw.applicabilityStatus === 'CONFIRMED_RELEVANT' ? 'rgba(22, 133, 107, 0.12)' : fw.applicabilityStatus === 'DISMISSED_NOT_RELEVANT' ? 'rgba(217, 45, 53, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                            color: fw.applicabilityStatus === 'CONFIRMED_RELEVANT' ? '#16856B' : fw.applicabilityStatus === 'DISMISSED_NOT_RELEVANT' ? '#D92D35' : '#D97706',
                                          }}>
                                            {fw.applicabilityStatus || 'REQUIRES_HUMAN_LEGAL_REVIEW'}
                                          </span>
                                        </div>

                                        {fw.candidateSections && fw.candidateSections.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                                            {fw.candidateSections.map((sec, si) => (
                                              <span key={si} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', background: 'var(--color-soft-pink)', color: 'var(--color-primary)', borderRadius: 4 }}>
                                                {sec}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        <p style={{ margin: '4px 0', fontSize: '0.78rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                                          {fw.reason}
                                        </p>

                                        {fw.supportingReportedFacts && fw.supportingReportedFacts.length > 0 && (
                                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                            <strong>Supporting Facts:</strong> {fw.supportingReportedFacts.join('; ')}
                                          </div>
                                        )}

                                        {fw.elementsToVerify && fw.elementsToVerify.length > 0 && (
                                          <div style={{ fontSize: '0.74rem', color: '#B45309', marginTop: 4 }}>
                                            <strong>Elements to Verify:</strong> {fw.elementsToVerify.join('; ')}
                                          </div>
                                        )}

                                        {fw.reviewNote && (
                                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                                            Review Note: {fw.reviewNote}
                                          </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 6 }}>
                                          {fw.officialSources && fw.officialSources.length > 0 && (
                                            <a
                                              href={typeof fw.officialSources[0] === 'string' ? fw.officialSources[0] : fw.officialSources[0].url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                                            >
                                              Official Source <ExternalLink size={11} />
                                            </a>
                                          )}
                                          <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                              className="btn btn-secondary btn-sm"
                                              onClick={() => handleReviewLegalRecommendation(c.caseId, fwi, 'CONFIRMED_RELEVANT')}
                                              style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                            >
                                              <Check size={11} /> Confirm Relevance
                                            </button>
                                            <button
                                              className="btn btn-secondary btn-sm"
                                              onClick={() => handleReviewLegalRecommendation(c.caseId, fwi, 'MARK_NOT_RELEVANT')}
                                              style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 3, color: '#D92D35' }}
                                            >
                                              <X size={11} /> Mark Not Relevant
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : c.legalAdvisory?.applicableResources && c.legalAdvisory.applicableResources.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {c.legalAdvisory.applicableResources.map((fw, fwi) => (
                                      <div key={fwi} style={{
                                        padding: '10px 12px',
                                        background: 'var(--color-card)',
                                        borderRadius: 6,
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.8rem',
                                      }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fw.title}</div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{fw.statute}</div>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                                          {fw.rationale}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>No statutory frameworks matched above threshold.</p>
                                )}
                              </div>

                              {/* Card 3: Internal Escalation & Safety Pathways */}
                              <div style={{
                                padding: '18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--color-text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <AlertCircle size={18} color="var(--color-primary)" />
                                  Internal Escalation & Safeguards
                                </div>

                                <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                                  <div><strong>Internal Review Required:</strong> {c.escalation?.internalReviewRequired || priority === 'HIGH' ? 'YES (Urgent Human Review)' : 'Standard Routine Queue'}</div>
                                  <div><strong>Internal Notification:</strong> <code>{c.escalation?.internalNotificationStatus || 'CONFIGURED_INTERNAL_QUEUE'}</code></div>
                                  <div><strong>External Police Status:</strong> <code>{c.escalation?.externalReportingStatus || 'NOT_INITIATED'}</code></div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    External police reporting is strictly restricted to authorized human review. The system does not automatically disclose reports to police.
                                  </div>
                                  <div style={{ marginTop: 8 }}><strong>Safeguarding Protocol:</strong> <code>{c.escalation?.safeguardingPathway || 'STANDARD_ADULT_REVIEW'}</code></div>
                                  <div><strong>Reporting Mode:</strong> {c.isAnonymous ? 'Anonymous' : 'Identified'} <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>(Absence of identity or evidence never reduces priority)</span></div>
                                </div>

                                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      setClarificationTargetCase(c);
                                      setClarificationMessage('');
                                      setClarificationError('');
                                    }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  >
                                    <MessageSquare size={14} /> Request Clarification from Complainant
                                  </button>
                                </div>
                              </div>

                              {/* Card 4: Verification & Evidence Integrity (Module D) */}
                              <div style={{
                                padding: '18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--color-text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <AlertTriangle size={18} color="var(--color-primary)" />
                                  Evidence Integrity & Duplicate Detection
                                </div>

                                <div style={{ fontSize: '0.82rem', marginBottom: 10 }}>
                                  <div><strong>Status:</strong> <span style={{ color: vConfig.color, fontWeight: 700 }}>{vConfig.label}</span></div>
                                  {c.verification?.matchedCaseId && (
                                    <div><strong>Lexical Similarity Match:</strong> <code>{c.verification.matchedCaseId}</code> ({( (c.verification.similarityScore || 0) * 100).toFixed(1)}%)</div>
                                  )}
                                </div>

                                {c.verification?.flags && c.verification.flags.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {c.verification.flags.map((flag, fi) => (
                                      <div key={fi} style={{
                                        padding: '8px 10px',
                                        borderRadius: 6,
                                        background: flag.resolved ? 'rgba(22, 133, 107, 0.08)' : 'rgba(217, 119, 6, 0.1)',
                                        border: `1px solid ${flag.resolved ? 'rgba(22, 133, 107, 0.2)' : 'rgba(217, 119, 6, 0.3)'}`,
                                        fontSize: '0.78rem',
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <strong>{flag.code}</strong>
                                          {flag.resolved ? (
                                            <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.72rem' }}>✓ Resolved</span>
                                          ) : (
                                            <button
                                              className="btn btn-secondary btn-sm"
                                              onClick={() => handleResolveFlag(c.caseId, fi)}
                                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                            >
                                              Resolve
                                            </button>
                                          )}
                                        </div>
                                        <p style={{ margin: '3px 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                                          {flag.message}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Evidence Files with SHA-256 Hashing */}
                                {c.evidence && c.evidence.length > 0 ? (
                                  <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Attached Evidence Files:</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {c.evidence.map(ev => (
                                        <div key={ev._id} style={{
                                          padding: '8px 10px', background: 'var(--color-card)',
                                          borderRadius: 6, border: '1px solid var(--color-border)',
                                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                                        }}>
                                          <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                              {ev.originalName}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                              SHA-256: {ev.sha256Hash ? `${ev.sha256Hash.slice(0, 16)}…` : 'Pending'}
                                            </div>
                                          </div>
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleVerifyEvidence(ev._id)}
                                            disabled={verifyingEvidenceId === ev._id}
                                            style={{ padding: '3px 8px', fontSize: '0.7rem', flexShrink: 0 }}
                                          >
                                            {verifyingEvidenceId === ev._id ? 'Checking…' : 'Verify Hash'}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                    No evidence files uploaded with this submission. (Absence of evidence does not affect safety priority).
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Section 4: Audit History */}
                            {c.auditHistory && c.auditHistory.length > 0 && (
                              <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <History size={16} /> Audit History & Human Review Trail
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {c.auditHistory.map((ah, ahi) => (
                                    <div key={ahi} style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{new Date(ah.timestamp).toLocaleString('en-IN')}:</span>{' '}
                                      <code>{ah.action}</code>
                                      {ah.originalPriority && ah.newPriority && (
                                        <span> ({ah.originalPriority} → <strong>{ah.newPriority}</strong>)</span>
                                      )}
                                      {' — '}
                                      <span>{ah.reason}</span>
                                      {ah.reviewerName && <span> (By {ah.reviewerName}, {ah.reviewerRole})</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Section 5: Status Update Inline Tool */}
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Update Case Status:</label>
                                <select
                                  className="form-select"
                                  style={{ minWidth: 200, padding: '6px 10px', fontSize: '0.82rem' }}
                                  value={updatingStatus === c.caseId ? newStatus : ''}
                                  onChange={e => {
                                    setUpdatingStatus(c.caseId);
                                    setNewStatus(e.target.value);
                                  }}
                                >
                                  <option value="">Select status</option>
                                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </div>
                              <div style={{ flex: 1, minWidth: 220 }}>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Status Note:</label>
                                <input
                                  className="form-input"
                                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                  value={updatingStatus === c.caseId ? statusNote : ''}
                                  onChange={e => {
                                    setUpdatingStatus(c.caseId);
                                    setStatusNote(e.target.value);
                                  }}
                                  placeholder="Brief official update note for timeline"
                                />
                              </div>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdateStatus(c.caseId)}
                                disabled={updatingStatus !== c.caseId || !newStatus}
                              >
                                Save Status Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          AUDITED HUMAN PRIORITY OVERRIDE MODAL (Section 13)
          ═══════════════════════════════════════════════════════════════════════ */}
      {overrideTargetCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: '28px', background: 'var(--color-card)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)' }}>
              Adjust Priority (Audited Override)
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              You are manually adjusting the safety priority for case <code style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{overrideTargetCase.caseId}</code>.
              This action creates an immutable audit trail with your identity and mandatory explanation.
            </p>

            <form onSubmit={handleOverridePriority}>
              <div style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>Target Priority *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                    <label
                      key={p}
                      style={{
                        padding: '12px 10px',
                        border: overridePriorityChoice === p ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: overridePriorityChoice === p ? 'var(--color-soft-pink)' : 'var(--color-card)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      <input
                        type="radio"
                        name="priorityChoice"
                        value={p}
                        checked={overridePriorityChoice === p}
                        onChange={() => setOverridePriorityChoice(p)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: PRIORITY_CONFIG[p].color }}>{p}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {p === 'HIGH' ? 'Urgent' : p === 'MEDIUM' ? 'Prompt' : 'Standard'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', margin: 0 }}>
                    Mandatory Override Justification Reason *
                  </label>
                  <VoiceInputButton
                    value={overrideReason}
                    onChange={setOverrideReason}
                    fieldName="override justification reason"
                    size="sm"
                  />
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why you are adjusting this case priority (minimum 10 characters required for audit compliance)..."
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  Reason must be detailed and will be logged under your account ({user?.name}).
                </span>
              </div>

              {overrideError && (
                <div className="badge badge-emergency" style={{ width: '100%', marginBottom: 16, padding: 10, fontSize: '0.82rem' }}>
                  {overrideError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOverrideTargetCase(null)}
                  disabled={overrideSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={overrideSubmitting || overrideReason.trim().length < 10}
                >
                  {overrideSubmitting ? 'Recording Override…' : 'Confirm & Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════════
          CLARIFICATION REQUEST MODAL (Section 13)
          ═══════════════════════════════════════════════════════════════════════ */}
      {clarificationTargetCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: '28px', background: 'var(--color-card)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} color="var(--color-primary)" />
              Request Clarification from Complainant
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Send an inquiry to the complainant regarding case <code style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{clarificationTargetCase.caseId}</code>.
              This will update the case workflow status to <strong>Additional Info Required</strong> while preserving safety priority.
            </p>

            <form onSubmit={handleSendClarification}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', margin: 0 }}>
                    Clarification Inquiry Message *
                  </label>
                  <VoiceInputButton
                    value={clarificationMessage}
                    onChange={setClarificationMessage}
                    fieldName="clarification message"
                    size="sm"
                  />
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={clarificationMessage}
                  onChange={e => setClarificationMessage(e.target.value)}
                  placeholder="Specify the exact elements or facts requiring clarification (minimum 10 characters)..."
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  This message will be visible to the reporter on their case tracking timeline.
                </span>
              </div>

              {clarificationError && (
                <div className="badge badge-emergency" style={{ width: '100%', marginBottom: 16, padding: 10, fontSize: '0.82rem' }}>
                  {clarificationError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setClarificationTargetCase(null)}
                  disabled={clarificationSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={clarificationSubmitting || clarificationMessage.trim().length < 10}
                >
                  {clarificationSubmitting ? 'Sending Request…' : 'Send Clarification Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
