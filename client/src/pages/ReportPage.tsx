import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield, Upload, CheckCircle2, AlertTriangle, X, FileText, Copy,
  ArrowRight, ArrowLeft, UserCheck, EyeOff, Check,
  Scale, Lock, Edit2
} from 'lucide-react';
import {
  submitReport,
  fetchLegalAssessment,
  type ReportSubmissionPayload
} from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────
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
  status: string;
  incidentCategory: {
    label: string;
    explanation: string;
  };
  potentiallyRelevantFrameworks: PotentiallyRelevantFramework[];
  additionalInformationNeeded: string[];
  disclaimer: string;
}

interface SubmissionResult {
  caseId: string;
  recoveryCode: string;
  submittedAt: string;
}

const ALLOWED_INCIDENT_CATEGORIES = [
  'sexual_harassment',
  'workplace_harassment',
  'cyber_crime',
  'discrimination',
  'other',
] as const;

type AllowedIncidentCategory = typeof ALLOWED_INCIDENT_CATEGORIES[number];

const CATEGORIES: { value: AllowedIncidentCategory; label: string; desc: string }[] = [
  {
    value: 'sexual_harassment',
    label: 'Workplace Sexual Harassment (POSH)',
    desc: 'Unwelcome physical, verbal, non-verbal sexual conduct, sexually colored remarks, or quid pro quo demands.',
  },
  {
    value: 'workplace_harassment',
    label: 'Workplace Harassment / Bullying',
    desc: 'Persistent hostility, intimidation, humiliation, professional sabotage, or hostile working environment.',
  },
  {
    value: 'cyber_crime',
    label: 'Cyber Crime & Online Harassment',
    desc: 'Harassment via digital platforms, emails, chats, unauthorized image sharing, or non-consensual tracking.',
  },
  {
    value: 'discrimination',
    label: 'Gender Discrimination',
    desc: 'Bias in hiring, promotions, wages, or assignments based on gender, pregnancy, or marital status.',
  },
  {
    value: 'other',
    label: 'Other Workplace Grievances',
    desc: 'Any other safety concern, retaliation threat, or misconduct occurring within your work or campus environment.',
  },
];

const SUPPORT_OPTIONS = [
  {
    value: 'formal_complaint',
    label: 'Formal IC Inquiry Proceedings',
    desc: 'Initiate formal inquiry proceedings with the Internal Committee (IC) under Section 11 of the POSH Act.',
  },
  {
    value: 'counselling',
    label: 'Counselling & Mental Health Support',
    desc: 'Access confidential psychosocial support, trauma-informed guidance, and professional mental health counsellors.',
  },
  {
    value: 'legal_info',
    label: 'Statutory Legal Guidance & Aid',
    desc: 'Understand your statutory rights under the POSH Act, BNS, and connect with free legal aid resources.',
  },
  {
    value: 'documentation',
    label: 'Evidence Documentation & Timestamping',
    desc: 'Securely record an immutable timeline of this incident for future official or legal proceedings.',
  },
  {
    value: 'urgent_safety',
    label: 'Urgent Safety Safeguards & Accommodations',
    desc: 'Request immediate workplace accommodations, transfer, leave, or restraint of the respondent from approaching.',
  },
];

const STEP_LABELS = [
  'Reporting Preference',
  'Incident Details',
  'Evidence & Support',
  'Review & Submit',
];

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────
const step1Schema = z.object({
  isAnonymous: z.boolean(),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  reporterPhone: z.string().optional(),
}).refine(data => {
  if (!data.isAnonymous) {
    return !!data.reporterName && data.reporterName.trim().length > 0;
  }
  return true;
}, {
  message: 'Full name is required when filing an identified report.',
  path: ['reporterName'],
}).refine(data => {
  if (!data.isAnonymous) {
    return !!data.reporterEmail && data.reporterEmail.trim().length > 0;
  }
  return true;
}, {
  message: 'Email address is required when filing an identified report.',
  path: ['reporterEmail'],
});

