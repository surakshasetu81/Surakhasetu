import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield, Upload, CheckCircle2, AlertTriangle, X, FileText, Copy,
  ArrowRight, ArrowLeft, UserCheck, EyeOff, Check,
  Scale, BookOpen, ExternalLink, HelpCircle, Info, Sparkles, RefreshCw,
  Building2, Briefcase, GraduationCap, ShieldCheck, AlertCircle
} from 'lucide-react';
import {
  submitReport,
  fetchLegalAssessment,
  verifyOrganization,
  getKnownOrganizations,
  type ReportSubmissionPayload
} from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';

interface CandidateProvision {
  section: string;
  title: string;
  summary: string;
  applicabilityCondition: string;
  officialSource: string;
}

interface PotentiallyRelevantFramework {
  actName: string;
  shortName: string;
  statute?: string;
  candidateProvisions: CandidateProvision[];
  reason: string;
  officialSources: { name: string; url: string }[];
  applicabilityStatus: string;
}

interface LegalAssessment {
  assessmentType: string;
  status: string; // PRELIMINARY, ADDITIONAL_INFORMATION_NEEDED, NO_SPECIFIC_MATCH_IDENTIFIED, SERVICE_UNAVAILABLE
  incidentCategory: {
    label: string;
    explanation: string;
  };
  additionalCategories?: {
    label: string;
    explanation: string;
  }[];
  potentiallyRelevantFrameworks: PotentiallyRelevantFramework[];
  additionalInformationNeeded: string[];
  modelMetadata: {
    modelVersion: string;
    knowledgeBaseVersion: string;
    assessmentMethod: string;
    isDemoModel: boolean;
  };
  disclaimer: string;
}

// ─── Zod Schemas per step ─────────────────────────────────────────────────────
const step1Schema = z.object({
  isAnonymous: z.boolean(),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  reporterPhone: z.string().optional(),
});

export const ALLOWED_INCIDENT_CATEGORIES = [
  'sexual_harassment',
  'workplace_harassment',
  'cyber_crime',
  'discrimination',
  'other',
] as const;

export type AllowedIncidentCategory = typeof ALLOWED_INCIDENT_CATEGORIES[number];

const step2Schema = z.object({
  incidentCategory: z.enum(ALLOWED_INCIDENT_CATEGORIES, {
    message: 'Please select a category',
  }),
  incidentDate: z.string().optional(),
  description: z.string().min(20, 'Please provide at least 20 characters for sufficient detail'),
  location: z.string().optional(),
  preferredLanguage: z.string().default('en'),
});

