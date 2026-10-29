import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token if present
api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('suraksha_staff_token') : null;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// Interceptor for standardized error messages
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      error.friendlyMessage = 'Unable to reach backend server. The service may be starting up or offline. Please check your connection and retry.';
    } else if (error.response.status === 405) {
      error.friendlyMessage = 'API endpoint returned 405 Method Not Allowed. The route was intercepted by static page routing instead of reaching the backend API.';
    } else {
      const serverMsg = typeof error.response.data === 'object' && error.response.data?.message;
      if (serverMsg) {
        error.friendlyMessage = serverMsg;
      } else if (error.response.status === 503) {
        error.friendlyMessage = 'Database service is currently unavailable. Please verify MongoDB connection and try again.';
      } else if (error.response.status === 504 || error.response.status === 502) {
        error.friendlyMessage = 'Gateway timeout: The backend server took too long to respond. Please try again.';
      } else if (error.response.status === 404) {
        error.friendlyMessage = 'Requested service endpoint was not found on the server (404).';
      } else {
        error.friendlyMessage = typeof error.response.data === 'string' && error.response.data.length < 120
          ? error.response.data
          : 'An error occurred while communicating with the server.';
      }
    }
    return Promise.reject(error);
  }
);

// ─── REPORT & CASE SUBMISSION ────────────────────────────────────────────────
export interface OrganizationVerificationPayload {
  verificationToken?: string;
  isVerified?: boolean;
  organizationType?: 'employee' | 'college_student';
  organizationName?: string;
}

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
  employeeOrCollegeId?: string;
  organizationVerification?: OrganizationVerificationPayload;
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
export const trackCase = async (reportIdOrCaseId: string, recoveryKeyOrCode: string, simulateOffline = false) => {
  const headers: Record<string, string> = {};
  if (simulateOffline) {
    headers['x-simulate-offline'] = 'true';
  }
  const cleanId = (reportIdOrCaseId || '').trim().toUpperCase();
  const cleanKey = (recoveryKeyOrCode || '').trim().toUpperCase();
  const res = await api.post('/api/cases/track-lookup', {
    caseId: cleanId,
    reportId: cleanId,
    recoveryCode: cleanKey,
    recoveryKey: cleanKey,
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

export const listVaultEvidence = async (token: string, params: Record<string, string> = {}) => {
  const res = await api.get('/api/vault/evidence', {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
};

export const linkVaultEvidence = async (token: string, evidenceId: string, payload: { caseId: string; recoveryCode?: string }) => {
  const res = await api.post(`/api/vault/evidence/${evidenceId}/link`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const unlinkVaultEvidence = async (token: string, evidenceId: string) => {
  const res = await api.post(`/api/vault/evidence/${evidenceId}/unlink`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getStaffCaseVaultEvidence = async (caseId: string) => {
  const res = await api.get(`/api/cases/${caseId}/vault-evidence`);
  return res.data;
};

export const downloadStaffCaseVaultEvidence = async (caseId: string, evidenceId: string) => {
  const res = await api.get(`/api/cases/${caseId}/vault-evidence/${evidenceId}/download`, {
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

// ─── ORGANIZATION VERIFICATION ───────────────────────────────────────────────
export interface VerifyOrganizationRequest {
  organizationType: 'employee' | 'college_student';
  organizationName: string;
  identifier: string; // Employee ID or College ID
  email?: string;
}

export interface VerifyOrganizationResponse {
  success: boolean;
  verified: boolean;
  verificationToken?: string;
  organizationType?: 'employee' | 'college_student';
  organizationName?: string;
  message: string;
  code?: string;
  formatHint?: string;
}

export const verifyOrganization = async (payload: VerifyOrganizationRequest): Promise<VerifyOrganizationResponse> => {
  const res = await api.post('/api/verification/verify-organization', payload);
  return res.data;
};

export const getKnownOrganizations = async (): Promise<{ name: string; type: string; idFormat: string }[]> => {
  const res = await api.get('/api/verification/known-organizations');
  return res.data?.organizations || [];
};


// ─── SAFETY ASSISTANT CHATBOT ───────────────────────────────────────────────
export interface OfficialResource {
  name: string;
  url: string;
  phone?: string;
  description?: string;
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  language: 'en' | 'hi' | 'hinglish';
  isEmergency: boolean;
  intent: string;
  suggestedActions: string[];
  officialResources: OfficialResource[];
  aiConfigured: boolean;
  source: string;
}

export const sendAssistantMessage = async (
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<AssistantChatResponse> => {
  const res = await api.post('/api/assistant/chat', { message, history });
  return res.data;
};


// ─── ENTERPRISE ADMIN & CASE MANAGEMENT APIS ────────────────────────────────
export const getAdminDashboardStats = async (params: Record<string, string> = {}) => {
  const res = await api.get('/api/admin/dashboard-stats', { params });
  return res.data;
};

export const getAdminStaff = async () => {
  const res = await api.get('/api/admin/staff');
  return res.data;
};

export const createStaffAccount = async (payload: {
  name: string;
  email: string;
  department?: string;
  designation?: string;
  role?: string;
  initialPassword?: string;
}) => {
  const res = await api.post('/api/admin/staff', payload);
  return res.data;
};

export const updateStaffRole = async (id: string, payload: { role?: string; department?: string; designation?: string }) => {
  const res = await api.patch(`/api/admin/staff/${id}/role`, payload);
  return res.data;
};

export const toggleStaffStatus = async (id: string, payload: { isActive: boolean; reason?: string }) => {
  const res = await api.patch(`/api/admin/staff/${id}/status`, payload);
  return res.data;
};

export const resetStaffPassword = async (id: string) => {
  const res = await api.post(`/api/admin/staff/${id}/reset-password`);
  return res.data;
};

export const assignCase = async (caseId: string, payload: { staffId: string; reason?: string }) => {
  const res = await api.patch(`/api/cases/${caseId}/assign`, payload);
  return res.data;
};

export const addInternalNote = async (caseId: string, content: string) => {
  const res = await api.post(`/api/cases/${caseId}/internal-notes`, { content });
  return res.data;
};

export const scheduleInquiryMeeting = async (caseId: string, payload: {
  title: string;
  scheduledAt: string;
  locationOrLink?: string;
  attendees?: string[];
  notes?: string;
  notifyComplainant?: boolean;
}) => {
  const res = await api.post(`/api/cases/${caseId}/inquiry-meetings`, payload);
  return res.data;
};

export const recordInquiryFindings = async (caseId: string, payload: {
  findingsSummary: string;
  recommendations?: string;
  formalOrderNumber?: string;
  finalOutcomeStatus?: string;
}) => {
  const res = await api.post(`/api/cases/${caseId}/inquiry-findings`, payload);
  return res.data;
};

export const closeOrReopenCase = async (caseId: string, payload: { action: 'CLOSE' | 'REOPEN'; reason: string }) => {
  const res = await api.patch(`/api/cases/${caseId}/close-or-reopen`, payload);
  return res.data;
};

export const submitComplainantClarification = async (payload: {
  caseId: string;
  recoveryCode: string;
  requestId?: string;
  responseText: string;
}) => {
  const res = await api.post('/api/cases/track/provide-info', payload);
  return res.data;
};

export const getNotifications = async () => {
  const res = await api.get('/api/notifications');
  return res.data;
};

export const markNotificationRead = async (id: string) => {
  const res = await api.patch(`/api/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.patch('/api/notifications/mark-all-read');
  return res.data;
};

export const getAdminAuditLogs = async (params: Record<string, string> = {}) => {
  const res = await api.get('/api/admin/audit-logs', { params });
  return res.data;
};

export const triggerDeadlineScan = async () => {
  const res = await api.post('/api/admin/deadlines/scan');
  return res.data;
};

export const recordEscalationAction = async (caseId: string, payload: {
  actionType: string;
  reason: string;
  newTargetDate?: string;
}) => {
  const res = await api.post(`/api/admin/deadlines/${caseId}/action`, payload);
  return res.data;
};

export const changePassword = async (payload: { currentPassword?: string; newPassword: string }) => {
  const res = await api.post('/api/auth/change-password', payload);
  return res.data;
};

export default api;