const step2Schema = z.object({
  incidentCategory: z.enum(ALLOWED_INCIDENT_CATEGORIES, {
    message: 'Please select an incident category',
  }),
  incidentDate: z.string().optional(),
  organizationDetails: z.string().optional(),
  employeeOrCollegeId: z.string().optional(),
  description: z.string().min(20, 'Please provide at least 20 characters for sufficient detail'),
  location: z.string().optional(),
  preferredLanguage: z.string().default('en'),
});

const step3Schema = z.object({
  supportRequired: z.array(z.string()).default([]),
  supportNotes: z.string().optional(),
  evidenceNotes: z.string().optional(),
  isUrgent: z.boolean().default(false),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ─── STEP INDICATOR COMPONENT ────────────────────────────────────────────────
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
                  width: 120,
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
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? 'var(--color-primary)'
                      : isCompleted
                        ? 'var(--color-text-main)'
                        : 'var(--color-text-secondary)',
                    lineHeight: 1.25,
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
    </div>
  );
}

// ─── FILE UPLOAD COMPONENT ────────────────────────────────────────────────────
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
          padding: '32px 20px',
          textAlign: 'center',
          background: dragging ? 'var(--color-soft-pink)' : 'var(--color-bg-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--color-soft-pink)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Upload size={22} />
        </div>
        <p style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 4, fontSize: '0.94rem' }}>
          Drop evidence files here or click to browse
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: 460, margin: '0 auto' }}>
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
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Selected Files ({files.length}/5):
          </div>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <FileText size={17} color="var(--color-primary)" />
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
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
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUCCESS SCREEN COMPONENT ────────────────────────────────────────────────
function SuccessScreen({ result }: { result: SubmissionResult }) {
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
      style={{ textAlign: 'center', padding: '16px 0' }}
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
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: 28, maxWidth: 540, margin: '0 auto 28px' }}>
        Your report has been securely registered in the system. Save your confidential Report ID and Recovery Key below to track investigation progress.
      </p>

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

