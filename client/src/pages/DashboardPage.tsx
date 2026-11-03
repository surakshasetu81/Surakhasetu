import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, Clock, RefreshCw,
  ShieldAlert, ShieldCheck, Scale, History, AlertTriangle,
  Lock, Search, UserPlus, UserCheck, UserX, Key, Calendar,
  Bell, X, FolderOpen, Shield, HelpCircle, CheckCircle2, MessageSquare,
  HeartHandshake, Download, FileCheck
} from 'lucide-react';
import CaseConversation from '../components/CaseConversation';
import { getStaffConversations, getStaffConversationStats, type ConversationItem } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  api as axios,
  getAdminDashboardStats,
  getAdminStaff,
  createStaffAccount,
  toggleStaffStatus,
  resetStaffPassword,
  assignCase,
  addInternalNote,
  scheduleInquiryMeeting,
  recordInquiryFindings,
  closeOrReopenCase,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAdminAuditLogs,
  triggerDeadlineScan,
  recordEscalationAction,
  changePassword,
  verifyEvidenceChecksum,
  overrideCasePriority,
  downloadStaffCaseVaultEvidence,
  getStaffSafetyAlerts,
  updateStaffSafetyFollowup,
  getCounsellingRequests,
  updateCounsellingRequestStatus,
  downloadInquiryReportPDF,
} from '../services/api';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  awaiting_review: 'Awaiting Review',
  assigned: 'Assigned for Inquiry',
  under_preliminary_assessment: 'Preliminary Assessment',
  inquiry_in_progress: 'Inquiry in Progress',
  under_review: 'Under Review',
  additional_info_required: 'Additional Info Required',
  awaiting_authorized_decision: 'Awaiting Decision',
  decision_recorded: 'Decision Recorded',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: '#6B7280',
  awaiting_review: '#2563EB',
  assigned: '#8B5CF6',
  under_preliminary_assessment: '#D97706',
  inquiry_in_progress: '#B7791F',
  under_review: '#B7791F',
  additional_info_required: '#7C3AED',
  awaiting_authorized_decision: '#C2185B',
  decision_recorded: '#C2185B',
  resolved: '#16856B',
  closed: '#16856B',
  reopened: '#DC2626',
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

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  staffId?: string;
  isActive: boolean;
  activeCasesCount?: number;
  lastLogin?: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  caseId?: string;
  read: boolean;
  createdAt: string;
}

interface AuditLogItem {
  _id: string;
  action: string;
  caseId?: string;
  performedBy?: { name: string; email: string; staffId?: string };
  details?: any;
  createdAt: string;
}

interface CaseItem {
  _id: string;
  caseId: string;
  status: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  incidentCategory: string;
  incidentDate?: string;
  incidentDescription?: string;
  description?: string;
  location?: string;
  preferredLanguage?: string;
  supportRequired?: string[];
  isAnonymous: boolean;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  organizationVerification?: {
    isVerified?: boolean;
    organizationName?: string;
    organizationType?: string;
    verificationMethod?: string;
  };
  classification?: {
    category?: string;
    severity?: string;
    severityScore?: number;
    confidence?: number;
    reasoning?: string;
  };
  legalAdvisory?: {
    recommendedActs?: string[];
    suggestedSections?: string[];
  };
  closureDetails?: {
    closedAt?: string;
    closedByName?: string;
    closedByRole?: string;
    closureRemarks?: string;
    finalOrderRef?: string;
    reportReferenceNumber?: string;
  };
  closureHistory?: Array<{
    closedAt: string;
    closedByName?: string;
    closureRemarks: string;
    finalOrderRef?: string;
    reportReferenceNumber?: string;
    reopenedAt?: string;
    reopenedByName?: string;
    reopeningReason?: string;
  }>;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt: string;
  targetResolutionDate?: string;
  statutoryDueDate?: string;
  daysRemaining?: number;
  isOverdue?: boolean;
  assignedTo?: { _id: string; name: string; email: string; staffId?: string; designation?: string; role?: string };
  evidence?: Array<{
    _id: string;
    fileId?: string;
    filename: string;
    originalName: string;
    mimeType?: string;
    mimetype?: string;
    size: number;
    sha256Hash: string;
    integrityStatus?: string;
    uploadedAt: string;
  }>;
  vaultEvidence?: Array<{
    _id: string;
    evidenceId: string;
    originalName: string;
    category: string;
    sizeBytes: number;
    mimeType: string;
    sha256Digest: string;
    linkingStatus?: string;
    integrityStatus?: string;
    createdAt: string;
    backupVerified?: boolean;
  }>;
  internalNotesList?: Array<{
    _id: string;
    content: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }>;
  inquiryMeetings?: Array<{
    _id: string;
    title: string;
    scheduledAt: string;
    locationOrLink: string;
    attendees?: string[];
    notes?: string;
  }>;
  inquiryFindings?: {
    findingsSummary?: string;
    recommendations?: string;
    formalOrderNumber?: string;
    concludedAt?: string;
  };
  clarificationRequests?: Array<{
    requestId: string;
    question: string;
    requestedAt: string;
    status: string;
    response?: string;
    respondedAt?: string;
  }>;
  auditHistory?: Array<{
    action: string;
    performedBy?: string;
    timestamp: string;
    reason?: string;
  }>;
}

interface DashboardMetrics {
  totalComplaints: number;
  newComplaints: number;
  awaitingAssignment: number;
  underInvestigation: number;
  awaitingDecision: number;
  resolvedAndClosed: number;
  highPriorityAndImmediateRisk: number;
  approachingDeadline: number;
  overdueCases: number;
  avgResolutionTimeDays: number;
  resolvedWithinTarget: number;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'communications' | 'safety' | 'counselling' | 'staff' | 'overdue' | 'audit'>('overview');
  const [commConversations, setCommConversations] = useState<ConversationItem[]>([]);
  const [commSelectedCaseId, setCommSelectedCaseId] = useState<string | null>(null);
  const [commStats, setCommStats] = useState<any>(null);
  const [commUnreadCount, setCommUnreadCount] = useState<number>(0);
  const [commSearch, setCommSearch] = useState('');
  const [commPriorityFilter, setCommPriorityFilter] = useState('all');
  const [commStatusFilter, setCommStatusFilter] = useState('all');
  const [loadingComm, setLoadingComm] = useState(false);

  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [safetyAlertsLoading, setSafetyAlertsLoading] = useState(false);
  const [followupNote, setFollowupNote] = useState('');

  // Counselling Requests State
  const [counsellingRequests, setCounsellingRequests] = useState<any[]>([]);
  const [counsellingLoading, setCounsellingLoading] = useState(false);
  const [counsellingStatusFilter, setCounsellingStatusFilter] = useState('');
  const [counsellingNoteInput, setCounsellingNoteInput] = useState<{ [id: string]: string }>({});

