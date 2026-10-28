import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for standardized error messages
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      error.friendlyMessage = 'Server is currently connecting. Backend is processing or offline.';
    } else {
      error.friendlyMessage = error.response.data?.message || 'An error occurred while communicating with the server.';
    }
    return Promise.reject(error);
  }
);

// ─── REPORT & CASE SUBMISSION ────────────────────────────────────────────────
export interface ReportSubmissionPayload {
  isAnonymous: boolean;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  incidentCategory?: string;
  incidentDate?: string;
  description?: string;
  location?: string;
  preferredLanguage?: string;
  supportRequired?: string[];
  isUrgent?: boolean;
}

export const submitReport = async (payload: ReportSubmissionPayload, files: File[] = []) => {
  // 1. Submit main complaint report
  const res = await api.post('/api/reports/submit', payload);
  const data = res.data;

  // 2. Upload associated evidence files if present
  if (files.length > 0 && data.caseId) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    await api.post(`/api/evidence/${data.caseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).catch(err => {
      console.warn('Evidence file upload warning:', err);
    });
  }

  return data;
};

// ─── CASE TRACKING ────────────────────────────────────────────────────────────
export const trackCase = async (caseId: string, recoveryCode: string, simulateOffline = false) => {
  const headers: Record<string, string> = {};
  if (simulateOffline) {
    headers['x-simulate-offline'] = 'true';
  }
  const res = await api.post('/api/cases/track-lookup', {
    caseId: caseId.trim().toUpperCase(),
    recoveryCode: recoveryCode.trim().toUpperCase(),
  }, { headers });
  return res.data;
};

export const getUserCases = async () => {
  const res = await api.get('/api/user/my-cases');
  return res.data;
};

export const getUserCaseDetails = async (caseId: string) => {
  const res = await api.get(`/api/user/my-cases/${caseId.trim().toUpperCase()}`);
  return res.data;
};

// ─── LEGAL ASSESSMENT ─────────────────────────────────────────────────────────
export interface LegalAssessmentRequest {
  description: string;
  incidentCategory?: string;
  preferredLanguage?: string;
  contextType?: string;
  targetMinor?: boolean;
  isOnline?: boolean;
}

export const fetchLegalAssessment = async (payload: LegalAssessmentRequest) => {
  const res = await api.post('/api/legal-assessment', payload);
  return res.data;
};

// ─── PUBLIC DATA & STATS ──────────────────────────────────────────────────────
export const getPublicStats = async () => {
  const res = await api.get('/api/public/stats');
  return res.data;
};

export const getEmergencyContacts = async () => {
  const res = await api.get('/api/public/emergency-contacts');
  return res.data;
};

// ─── LEGAL FRAMEWORK & AWARENESS ──────────────────────────────────────────────
export const getLegalActs = async () => {
  const res = await api.get('/api/legal/acts');
  return res.data;
};

export const getAwarenessArticles = async () => {
  const res = await api.get('/api/awareness/articles');
  return res.data;
};

export const submitAwarenessSurvey = async (topic: string, responses: any) => {
  const res = await api.post('/api/awareness/surveys/submit', { topic, responses });
  return res.data;
};

// ─── COUNSELLING & SUPPORT ────────────────────────────────────────────────────
export const getSupportCounsellors = async () => {
  const res = await api.get('/api/support/counsellors');
  return res.data;
};

export const bookCounsellingSession = async (bookingData: any) => {
  const res = await api.post('/api/support/book-counselling', bookingData);
  return res.data;
};

// ─── PROOF VAULT ──────────────────────────────────────────────────────────────
export const getProofConsentNotes = async (caseId?: string) => {
  const res = await api.get('/api/proof/consent-notes', { params: { caseId } });
  return res.data;
};

export const createConsentNote = async (data: { caseId?: string; title: string; content: string; recipient?: string }) => {
  const res = await api.post('/api/proof/consent-notes', data);
  return res.data;
};

export const verifyProofChain = async (caseId?: string) => {
  const res = await api.get('/api/proof/verify-chain', { params: { caseId } });
  return res.data;
};

// ─── DASHBOARD & STAFF ACTIONS ────────────────────────────────────────────────
export const getCasesQueue = async (params: { status?: string; priority?: string; verificationStatus?: string; page?: number; limit?: number }) => {
  const res = await api.get('/api/cases', { params });
  return res.data;
};

export const updateCaseStatus = async (caseId: string, status: string, message?: string) => {
  const res = await api.patch(`/api/cases/${caseId}/status`, { status, message });
  return res.data;
};

export const overrideCasePriority = async (caseId: string, newPriority: string, reason: string) => {
  const res = await api.patch(`/api/cases/${caseId}/priority`, { newPriority, reason });
  return res.data;
};

export const verifyEvidenceChecksum = async (evidenceId: string) => {
  const res = await api.get(`/api/evidence/${evidenceId}/verify`);
  return res.data;
};

// ─── PROOF VAULT ZERO-KNOWLEDGE API ───────────────────────────────────────────
export const createVault = async () => {
  const res = await api.post('/api/vault/create');
  return res.data;
};

export const unlockVault = async (vaultId: string, secretKey: string) => {
  const res = await api.post('/api/vault/unlock', { vaultId, secretKey });
  return res.data;
};

export const getVaultMetadata = async (token: string) => {
  const res = await api.get('/api/vault/meta', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const uploadVaultEvidence = async (token: string, formData: FormData) => {
  const res = await api.post('/api/vault/evidence/upload', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const listVaultEvidence = async (token: string) => {
  const res = await api.get('/api/vault/evidence', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const downloadVaultCiphertext = async (token: string, evidenceId: string) => {
  const res = await api.get(`/api/vault/evidence/${evidenceId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'arraybuffer',
  });
  return {
    data: res.data as ArrayBuffer,
    iv: res.headers['x-evidence-iv'] || '',
    digest: res.headers['x-evidence-digest'] || '',
    originalName: decodeURIComponent(res.headers['x-evidence-original-name'] || 'evidence.bin'),
    mimeType: res.headers['x-evidence-mimetype'] || 'application/octet-stream',
  };
};

export const verifyVaultEvidenceIntegrity = async (token: string, evidenceId: string) => {
  const res = await api.post(`/api/vault/evidence/${evidenceId}/verify`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteVaultEvidence = async (token: string, evidenceId: string) => {
  const res = await api.delete(`/api/vault/evidence/${evidenceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getVaultAuditTrail = async (token: string) => {
  const res = await api.get('/api/vault/audit', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const lockVault = async (token: string) => {
  const res = await api.post('/api/vault/lock', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default api;

