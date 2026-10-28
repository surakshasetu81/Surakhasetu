import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Clock, CheckCircle, AlertCircle, Info, Shield,
  ArrowLeft, RefreshCw, Lock, PhoneCall, Scale, Eye, EyeOff
} from 'lucide-react';
import { trackCase as apiTrackCase } from '../services/api';

// ─── STATUS CONFIGURATION ───────────────────────────────────────────────────
interface StatusMeta {
  label: string;
  color: string;
  badgeBg: string;
  icon: (size?: number) => ReactNode;
  summary: string;
}

const STATUS_CONFIG: Record<string, StatusMeta> = {
  submitted: {
    label: 'Report Received',
    color: '#6B7280',
    badgeBg: 'rgba(107, 114, 128, 0.12)',
    icon: (s = 14) => <Clock size={s} />,
    summary: 'Your report has been securely registered in the intake repository and is queued for verification.',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: '#2563EB',
    badgeBg: 'rgba(37, 99, 235, 0.12)',
    icon: (s = 14) => <Info size={s} />,
    summary: 'The Internal Complaints Committee (ICC) has formally acknowledged receipt of your filing.',
  },
  under_review: {
    label: 'Under Review',
    color: '#B7791F',
    badgeBg: 'rgba(183, 121, 31, 0.12)',
    icon: (s = 14) => <Search size={s} />,
    summary: 'Formal preliminary inquiry in progress under Section 11 of the POSH Act 2013 (statutory 90-day window).',
  },
  additional_info_required: {
    label: 'Additional Info Required',
    color: '#7C3AED',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    icon: (s = 14) => <AlertCircle size={s} />,
    summary: 'The committee has requested additional clarification or supporting documentation to proceed.',
  },
  decision_recorded: {
    label: 'Decision Recorded',
    color: '#C2185B',
    badgeBg: 'rgba(194, 24, 91, 0.12)',
    icon: (s = 14) => <CheckCircle size={s} />,
    summary: 'The committee has concluded inquiry proceedings and formally recorded its recommendations.',
  },
  closed: {
    label: 'Case Closed',
    color: '#16856B',
    badgeBg: 'rgba(22, 133, 107, 0.12)',
    icon: (s = 14) => <CheckCircle size={s} />,
    summary: 'All statutory requirements and administrative steps have been completed.',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  sexual_harassment: 'Workplace Sexual Harassment (POSH)',
  workplace_harassment: 'Workplace Harassment & Hostility',
  child_abuse: 'Child Abuse & Protection (POCSO)',
  domestic_violence: 'Domestic Violence & Safety',
  cyber_crime: 'Cyber Crime & Online Harassment',
  discrimination: 'Workplace Discrimination',
  other: 'Other Incident',
};

const SUPPORT_LABELS: Record<string, string> = {
  formal_complaint: 'Formal IC Inquiry',
  counselling: 'Counselling & Mental Health',
  legal_info: 'Statutory Legal Information',
  documentation: 'Evidence Documentation',
  urgent_safety: 'Urgent Safety Safeguards',
};

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface CaseData {
  caseId: string;
  status: string;
  incidentCategory: string;
  incidentDate?: string;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  supportRequired?: string[];
  isUrgent?: boolean;
  legalAdvisory?: {
    assessmentType?: string;
    incidentCategory?: { label?: string; explanation?: string };
    potentiallyRelevantFrameworks?: Array<{
      actName: string;
      shortName: string;
      candidateProvisions?: Array<{ section: string; title: string; summary?: string }>;
    }>;
    disclaimer?: string;
  };
}

interface TimelineUpdate {
  status: string;
  message: string;
  createdAt: string;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form inputs
  const [reportId, setReportId] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Validation & Error states
  const [validationErrors, setValidationErrors] = useState<{ reportId?: string; recoveryKey?: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Case Result state
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [timeline, setTimeline] = useState<TimelineUpdate[]>([]);

  // Handle URL query pre-fills (e.g. ?reportId=... or ?caseId=...)
  useEffect(() => {
    const qReportId = searchParams.get('reportId') || searchParams.get('caseId');
    const qKey = searchParams.get('recoveryKey') || searchParams.get('recoveryCode');
    if (qReportId) {
      setReportId(qReportId.trim().toUpperCase());
    }
    if (qKey) {
      setRecoveryKey(qKey.trim().toUpperCase());
    }
  }, [searchParams]);

  // ─── INPUT VALIDATION ─────────────────────────────────────────────────────
  const validateInputs = () => {
    const errors: { reportId?: string; recoveryKey?: string } = {};
    const cleanId = reportId.trim().toUpperCase();
    const cleanKey = recoveryKey.trim().toUpperCase();

    if (!cleanId) {
      errors.reportId = 'Please enter your Report ID.';
    } else if (cleanId.length < 5) {
      errors.reportId = 'Please enter a valid Report ID (e.g. SS-TEST2026-A1B2C3).';
    }

    if (!cleanKey) {
      errors.recoveryKey = 'Please enter your Recovery Key.';
    } else if (cleanKey.length < 6) {
      errors.recoveryKey = 'Please enter a valid Recovery Key.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── TRACK SUBMIT HANDLER ─────────────────────────────────────────────────
  const handleTrackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setGeneralError('');
    setRefreshSuccess(false);

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    const cleanId = reportId.trim().toUpperCase();
    const cleanKey = recoveryKey.trim().toUpperCase();

    try {
      const data = await apiTrackCase(cleanId, cleanKey);
      if (data?.case) {
        setCaseData(data.case);
        setTimeline(data.timeline || []);
        setGeneralError('');
      } else {
        setGeneralError('Unable to verify these details. Please check your Report ID and Recovery Key and try again.');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 404) {
        setGeneralError('Unable to verify these details. Please check your Report ID and Recovery Key and try again.');
      } else if (status === 503 || !err.response) {
        setGeneralError('Case tracking is temporarily unavailable. Please try again.');
      } else {
        setGeneralError(err?.response?.data?.message || 'Case tracking is temporarily unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────
  const handleTrackAnother = () => {
    setReportId('');
    setRecoveryKey('');
    setCaseData(null);
    setTimeline([]);
    setGeneralError('');
    setValidationErrors({});
    setRefreshSuccess(false);
  };

  const handleBackHome = () => {
    navigate('/');
  };

  const handleRefreshStatus = async () => {
    if (!caseData || refreshing) return;
    setRefreshing(true);
    setRefreshSuccess(false);
    setGeneralError('');

    try {
      const cleanId = caseData.caseId;
      const cleanKey = recoveryKey.trim().toUpperCase();
      const data = await apiTrackCase(cleanId, cleanKey);
      if (data?.case) {
        setCaseData(data.case);
        setTimeline(data.timeline || []);
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 3000);
      }
    } catch {
      setGeneralError('Unable to refresh status. Please verify your connection.');
    } finally {
      setRefreshing(false);
    }
  };

  const statusCfg = caseData ? STATUS_CONFIG[caseData.status] || STATUS_CONFIG.submitted : null;

  return (
    <main
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        padding: '48px 16px 88px',
        color: 'var(--color-text-main)',
      }}
      role="main"
      aria-label="Track Your Case Portal"
    >
      <div className="container-sm" style={{ maxWidth: 840, margin: '0 auto' }}>

        {/* ─── PAGE HEADING ──────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            className="icon-container"
            style={{
              margin: '0 auto 16px',
              width: 58,
              height: 58,
              borderRadius: 16,
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={28} />
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Track Your Case
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Securely track your submitted report using your Report ID and Recovery Key.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* VIEW A: CASE RESULTS VIEW (WHEN CASE IS VERIFIED & LOADED)        */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {caseData && statusCfg ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            id="case-results-view"
          >
            {/* Top Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={handleTrackAnother}
                className="btn btn-secondary btn-sm"
                id="track-another-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} /> Track Another Report
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="btn btn-secondary btn-sm"
                  id="refresh-status-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Request the latest permitted status from the server"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh Status'}
                </button>
                <button
                  type="button"
                  onClick={handleBackHome}
                  className="btn btn-outline-primary btn-sm"
                  id="back-home-btn"
                >
                  Back to Home
                </button>
              </div>
            </div>

            {/* Refresh Success Notice */}
            {refreshSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(22, 133, 107, 0.1)',
                  border: '1px solid var(--color-success)',
                  color: 'var(--color-success)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle size={15} /> Status refreshed with the latest actual records.
              </motion.div>
            )}

            {/* Error Notice */}
            {generalError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(217, 45, 53, 0.08)',
                  border: '1px solid rgba(217, 45, 53, 0.3)',
                  color: 'var(--color-emergency)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} /> {generalError}
              </div>
            )}

            {/* 1. Case Summary Card */}
            <div className="card" style={{ marginBottom: 24, padding: 28 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 20,
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Verified Report Reference
                  </div>
                  <h2
                    style={{
                      fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      letterSpacing: '0.02em',
                      margin: 0,
                    }}
                    id="verified-case-id"
                  >
                    {caseData.caseId}
                  </h2>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 9999,
                    background: statusCfg.badgeBg,
                    color: statusCfg.color,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: `1px solid ${statusCfg.color}30`,
                  }}
                  id="case-status-badge"
                >
                  {statusCfg.icon(16)}
                  <span>{statusCfg.label}</span>
                </div>
              </div>

              {/* Status explanation */}
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 20,
                  background: 'var(--color-bg-secondary)',
                  padding: '12px 16px',
                  borderRadius: 10,
                  borderLeft: `4px solid ${statusCfg.color}`,
                }}
              >
                {statusCfg.summary}
              </p>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    Incident Category
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>
                    {CATEGORY_LABELS[caseData.incidentCategory] || caseData.incidentCategory}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    Submission Date
                  </p>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                    {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    Last System Update
                  </p>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                    {caseData.updatedAt
                      ? new Date(caseData.updatedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Initial Intake'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    Reporting Privacy
                  </p>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      margin: 0,
                      color: caseData.isAnonymous ? 'var(--color-primary)' : 'var(--color-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Lock size={13} /> {caseData.isAnonymous ? 'Anonymous Filing' : 'Identified Filing'}
                  </p>
                </div>
              </div>

              {/* Support Requested Tags */}
              {caseData.supportRequired && caseData.supportRequired.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 700,
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Requested Support Channels
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {caseData.supportRequired.map(key => (
                      <span
                        key={key}
                        style={{
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: 'var(--color-soft-pink)',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {SUPPORT_LABELS[key] || key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Case Progress Timeline */}
            <div className="card" style={{ marginBottom: 24, padding: 28 }} id="case-timeline-section">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 14,
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={19} color="var(--color-primary)" />
                  Case Progress Timeline
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {timeline.length} {timeline.length === 1 ? 'event recorded' : 'events recorded'}
                </span>
              </div>

              {timeline.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 12,
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.92rem',
                  }}
                  id="no-updates-message"
                >
                  <Clock size={28} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-main)' }}>
                    Your report has been received, but no case updates are available yet.
                  </p>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>
                    Updates will be posted here as the Internal Complaints Committee moves forward.
                  </p>
                </div>
              ) : (
                <div className="timeline" style={{ paddingLeft: 4 }}>
                  {timeline.map((update, idx) => {
                    const itemCfg = STATUS_CONFIG[update.status] || STATUS_CONFIG.submitted;
                    return (
                      <div
                        key={idx}
                        className="timeline-item"
                        style={{
                          position: 'relative',
                          paddingBottom: idx === timeline.length - 1 ? 4 : 24,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: itemCfg.color,
                              background: itemCfg.badgeBg,
                              padding: '3px 10px',
                              borderRadius: 9999,
                            }}
                          >
                            {itemCfg.icon(13)} {itemCfg.label}
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--color-text-secondary)',
                              fontWeight: 500,
                            }}
                          >
                            {new Date(update.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-main)',
                            margin: '4px 0 0',
                            lineHeight: 1.6,
                          }}
                        >
                          {update.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Advisory Legal Recommendations (if available from real backend) */}
            {caseData.legalAdvisory && caseData.legalAdvisory.potentiallyRelevantFrameworks && caseData.legalAdvisory.potentiallyRelevantFrameworks.length > 0 && (
              <div className="card" style={{ marginBottom: 24, padding: 28 }} id="legal-recommendations-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Scale size={20} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Relevant Statutory Frameworks & Provisions
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {caseData.legalAdvisory.potentiallyRelevantFrameworks.map((fw, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                        {fw.shortName || fw.actName}
                      </h4>
                      {fw.candidateProvisions && fw.candidateProvisions.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {fw.candidateProvisions.map((prov, pIdx) => (
                            <div key={pIdx} style={{ fontSize: '0.85rem', marginBottom: 4 }}>
                              <strong>{prov.section}:</strong> {prov.title}
                              {prov.summary && <span style={{ color: 'var(--color-text-secondary)' }}> — {prov.summary}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {caseData.legalAdvisory.disclaimer && (
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.55,
                      marginTop: 16,
                      fontStyle: 'italic',
                    }}
                  >
                    {caseData.legalAdvisory.disclaimer}
                  </p>
                )}
              </div>
            )}

            {/* 4. Official Support Helplines */}
            <div
              className="card"
              style={{
                marginBottom: 24,
                padding: '24px 28px',
                background: 'var(--color-soft-pink)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PhoneCall size={18} color="var(--color-primary)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                  Verified Official Helplines & Immediate Support
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                If you are in immediate distress or require guidance while your complaint is processed, official assistance is available 24/7:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-card)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>National Women Helpline</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>1091 / 7827170170</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-card)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Tele-MANAS Mental Health</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>14416 (24/7 Toll-Free)</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-card)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>POCSO / Childline</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>1098 (Toll-Free)</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 32 }}>
              <button
                type="button"
                onClick={handleTrackAnother}
                className="btn btn-secondary"
                id="bottom-track-another-btn"
              >
                <Search size={16} /> Track Another Report
              </button>
              <button
                type="button"
                onClick={handleBackHome}
                className="btn btn-primary"
                id="bottom-back-home-btn"
              >
                Return to Homepage
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─────────────────────────────────────────────────────────────── */
          /* VIEW B: UNIFIED CASE TRACKING FORM                             */
          /* ─────────────────────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: 560, margin: '0 auto' }}
          >
            {/* Centered Track Card */}
            <div
              className="card"
              style={{
                padding: '36px 32px',
                marginBottom: 24,
                boxShadow: 'var(--shadow-md, 0 4px 14px rgba(0,0,0,0.06))',
              }}
              id="unified-track-card"
            >
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: 'var(--color-soft-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Shield size={28} />
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)' }}>
                  Track Your Report
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '0 auto', maxWidth: 440 }}>
                  Enter the Report ID and Recovery Key you received after submitting your report.
                </p>
              </div>

              {/* General Error Alert */}
              {generalError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(217, 45, 53, 0.08)',
                    border: '1px solid rgba(217, 45, 53, 0.3)',
                    color: 'var(--color-emergency)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                  id="track-error-alert"
                  role="alert"
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleTrackSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Report ID input */}
                <div>
                  <label
                    htmlFor="report-id-input"
                    className="form-label"
                    style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}
                  >
                    Report ID <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <input
                    id="report-id-input"
                    name="reportId"
                    type="text"
                    value={reportId}
                    onChange={e => {
                      setReportId(e.target.value.toUpperCase());
                      if (validationErrors.reportId) {
                        setValidationErrors(prev => ({ ...prev, reportId: undefined }));
                      }
                    }}
                    placeholder="Enter your Report ID"
                    className="form-input"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                      borderColor: validationErrors.reportId ? 'var(--color-emergency)' : undefined,
                    }}
                    autoComplete="off"
                    autoCapitalize="characters"
                    aria-invalid={!!validationErrors.reportId}
                    aria-describedby={validationErrors.reportId ? 'report-id-error' : 'report-id-hint'}
                    disabled={loading}
                  />
                  {validationErrors.reportId ? (
                    <p id="report-id-error" style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', marginTop: 4 }}>
                      {validationErrors.reportId}
                    </p>
                  ) : (
                    <p id="report-id-hint" style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      e.g., SS-TEST2026-A1B2C3 (from your submission confirmation)
                    </p>
                  )}
                </div>

                {/* 2. Recovery Key input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label
                      htmlFor="recovery-key-input"
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}
                    >
                      Recovery Key <span style={{ color: 'var(--color-primary)' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showKey ? 'Hide Key' : 'Show Key'}
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      id="recovery-key-input"
                      name="recoveryKey"
                      type={showKey ? 'text' : 'password'}
                      value={recoveryKey}
                      onChange={e => {
                        setRecoveryKey(e.target.value.toUpperCase());
                        if (validationErrors.recoveryKey) {
                          setValidationErrors(prev => ({ ...prev, recoveryKey: undefined }));
                        }
                      }}
                      placeholder="Enter your Recovery Key"
                      className="form-input"
                      maxLength={32}
                      style={{
                        textTransform: 'uppercase',
                        letterSpacing: showKey ? '0.12em' : 'normal',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        borderColor: validationErrors.recoveryKey ? 'var(--color-emergency)' : undefined,
                      }}
                      autoComplete="off"
                      aria-invalid={!!validationErrors.recoveryKey}
                      aria-describedby={validationErrors.recoveryKey ? 'recovery-key-error' : 'recovery-key-hint'}
                      disabled={loading}
                    />
                  </div>
                  {validationErrors.recoveryKey ? (
                    <p id="recovery-key-error" style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', marginTop: 4 }}>
                      {validationErrors.recoveryKey}
                    </p>
                  ) : (
                    <p id="recovery-key-hint" style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      Confidential alphanumeric key provided upon filing.
                    </p>
                  )}
                </div>

                {/* Primary Pink Track Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  id="track-report-btn"
                  style={{
                    width: '100%',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Verifying report credentials...</span>
                    </>
                  ) : (
                    <>
                      <Search size={17} />
                      <span>Track My Report</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recovery Key Security Notice */}
            <div
              className="card"
              style={{
                padding: '20px 24px',
                borderRadius: 14,
                background: 'var(--color-soft-pink)',
                border: '1px solid var(--color-border)',
              }}
              id="recovery-security-box"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Lock size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                    Zero-Knowledge Privacy & Case Tracking
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    Your Report ID and Recovery Key work as cryptographic keys to unlock authorized case updates without revealing your identity or private evidence.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>
                    Because Suraksha Setu uses one-way cryptographic hashing, recovery keys cannot be recovered by administrators if lost. Keep your keys stored safely.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