const step3Schema = z.object({
  supportRequired: z.array(z.string()).min(1, 'Please select at least one support option'),
  supportNotes: z.string().optional(),
  isUrgent: z.boolean().default(false),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface SubmissionResult {
  caseId: string;
  recoveryCode: string;
  submittedAt: string;
}

const CATEGORIES = [
  { value: 'sexual_harassment', label: 'Sexual Harassment at Workplace' },
  { value: 'workplace_harassment', label: 'Workplace Harassment / Bullying' },
  { value: 'cyber_crime', label: 'Cyber Crime / Online Harassment' },
  { value: 'discrimination', label: 'Gender Discrimination' },
  { value: 'other', label: 'Other Concerns' },
];

const SUPPORT_OPTIONS = [
  { value: 'formal_complaint', label: 'Formal Complaint Investigation', desc: 'Initiate formal inquiry proceedings with the Internal Committee (IC)' },
  { value: 'counselling', label: 'Counselling & Emotional Guidance', desc: 'Access verified psychosocial counselling and mental health support' },
  { value: 'legal_info', label: 'Legal Advice & Aid Referral', desc: 'Understand POSH Act statutory rights and connect with legal aid' },
  { value: 'documentation', label: 'Documentation & Evidence Vault', desc: 'Securely record this incident timeline for future legal or official use' },
  { value: 'urgent_safety', label: 'Emergency Safety Assistance', desc: 'Connect immediately with crisis hotlines and protection services' },
];

const STEP_LABELS = [
  'Preference',
  'Incident Details',
  'Support Required',
  'Evidence',
  'Review & Submit',
];

// ─── Step Indicator Component ────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const progressPercent = ((current - 1) / (total - 1)) * 100;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto 28px', width: '100%' }}>
      {/* Desktop Stepper */}
      <div className="report-desktop-stepper" aria-label="Complaint progress">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Background Connecting Line */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 20,
              right: 20,
              height: 3,
              background: 'var(--color-border)',
              zIndex: 0,
            }}
          />
          {/* Active Fill Line */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 20,
              width: `calc(${progressPercent}% * 0.95)`,
              height: 3,
              background: 'var(--color-primary)',
              zIndex: 1,
              transition: 'width 0.4s ease',
            }}
          />

          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < current;
            const isActive = stepNum === current;

            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                  width: 90,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 0 0 4px var(--color-soft-pink)' : 'none',
                    background: isCompleted
                      ? 'var(--color-success)'
                      : isActive
                        ? 'var(--color-primary)'
                        : 'var(--color-card)',
                    color: isCompleted || isActive ? '#ffffff' : 'var(--color-text-secondary)',
                    border: isCompleted || isActive ? 'none' : '2px solid var(--color-border)',
                  }}
                >
                  {isCompleted ? <Check size={18} strokeWidth={2.5} /> : stepNum}
                </div>

                <span
                  style={{
                    marginTop: 8,
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? 'var(--color-primary)'
                      : isCompleted
                        ? 'var(--color-text-main)'
                        : 'var(--color-text-secondary)',
                    lineHeight: 1.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="report-mobile-stepper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Step {current} of {total}
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            {STEP_LABELS[current - 1]}
          </span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(current / total) * 100}%`,
              height: '100%',
              background: 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Current Step Concise Label on Desktop */}
      <p className="report-desktop-step-caption" style={{ textAlign: 'center', marginTop: 14, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
        Step {current} of {total}: <strong style={{ color: 'var(--color-primary)' }}>{STEP_LABELS[current - 1]}</strong>
      </p>
    </div>
  );
}

// ─── File Upload Component ───────────────────────────────────────────────────
function FileUpload({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg', 'audio/wav'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter(f => ALLOWED.includes(f.type) && f.size <= MAX_SIZE);
    setFiles([...files, ...valid].slice(0, 5));
  };

  const removeFile = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        className={`upload-zone${dragging ? ' drag-active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => document.getElementById('evidence-input')?.click()}
        style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 20px',
          textAlign: 'center',
          background: dragging ? 'var(--color-soft-pink)' : 'var(--color-bg-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
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
            margin: '0 auto 12px',
          }}
        >
          <Upload size={24} />
        </div>
        <p style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 4, fontSize: '0.96rem' }}>
          Drop evidence files here or click to browse
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', maxWidth: 440, margin: '0 auto' }}>
          Supports JPG, PNG, PDF, MP4, MP3, WAV · Max 10MB per file · Up to 5 files
        </p>
        <input
          id="evidence-input"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.mp3,.wav"
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Selected Files ({files.length}/5):
          </div>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <FileText size={18} color="var(--color-primary)" />
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                {f.name}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                aria-label={`Remove file ${f.name}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ result, verifiedOrg }: { result: SubmissionResult; verifiedOrg?: { organizationName: string; organizationType: string } | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center', padding: '12px 0' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(22, 133, 107, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
        }}
      >
        <CheckCircle2 size={36} color="var(--color-success)" />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)' }}>
        Complaint Submitted Successfully
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: 20, maxWidth: 540, margin: '0 auto 20px' }}>
        Your report has been securely registered in the system. Save your confidential Case ID and Recovery Code below to track investigation progress.
      </p>

      {verifiedOrg && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 999,
            background: 'var(--color-pale-pink)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontSize: '0.86rem',
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          <ShieldCheck size={18} color="var(--color-success)" />
          <span>Organization Affiliation Verified: {verifiedOrg.organizationName} ({verifiedOrg.organizationType === 'employee' ? 'Employee' : 'College Student'})</span>
        </div>
      )}

      <div
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: 24,
          textAlign: 'left',
          maxWidth: 600,
          margin: '0 auto 24px',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Report ID (Case Reference)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                padding: '8px 14px',
                borderRadius: 8,
                flex: 1,
              }}
            >
              {result.caseId}
            </code>
            <button onClick={() => copy(result.caseId, 'caseId')} className="btn btn-secondary btn-sm">
              <Copy size={13} /> {copied === 'caseId' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recovery Key
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#7C3AED',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                padding: '8px 14px',
                borderRadius: 8,
                flex: 1,
                letterSpacing: '0.08em',
              }}
            >
              {result.recoveryCode}
            </code>
            <button onClick={() => copy(result.recoveryCode, 'code')} className="btn btn-secondary btn-sm">
              <Copy size={13} /> {copied === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div
        className="badge badge-warning"
        style={{
          marginBottom: 24,
          fontSize: '0.82rem',
          padding: '10px 18px',
          display: 'inline-flex',
          maxWidth: 600,
          textAlign: 'left',
          lineHeight: 1.5,
        }}
      >
        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Important:</strong> Please store your Report ID and Recovery Key in a safe place. For confidentiality and security, they will not be re-displayed.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
        <a href={`/track?reportId=${encodeURIComponent(result.caseId)}`} className="btn btn-primary">
          Track This Report Now
        </a>
        <a href="/" className="btn btn-secondary">
          Return Home
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main ReportPage Component ───────────────────────────────────────────────
export default function ReportPage() {
  const [step, setStep] = useState(0); // Step 0: Organization Verification
  const [verifiedOrg, setVerifiedOrg] = useState<{
    isVerified: boolean;
    organizationType: 'employee' | 'college_student';
    organizationName: string;
    verificationToken: string;
  } | null>(null);
  const [orgVerificationMode, setOrgVerificationMode] = useState<'verify' | 'anonymous'>('verify');
  const [orgType, setOrgType] = useState<'employee' | 'college_student'>('employee');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState('');
  const [knownOrgs, setKnownOrgs] = useState<{ name: string; type: string; idFormat: string }[]>([]);

  useEffect(() => {
    getKnownOrganizations()
      .then(orgs => setKnownOrgs(orgs))
      .catch(() => {});
  }, []);

  const handleVerifyOrganization = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOrgError('');
    setOrgSuccess('');

    if (!orgName.trim()) {
      setOrgError(orgType === 'employee' ? 'Please enter your Company Name.' : 'Please enter your College/University Name.');
      return;
    }
    if (!orgId.trim()) {
      setOrgError(orgType === 'employee' ? 'Please enter your Employee ID.' : 'Please enter your College ID.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyOrganization({
        organizationType: orgType,
        organizationName: orgName.trim(),
        identifier: orgId.trim(),
        email: orgEmail.trim() || undefined,
      });

      if (res.verified && res.verificationToken) {
        setVerifiedOrg({
          isVerified: true,
          organizationType: res.organizationType || orgType,
          organizationName: res.organizationName || orgName.trim(),
          verificationToken: res.verificationToken,
        });
        setOrgSuccess(res.message || 'Organization successfully verified.');
        setTimeout(() => {
          setStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 600);
      } else {
        setOrgError(res.message || 'Verification could not be completed.');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.friendlyMessage || 'Verification failed. Please check the entered details or proceed with anonymous reporting.';
      setOrgError(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleContinueAnonymous = () => {
    setVerifiedOrg(null);
    form1.setValue('isAnonymous', true);
    setStep1Data(prev => ({ ...prev, isAnonymous: true }));
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [step1Data, setStep1Data] = useState<Step1Data>({ isAnonymous: true });
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({});
  const [step3Data, setStep3Data] = useState<Step3Data>({ supportRequired: [], isUrgent: false });
  const [evidenceNotes, setEvidenceNotes] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState('');
  const [legalAssessment, setLegalAssessment] = useState<LegalAssessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');

  const fetchAssessment = async () => {
    if (!step2Data.description) return;
    setLoadingAssessment(true);
    setAssessmentError('');
    try {
      const combinedDescription = [
        step2Data.description,
        step3Data.supportNotes ? `[Specific Support / Accommodation Notes: ${step3Data.supportNotes}]` : null,
        evidenceNotes ? `[Evidence Notes & Descriptions: ${evidenceNotes}]` : null,
      ].filter(Boolean).join('\n\n');

      const res = await fetchLegalAssessment({
        description: combinedDescription,
        incidentCategory: step2Data.incidentCategory,
        preferredLanguage: step2Data.preferredLanguage || 'en',
        contextType: 'workplace',
        targetMinor: false,
        isOnline: step2Data.incidentCategory === 'cyber_crime',
      });
      setLegalAssessment(res);
    } catch {
      setAssessmentError('Legal assessment is currently unavailable. You may proceed to submit your complaint without interruption.');
    } finally {
      setLoadingAssessment(false);
    }
  };

  useEffect(() => {
    if (step === 5 && step2Data.description) {
      fetchAssessment();
    }
  }, [step, step2Data.description, step2Data.incidentCategory, step3Data.supportNotes, evidenceNotes]);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { isAnonymous: true },
    values: step1Data,
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      preferredLanguage: 'en',
      incidentCategory: (step2Data.incidentCategory as AllowedIncidentCategory) || undefined,
      description: step2Data.description || '',
      incidentDate: step2Data.incidentDate || '',
      location: step2Data.location || '',
    },
    values: step2Data.description ? (step2Data as Step2Data) : undefined,
  });

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s + 1);
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s - 1);
  };

  const handleStep1 = form1.handleSubmit(data => {
    setStep1Data(data);
    nextStep();
  });

  const handleStep2 = form2.handleSubmit(data => {
    setStep2Data(data);
    nextStep();
  });

  const handleSubmit = async () => {
    if (step3Data.supportRequired.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const combinedDescription = [
        step2Data.description,
        step3Data.supportNotes ? `[Specific Support / Accommodation Notes: ${step3Data.supportNotes}]` : null,
        evidenceNotes ? `[Evidence Notes & Descriptions: ${evidenceNotes}]` : null,
      ].filter(Boolean).join('\n\n');

      const payload: ReportSubmissionPayload = {
        ...step1Data,
        ...step2Data,
        ...step3Data,
        description: combinedDescription,
        organizationVerification: verifiedOrg ? {
          verificationToken: verifiedOrg.verificationToken,
          isVerified: true,
          organizationType: verifiedOrg.organizationType,
          organizationName: verifiedOrg.organizationName,
        } : { isVerified: false },
      };
      const res = await submitReport(payload, files);
      setResult(res);
      setStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSupport = (value: string) => {
    setStep3Data(prev => ({
      ...prev,
      supportRequired: prev.supportRequired.includes(value)
        ? prev.supportRequired.filter(v => v !== value)
        : [...prev.supportRequired, value],
    }));
  };

  const isAnonymous = form1.watch('isAnonymous');

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '36px 0 80px' }}>
      <div style={{ maxWidth: 840, width: '100%', margin: '0 auto', padding: '0 20px' }}>
        {/* ─── Compact Redesigned Header ─── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
              margin: '0 auto 12px',
            }}
          >
            <Shield size={26} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.02em',
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Report an Incident
          </h1>

          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.92rem',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Your report will be handled according to the platform's privacy and access-control policies. Choose your reporting preference to continue.
          </p>
        </div>

        {/* ─── Step Progress Indicator ─── */}
        {step >= 1 && step < 6 && <StepIndicator current={step} total={5} />}

        {/* ─── Step 0 Indicator ─── */}
        {step === 0 && (
          <div style={{ maxWidth: 820, margin: '0 auto 24px', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 18px',
                background: 'var(--color-soft-pink)',
                border: '1px solid var(--color-border)',
                borderRadius: 999,
                color: 'var(--color-primary)',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              <Building2 size={16} />
              <span>Section 1: Organization Verification</span>
            </div>
          </div>
        )}

        {/* ─── Main Form Card Container ─── */}
        <div
          className="card"
          style={{
            maxWidth: 820,
            width: '100%',
            margin: '0 auto',
            padding: 'clamp(24px, 4vw, 36px)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Persistent Verification Status Banner for Steps 1-5 */}
          {step >= 1 && step <= 5 && (
            verifiedOrg ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: 'var(--color-pale-pink)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--color-soft-pink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={18} color="var(--color-success)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Organization Verified: {verifiedOrg.organizationName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Verified as {verifiedOrg.organizationType === 'employee' ? 'Company Employee' : 'College Student'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EyeOff size={16} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    Filing in Anonymous / Unverified Affiliation Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Verify Organization
                </button>
              </div>
            )
          )}

          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════
                STEP 0: ORGANIZATION VERIFICATION
                ══════════════════════════════════════════════════════════════ */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Heading & Description required by specification */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
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
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', color: 'var(--color-text-main)', margin: 0 }}>
                      Organization Verification
                    </h2>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                    Verify your organization to help us process your workplace or college complaint appropriately.
                  </p>
                </div>

                {/* Two options: Verify My Organization vs Continue with Anonymous Reporting */}
                <div
                  role="radiogroup"
                  aria-label="Choose verification approach"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}
                >
                  {/* Option 1: Verify My Organization */}
                  <div
                    role="radio"
                    aria-checked={orgVerificationMode === 'verify'}
                    tabIndex={0}
                    onClick={() => { setOrgVerificationMode('verify'); setOrgError(''); }}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setOrgVerificationMode('verify'); setOrgError(''); } }}
                    style={{
                      border: orgVerificationMode === 'verify' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: orgVerificationMode === 'verify' ? 'var(--color-soft-pink)' : 'var(--color-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: orgVerificationMode === 'verify' ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: 4 }}>
                        Verify My Organization
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        Verify affiliation with your workplace company or college/university using your ID.
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Continue with Anonymous Reporting */}
                  <div
                    role="radio"
                    aria-checked={orgVerificationMode === 'anonymous'}
                    tabIndex={0}
                    onClick={() => { setOrgVerificationMode('anonymous'); setOrgError(''); }}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setOrgVerificationMode('anonymous'); setOrgError(''); } }}
                    style={{
                      border: orgVerificationMode === 'anonymous' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: orgVerificationMode === 'anonymous' ? 'var(--color-soft-pink)' : 'var(--color-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: orgVerificationMode === 'anonymous' ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <EyeOff size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: 4 }}>
                        Continue with Anonymous Reporting
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        File a report confidentially without entering any Employee or College ID.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Form Body */}
                {orgVerificationMode === 'verify' ? (
                  <form onSubmit={handleVerifyOrganization} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Field 1: Organization Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 8 }}>
                        Organization Type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => { setOrgType('employee'); setOrgError(''); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: orgType === 'employee' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                            background: orgType === 'employee' ? 'var(--color-soft-pink)' : 'var(--color-card)',
                            color: orgType === 'employee' ? 'var(--color-primary)' : 'var(--color-text-main)',
                            fontWeight: orgType === 'employee' ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Briefcase size={18} />
                          <span>Employee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOrgType('college_student'); setOrgError(''); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: orgType === 'college_student' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                            background: orgType === 'college_student' ? 'var(--color-soft-pink)' : 'var(--color-card)',
                            color: orgType === 'college_student' ? 'var(--color-primary)' : 'var(--color-text-main)',
                            fontWeight: orgType === 'college_student' ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                        >
                          <GraduationCap size={18} />
                          <span>College Student</span>
                        </button>
                      </div>
                    </div>

                    {/* Field 2: Organization Name */}
                    <div>
                      <label htmlFor="org-name-input" style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 6 }}>
                        {orgType === 'employee' ? 'Company Name' : 'College/University Name'} <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        id="org-name-input"
                        type="text"
                        list="known-orgs-datalist"
                        value={orgName}
                        onChange={e => { setOrgName(e.target.value); setOrgError(''); }}
                        placeholder={orgType === 'employee' ? 'e.g., Apex Global Technologies or Tata Consultancy Services' : 'e.g., Delhi University or St. Xavier\'s College'}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--color-border)',
                          background: 'var(--color-card)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <datalist id="known-orgs-datalist">
                        {knownOrgs
                          .filter(o => o.type === orgType)
                          .map(o => (
                            <option key={o.name} value={o.name}>
                              {o.name} ({o.idFormat})
                            </option>
                          ))}
                      </datalist>
                      <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        Supported configured institutions include registered workplace partners and university boards.
                      </p>
                    </div>

                    {/* Field 3: Employee ID / College ID */}
                    <div>
                      <label htmlFor="org-id-input" style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 6 }}>
                        {orgType === 'employee' ? 'Employee ID' : 'College ID'} <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        id="org-id-input"
                        type="text"
                        value={orgId}
                        onChange={e => { setOrgId(e.target.value); setOrgError(''); }}
                        placeholder={orgType === 'employee' ? 'Enter Employee ID' : 'Enter College ID'}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--color-border)',
                          background: 'var(--color-card)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        Your ID is verified cryptographically and is never stored in plaintext or exposed on public tracking.
                      </p>
                    </div>

                    {/* Field 4: Optional Organization Email */}
                    <div>
                      <label htmlFor="org-email-input" style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 6 }}>
                        {orgType === 'employee' ? 'Work Email (Optional)' : 'College Email (Optional)'}
                      </label>
                      <input
                        id="org-email-input"
                        type="email"
                        value={orgEmail}
                        onChange={e => { setOrgEmail(e.target.value); setOrgError(''); }}
                        placeholder={orgType === 'employee' ? 'e.g., name@apextech.com' : 'e.g., student@du.ac.in'}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--color-border)',
                          background: 'var(--color-card)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        Optional: matching your institutional domain strengthens verification authenticity.
                      </p>
                    </div>

                    {/* Error Alert */}
                    {orgError && (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(217, 45, 53, 0.08)',
                          border: '1px solid rgba(217, 45, 53, 0.3)',
                          color: 'var(--color-emergency)',
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                        }}
                      >
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Verification Error</div>
                          <div>{orgError}</div>
                          <div style={{ marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={handleContinueAnonymous}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.84rem',
                                padding: 0,
                                textDecoration: 'underline',
                              }}
                            >
                              Proceed with Anonymous Reporting instead &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Alert */}
                    {orgSuccess && (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(22, 133, 107, 0.1)',
                          border: '1px solid rgba(22, 133, 107, 0.3)',
                          color: 'var(--color-success)',
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                        <div style={{ fontWeight: 700 }}>{orgSuccess}</div>
                      </div>
                    )}

                    {/* Action Button: Verify & Continue */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={verifying}
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '12px 24px',
                          fontSize: '0.94rem',
                          fontWeight: 700,
                        }}
                      >
                        {verifying ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Verifying Organization...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={18} />
                            <span>Verify & Continue</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleContinueAnonymous}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Skip verification and continue anonymously
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-secondary)',
                        border: '1.5px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, color: 'var(--color-primary)' }}>
                        <EyeOff size={18} />
                        <span>Anonymous Reporting Notice</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                        Anonymous reporting is 100% confidential. You are not required to provide an Employee ID, College ID, name, or email. Please note that anonymous reporting may limit the ability of the Internal Committee (IC) to verify your organizational affiliation.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleContinueAnonymous}
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '12px 24px',
                          fontSize: '0.94rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>Continue to Complaint Form</span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrgVerificationMode('verify')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        &larr; Switch to Organization Verification
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 1: REPORTING PREFERENCE
                ══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Reporting Preference
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    Choose how you would like to submit this complaint.
                  </p>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Choose reporting preference"
                  style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}
                >
                  {/* Card A: Anonymous Reporting */}
                  <div
                    role="radio"
                    aria-checked={isAnonymous === true}
                    tabIndex={0}
                    onClick={() => form1.setValue('isAnonymous', true)}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        form1.setValue('isAnonymous', true);
                      }
                    }}
                    style={{
                      border: isAnonymous === true ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: isAnonymous === true ? 'var(--color-soft-pink)' : 'var(--color-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      outline: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: isAnonymous === true ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <EyeOff size={22} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                          Anonymous Reporting
                        </span>
                        {/* Custom Radio Circle */}
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: isAnonymous === true ? '6px solid var(--color-primary)' : '2px solid var(--color-border)',
                            background: '#ffffff',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                        Submit a report without providing your name or contact details, where anonymous reporting is supported.
                      </p>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        • Generates a private Case ID and Recovery Code. No name or phone number is collected.
                      </div>
                    </div>
                  </div>

                  {/* Card B: Identified Reporting */}
                  <div
                    role="radio"
                    aria-checked={isAnonymous === false}
                    tabIndex={0}
                    onClick={() => form1.setValue('isAnonymous', false)}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        form1.setValue('isAnonymous', false);
                      }
                    }}
                    style={{
                      border: isAnonymous === false ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: isAnonymous === false ? 'var(--color-soft-pink)' : 'var(--color-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      outline: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: isAnonymous === false ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UserCheck size={22} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                          Identified Reporting
                        </span>
                        {/* Custom Radio Circle */}
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: isAnonymous === false ? '6px solid var(--color-primary)' : '2px solid var(--color-border)',
                            background: '#ffffff',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                        Provide the necessary contact details if you would like authorized staff to contact you regarding your report.
                      </p>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        • Enables authorized committee members to verify details and coordinate protective relief.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Identified Contact Inputs */}
                {!isAnonymous && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        marginBottom: 24,
                        padding: '20px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        Contact Details for Committee Follow-Up:
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                          <label className="form-label" style={{ margin: 0 }}>Full Name *</label>
                          <VoiceInputButton
                            value={form1.watch('reporterName') || ''}
                            onChange={newText => {
                              form1.setValue('reporterName', newText, { shouldDirty: true });
                              setStep1Data(prev => ({ ...prev, reporterName: newText }));
                            }}
                            fieldName="reporter name"
                            size="sm"
                            compact
                          />
                        </div>
                        <input
                          className="form-input"
                          {...form1.register('reporterName')}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="form-label">Email Address (Optional)</label>
                        <input
                          className="form-input"
                          type="email"
                          {...form1.register('reporterEmail')}
                          placeholder="name@example.com"
                        />
                        {form1.formState.errors.reporterEmail && (
                          <p className="form-error">{form1.formState.errors.reporterEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Phone Number (Optional)</label>
                        <input
                          className="form-input"
                          {...form1.register('reporterPhone')}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Navigation Controls - Step 1 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border)',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Step 1 of 5
                  </span>

                  <button
                    type="button"
                    onClick={handleStep1}
                    className="btn btn-primary"
                    style={{ minWidth: 160, justifyContent: 'center', padding: '10px 24px' }}
                    id="step1-continue-btn"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 2: INCIDENT DETAILS
                ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Incident Details
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    Tell us about what happened. Provide as much detail as you are comfortable sharing.
                  </p>
                </div>

                <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label className="form-label">Incident Category *</label>
                    <select className="form-select" {...form2.register('incidentCategory')}>
                      <option value="">Select a category</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {form2.formState.errors.incidentCategory && (
                      <p className="form-error">{form2.formState.errors.incidentCategory.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Date of Incident (if known)</label>
                    <input
                      className="form-input"
                      type="date"
                      {...form2.register('incidentDate')}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <label className="form-label" style={{ margin: 0 }}>Description *</label>
                      <VoiceInputButton
                        value={form2.watch('description') || ''}
                        onChange={newText => {
                          form2.setValue('description', newText, { shouldValidate: true, shouldDirty: true });
                          setStep2Data(prev => ({ ...prev, description: newText }));
                        }}
                        fieldName="incident description"
                        defaultLanguage={form2.watch('preferredLanguage') === 'hi' ? 'hi-IN' : 'en-IN'}
                      />
                    </div>
                    <textarea
                      className="form-textarea"
                      {...form2.register('description')}
                      placeholder="Describe what happened in as much detail as you feel comfortable sharing (minimum 20 characters)... You can type or click the microphone to speak."
                      rows={6}
                    />
                    {form2.formState.errors.description && (
                      <p className="form-error">{form2.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <label className="form-label" style={{ margin: 0 }}>Location (Optional)</label>
                      <VoiceInputButton
                        value={form2.watch('location') || ''}
                        onChange={newText => {
                          form2.setValue('location', newText, { shouldDirty: true });
                          setStep2Data(prev => ({ ...prev, location: newText }));
                        }}
                        fieldName="incident location"
                        size="sm"
                        compact
                      />
                    </div>
                    <input
                      className="form-input"
                      {...form2.register('location')}
                      placeholder="e.g. Office branch, department, or online platform"
                    />
                  </div>

                  <div>
                    <label className="form-label">Preferred Language for Assistance</label>
                    <select className="form-select" {...form2.register('preferredLanguage')}>
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>

                  {/* Form Navigation Controls - Step 2 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTop: '1px solid var(--color-border)',
                      gap: 12,
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn btn-secondary"
                      style={{ padding: '10px 20px' }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                        Step 2 of 5
                      </span>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ minWidth: 140, justifyContent: 'center', padding: '10px 22px' }}
                      >
                        Continue <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 3: SUPPORT REQUIRED
                ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Support Required
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    Select the type of support you are looking for. You may select multiple options.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {SUPPORT_OPTIONS.map(opt => {
                    const selected = step3Data.supportRequired.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        onClick={() => toggleSupport(opt.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          padding: '16px 18px',
                          borderRadius: 'var(--radius-lg)',
                          border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          background: selected ? 'var(--color-soft-pink)' : 'var(--color-card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: selected ? 'var(--color-primary)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                            transition: 'all 0.2s',
                          }}
                        >
                          {selected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--color-text-main)', marginBottom: 3 }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    background: step3Data.isUrgent ? 'rgba(217, 45, 53, 0.08)' : 'var(--color-bg-secondary)',
                    border: `1.5px solid ${step3Data.isUrgent ? 'var(--color-emergency)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
                    marginBottom: 24,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onClick={() => setStep3Data(d => ({ ...d, isUrgent: !d.isUrgent }))}
                >
                  <input
                    type="checkbox"
                    checked={step3Data.isUrgent}
                    onChange={e => setStep3Data(d => ({ ...d, isUrgent: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-emergency)', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: step3Data.isUrgent ? 'var(--color-emergency)' : 'var(--color-text-main)' }}>
                      Mark as Urgent Request
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      Prioritize expedited contact with safety channels or distress counsellors.
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Specific Support & Accommodation Details (Optional)
                    </label>
                    <VoiceInputButton
                      value={step3Data.supportNotes || ''}
                      onChange={newText => setStep3Data(d => ({ ...d, supportNotes: newText }))}
                      fieldName="support accommodation notes"
                      defaultLanguage={form2.watch('preferredLanguage') === 'hi' ? 'hi-IN' : 'en-IN'}
                    />
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe specific accommodations or safety arrangements required (e.g., relocation, timing adjustments, counselling preferences)... You can type or click the microphone to speak."
                    value={step3Data.supportNotes || ''}
                    onChange={e => setStep3Data(d => ({ ...d, supportNotes: e.target.value }))}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                    Helps the internal committee and counsellor prepare appropriate accommodations.
                  </span>
                </div>

                {/* Form Navigation Controls - Step 3 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border)',
                    gap: 12,
                  }}
                >
                  <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                    <ArrowLeft size={16} /> Back
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                      Step 3 of 5
                    </span>
                    <button
                      type="button"
                      onClick={() => step3Data.supportRequired.length > 0 && nextStep()}
                      className="btn btn-primary"
                      style={{ minWidth: 140, justifyContent: 'center', padding: '10px 22px' }}
                      disabled={step3Data.supportRequired.length === 0}
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 4: EVIDENCE UPLOAD
                ══════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Evidence Upload (Optional)
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    Upload supporting evidence such as screenshots, emails, photos, or audio recordings. This step is optional — you can proceed without files.
                  </p>
                </div>

                <FileUpload files={files} setFiles={setFiles} />

                <div style={{ marginTop: 24, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Evidence Context & Explanatory Notes (Optional)
                    </label>
                    <VoiceInputButton
                      value={evidenceNotes}
                      onChange={setEvidenceNotes}
                      fieldName="evidence context notes"
                      defaultLanguage={form2.watch('preferredLanguage') === 'hi' ? 'hi-IN' : 'en-IN'}
                    />
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide explanatory context about the files, dates, communication channels, or witness names mentioned in documents... You can type or click the microphone to speak."
                    value={evidenceNotes}
                    onChange={e => setEvidenceNotes(e.target.value)}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                    Contextual details help investigators understand chronology and relevance of uploaded materials.
                  </span>
                </div>

                {/* Form Navigation Controls - Step 4 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border)',
                    gap: 12,
                    marginTop: 28,
                  }}
                >
                  <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                    <ArrowLeft size={16} /> Back
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                      Step 4 of 5
                    </span>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      style={{ minWidth: 160, justifyContent: 'center', padding: '10px 22px' }}
                    >
                      {files.length > 0 ? `Continue with ${files.length} file(s)` : 'Continue without files'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 5: REVIEW & SUBMIT
                ══════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Review & Submit
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    Review your complaint before submitting. Once submitted, you cannot modify the details directly.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {[
                    ['Organization Affiliation', verifiedOrg ? `Verified — ${verifiedOrg.organizationName} (${verifiedOrg.organizationType === 'employee' ? 'Company Employee' : 'College Student'})` : 'Unverified (Anonymous / General Reporting)'],
                    ['Reporting Preference', step1Data.isAnonymous ? 'Anonymous Reporting (No personal identity recorded)' : `Identified — ${step1Data.reporterName || 'Name provided'}`],
                    ['Incident Category', CATEGORIES.find(c => c.value === step2Data.incidentCategory)?.label || 'Not specified'],
                    ['Incident Date', step2Data.incidentDate || 'Not specified'],
                    ['Location', step2Data.location || 'Not specified'],
                    ['Support Selected', step3Data.supportRequired.map(s => SUPPORT_OPTIONS.find(o => o.value === s)?.label || s).join(', ')],
                    ['Urgency Flag', step3Data.isUrgent ? 'Marked as Urgent' : 'Standard Priority'],
                    ['Attached Files', files.length > 0 ? `${files.length} file(s) attached` : 'None'],
                    ...(step3Data.supportNotes ? [['Specific Support Notes', step3Data.supportNotes]] : []),
                    ...(evidenceNotes ? [['Evidence Context Notes', evidenceNotes]] : []),
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', minWidth: 170, color: 'var(--color-text-main)' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', flex: 1 }}>
                        {value}
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6, color: 'var(--color-text-main)' }}>
                      Incident Description:
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {step2Data.description}
                    </p>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    AI/ML-ASSISTED LEGAL CATEGORY & APPLICABLE LAW
                    ═════════════════════════════════════════════════════════════ */}
                <div
                  style={{
                    margin: '18px 0 24px',
                    padding: '22px 24px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1.5px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: 'var(--color-soft-pink)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Scale size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                          AI/ML-Assisted Legal Category & Applicable Law
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                          Preliminary advisory framework analysis based on reported facts
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {legalAssessment && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            background:
                              legalAssessment.status === 'ADDITIONAL_INFORMATION_NEEDED'
                                ? 'rgba(217, 119, 6, 0.12)'
                                : legalAssessment.status === 'NO_SPECIFIC_MATCH_IDENTIFIED'
                                  ? 'rgba(107, 114, 128, 0.12)'
                                  : 'rgba(22, 133, 107, 0.12)',
                            color:
                              legalAssessment.status === 'ADDITIONAL_INFORMATION_NEEDED'
                                ? '#B45309'
                                : legalAssessment.status === 'NO_SPECIFIC_MATCH_IDENTIFIED'
                                  ? '#4B5563'
                                  : '#16856B',
                            border:
                              legalAssessment.status === 'ADDITIONAL_INFORMATION_NEEDED'
                                ? '1px solid rgba(217, 119, 6, 0.3)'
                                : '1px solid rgba(22, 133, 107, 0.3)',
                          }}
                        >
                          {legalAssessment.status === 'ADDITIONAL_INFORMATION_NEEDED'
                            ? 'Clarification Needed'
                            : legalAssessment.status === 'NO_SPECIFIC_MATCH_IDENTIFIED'
                              ? 'Uncategorized'
                              : 'Preliminary Advisory'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={fetchAssessment}
                        disabled={loadingAssessment}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Refresh legal analysis"
                      >
                        <RefreshCw size={12} className={loadingAssessment ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loadingAssessment && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                      <Sparkles size={20} color="var(--color-primary)" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                      Analyzing reported conduct with verified Indian legal knowledge base…
                    </div>
                  )}

                  {/* Error State */}
                  {!loadingAssessment && assessmentError && (
                    <div style={{ padding: '12px 16px', background: 'var(--color-card)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                      <Info size={16} color="var(--color-primary)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                      {assessmentError}
                    </div>
                  )}

                  {/* Assessment Body */}
                  {!loadingAssessment && legalAssessment && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* 1. Suggested Incident Category */}
                      <div
                        style={{
                          padding: '14px 16px',
                          background: 'var(--color-card)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em', marginBottom: 4 }}>
                          Suggested Incident Category
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 4 }}>
                          {legalAssessment.incidentCategory.label}
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {legalAssessment.incidentCategory.explanation}
                        </p>

                        {legalAssessment.additionalCategories && legalAssessment.additionalCategories.length > 0 && (
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Additional Categories Identified: </span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              {legalAssessment.additionalCategories.map((c, ci) => (
                                <span key={ci} style={{ fontSize: '0.74rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--color-soft-pink)', color: 'var(--color-primary)' }}>
                                  {c.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Potentially Relevant Legal Frameworks & Verified Provisions */}
                      {legalAssessment.potentiallyRelevantFrameworks && legalAssessment.potentiallyRelevantFrameworks.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: 10 }}>
                            Potentially Relevant Legal Frameworks & Verified Provisions to Review
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {legalAssessment.potentiallyRelevantFrameworks.map((fw, fwi) => (
                              <div
                                key={fwi}
                                style={{
                                  padding: '16px',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'var(--color-card)',
                                  border: '1.5px solid var(--color-border)',
                                }}
                              >
                                {/* Act Name */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                  <div>
                                    <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                                      {fw.actName}
                                    </h4>
                                    {fw.statute && (
                                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 1 }}>
                                        {fw.statute}
                                      </div>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                                    {fw.applicabilityStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {/* Why This May Apply */}
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', lineHeight: 1.5, marginBottom: 12 }}>
                                  <strong>Why This May Apply:</strong> {fw.reason}
                                </div>

                                {/* Verified Provisions to Review */}
                                {fw.candidateProvisions && fw.candidateProvisions.length > 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                                      Verified Provisions to Review:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {fw.candidateProvisions.map((prov, pi) => (
                                        <div
                                          key={pi}
                                          style={{
                                            padding: '10px 12px',
                                            borderRadius: 6,
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '0.8rem',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                                              {prov.section} — {prov.title}
                                            </span>
                                            {prov.officialSource && (
                                              <a
                                                href={prov.officialSource}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.7rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
                                              >
                                                India Code <ExternalLink size={10} />
                                              </a>
                                            )}
                                          </div>
                                          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                                            {prov.summary}
                                          </p>
                                          {prov.applicabilityCondition && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-main)', marginTop: 4, fontStyle: 'italic' }}>
                                              <strong>Applicability Condition:</strong> {prov.applicabilityCondition}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Official Sources */}
                                {fw.officialSources && fw.officialSources.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.74rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>Official Sources:</span>
                                    {fw.officialSources.map((src, si) => (
                                      <a
                                        key={si}
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: 'var(--color-primary)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 3,
                                          textDecoration: 'none',
                                          background: 'var(--color-bg-secondary)',
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          border: '1px solid var(--color-border)',
                                        }}
                                      >
                                        <BookOpen size={10} />
                                        {src.name}
                                        <ExternalLink size={9} />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Additional Information Needed */}
                      {legalAssessment.additionalInformationNeeded && legalAssessment.additionalInformationNeeded.length > 0 && (
                        <div
                          style={{
                            padding: '14px 16px',
                            background: 'var(--color-card)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#B45309', marginBottom: 6 }}>
                            <HelpCircle size={15} />
                            Additional Information Needed to Assess Applicability:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {legalAssessment.additionalInformationNeeded.map((item, ii) => (
                              <li key={ii}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 4. Mandatory Disclaimer */}
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(218, 59, 94, 0.06)',
                          borderLeft: '3px solid var(--color-primary)',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '0.76rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Disclaimer:</strong> {legalAssessment.disclaimer}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div
                    className="badge badge-emergency"
                    style={{
                      width: '100%',
                      marginBottom: 20,
                      justifyContent: 'center',
                      padding: 12,
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form Navigation Controls - Step 5 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border)',
                    gap: 12,
                  }}
                >
                  <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                    <ArrowLeft size={16} /> Back
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                      Step 5 of 5
                    </span>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="btn btn-primary"
                      style={{ minWidth: 180, justifyContent: 'center', padding: '10px 24px', fontWeight: 700 }}
                      disabled={submitting}
                      id="submit-complaint-btn"
                    >
                      {submitting ? 'Submitting…' : '✓ Submit Complaint'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 6: SUBMISSION SUCCESS SCREEN
                ══════════════════════════════════════════════════════════════ */}
            {step === 6 && result && (
              <motion.div
                key="step6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SuccessScreen result={result} verifiedOrg={verifiedOrg} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