// ─── MAIN REPORTPAGE COMPONENT ───────────────────────────────────────────────
export default function ReportPage() {
  // Current active step (1 to 4 for form steps, 5 for success screen)
  const [step, setStep] = useState(1);

  // Form step data states
  const [step1Data, setStep1Data] = useState<Step1Data>({ isAnonymous: true });
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({
    preferredLanguage: 'en',
    description: '',
  });
  const [step3Data, setStep3Data] = useState<Step3Data>({
    supportRequired: ['formal_complaint'],
    isUrgent: false,
    supportNotes: '',
    evidenceNotes: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Legal Assessment state
  const [legalAssessment, setLegalAssessment] = useState<LegalAssessment | null>(null);
  const [, setLoadingAssessment] = useState(false);

  // Step 1 Form
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { isAnonymous: true },
    values: step1Data,
  });

  // Step 2 Form
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      preferredLanguage: 'en',
      incidentCategory: (step2Data.incidentCategory as AllowedIncidentCategory) || undefined,
      description: step2Data.description || '',
      incidentDate: step2Data.incidentDate || '',
      organizationDetails: step2Data.organizationDetails || '',
      employeeOrCollegeId: step2Data.employeeOrCollegeId || '',
      location: step2Data.location || '',
    },
    values: step2Data.description !== undefined ? (step2Data as Step2Data) : undefined,
  });

  // Fetch preliminary legal assessment on review step
  useEffect(() => {
    if (step === 4 && step2Data.description && step2Data.incidentCategory) {
      setLoadingAssessment(true);
      fetchLegalAssessment({
        description: step2Data.description,
        incidentCategory: step2Data.incidentCategory,
        preferredLanguage: step2Data.preferredLanguage || 'en',
        contextType: 'workplace',
        targetMinor: false,
        isOnline: step2Data.incidentCategory === 'cyber_crime',
      })
        .then(res => setLegalAssessment(res))
        .catch(() => {})
        .finally(() => setLoadingAssessment(false));
    }
  }, [step, step2Data.description, step2Data.incidentCategory, step2Data.preferredLanguage]);

  // Stepper navigation helpers
  const goToStep = (s: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s);
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s + 1);
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.max(1, s - 1));
  };

  // Step 1 Submit
  const handleStep1 = form1.handleSubmit(data => {
    setStep1Data(data);
    nextStep();
  });

  // Step 2 Submit
  const handleStep2 = form2.handleSubmit(data => {
    setStep2Data(data);
    nextStep();
  });

  // Step 3 Submit
  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  // Step 4 Final Submit
  const handleFinalSubmit = async () => {
    if (!step2Data.incidentCategory || !step2Data.description) return;
    setSubmitting(true);
    setError('');

    try {
      const combinedDescription = [
        step2Data.description,
        step3Data.supportNotes ? `[Specific Support / Accommodation Notes: ${step3Data.supportNotes}]` : null,
        step3Data.evidenceNotes ? `[Evidence Notes & Descriptions: ${step3Data.evidenceNotes}]` : null,
      ].filter(Boolean).join('\n\n');

      const fullLocation = [
        step2Data.organizationDetails,
        step2Data.location,
      ].filter(Boolean).join(' • ');

      const payload: ReportSubmissionPayload = {
        isAnonymous: step1Data.isAnonymous,
        reporterName: step1Data.isAnonymous ? undefined : step1Data.reporterName,
        reporterEmail: step1Data.isAnonymous ? undefined : step1Data.reporterEmail,
        reporterPhone: step1Data.isAnonymous ? undefined : step1Data.reporterPhone,
        incidentCategory: step2Data.incidentCategory,
        incidentDate: step2Data.incidentDate || undefined,
        location: fullLocation || undefined,
        employeeOrCollegeId: step2Data.employeeOrCollegeId?.trim() || undefined,
        description: combinedDescription,
        preferredLanguage: step2Data.preferredLanguage || 'en',
        supportRequired: step3Data.supportRequired.length > 0 ? step3Data.supportRequired : ['formal_complaint'],
        isUrgent: step3Data.isUrgent,
      };

      const res = await submitReport(payload, files);
      setResult(res);
      setStep(5);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.friendlyMessage;
      let displayMessage = '';
      if (!err?.response) {
        displayMessage = 'Unable to connect to the backend server. The server may be starting up. Please check your internet connection and retry.';
      } else if (err.response.status === 405) {
        displayMessage = 'API routing error (405 Method Not Allowed). The request was intercepted by static routing instead of reaching the backend API.';
      } else if (err.response.status === 503) {
        displayMessage = serverMessage || 'Database service is currently connecting or unavailable. Please try again in a few moments.';
      } else if (err.response.status === 400) {
        displayMessage = serverMessage || 'Some required fields were invalid. Please review your complaint details.';
      } else {
        displayMessage = serverMessage || 'Failed to submit report. Please check your connection and try again.';
      }
      setError(displayMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        padding: '36px 16px 80px',
        color: 'var(--color-text-main)',
      }}
      role="main"
      aria-label="Incident Reporting Portal"
    >
      <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="icon-container"
            style={{
              margin: '0 auto 14px',
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              fontSize: '0.94rem',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Your report is strictly protected under statutory confidentiality standards. Complete the simple 4-step intake below.
          </p>
        </div>

        {/* Step Progress Indicator (Steps 1-4) */}
        {step >= 1 && step <= 4 && <StepIndicator current={step} total={4} />}

        {/* Main Form Container */}
        <div
          className="card"
          style={{
            maxWidth: 820,
            width: '100%',
            margin: '0 auto',
            padding: 'clamp(22px, 3.5vw, 36px)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-card)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <AnimatePresence mode="wait">
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
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Step 1: Choose Your Reporting Preference
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                    Decide whether to file anonymously or provide your contact details for direct committee follow-up.
                  </p>
                </div>

                <form onSubmit={handleStep1}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {/* Option A: Anonymous */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => form1.setValue('isAnonymous', true)}
                      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') form1.setValue('isAnonymous', true); }}
                      style={{
                        border: form1.watch('isAnonymous') ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: form1.watch('isAnonymous') ? 'var(--color-soft-pink)' : 'var(--color-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '22px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: form1.watch('isAnonymous') ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <EyeOff size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                            File Anonymously
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                            100% Confidential
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        No personal identifying information (name, phone, email) is stored or shared with your employer. You will receive a secure Report ID and Recovery Key to track progress.
                      </p>
                    </div>

                    {/* Option B: Identified */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => form1.setValue('isAnonymous', false)}
                      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') form1.setValue('isAnonymous', false); }}
                      style={{
                        border: !form1.watch('isAnonymous') ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: !form1.watch('isAnonymous') ? 'var(--color-soft-pink)' : 'var(--color-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '22px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: !form1.watch('isAnonymous') ? 'var(--color-card)' : 'var(--color-bg-secondary)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <UserCheck size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                            File with Contact Details
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                            Direct Follow-up
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        Provide your details so the Internal Complaints Committee (ICC) can directly reach out to schedule confidential inquiry hearings and share formal notifications.
                      </p>
                    </div>
                  </div>

                  {/* Identifying inputs (when Option B is chosen) */}
                  {!form1.watch('isAnonymous') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: '20px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        marginBottom: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lock size={15} /> Your Contact Information (Kept confidential by the IC)
                      </div>

                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', marginBottom: 6 }}>
                          Full Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                        </label>
                        <input
                          type="text"
                          {...form1.register('reporterName')}
                          placeholder="e.g., Priya Sharma"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                        {form1.formState.errors.reporterName && (
                          <p style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', marginTop: 4 }}>
                            {form1.formState.errors.reporterName.message}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', marginBottom: 6 }}>
                            Email Address <span style={{ color: 'var(--color-primary)' }}>*</span>
                          </label>
                          <input
                            type="email"
                            {...form1.register('reporterEmail')}
                            placeholder="e.g., priya.sharma@example.com"
                            className="form-input"
                            style={{ width: '100%' }}
                          />
                          {form1.formState.errors.reporterEmail && (
                            <p style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', marginTop: 4 }}>
                              {form1.formState.errors.reporterEmail.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', marginBottom: 6 }}>
                            Phone Number (Optional)
                          </label>
                          <input
                            type="tel"
                            {...form1.register('reporterPhone')}
                            placeholder="e.g., +91 98765 43210"
                            className="form-input"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ minWidth: 190, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      id="step1-continue-btn"
                    >
                      <span>Continue to Incident Details</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
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
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Step 2: Incident Details
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                    Provide specifics regarding what occurred. You may also enter your optional Employee/College ID below.
                  </p>
                </div>

                <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Category Selection */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 8 }}>
                      Incident Category <span style={{ color: 'var(--color-primary)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {CATEGORIES.map(cat => {
                        const selected = form2.watch('incidentCategory') === cat.value;
                        return (
                          <div
                            key={cat.value}
                            role="button"
                            tabIndex={0}
                            onClick={() => form2.setValue('incidentCategory', cat.value)}
                            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') form2.setValue('incidentCategory', cat.value); }}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: selected ? 'var(--color-soft-pink)' : 'var(--color-card)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: selected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                {cat.label}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {cat.desc}
                              </div>
                            </div>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: selected ? '6px solid var(--color-primary)' : '2px solid var(--color-border)',
                                background: '#fff',
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {form2.formState.errors.incidentCategory && (
                      <p style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', marginTop: 4 }}>
                        {form2.formState.errors.incidentCategory.message}
                      </p>
                    )}
                  </div>

                  {/* Date & Location Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label htmlFor="incident-date-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                        Approximate Date of Incident
                      </label>
                      <input
                        id="incident-date-input"
                        type="date"
                        {...form2.register('incidentDate')}
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="incident-location-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                        Workplace / Campus Location
                      </label>
                      <input
                        id="incident-location-input"
                        type="text"
                        {...form2.register('location')}
                        placeholder="e.g. 4th Floor Conference Room, Cafeteria, or Remote/Zoom"
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Organization Name & Optional Employee/College ID Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label htmlFor="organization-details-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                        Organization / College Name (Optional)
                      </label>
                      <input
                        id="organization-details-input"
                        type="text"
                        {...form2.register('organizationDetails')}
                        placeholder="e.g., Apex Global Technologies or Delhi University"
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                      <p style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: 4, margin: '4px 0 0' }}>
                        Helps route the complaint to the appropriate Internal Complaints Committee.
                      </p>
                    </div>

                    {/* ─── REQUIRED EMPLOYEE ID / COLLEGE ID OPTIONAL FIELD ─── */}
                    <div>
                      <label
                        htmlFor="employee-or-college-id-input"
                        style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}
                      >
                        Employee ID / College ID
                      </label>
                      <input
                        id="employee-or-college-id-input"
                        type="text"
                        {...form2.register('employeeOrCollegeId')}
                        placeholder="Enter your Employee ID or College ID (optional)"
                        className="form-input"
                        style={{ width: '100%' }}
                        autoComplete="off"
                      />
                      <p style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: 4, margin: '4px 0 0', lineHeight: 1.4 }}>
                        Provide your ID if you feel comfortable. Do not enter passwords or other sensitive credentials.
                      </p>
                    </div>
                  </div>

                  {/* Incident Description with Voice Input */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label htmlFor="incident-description-input" style={{ fontWeight: 700, fontSize: '0.86rem', margin: 0 }}>
                        Incident Description <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <VoiceInputButton
                        value={form2.watch('description') || ''}
                        onChange={val => form2.setValue('description', val, { shouldValidate: true })}
                        fieldName="Incident Description"
                        defaultLanguage="en-IN"
                      />
                    </div>
                    <textarea
                      id="incident-description-input"
                      rows={5}
                      {...form2.register('description')}
                      placeholder="Describe what occurred with as much objective detail as you are comfortable sharing (dates, specific words, conduct, witnesses)..."
                      className="form-input"
                      style={{ width: '100%', resize: 'vertical', lineHeight: 1.55 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      {form2.formState.errors.description ? (
                        <p style={{ color: 'var(--color-emergency)', fontSize: '0.78rem', margin: 0 }}>
                          {form2.formState.errors.description.message}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                          Minimum 20 characters required for preliminary triage.
                        </p>
                      )}
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                        {(form2.watch('description') || '').length} characters
                      </span>
                    </div>
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label htmlFor="preferred-language-select" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                      Preferred Language for Written Communication
                    </label>
                    <select
                      id="preferred-language-select"
                      {...form2.register('preferredLanguage')}
                      className="form-input"
                      style={{ width: '100%', maxWidth: 300 }}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="mr">Marathi (मराठी)</option>
                      <option value="gu">Gujarati (ગુજરાતી)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                    <button type="button" onClick={prevStep} className="btn btn-secondary">
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ minWidth: 190, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      id="step2-continue-btn"
                    >
                      <span>Continue to Evidence & Support</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 3: EVIDENCE AND SUPPORT
                ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Step 3: Evidence and Support Preferences
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                    Optionally attach supporting evidence and let us know what assistance or safety safeguards you require.
                  </p>
                </div>

                <form onSubmit={handleStep3} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Evidence Preservation Notice */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-soft-pink)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Shield size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                      <strong style={{ color: 'var(--color-primary)' }}>Best Practice for Evidence Preservation:</strong>
                      <p style={{ margin: '4px 0 0' }}>
                        Take full unedited screenshots displaying date, time, and sender details. Preserve original email headers or chat exports. Evidence upload is completely optional and can also be submitted later to the committee.
                      </p>
                    </div>
                  </div>

                  {/* File Upload Component */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 8 }}>
                      Upload Supporting Documents / Screenshots (Optional)
                    </label>
                    <FileUpload files={files} setFiles={setFiles} />
                  </div>

                  {/* Evidence Notes */}
                  <div>
                    <label htmlFor="evidence-notes-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                      Evidence Notes & Descriptions (Optional)
                    </label>
                    <input
                      id="evidence-notes-input"
                      type="text"
                      value={step3Data.evidenceNotes || ''}
                      onChange={e => setStep3Data(prev => ({ ...prev, evidenceNotes: e.target.value }))}
                      placeholder="e.g. Screenshot 1 shows WhatsApp messages from Oct 12th; PDF is formal email record"
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Support Requested Options */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', marginBottom: 10 }}>
                      Support & Assistance Preferences
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {SUPPORT_OPTIONS.map(opt => {
                        const checked = step3Data.supportRequired.includes(opt.value);
                        return (
                          <div
                            key={opt.value}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setStep3Data(prev => {
                                const current = prev.supportRequired;
                                const updated = current.includes(opt.value)
                                  ? current.filter(k => k !== opt.value)
                                  : [...current, opt.value];
                                return { ...prev, supportRequired: updated };
                              });
                            }}
                            onKeyDown={e => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                setStep3Data(prev => {
                                  const current = prev.supportRequired;
                                  const updated = current.includes(opt.value)
                                    ? current.filter(k => k !== opt.value)
                                    : [...current, opt.value];
                                  return { ...prev, supportRequired: updated };
                                });
                              }
                            }}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              border: checked ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: checked ? 'var(--color-soft-pink)' : 'var(--color-card)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: checked ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                {opt.label}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {opt.desc}
                              </div>
                            </div>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                border: checked ? 'none' : '2px solid var(--color-border)',
                                background: checked ? 'var(--color-primary)' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {checked && <Check size={14} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urgent Danger Checkbox */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(217, 45, 53, 0.05)',
                      border: '1px solid rgba(217, 45, 53, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <input
                      id="urgent-safety-checkbox"
                      type="checkbox"
                      checked={step3Data.isUrgent}
                      onChange={e => setStep3Data(prev => ({ ...prev, isUrgent: e.target.checked }))}
                      style={{ marginTop: 3, width: 17, height: 17, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    <label htmlFor="urgent-safety-checkbox" style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', cursor: 'pointer', lineHeight: 1.5 }}>
                      <strong>Acute / Urgent Safety Flag:</strong> I am reporting an ongoing threat, stalking, physical force, or urgent retaliation that requires immediate safeguarding intervention.
                    </label>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                    <button type="button" onClick={prevStep} className="btn btn-secondary">
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ minWidth: 190, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      id="step3-continue-btn"
                    >
                      <span>Continue to Review & Submit</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 4: REVIEW AND SUBMIT
                ══════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Step 4: Review and Submit Your Complaint
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                    Please review your entered details before submitting. You may click Edit on any section to make adjustments.
                  </p>
                </div>

                {/* Review Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  {/* Card 1: Reporting Preference */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        1. Reporting Preference
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: '0 0 4px', color: 'var(--color-text-main)' }}>
                      {step1Data.isAnonymous ? 'Anonymous Complaint (Zero personal contact stored)' : `Identified Complaint: ${step1Data.reporterName || 'Complainant'}`}
                    </p>
                    {!step1Data.isAnonymous && step1Data.reporterEmail && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        Email: {step1Data.reporterEmail} {step1Data.reporterPhone ? `• Phone: ${step1Data.reporterPhone}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Card 2: Incident Details */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        2. Incident Details
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Category:</span>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: '2px 0 0' }}>
                          {CATEGORIES.find(c => c.value === step2Data.incidentCategory)?.label || step2Data.incidentCategory}
                        </p>
                      </div>

                      {step2Data.incidentDate && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Date:</span>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '2px 0 0' }}>
                            {new Date(step2Data.incidentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      )}

                      {step2Data.organizationDetails && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Organization:</span>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '2px 0 0' }}>
                            {step2Data.organizationDetails}
                          </p>
                        </div>
                      )}

                      {/* Display optional Employee ID / College ID if provided */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Employee / College ID:</span>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '2px 0 0', color: step2Data.employeeOrCollegeId ? 'var(--color-text-main)' : 'var(--color-text-secondary)' }}>
                          {step2Data.employeeOrCollegeId ? step2Data.employeeOrCollegeId : 'Not provided (Optional)'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Narrative Summary:</span>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', margin: '4px 0 0', lineHeight: 1.55 }}>
                        {step2Data.description}
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Evidence & Support */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        3. Evidence & Support Requested
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>

                    <p style={{ fontSize: '0.86rem', margin: '0 0 6px' }}>
                      <strong>Evidence Files:</strong> {files.length > 0 ? `${files.length} attached file(s)` : 'None attached (Can be shared during inquiry)'}
                    </p>

                    <p style={{ fontSize: '0.86rem', margin: '0 0 4px' }}>
                      <strong>Support Requested:</strong> {step3Data.supportRequired.length > 0 ? step3Data.supportRequired.map(k => SUPPORT_OPTIONS.find(s => s.value === k)?.label || k).join(', ') : 'Standard IC Intake'}
                    </p>

                    {step3Data.isUrgent && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-emergency)', background: 'rgba(217, 45, 53, 0.1)', padding: '3px 8px', borderRadius: 6, marginTop: 6 }}>
                        <AlertTriangle size={13} /> Immediate Safeguarding Requested
                      </span>
                    )}
                  </div>

                  {/* Card 4: Preliminary Legal Assessment Advisory */}
                  {legalAssessment && (
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Scale size={18} color="var(--color-primary)" />
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
                          Statutory Framework Advisory
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                        {legalAssessment.incidentCategory.explanation}
                      </p>
                      {legalAssessment.potentiallyRelevantFrameworks?.map((fw, fIdx) => (
                        <div key={fIdx} style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                          <strong>{fw.shortName || fw.actName}:</strong> {fw.reason}
                        </div>
                      ))}
                      <p style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 8, fontStyle: 'italic', margin: '8px 0 0' }}>
                        {legalAssessment.disclaimer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-soft-pink)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <input
                    id="consent-declaration-checkbox"
                    type="checkbox"
                    checked={consentGiven}
                    onChange={e => setConsentGiven(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="consent-declaration-checkbox" style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', cursor: 'pointer', lineHeight: 1.5 }}>
                    <strong>Statutory Grievance Declaration:</strong> I confirm that the information provided is accurate to the best of my knowledge and consent to it being securely processed under Suraksha Setu&apos;s privacy and POSH grievance intake procedures.
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'rgba(217, 45, 53, 0.08)',
                      border: '1px solid rgba(217, 45, 53, 0.3)',
                      color: 'var(--color-emergency)',
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 20,
                    }}
                    role="alert"
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={prevStep} className="btn btn-secondary" disabled={submitting}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={submitting || !consentGiven}
                    className="btn btn-primary"
                    style={{ minWidth: 200, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
                    id="submit-complaint-btn"
                  >
                    {submitting ? (
                      <span>Submitting to secure intake...</span>
                    ) : (
                      <>
                        <span>✓ Submit Complaint</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 5: SUBMISSION SUCCESS SCREEN
                ══════════════════════════════════════════════════════════════ */}
            {step === 5 && result && (
              <motion.div
                key="step5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SuccessScreen result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