  // Metrics State
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalComplaints: 0,
    newComplaints: 0,
    awaitingAssignment: 0,
    underInvestigation: 0,
    awaitingDecision: 0,
    resolvedAndClosed: 0,
    highPriorityAndImmediateRisk: 0,
    approachingDeadline: 0,
    overdueCases: 0,
    avgResolutionTimeDays: 0,
    resolvedWithinTarget: 0,
  });

  // Cases Queue State
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueOnlyFilter, setOverdueOnlyFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Staff State
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionData, setProvisionData] = useState({
    name: '',
    email: '',
    department: 'POSH Internal Committee',
    designation: 'Inquiry Officer',
    role: 'ic_member',
    initialPassword: '',
  });
  const [provisionError, setProvisionError] = useState('');
  const [provisionSuccess, setProvisionSuccess] = useState('');

  // Selected Case Drawer
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Case Action States
  const [assigneeId, setAssigneeId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusChangeChoice, setStatusChangeChoice] = useState('');
  const [statusChangeNote, setStatusChangeNote] = useState('');

  // Meeting Schedule Modal State
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: 'POSH Inquiry Hearing',
    scheduledAt: '',
    locationOrLink: 'ICC Confidential Inquiry Room',
    attendees: '',
    notes: '',
  });

  // Findings Modal State
  const [findingsModalOpen, setFindingsModalOpen] = useState(false);
  const [findingsData, setFindingsData] = useState({
    findingsSummary: '',
    recommendations: '',
    formalOrderNumber: '',
    finalOutcomeStatus: 'resolved',
  });

  // Close / Reopen Modal State
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureAction, setClosureAction] = useState<'CLOSE' | 'REOPEN'>('CLOSE');
  const [closureReason, setClosureReason] = useState('');

  // Clarification Request Modal State
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');

  // Priority Override State
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [newPriorityChoice, setNewPriorityChoice] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [priorityOverrideReason, setPriorityOverrideReason] = useState('');

  // Escalation Action Modal State
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [escalationTargetCase, setEscalationTargetCase] = useState<CaseItem | null>(null);
  const [escalationActionType, setEscalationActionType] = useState('DEADLINE_EXTENSION');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationNewDate, setEscalationNewDate] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  // Password Setup Enforcement
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Evidence Verification State
  const [evidenceVerificationStatus, setEvidenceVerificationStatus] = useState<Record<string, string>>({});

  const isMainAdmin = user?.role === 'admin';
  const isAuditor = user?.role === 'auditor';
  const isICMember = user?.role === 'ic_member' || user?.role === 'committee';

  // Check mandatory password change
  useEffect(() => {
    if (user?.mustChangePassword) {
      setPasswordModalOpen(true);
    }
  }, [user]);

  // Load Metrics
  const loadMetrics = async () => {
    try {
      if (isMainAdmin) {
        const data = await getAdminDashboardStats();
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch {
      // Fallback if role doesn't have admin route access
    }
  };

  // Load Cases
  const loadCases = async () => {
    setCasesLoading(true);
    setCasesError('');
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (overdueOnlyFilter) params.overdueOnly = 'true';
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get('/api/cases', { params, withCredentials: true });
      setCases(res.data.cases || []);
      setTotalCases(res.data.total || 0);

      // If user isn't admin, compute local counts for metrics overview
      if (!isMainAdmin && res.data.cases) {
        const cList: CaseItem[] = res.data.cases;
        setMetrics({
          totalComplaints: res.data.total || cList.length,
          newComplaints: cList.filter(c => c.status === 'submitted').length,
          awaitingAssignment: cList.filter(c => !c.assignedTo).length,
          underInvestigation: cList.filter(c => ['under_preliminary_assessment', 'inquiry_in_progress', 'under_review'].includes(c.status)).length,
          awaitingDecision: cList.filter(c => c.status === 'awaiting_authorized_decision').length,
          resolvedAndClosed: cList.filter(c => ['resolved', 'closed', 'decision_recorded'].includes(c.status)).length,
          highPriorityAndImmediateRisk: cList.filter(c => c.priority === 'HIGH' || c.isUrgent).length,
          approachingDeadline: cList.filter(c => c.daysRemaining !== undefined && c.daysRemaining <= 15 && c.daysRemaining > 0 && !['resolved', 'closed'].includes(c.status)).length,
          overdueCases: cList.filter(c => c.isOverdue && !['resolved', 'closed'].includes(c.status)).length,
          avgResolutionTimeDays: 14,
          resolvedWithinTarget: cList.filter(c => ['resolved', 'closed'].includes(c.status)).length,
        });
      }
    } catch {
      setCases([]);
      setCasesError('Unable to load cases queue. Please ensure backend connectivity.');
    } finally {
      setCasesLoading(false);
    }
  };

  // Load Staff
  const loadStaff = async () => {
    if (!isMainAdmin && !isICMember) return;
    setStaffLoading(true);
    try {
      const data = await getAdminStaff();
      setStaffList(data.staff || []);
    } catch {
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadNotifCount(data.unreadCount || 0);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  // Load Communications
  const loadCommunications = async () => {
    setLoadingComm(true);
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        getStaffConversations({
          priority: commPriorityFilter !== 'all' ? commPriorityFilter : undefined,
          status: commStatusFilter !== 'all' ? commStatusFilter : undefined,
          search: commSearch || undefined,
        }),
        getStaffConversationStats(),
      ]);

      if (listRes.status === 'fulfilled' && listRes.value?.conversations) {
        setCommConversations(listRes.value.conversations);
        const totalUnread = listRes.value.conversations.reduce((acc: number, c: any) => acc + (c.unreadStaffCount || 0), 0);
        setCommUnreadCount(totalUnread);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setCommStats(statsRes.value.stats);
      }
    } catch {
      // Communications fetch handled gracefully
    } finally {
      setLoadingComm(false);
    }
  };

  // Load Counselling Requests (Authorized staff & counsellors)
  const loadCounsellingRequests = async () => {
    setCounsellingLoading(true);
    try {
      const data = await getCounsellingRequests({
        status: counsellingStatusFilter || undefined,
        limit: 50,
      });
      setCounsellingRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load counselling requests:', err);
      setCounsellingRequests([]);
    } finally {
      setCounsellingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'counselling') {
      loadCounsellingRequests();
    }
  }, [activeTab, counsellingStatusFilter]);
  // Load Audit Logs
  const loadSafetyAlerts = async () => {
    setSafetyAlertsLoading(true);
    try {
      const data = await getStaffSafetyAlerts();
      setSafetyAlerts(data.alerts || []);
    } catch {
      setSafetyAlerts([]);
    } finally {
      setSafetyAlertsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'safety') {
      loadSafetyAlerts();
    }
  }, [activeTab]);

  const loadAuditLogs = async () => {
    if (!isMainAdmin && !isAuditor) return;
    setAuditLoading(true);
    try {
      const data = await getAdminAuditLogs({ page: String(auditPage), limit: '25' });
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
      loadCases();
      loadStaff();
      loadNotifications();
      loadCommunications();
    }
  }, [user, page, statusFilter, priorityFilter, overdueOnlyFilter]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    } else if (activeTab === 'communications') {
      loadCommunications();
    }
  }, [activeTab, auditPage]);

  if (!loading && !user) return <Navigate to="/staff-login" replace />;

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const handleAssignStaff = async () => {
    if (!selectedCase || !assigneeId) return;
    try {
      await assignCase(selectedCase.caseId, {
        staffId: assigneeId,
        reason: assignmentReason || 'Case assigned by administrator',
      });
      alert('Case successfully assigned.');
      setAssignmentReason('');
      loadCases();
      // Update local selectedCase
      const assignedUser = staffList.find(s => s._id === assigneeId);
      setSelectedCase(prev => prev ? { ...prev, assignedTo: assignedUser, status: 'assigned' } : null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign case.');
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedCase || !internalNoteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await addInternalNote(selectedCase.caseId, internalNoteText.trim());
      setInternalNoteText('');
      if (res.case?.internalNotesList) {
        setSelectedCase(prev => prev ? { ...prev, internalNotesList: res.case.internalNotesList } : null);
      }
      alert('Confidential internal note recorded.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record internal note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedCase || !statusChangeChoice) return;
    try {
      await axios.patch(`/api/cases/${selectedCase.caseId}/status`, {
        status: statusChangeChoice,
        message: statusChangeNote || `Status changed to ${statusChangeChoice}`,
      }, { withCredentials: true });
      alert('Status updated.');
      setStatusChangeNote('');
      setSelectedCase(prev => prev ? { ...prev, status: statusChangeChoice } : null);
      loadCases();
      loadMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      const payload = {
        title: meetingData.title,
        scheduledAt: meetingData.scheduledAt,
        locationOrLink: meetingData.locationOrLink,
        attendees: meetingData.attendees ? meetingData.attendees.split(',').map(s => s.trim()) : [],
        notes: meetingData.notes,
        notifyComplainant: true,
      };
      await scheduleInquiryMeeting(selectedCase.caseId, payload);
      alert('POSH Inquiry meeting scheduled. Notifications dispatched.');
      setMeetingModalOpen(false);
      loadCases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule inquiry meeting.');
    }
  };

  const handleRecordFindings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      await recordInquiryFindings(selectedCase.caseId, findingsData);
      alert('Formal inquiry findings recorded.');
      setFindingsModalOpen(false);
      loadCases();
      loadMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record findings.');
    }
  };

  const handleCloseOrReopen = async () => {
    if (!selectedCase || !closureReason.trim()) {
      alert('Please provide a mandatory justification.');
      return;
    }
    try {
      await closeOrReopenCase(selectedCase.caseId, {
        action: closureAction,
        reason: closureReason.trim(),
      });
      alert(`Case ${closureAction === 'CLOSE' ? 'closed' : 'reopened'} successfully.`);
      setClosureModalOpen(false);
      setClosureReason('');
      loadCases();
      loadMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to execute case action.');
    }
  };

  const handleOverridePriority = async () => {
    if (!selectedCase || !priorityOverrideReason.trim()) {
      alert('Please provide a documented reason for priority override.');
      return;
    }
    try {
      await overrideCasePriority(selectedCase.caseId, newPriorityChoice, priorityOverrideReason.trim());
      alert('Case priority updated with audit log.');
      setPriorityModalOpen(false);
      setPriorityOverrideReason('');
      loadCases();
      loadMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to override priority.');
    }
  };

  const handleEscalationAction = async () => {
    if (!escalationTargetCase || !escalationReason.trim()) {
      alert('Please provide an escalation rationale.');
      return;
    }
    try {
      await recordEscalationAction(escalationTargetCase.caseId, {
        actionType: escalationActionType,
        reason: escalationReason.trim(),
        newTargetDate: escalationNewDate || undefined,
      });
      alert('Escalation action recorded.');
      setEscalationModalOpen(false);
      setEscalationReason('');
      loadCases();
      loadMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record escalation action.');
    }
  };

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError('');
    setProvisionSuccess('');
    try {
      const res = await createStaffAccount(provisionData);
      setProvisionSuccess(`Staff account created! Assigned ID: ${res.user.staffId}`);
      setProvisionData({
        name: '',
        email: '',
        department: 'POSH Internal Committee',
        designation: 'Inquiry Officer',
        role: 'ic_member',
        initialPassword: '',
      });
      loadStaff();
    } catch (err: any) {
      setProvisionError(err.response?.data?.message || 'Failed to provision staff account.');
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentActive: boolean) => {
    const reason = prompt(`Enter reason to ${currentActive ? 'deactivate/revoke' : 'activate'} this staff member:`);
    if (!reason) return;
    try {
      await toggleStaffStatus(staffId, { isActive: !currentActive, reason });
      alert('Staff status updated.');
      loadStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update staff status.');
    }
  };

  const handleResetStaffPassword = async (staffId: string) => {
    if (!confirm('Generate a secure temporary password for this staff member?')) return;
    try {
      const res = await resetStaffPassword(staffId);
      alert(`Temporary Password: ${res.tempPassword}\n\nThe staff member must change it on their next sign-in.`);
      loadStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset staff password.');
    }
  };

  const handleVerifyEvidence = async (evidenceId: string) => {
    try {
      const res = await verifyEvidenceChecksum(evidenceId);
      setEvidenceVerificationStatus(prev => ({
        ...prev,
        [evidenceId]: res.verified ? 'PASSED: SHA-256 matches immutable intake fingerprint' : 'FAILED: Hash mismatch',
      }));
    } catch {
      setEvidenceVerificationStatus(prev => ({ ...prev, [evidenceId]: 'Verification service unavailable' }));
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      await changePassword({ newPassword });
      setPasswordSuccess('Password successfully updated! You may continue.');
      setTimeout(() => {
        setPasswordModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text-main)' }}>
      {/* ─── TOP NAVIGATION & IDENTITY BAR ─────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), #B71C1C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 12px rgba(194, 24, 91, 0.25)',
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  Suraksha Setu
                </h1>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  POSH Case Admin
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Confidential Workplace Harassment Redressal Infrastructure
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* User Profile Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  {user?.staffId || user?.role?.toUpperCase()} | {user?.designation || user?.department || 'Authorized Staff'}
                </div>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: isMainAdmin ? 'rgba(194, 24, 91, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                color: isMainAdmin ? 'var(--color-primary)' : '#2563EB',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{
                  position: 'relative',
                  padding: 8,
                  borderRadius: 10,
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  color: 'var(--color-text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Case & Escalation Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#D92D35',
                    color: '#FFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--color-card)',
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {notifDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: 8,
                  width: 340,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>In-App Notifications</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await markAllNotificationsRead();
                        loadNotifications();
      loadCommunications();
                      }}
                      style={{ fontSize: '0.74rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                        No unread notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n._id}
                          onClick={async () => {
                            if (!n.read) {
                              await markNotificationRead(n._id);
                              loadNotifications();
      loadCommunications();
                            }
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--color-border)',
                            background: n.read ? 'transparent' : 'var(--color-soft-pink)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>{n.title}</span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Change Password Button */}
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="btn btn-secondary btn-sm"
              title="Update Staff Password"
            >
              <Key size={14} /> Password
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => {
                loadMetrics();
                loadCases();
                loadStaff();
                loadNotifications();
      loadCommunications();
              }}
              className="btn btn-secondary btn-sm"
              title="Refresh Live Data"
            >
              <RefreshCw size={14} />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="btn btn-outline-primary btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
        <div className="tabs-scroll-container" style={{ maxWidth: 1400, margin: '12px auto 0', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'overview' ? '#FFF' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LayoutDashboard size={15} /> Overview & KPIs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('communications')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'communications' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'communications' ? '#FFF' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            id="tab-communications-btn"
          >
            <MessageSquare size={15} /> Secure Communications
            {commUnreadCount > 0 && (
              <span
                style={{
                  background: activeTab === 'communications' ? '#FFF' : 'var(--color-primary)',
                  color: activeTab === 'communications' ? 'var(--color-primary)' : '#FFF',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 999,
                  marginLeft: 2,
                }}
              >
                {commUnreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'safety' ? '#D92D35' : 'transparent',
              color: activeTab === 'safety' ? '#FFF' : '#D92D35',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={15} /> Immediate Safety Alerts
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('counselling')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'counselling' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'counselling' ? '#FFF' : 'var(--color-primary)',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <HeartHandshake size={15} /> Counselling Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'cases' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'cases' ? '#FFF' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={15} /> Case Management ({totalCases})
          </button>

          {isMainAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'staff' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'staff' ? '#FFF' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users size={15} /> Staff Directory ({staffList.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'overdue' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'overdue' ? '#FFF' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={15} /> Overdue & Statutory Queue ({metrics.overdueCases})
          </button>

          {(isMainAdmin || isAuditor) && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'audit' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'audit' ? '#FFF' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <History size={15} /> Append-Only Audit Trail
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ───────────────────────────────────────────── */}
      <main style={{ maxWidth: 1400, margin: '24px auto', padding: '0 24px' }}>

        {/* ─── TAB: IMMEDIATE SAFETY ALERTS ───────────────────────────────────── */}
        {activeTab === 'safety' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: '#D92D35', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={24} /> Immediate Safety Alerts & Complainant Escalations
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Live incoming alerts reported by complainants on post-submission safety triage. Requires immediate human review.
                </p>
              </div>
              <button
                onClick={loadSafetyAlerts}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Refresh Safety Alerts
              </button>
            </div>

            {safetyAlertsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading safety alerts...</div>
            ) : safetyAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>No Active Immediate Danger Alerts</h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  All reported cases have satisfied initial safety triage or follow-ups have been acknowledged.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {safetyAlerts.map(alert => (
                  <div
                    key={alert._id}
                    style={{
                      background: 'var(--color-card)',
                      border: alert.priority === 'HIGH' ? '1.5px solid #D92D35' : '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                            Case: {alert.caseId}
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: alert.priority === 'HIGH' ? 'rgba(217, 45, 53, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                            color: alert.priority === 'HIGH' ? '#D92D35' : '#D97706',
                          }}>
                            {alert.priority} PRIORITY
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'var(--color-soft-pink)',
                            color: 'var(--color-primary)',
                          }}>
                            Status: {alert.safetyStatus}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          Reported: {new Date(alert.createdAt).toLocaleString()} • Trigger: {alert.triggerSource}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: alert.humanReviewStatus === 'PENDING' ? 'rgba(217, 45, 53, 0.1)' : 'rgba(22, 133, 107, 0.1)',
                          color: alert.humanReviewStatus === 'PENDING' ? '#D92D35' : 'var(--color-success)',
                        }}>
                          Review: {alert.humanReviewStatus}
                        </span>
                      </div>
                    </div>

                    {alert.case && (
                      <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 }}>
                        <strong>Incident Category:</strong> {alert.case.incidentCategory} • <strong>Case Status:</strong> {alert.case.status}
                      </div>
                    )}

                    {/* Staff Follow-up Form */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                      <input
                        type="text"
                        placeholder="Record staff follow-up action / referral note..."
                        value={followupNote}
                        onChange={e => setFollowupNote(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 260,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bg)',
                          fontSize: '0.84rem',
                          color: 'var(--color-text-main)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await updateStaffSafetyFollowup(alert._id, {
                            humanReviewStatus: 'ACKNOWLEDGED',
                            staffReviewNotes: followupNote || 'Alert acknowledged by authorized staff.',
                            assignToSelf: true,
                          });
                          alert('Safety alert acknowledged.');
                          setFollowupNote('');
                          loadSafetyAlerts();
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        Acknowledge Alert
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!followupNote.trim()) {
                            alert('Please enter referral notes.');
                            return;
                          }
                          await updateStaffSafetyFollowup(alert._id, {
                            humanReviewStatus: 'REFERRED_TO_SERVICES',
                            staffReviewNotes: followupNote.trim(),
                            assignToSelf: true,
                          });
                          alert('Referred to support services and logged.');
                          setFollowupNote('');
                          loadSafetyAlerts();
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        Refer to One Stop Centre / Support
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: COUNSELLING REQUESTS MANAGEMENT (AUTHORIZED STAFF / COUNSELLORS) ─── */}
        {activeTab === 'counselling' && (
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeartHandshake size={24} /> Counselling & Mental Health Support Requests
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Confidential session requests submitted by complainants during post-intake triage. Complaint details are strictly safeguarded.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={counsellingStatusFilter}
                  onChange={(e) => setCounsellingStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.84rem', padding: '6px 12px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Session Scheduled">Session Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={loadCounsellingRequests}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {counsellingLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
                Loading counselling requests...
              </div>
            ) : counsellingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <HeartHandshake size={40} color="var(--color-text-secondary)" style={{ opacity: 0.5, marginBottom: 12 }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>No Counselling Requests Found</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                  No active counselling requests match the selected filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {counsellingRequests.map((reqItem) => {
                  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                    Pending: { bg: 'rgba(234, 88, 12, 0.08)', text: '#EA580C', border: '#EA580C' },
                    Assigned: { bg: 'rgba(37, 99, 235, 0.08)', text: '#2563EB', border: '#2563EB' },
                    Contacted: { bg: 'rgba(124, 58, 237, 0.08)', text: '#7C3AED', border: '#7C3AED' },
                    'Session Scheduled': { bg: 'rgba(194, 24, 91, 0.08)', text: 'var(--color-primary)', border: 'var(--color-primary)' },
                    Completed: { bg: 'rgba(22, 133, 107, 0.08)', text: '#16856B', border: '#16856B' },
                    Cancelled: { bg: 'rgba(107, 114, 128, 0.08)', text: '#6B7280', border: '#6B7280' },
                  };
                  const colorScheme = statusColors[reqItem.status] || statusColors.Pending;

                  return (
                    <div
                      key={reqItem._id}
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-card)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                              Ref: {reqItem.referenceId || reqItem._id}
                            </span>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: colorScheme.bg,
                                color: colorScheme.text,
                                border: `1px solid ${colorScheme.border}30`,
                              }}
                            >
                              {reqItem.status}
                            </span>
                            {reqItem.caseId && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>
                                Case: <strong>{reqItem.caseId}</strong>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                            Requested on: {new Date(reqItem.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Status Update Quick Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                            Update Status:
                          </label>
                          <select
                            value={reqItem.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              await updateCounsellingRequestStatus(reqItem._id, { status: newStatus });
                              loadCounsellingRequests();
                            }}
                            className="form-input"
                            style={{ fontSize: '0.82rem', padding: '5px 10px', fontWeight: 700 }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Session Scheduled">Session Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Request Details Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: 12,
                          background: 'var(--color-bg-secondary)',
                          padding: '14px 16px',
                          borderRadius: 8,
                          marginBottom: 14,
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                            Preferred Date & Window
                          </strong>
                          <span>{reqItem.preferredDate} ({reqItem.preferredTimeSlot})</span>
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                            Mode & Contact Method
                          </strong>
                          <span>
                            {reqItem.preferredMode === 'telephonic' ? 'Audio Call' : reqItem.preferredMode === 'video' ? 'Video' : 'In-Person'} • {reqItem.preferredContactMethod || 'phone'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                            Contact Information
                          </strong>
                          <span>{reqItem.contactPhoneOrEmail || '(Anonymous / via Platform)'}</span>
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                            Language
                          </strong>
                          <span>{reqItem.preferredLanguage?.toUpperCase() || 'EN'}</span>
                        </div>
                      </div>

                      {reqItem.notes && (
                        <div style={{ marginBottom: 14, fontSize: '0.84rem' }}>
                          <strong style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Complainant Support Note:</strong>
                          <p style={{ margin: '4px 0 0', padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 6, fontStyle: 'italic' }}>
                            "{reqItem.notes}"
                          </p>
                        </div>
                      )}

                      {/* Staff/Counsellor Progress Notes */}
                      {reqItem.staffNotes && reqItem.staffNotes.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                            Session / Contact Log:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {reqItem.staffNotes.map((sn: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: '0.8rem',
                                  padding: '6px 10px',
                                  background: 'var(--color-card)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 6,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>{sn.note}</span>
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.74rem' }}>
                                  {sn.authorName} • {new Date(sn.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Staff Log Input */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="Log contact outcome or session scheduling note..."
                          value={counsellingNoteInput[reqItem._id] || ''}
                          onChange={(e) => setCounsellingNoteInput({ ...counsellingNoteInput, [reqItem._id]: e.target.value })}
                          className="form-input"
                          style={{ flex: 1, fontSize: '0.82rem' }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const noteText = counsellingNoteInput[reqItem._id];
                            if (!noteText || !noteText.trim()) return;
                            await updateCounsellingRequestStatus(reqItem._id, { note: noteText.trim() });
                            setCounsellingNoteInput({ ...counsellingNoteInput, [reqItem._id]: '' });
                            loadCounsellingRequests();
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          Add Log Note
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 1: OVERVIEW & 11 REAL METRICS ───────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text-main)' }}>
                  Enterprise POSH Executive Overview
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Real-time statutory compliance, inquiry progress, and workload metrics computed directly from database records.
                </p>
              </div>

              {isMainAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerDeadlineScan();
                    alert(`Deadline evaluation complete: ${res.result?.evaluatedCases || 0} cases scanned.`);
                    loadMetrics();
                    loadCases();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Clock size={14} /> Run Statutory Deadline Scan
                </button>
              )}
            </div>

            {/* 11 KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: 16,
              marginBottom: 28,
            }}>
              {/* 1. Total Complaints */}
              <div
                onClick={() => { setStatusFilter(''); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Total Complaints
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                  {metrics.totalComplaints}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>All registered filings</span>
              </div>

              {/* 2. Newly Submitted */}
              <div
                onClick={() => { setStatusFilter('submitted'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #6B7280' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Newly Submitted
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6B7280', margin: '6px 0 2px' }}>
                  {metrics.newComplaints}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Awaiting initial intake</span>
              </div>

              {/* 3. Awaiting Assignment */}
              <div
                onClick={() => { setStatusFilter('awaiting_review'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #3B82F6' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Awaiting Assignment
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6', margin: '6px 0 2px' }}>
                  {metrics.awaitingAssignment}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Needs IC officer assigned</span>
              </div>

              {/* 4. Under Investigation */}
              <div
                onClick={() => { setStatusFilter('inquiry_in_progress'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #D97706' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Under Investigation
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', margin: '6px 0 2px' }}>
                  {metrics.underInvestigation}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Active inquiry proceedings</span>
              </div>

              {/* 5. Awaiting Authorized Decision */}
              <div
                onClick={() => { setStatusFilter('awaiting_authorized_decision'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #C2185B' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Awaiting Decision
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C2185B', margin: '6px 0 2px' }}>
                  {metrics.awaitingDecision}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Findings concluded</span>
              </div>

              {/* 6. Resolved & Closed Cases */}
              <div
                onClick={() => { setStatusFilter('resolved'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #16856B' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Resolved & Closed
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16856B', margin: '6px 0 2px' }}>
                  {metrics.resolvedAndClosed}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Formal orders implemented</span>
              </div>

              {/* 7. High Priority & Immediate Risk */}
              <div
                onClick={() => { setPriorityFilter('HIGH'); setOverdueOnlyFilter(false); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #D92D35', background: 'rgba(217, 45, 53, 0.04)' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#D92D35', textTransform: 'uppercase' }}>
                  High Priority / Risk
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D92D35', margin: '6px 0 2px' }}>
                  {metrics.highPriorityAndImmediateRisk}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Immediate safeguards requested</span>
              </div>

              {/* 8. Approaching Deadline (<= 15d) */}
              <div
                onClick={() => { setActiveTab('overdue'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #B45309' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
                  Approaching Deadline
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B45309', margin: '6px 0 2px' }}>
                  {metrics.approachingDeadline}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>&le; 15 days to target</span>
              </div>

              {/* 9. Overdue Cases (> 60d) */}
              <div
                onClick={() => { setOverdueOnlyFilter(true); setActiveTab('cases'); }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '4px solid #DC2626', background: 'rgba(220, 38, 38, 0.05)' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Overdue Cases
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', margin: '6px 0 2px' }}>
                  {metrics.overdueCases}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>&gt; 60 days SLA exceeded</span>
              </div>

              {/* 10. Avg Resolution Time */}
              <div
                className="card"
                style={{ padding: '18px 20px', borderLeft: '4px solid var(--color-primary)' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Avg Resolution Days
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                  {metrics.avgResolutionTimeDays}d
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Target benchmark &le; 60d</span>
              </div>

              {/* 11. Resolved Within Target */}
              <div
                className="card"
                style={{ padding: '18px 20px', borderLeft: '4px solid #16856B' }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Resolved in Target
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16856B', margin: '6px 0 2px' }}>
                  {metrics.resolvedWithinTarget}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Completed under 60-day SLA</span>
              </div>
            </div>

            {/* Quick Overdue Alert Banner if Any */}
            {metrics.overdueCases > 0 && (
              <div style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(217, 45, 53, 0.08)',
                border: '1.5px solid #D92D35',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle size={24} color="#D92D35" />
                  <div>
                    <h4 style={{ margin: '0 0 2px', fontSize: '0.96rem', fontWeight: 800, color: '#D92D35' }}>
                      Statutory Escalation Alert: {metrics.overdueCases} Case(s) Exceeded Internal 60-Day SLA
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                      POSH Act Section 11(4) mandates conclusion within 90 days. Mandatory administrative extension or referral action required.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overdue')}
                  className="btn btn-primary btn-sm"
                >
                  Review Overdue Queue &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: CASE QUEUE & WORKFLOW ────────────────────────────────────── */}
        {(activeTab === 'cases' || activeTab === 'overview') && (
          <div style={{ marginTop: activeTab === 'overview' ? 24 : 0 }}>
            {/* Filter Bar */}
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <Search size={16} color="var(--color-text-secondary)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Case ID, complainant, category, or keyword..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-input"
                    style={{ minWidth: 160 }}
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="form-input"
                    style={{ minWidth: 130 }}
                  >
                    <option value="">All Priorities</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>

                  {/* Overdue Checkbox */}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={overdueOnlyFilter}
                      onChange={(e) => setOverdueOnlyFilter(e.target.checked)}
                    />
                    Overdue Only
                  </label>

                  {/* Reset Filters */}
                  {(statusFilter || priorityFilter || overdueOnlyFilter || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('');
                        setPriorityFilter('');
                        setOverdueOnlyFilter(false);
                        setSearchQuery('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {casesError && (
              <div style={{ padding: '12px 16px', background: 'rgba(217, 45, 53, 0.1)', color: '#D92D35', borderRadius: 8, fontSize: '0.86rem', fontWeight: 600, marginBottom: 14 }}>
                {casesError}
              </div>
            )}
            {/* Cases Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Case Reference</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category & Mode</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Priority</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Lifecycle Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Officer</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>POSH Timeline</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casesLoading ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                          Loading cases from secure vault...
                        </td>
                      </tr>
                    ) : cases.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          <ShieldCheck size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                          <p style={{ fontWeight: 700, margin: '0 0 4px', color: 'var(--color-text-main)' }}>No cases match the active filter criteria</p>
                          <p style={{ fontSize: '0.8rem', margin: 0 }}>All submitted confidential complaints will appear here with live lifecycle tracking.</p>
                        </td>
                      </tr>
                    ) : (
                      cases.map((c) => {
                        const pCfg = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.LOW;
                        const statusColor = STATUS_COLORS[c.status] || '#6B7280';
                        return (
                          <tr
                            key={c._id}
                            style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                            onClick={() => { setSelectedCase(c); setDrawerOpen(true); }}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{c.caseId}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                                {new Date(c.createdAt).toLocaleDateString('en-IN')}
                              </div>
                              {((c.vaultEvidence?.length || 0) + (c.evidence?.length || 0)) > 0 ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  background: 'rgba(22, 133, 107, 0.12)',
                                  color: '#16856B',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  marginTop: 4,
                                }}>
                                  <FileText size={10} /> {((c.vaultEvidence?.length || 0) + (c.evidence?.length || 0))} Evidence File{((c.vaultEvidence?.length || 0) + (c.evidence?.length || 0)) > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                                  No Evidence Attached
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 600 }}>{c.incidentCategory}</div>
                              <div style={{ fontSize: '0.72rem', color: c.isAnonymous ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {c.isAnonymous ? <><Lock size={11} /> Anonymous</> : 'Identified'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: pCfg.bg,
                                color: pCfg.color,
                                border: `1px solid ${pCfg.border}`,
                                fontSize: '0.74rem',
                                fontWeight: 800,
                              }}>
                                {c.priority}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: `${statusColor}18`,
                                color: statusColor,
                                border: `1px solid ${statusColor}40`,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}>
                                {STATUS_LABELS[c.status] || c.status}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              {c.assignedTo ? (
                                <div>
                                  <div style={{ fontWeight: 600 }}>{c.assignedTo.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                                    {c.assignedTo.staffId || c.assignedTo.designation || 'Staff'}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.76rem', color: '#B45309', fontWeight: 700 }}>
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: c.isOverdue ? '#D92D35' : (c.daysRemaining !== undefined && c.daysRemaining <= 15 ? '#D97706' : 'var(--color-text-main)'),
                              }}>
                                {c.daysRemaining !== undefined ? (c.daysRemaining > 0 ? `${c.daysRemaining}d remaining` : 'Overdue') : 'Active'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                Target: {c.targetResolutionDate ? new Date(c.targetResolutionDate).toLocaleDateString('en-IN') : '60d'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCase(c);
                                  setDrawerOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <FolderOpen size={13} /> Open
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cases Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--color-border)', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Showing page {page} ({cases.length} of {totalCases} cases)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={cases.length < 20}
                    onClick={() => setPage(p => p + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: STAFF DIRECTORY & PROVISIONING (ADMIN ONLY) ───────────────── */}
        {activeTab === 'staff' && isMainAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px' }}>
                  Main Admin Staff & Inquiry Officer Provisioning
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Manage authorized Internal Committee members, case officers, and statutory auditors with role-based access control.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProvisionModalOpen(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UserPlus size={16} /> Provision New Staff
              </button>
            </div>

            {/* Staff List Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Staff Identifier</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Full Name & Email</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Department & Designation</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Role</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Active Workload</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Account Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Loading staff records...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No staff accounts provisioned yet.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((s) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {s.staffId || 'STF-LEGACY'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{s.department || 'POSH Internal Committee'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{s.designation || 'Inquiry Officer'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: s.role === 'admin' ? 'rgba(194, 24, 91, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                          color: s.role === 'admin' ? 'var(--color-primary)' : '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                        }}>
                          {s.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        {s.activeCasesCount || 0} active cases
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: s.isActive ? 'rgba(22, 133, 107, 0.12)' : 'rgba(217, 45, 53, 0.12)',
                          color: s.isActive ? '#16856B' : '#D92D35',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                        }}>
                          {s.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleResetStaffPassword(s._id)}
                            className="btn btn-secondary btn-sm"
                            title="Reset Password"
                          >
                            <Key size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(s._id, s.isActive)}
                            className={s.isActive ? "btn btn-outline-primary btn-sm" : "btn btn-secondary btn-sm"}
                            title={s.isActive ? "Deactivate Access" : "Activate Access"}
                          >
                            {s.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))
                  }
                </tbody>
              </table>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--color-border)', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Total {auditTotal} forensic events logged (Page {auditPage})
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={auditLogs.length < 25}
                    onClick={() => setAuditPage(p => p + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: OVERDUE & STATUTORY ESCALATION QUEUE ───────────────────────── */}
        {activeTab === 'overdue' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px', color: '#D92D35' }}>
                  Statutory Overdue & Escalation Queue
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Cases exceeding the internal 60-day resolution target or approaching the 90-day POSH Act Section 11(4) ceiling.
                </p>
              </div>

              {isMainAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerDeadlineScan();
                    alert(`Deadline scan complete: ${res.result?.evaluatedCases || 0} cases re-evaluated.`);
                    loadCases();
                    loadMetrics();
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Scan & Evaluate Deadlines
                </button>
              )}
            </div>

            {/* Overdue Queue Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cases.filter(c => c.isOverdue || (c.daysRemaining !== undefined && c.daysRemaining <= 15 && !['resolved', 'closed'].includes(c.status))).length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <ShieldCheck size={36} color="#16856B" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#16856B', margin: '0 0 4px' }}>Zero Statutory Overdue Cases</p>
                  <p style={{ fontSize: '0.84rem', margin: 0 }}>All active cases are currently progressing within internal service-level agreements and statutory windows.</p>
                </div>
              ) : (
                cases.filter(c => c.isOverdue || (c.daysRemaining !== undefined && c.daysRemaining <= 15 && !['resolved', 'closed'].includes(c.status))).map(c => (
                  <div key={c._id} className="card" style={{ padding: 20, borderLeft: '4px solid #D92D35' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{c.caseId}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(217, 45, 53, 0.12)', color: '#D92D35', fontWeight: 800, fontSize: '0.74rem' }}>
                            {c.isOverdue ? 'OVERDUE' : 'EXPIRING SOON'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '0.86rem', color: 'var(--color-text-main)' }}>
                          <strong>Category:</strong> {c.incidentCategory} | <strong>Assigned:</strong> {c.assignedTo?.name || 'Unassigned'}
                        </p>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          <span>Target Date: {c.targetResolutionDate ? new Date(c.targetResolutionDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          <span>Statutory 90d Ceiling: {c.statutoryDueDate ? new Date(c.statutoryDueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          <span>Remaining: <strong>{c.daysRemaining} days</strong></span>
                        </div>
                      </div>

                      {isMainAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEscalationTargetCase(c);
                            setEscalationModalOpen(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Scale size={14} /> Record Escalation Action
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: APPEND-ONLY AUDIT LOGS (ADMIN & AUDITOR) ─────────────────── */}
        {activeTab === 'audit' && (isMainAdmin || isAuditor) && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px' }}>
                Immutable Audit Trail
              </h2>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                Append-only forensic log recording all administrative authorizations, role modifications, priority overrides, and case status transitions.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Action Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Case Reference</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Performed By</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Details / Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Loading audit trail records...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'var(--color-bg-secondary)',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            border: '1px solid var(--color-border)',
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {log.caseId || 'SYSTEM'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {log.performedBy ? `${log.performedBy.name} (${log.performedBy.staffId || 'Admin'})` : 'Automated System Engine'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ─── TAB 6: SECURE COMMUNICATIONS ────────────────────────────────────── */}
        {activeTab === 'communications' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text-main)' }}>
                  Secure Case Communications
                </h2>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                  Confidential two-way messaging with complainants. Complainant identity is strictly shielded while maintaining complete auditability.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadCommunications()}
                disabled={loadingComm}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} className={loadingComm ? 'spin-animation' : ''} />
                Refresh Channels
              </button>
            </div>

            {commStats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <div className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Channels
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: 4 }}>
                    {commStats.totalConversations}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Unread Complainant Messages
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                    {commStats.unreadConversations}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pending Staff Responses
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                    {commStats.pendingComplainantResponses}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#D92D35', fontWeight: 700, textTransform: 'uppercase' }}>
                    High-Priority Cases
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D92D35', marginTop: 4 }}>
                    {commStats.highPriorityCount}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: 20,
                alignItems: 'start',
              }}
            >
              <div
                className="card"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 700,
                  minHeight: 520,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-secondary)' }} />
                  <input
                    type="text"
                    value={commSearch}
                    onChange={(e) => setCommSearch(e.target.value)}
                    placeholder="Search Case ID or category..."
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 32px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-secondary)',
                      fontSize: '0.82rem',
                      color: 'var(--color-text-main)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={commPriorityFilter}
                    onChange={(e) => setCommPriorityFilter(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card)',
                      fontSize: '0.74rem',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="all">Priority: All</option>
                    <option value="HIGH">Priority: HIGH</option>
                    <option value="MEDIUM">Priority: MEDIUM</option>
                    <option value="LOW">Priority: LOW</option>
                  </select>

                  <select
                    value={commStatusFilter}
                    onChange={(e) => setCommStatusFilter(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card)',
                      fontSize: '0.74rem',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Active</option>
                    <option value="awaiting_staff">Awaiting Staff</option>
                    <option value="awaiting_complainant">Awaiting Complainant</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                  {loadingComm ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      Loading case channels...
                    </div>
                  ) : commConversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      No conversations found matching filters.
                    </div>
                  ) : (
                    commConversations.map((cItem) => {
                      const isSelected = commSelectedCaseId === cItem.caseId;
                      return (
                        <div
                          key={cItem._id}
                          onClick={() => setCommSelectedCaseId(cItem.caseId)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: isSelected ? 'var(--color-soft-pink)' : 'var(--color-bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                              {cItem.caseId}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: cItem.priority === 'HIGH' ? 'rgba(217, 45, 53, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                                color: cItem.priority === 'HIGH' ? '#D92D35' : '#D97706',
                              }}
                            >
                              {cItem.priority}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{cItem.incidentCategory}</span>
                            {cItem.unreadStaffCount > 0 && (
                              <span
                                style={{
                                  background: 'var(--color-primary)',
                                  color: '#FFFFFF',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '1px 7px',
                                  borderRadius: 999,
                                }}
                              >
                                {cItem.unreadStaffCount} new
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cItem.lastMessagePreview || 'Channel opened. Ready for messaging.'}
                          </div>

                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', opacity: 0.8, marginTop: 4, textAlign: 'right' }}>
                            {new Date(cItem.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(cItem.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ minHeight: 520 }}>
                {commSelectedCaseId ? (
                  <CaseConversation
                    caseId={commSelectedCaseId}
                    isStaffMode={true}
                    onStatusChange={() => loadCommunications()}
                  />
                ) : (
                  <div
                    className="card"
                    style={{
                      padding: 48,
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                      minHeight: 520,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageSquare size={36} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: 14 }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                      Select a Case Communication Channel
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: 400 }}>
                      Select any active or pending case from the list on the left to read messages, reply to complainants, or issue official evidence requests.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── CASE DETAIL & POSH WORKFLOW DRAWER / MODAL ────────────────────────── */}
      {drawerOpen && selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 'min(780px, 100vw)', padding: 'clamp(18px, 4vw, 32px)',
            background: 'var(--color-card)',
            height: '100%',
            overflowY: 'auto',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.2)',
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Confidential Inquiry File
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: '2px 0 0' }}>
                  {selectedCase.caseId}
                </h2>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: STATUS_COLORS[selectedCase.status] + '18',
                    color: STATUS_COLORS[selectedCase.status],
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}>
                    {STATUS_LABELS[selectedCase.status] || selectedCase.status}
                  </span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: PRIORITY_CONFIG[selectedCase.priority]?.bg,
                    color: PRIORITY_CONFIG[selectedCase.priority]?.color,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                  }}>
                    {selectedCase.priority} PRIORITY
                  </span>
                  {selectedCase.isAnonymous && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={12} /> Confidential Anonymous Intake
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Read-Only Banner for Auditor */}
            {isAuditor && (
              <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', fontSize: '0.82rem', fontWeight: 700, marginBottom: 16 }}>
                Statutory Auditor Mode: Read-Only Access. Modifying operations are disabled.
              </div>
            )}

            {/* PART 4 & 5: DOWNLOAD COMPLETE OFFICIAL INQUIRY REPORT (PDF) BANNER (CLOSED CASES ONLY) */}
            {selectedCase.status === 'closed' ? (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(194, 24, 91, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
                  border: '1.5px solid var(--color-primary)',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={20} color="var(--color-primary)" />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      Complete Inquiry Report & Case Docket (PDF)
                    </h4>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Case officially concluded. Download the authorized, multi-page confidential statutory inquiry dossier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const blobData = await downloadInquiryReportPDF(selectedCase.caseId);
                      const blob = new Blob([blobData], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `SurakshaSetu_InquiryReport_${selectedCase.caseId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err: any) {
                      console.error('Download inquiry report error:', err);
                      alert(err.response?.data?.message || 'Failed to download inquiry report PDF.');
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, padding: '8px 16px' }}
                >
                  <Download size={15} /> Download Complete Inquiry Report (PDF)
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 18,
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>Official Inquiry Report (PDF):</strong> Available for download once inquiry proceedings are concluded and case status is formally set to <strong>Closed</strong>.
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#D97706' }}>
                  Current Status: {STATUS_LABELS[selectedCase.status] || selectedCase.status}
                </span>
              </div>
            )}

            {/* Section 1: Intake & POSH Timeline Overview */}
            <div className="card" style={{ padding: 18, marginBottom: 18, background: 'var(--color-bg-secondary)' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800 }}>Incident Overview & Statutory Mandates</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Category:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{selectedCase.incidentCategory}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Filing Date:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{new Date(selectedCase.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Internal SLA Due:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: selectedCase.isOverdue ? '#D92D35' : 'inherit' }}>
                    {selectedCase.targetResolutionDate ? new Date(selectedCase.targetResolutionDate).toLocaleDateString('en-IN') : '60 days'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>POSH Sec 11(4) Due:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700 }}>
                    {selectedCase.statutoryDueDate ? new Date(selectedCase.statutoryDueDate).toLocaleDateString('en-IN') : '90 days'}
                  </p>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                PART 1 & 2: ORIGINAL COMPLAINT & INCIDENT DETAILS (STRUCTURED)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="card" style={{ padding: 20, marginBottom: 18, border: '1.5px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} /> Original Complaint & Incident Details
                </h4>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: selectedCase.isAnonymous ? 'var(--color-soft-pink)' : 'rgba(37, 99, 235, 0.1)',
                    color: selectedCase.isAnonymous ? 'var(--color-primary)' : '#2563EB',
                  }}
                >
                  {selectedCase.isAnonymous ? 'Protected Anonymous Intake' : 'Identified Complainant'}
                </span>
              </div>

              {/* A. Original Incident Statement (Full Text) */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  A. Original Incident Statement (Full Verbatim Complaint Text)
                </span>
                <div
                  style={{
                    marginTop: 6,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    color: 'var(--color-text-main)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedCase.description || selectedCase.incidentDescription || '(No narrative statement text recorded at intake)'}
                </div>
              </div>

              {/* B. Incident Information */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  B. Incident Circumstances & Parameters
                </span>
                <div
                  style={{
                    marginTop: 6,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'var(--color-bg-secondary)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Incident Date & Time:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.84rem' }}>
                      {selectedCase.incidentDate ? new Date(selectedCase.incidentDate).toLocaleString('en-IN') : 'Not specified by complainant'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Incident Location:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.84rem' }}>
                      {selectedCase.location || 'Not specified by complainant'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Type of Harassment:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.84rem' }}>
                      {selectedCase.incidentCategory}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Support Preferences Selected:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-primary)' }}>
                      {(selectedCase.supportRequired && selectedCase.supportRequired.length > 0) ? selectedCase.supportRequired.join(', ') : 'Standard IC Inquiry'}
                    </p>
                  </div>
                </div>
              </div>

              {/* C. People Involved */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  C. People Involved & Access Controls
                </span>
                <div
                  style={{
                    marginTop: 6,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'var(--color-bg-secondary)',
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedCase.isAnonymous ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 700 }}>
                        <Lock size={14} /> Anonymous Reporting Safeguard Active
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        Complainant elected anonymous intake. Identifying names, phone numbers, and personal email addresses are withheld under whistleblower protection protocols.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Complainant Name:</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{selectedCase.reporterName || 'Confidential on record'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Email:</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{selectedCase.reporterEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Phone:</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{selectedCase.reporterPhone || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    <strong>Respondent & Witnesses:</strong> Identified within verbatim statement text and summons notices in Section 3 below.
                  </div>
                </div>
              </div>

              {/* D. AI Screening Assessment (Clearly distinguished as advisory) */}
              {selectedCase.classification && (
                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    D. AI Screening Assessment (Advisory / Non-Binding)
                  </span>
                  <div
                    style={{
                      marginTop: 6,
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB' }}>
                        Severity: {selectedCase.classification.severity || 'STANDARD'} (Score: {selectedCase.classification.severityScore ?? 'N/A'})
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Confidence: {selectedCase.classification.confidence ? `${Math.round(selectedCase.classification.confidence * 100)}%` : 'Rule-based'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16856B' }}>
                        Category: {selectedCase.classification.category || selectedCase.incidentCategory}
                      </span>
                    </div>
                    {selectedCase.classification.reasoning && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                        "{selectedCase.classification.reasoning}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Case Officer Assignment */}
            {!isAuditor && (isMainAdmin || isICMember) && (
              <div className="card" style={{ padding: 18, marginBottom: 18 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800 }}>Inquiry Officer Assignment</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, minWidth: 200 }}
                  >
                    <option value="">Select Eligible IC Member...</option>
                    {staffList.filter(s => s.isActive && ['ic_member', 'case_officer', 'admin'].includes(s.role)).map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.staffId || s.role}) — {s.activeCasesCount || 0} active cases
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    placeholder="Reason for assignment / reassignment..."
                    className="form-input"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    type="button"
                    onClick={handleAssignStaff}
                    disabled={!assigneeId}
                    className="btn btn-primary btn-sm"
                  >
                    Assign Case
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Status Transition & Override */}
            {!isAuditor && (
              <div className="card" style={{ padding: 18, marginBottom: 18 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800 }}>Advance Case Lifecycle</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <select
                    value={statusChangeChoice}
                    onChange={(e) => setStatusChangeChoice(e.target.value)}
                    className="form-input"
                    style={{ minWidth: 220 }}
                  >
                    <option value="">Select New Lifecycle State...</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder="Transition rationale note..."
                    className="form-input"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={!statusChangeChoice}
                    className="btn btn-secondary btn-sm"
                  >
                    Update Status
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setMeetingModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Calendar size={13} /> Schedule Inquiry Hearing
                  </button>
                  <button
                    type="button"
                    onClick={() => setFindingsModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Scale size={13} /> Record Inquiry Findings
                  </button>
                  <button
                    type="button"
                    onClick={() => setClarificationModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <HelpCircle size={13} /> Request Clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriorityModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ShieldAlert size={13} /> Override Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClosureAction(selectedCase.status === 'closed' ? 'REOPEN' : 'CLOSE');
                      setClosureModalOpen(true);
                    }}
                    className={selectedCase.status === 'closed' ? "btn btn-primary btn-sm" : "btn btn-outline-primary btn-sm"}
                  >
                    {selectedCase.status === 'closed' ? 'Reopen Case' : 'Close Case File'}
                  </button>
                </div>
              </div>
            )}

            {/* Section 4: Scheduled Hearings & Inquiry Milestones */}
            <div className="card" style={{ padding: 18, marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800 }}>Inquiry Milestones & Hearing Proceedings</h4>
              {(!selectedCase.inquiryMeetings || selectedCase.inquiryMeetings.length === 0) ? (
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                  No inquiry hearings or witness testimonies scheduled yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCase.inquiryMeetings.map((m) => (
                    <div key={m._id} style={{ padding: 10, background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{m.title}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                          {new Date(m.scheduledAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Venue / Link: {m.locationOrLink}</div>
                      {m.notes && <div style={{ fontSize: '0.78rem', marginTop: 4 }}>{m.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Confidential Internal Investigation Notes */}
            <div className="card" style={{ padding: 18, marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Lock size={15} /> Confidential Internal Investigation Notes
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                These notes are strictly confidential to authorized Internal Committee members and are excluded from complainant case tracking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                {(!selectedCase.internalNotesList || selectedCase.internalNotesList.length === 0) ? (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>No confidential investigation notes recorded.</p>
                ) : (
                  selectedCase.internalNotesList.map((note) => (
                    <div key={note._id} style={{ padding: 10, background: 'var(--color-bg-secondary)', borderRadius: 8, borderLeft: '3px solid var(--color-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>{note.authorName} ({note.authorRole})</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.4 }}>{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {!isAuditor && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="Enter confidential observation, evidence finding, or committee note..."
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddInternalNote}
                    disabled={submittingNote || !internalNoteText.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    Add Note
                  </button>
                </div>
              )}
            </div>

            {/* Section 6: Evidence Integrity & Linked Vault Files */}
            <div className="card" style={{ padding: 18, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800 }}>
                  Evidence & Proof Vault Cryptographic Records
                </h4>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--color-soft-pink)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                }}>
                  {((selectedCase.vaultEvidence?.length || 0) + (selectedCase.evidence?.length || 0))} Attached
                </span>
              </div>

              {((selectedCase.vaultEvidence?.length || 0) + (selectedCase.evidence?.length || 0)) === 0 ? (
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                  No evidence attachments or Proof Vault files linked to this complaint yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Linked Proof Vault Records */}
                  {selectedCase.vaultEvidence && selectedCase.vaultEvidence.map((ve) => (
                    <div key={ve._id || ve.evidenceId} style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Lock size={13} color="var(--color-primary)" />
                            {ve.originalName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {ve.category?.toUpperCase()} • {Math.round((ve.sizeBytes || 0) / 1024)} KB • Uploaded {new Date(ve.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: 'rgba(22, 133, 107, 0.12)',
                            color: '#16856B',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}>
                            {ve.linkingStatus ? ve.linkingStatus.toUpperCase() : 'LINKED'}
                          </span>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: 'rgba(37, 99, 235, 0.12)',
                            color: '#2563EB',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}>
                            AES-256-GCM
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginBottom: 8, wordBreak: 'break-all' }}>
                        SHA-256: {ve.sha256Digest}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: '0.74rem', color: '#16856B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={13} /> Dual-Copy Verified (Primary + Local Replica)
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleVerifyEvidence(ve.evidenceId || ve._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                          >
                            Verify Integrity
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await downloadStaffCaseVaultEvidence(selectedCase.caseId, ve.evidenceId);
                                const blob = new Blob([res.data], { type: res.mimeType });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = res.originalName + '.enc';
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch (err: any) {
                                alert('Failed to download encrypted file: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                          >
                            Download Encrypted
                          </button>
                        </div>
                      </div>

                      {evidenceVerificationStatus[ve.evidenceId || ve._id] && (
                        <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', padding: '6px 10px', background: 'rgba(22, 133, 107, 0.1)', borderRadius: 6 }}>
                          {evidenceVerificationStatus[ve.evidenceId || ve._id]}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Standard Form Uploaded Evidence */}
                  {selectedCase.evidence && selectedCase.evidence.map((ev) => (
                    <div key={ev._id} style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} color="var(--color-primary)" />
                            {ev.originalName || ev.filename}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {ev.mimetype || ev.mimeType || 'Document'} • {ev.size ? `${(ev.size / 1024).toFixed(1)} KB` : 'Uploaded'} • SHA-256: {ev.sha256Hash ? `${ev.sha256Hash.substring(0, 24)}...` : 'Intake check'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleVerifyEvidence(ev.fileId || ev._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                          >
                            Verify Checksum
                          </button>

                          <a
                            href={`/api/evidence/${ev._id}/download`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>
                      {evidenceVerificationStatus[ev.fileId || ev._id] && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', padding: '4px 8px', background: 'rgba(22, 133, 107, 0.1)', borderRadius: 6 }}>
                          {evidenceVerificationStatus[ev.fileId || ev._id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                PART 3: STAFF CASE INVESTIGATION VIEW (CHRONOLOGICAL PROGRESS)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="card" style={{ padding: 18, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} color="var(--color-primary)" /> Investigation & Case Progress
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Real-time Chronological Audit Ledger
                </span>
              </div>

              {/* Render dynamic unified chronological history */}
              {(() => {
                const events: Array<{ date: Date; action: string; actor: string; desc: string }> = [];

                if (selectedCase.createdAt) {
                  events.push({
                    date: new Date(selectedCase.createdAt),
                    action: 'Complaint Submitted',
                    actor: selectedCase.isAnonymous ? 'Protected Anonymous Complainant' : (selectedCase.reporterName || 'Complainant'),
                    desc: `Initial intake recorded with Case ID ${selectedCase.caseId}. Categorized as ${selectedCase.incidentCategory}.`,
                  });
                }

                if (selectedCase.assignedTo) {
                  events.push({
                    date: new Date(new Date(selectedCase.createdAt).getTime() + 1000 * 60 * 30),
                    action: 'Inquiry Officer Assigned',
                    actor: 'Internal Committee Administration',
                    desc: `Case assigned to Inquiry Officer: ${selectedCase.assignedTo.name} (${selectedCase.assignedTo.designation || selectedCase.assignedTo.role}).`,
                  });
                }

                if (selectedCase.inquiryMeetings) {
                  selectedCase.inquiryMeetings.forEach(m => {
                    events.push({
                      date: new Date(m.scheduledAt),
                      action: 'Inquiry Hearing Scheduled',
                      actor: 'Internal Committee',
                      desc: `Hearing '${m.title}' scheduled at ${m.locationOrLink}. Notes: ${m.notes || 'Hearing record logged.'}`,
                    });
                  });
                }

                if (selectedCase.clarificationRequests) {
                  selectedCase.clarificationRequests.forEach(cr => {
                    events.push({
                      date: new Date(cr.requestedAt),
                      action: 'Clarification Requested',
                      actor: 'Inquiry Committee',
                      desc: `Inquiry question sent to complainant: "${cr.question}".`,
                    });
                    if (cr.response && cr.respondedAt) {
                      events.push({
                        date: new Date(cr.respondedAt),
                        action: 'Clarification Received',
                        actor: 'Complainant',
                        desc: `Complainant provided clarification: "${cr.response}".`,
                      });
                    }
                  });
                }

                if (selectedCase.auditHistory) {
                  selectedCase.auditHistory.forEach(a => {
                    events.push({
                      date: new Date(a.timestamp),
                      action: a.action,
                      actor: a.performedBy || 'Authorized Staff',
                      desc: a.reason || 'Case record action logged.',
                    });
                  });
                }

                events.sort((a, b) => b.date.getTime() - a.date.getTime()); // Latest first in UI

                if (events.length === 0) {
                  return <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>No historical events recorded.</p>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {events.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '10px 12px',
                          background: 'var(--color-bg-secondary)',
                          borderRadius: 8,
                          borderLeft: '3px solid var(--color-primary)',
                        }}
                      >
                        <div style={{ minWidth: 130 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                            {ev.date.toLocaleDateString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {ev.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '0.84rem', color: 'var(--color-text-main)' }}>{ev.action}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>by {ev.actor}</span>
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                            {ev.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PROVISION STAFF ────────────────────────────────────────────── */}
      {provisionModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(500px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>Provision Staff Account</h3>
            {provisionError && <div style={{ padding: 10, background: 'rgba(217, 45, 53, 0.1)', color: '#D92D35', borderRadius: 8, fontSize: '0.84rem', marginBottom: 12 }}>{provisionError}</div>}
            {provisionSuccess && <div style={{ padding: 10, background: 'rgba(22, 133, 107, 0.12)', color: '#16856B', borderRadius: 8, fontSize: '0.84rem', marginBottom: 12 }}>{provisionSuccess}</div>}

            <form onSubmit={handleProvisionStaff}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={provisionData.name}
                  onChange={(e) => setProvisionData({ ...provisionData, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Official Email Address</label>
                <input
                  type="email"
                  required
                  value={provisionData.email}
                  onChange={(e) => setProvisionData({ ...provisionData, email: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Department</label>
                  <input
                    type="text"
                    value={provisionData.department}
                    onChange={(e) => setProvisionData({ ...provisionData, department: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Designation</label>
                  <input
                    type="text"
                    value={provisionData.designation}
                    onChange={(e) => setProvisionData({ ...provisionData, designation: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Role & Authority</label>
                <select
                  value={provisionData.role}
                  onChange={(e) => setProvisionData({ ...provisionData, role: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="ic_member">Internal Committee (IC) Member</option>
                  <option value="case_officer">Case Inquiry Officer</option>
                  <option value="auditor">Statutory Compliance Auditor (Read-Only)</option>
                  <option value="admin">System Main Administrator</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Initial Temporary Password</label>
                <input
                  type="text"
                  required
                  value={provisionData.initialPassword}
                  onChange={(e) => setProvisionData({ ...provisionData, initialPassword: e.target.value })}
                  placeholder="e.g. SecurePass2026!"
                  className="form-input"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                  User will be prompted to choose a new password on their first login.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setProvisionModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SCHEDULE INQUIRY MEETING ──────────────────────────────────── */}
      {meetingModalOpen && selectedCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>Schedule POSH Inquiry Proceeding</h3>
            <form onSubmit={handleScheduleMeeting}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Hearing Title</label>
                <input
                  type="text"
                  required
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingData.scheduledAt}
                  onChange={(e) => setMeetingData({ ...meetingData, scheduledAt: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Location / Secure Virtual Link</label>
                <input
                  type="text"
                  required
                  value={meetingData.locationOrLink}
                  onChange={(e) => setMeetingData({ ...meetingData, locationOrLink: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Attendees (comma separated emails / names)</label>
                <input
                  type="text"
                  value={meetingData.attendees}
                  onChange={(e) => setMeetingData({ ...meetingData, attendees: e.target.value })}
                  placeholder="e.g. Presiding Officer, External Member, Complainant"
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Schedule Hearing & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD INQUIRY FINDINGS ────────────────────────────────────── */}
      {findingsModalOpen && selectedCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(560px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>Record Formal Inquiry Findings & Recommendations</h3>
            <form onSubmit={handleRecordFindings}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Inquiry Findings Summary</label>
                <textarea
                  required
                  rows={4}
                  value={findingsData.findingsSummary}
                  onChange={(e) => setFindingsData({ ...findingsData, findingsSummary: e.target.value })}
                  placeholder="Summary of findings established through committee inquiry..."
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Recommendations to Employer (POSH Sec 13)</label>
                <textarea
                  rows={3}
                  value={findingsData.recommendations}
                  onChange={(e) => setFindingsData({ ...findingsData, recommendations: e.target.value })}
                  placeholder="Disciplinary action, compensation, policy training..."
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Formal Order Reference #</label>
                  <input
                    type="text"
                    value={findingsData.formalOrderNumber}
                    onChange={(e) => setFindingsData({ ...findingsData, formalOrderNumber: e.target.value })}
                    placeholder="e.g. ICC-2026-ORD-042"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Final Outcome State</label>
                  <select
                    value={findingsData.finalOutcomeStatus}
                    onChange={(e) => setFindingsData({ ...findingsData, finalOutcomeStatus: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="decision_recorded">Decision Recorded</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setFindingsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Record Findings & Advance Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CLOSE / REOPEN CASE ────────────────────────────────────────── */}
      {closureModalOpen && selectedCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(480px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>
              {closureAction === 'CLOSE' ? 'Close Case File' : 'Reopen Case File'}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              Mandatory documented justification is required for forensic compliance.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                Documented Justification
              </label>
              <textarea
                required
                rows={4}
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder={closureAction === 'CLOSE' ? "State closure rationale, committee consensus, or compliance verification..." : "State newly submitted evidence or procedural review justification..."}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setClosureModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseOrReopen}
                className={closureAction === 'CLOSE' ? "btn btn-primary" : "btn btn-secondary"}
              >
                Confirm {closureAction === 'CLOSE' ? 'Closure' : 'Reopening'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REQUEST CLARIFICATION ────────────────────────────────────── */}
      {clarificationModalOpen && selectedCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(480px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>
              Request Information from Complainant
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              This request will be visible to the complainant on their Case Tracking portal using their Report ID & Recovery Key.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                Specific Clarification Needed
              </label>
              <textarea
                required
                rows={4}
                value={clarificationQuestion}
                onChange={(e) => setClarificationQuestion(e.target.value)}
                placeholder="e.g. Please clarify the exact date or provide witness contact details..."
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setClarificationModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!clarificationQuestion.trim()) return;
                  try {
                    await axios.post(`/api/cases/${selectedCase.caseId}/clarification-requests`, {
                      question: clarificationQuestion.trim(),
                    }, { withCredentials: true });
                    alert('Clarification request dispatched to complainant tracking portal.');
                    setClarificationModalOpen(false);
                    setClarificationQuestion('');
                    loadCases();
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to dispatch clarification request.');
                  }
                }}
                className="btn btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRIORITY OVERRIDE ──────────────────────────────────────────── */}
      {priorityModalOpen && selectedCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(480px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>Override Case Priority</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>New Priority Level</label>
              <select
                value={newPriorityChoice}
                onChange={(e) => setNewPriorityChoice(e.target.value as any)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="HIGH">HIGH (Urgent safety review)</option>
                <option value="MEDIUM">MEDIUM (Prompt inquiry)</option>
                <option value="LOW">LOW (Standard workflow)</option>
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                Documented Reason for Override
              </label>
              <textarea
                required
                rows={3}
                value={priorityOverrideReason}
                onChange={(e) => setPriorityOverrideReason(e.target.value)}
                placeholder="State the safety, procedural, or operational factor requiring this override..."
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setPriorityModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverridePriority}
                className="btn btn-primary"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ESCALATION ACTION ──────────────────────────────────────────── */}
      {escalationModalOpen && escalationTargetCase && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800, color: '#D92D35' }}>
              Record Authorized Escalation / Extension Action
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Action Type</label>
              <select
                value={escalationActionType}
                onChange={(e) => setEscalationActionType(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="DEADLINE_EXTENSION">Statutory Deadline Extension</option>
                <option value="COMMITTEE_REFERRAL">Full Committee Re-referral</option>
                <option value="EXTERNAL_LEGAL_REFERRAL">External Legal / Police Referral</option>
                <option value="MANAGEMENT_ESCALATION">Employer Executive Escalation</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Extended Target Date (Optional)</label>
              <input
                type="date"
                value={escalationNewDate}
                onChange={(e) => setEscalationNewDate(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Authorized Rationale</label>
              <textarea
                required
                rows={3}
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="State the justification, witness delays, or legal grounds..."
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEscalationModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscalationAction}
                className="btn btn-primary"
              >
                Record Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: FIRST-TIME PASSWORD SETUP ENFORCEMENT ──────────────────────── */}
      {passwordModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(450px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(18px, 4vw, 28px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Key size={22} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Set Up Your Secure Password</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              For your account security and confidential POSH compliance, you must set a personal password before accessing case records.
            </p>

            {passwordError && <div style={{ padding: 10, background: 'rgba(217, 45, 53, 0.1)', color: '#D92D35', borderRadius: 8, fontSize: '0.84rem', marginBottom: 12 }}>{passwordError}</div>}
            {passwordSuccess && <div style={{ padding: 10, background: 'rgba(22, 133, 107, 0.12)', color: '#16856B', borderRadius: 8, fontSize: '0.84rem', marginBottom: 12 }}>{passwordSuccess}</div>}

            <form onSubmit={handleChangePasswordSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>New Password (minimum 8 characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
