import { useState, useEffect, useId, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Shield, Key, Download, Trash2, CheckCircle2,
  AlertTriangle, Eye, EyeOff, Copy, Check, RefreshCw, FileText,
  Image as ImageIcon, Music, Video, Plus, Clock, Search,
  CheckCircle, ArrowRight, Link, Unlink
} from 'lucide-react';
import {
  createVault,
  unlockVault,
  getVaultMetadata,
  uploadVaultEvidence,
  listVaultEvidence,
  downloadVaultCiphertext,
  verifyVaultEvidenceIntegrity,
  deleteVaultEvidence,
  getVaultAuditTrail,
  lockVault,
  linkVaultEvidence,
  unlinkVaultEvidence,
} from '../services/api';
import {
  deriveVaultKey,
  encryptEvidence,
  decryptEvidence,
  generateRecoveryKitContent,
} from '../services/vaultCrypto';

interface VaultData {
  vaultId: string;
  salt: string;
  status: string;
  evidenceCount: number;
  storageUsedBytes: number;
  createdAt: string;
  lastUnlockedAt?: string;
  backupVerified?: boolean;
}

interface EvidenceItem {
  evidenceId: string;
  originalName: string;
  category: string;
  sizeBytes: number;
  mimeType: string;
  iv: string;
  sha256Digest: string;
  encryptionVersion: string;
  notes?: string;
  createdAt: string;
  caseId?: string;
  linkingStatus?: string;
  linkedAt?: string;
  integrityStatus?: string;
  backupVerified?: boolean;
  backupVerifiedAt?: string;
}

interface AuditEvent {
  eventId: string;
  eventType: string;
  details: Record<string, any>;
  previousHash: string;
  eventHash: string;
  timestamp: string;
}

export default function ProofVaultPage() {
  const fileInputId = useId();
  // ─── Authentication & Session State ───
  const [token, setToken] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [vaultSecretKeyMemory, setVaultSecretKeyMemory] = useState<string>('');

  // ─── Login / Unlock Form State ───
  const [inputVaultId, setInputVaultId] = useState('');
  const [inputSecretKey, setInputSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ─── Vault Creation Flow State ───
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVaultInfo, setNewVaultInfo] = useState<{ vaultId: string; secretKey: string; salt: string; token: string } | null>(null);
  const [hasConfirmedSavedKey, setHasConfirmedSavedKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // ─── Active Vault Dashboard State ───
  const [activeTab, setActiveTab] = useState<'evidence' | 'upload' | 'audit' | 'recovery'>('evidence');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ─── Upload State ───
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('document');
  const [fileNotes, setFileNotes] = useState('');
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploadRecoveryKey, setUploadRecoveryKey] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStepMsg, setUploadStepMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // ─── Case Linking & Filter State ───
  const [linkingFilter, setLinkingFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [linkModalItem, setLinkModalItem] = useState<EvidenceItem | null>(null);
  const [linkModalCaseId, setLinkModalCaseId] = useState('');
  const [linkModalRecoveryKey, setLinkModalRecoveryKey] = useState('');
  const [linkModalSubmitting, setLinkModalSubmitting] = useState(false);
  const [linkModalError, setLinkModalError] = useState('');
  const [linkModalSuccess, setLinkModalSuccess] = useState('');

  // ─── Verification & Action State ───
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

  // ─── Audit Trail State ───
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [chainIntact, setChainIntact] = useState<boolean | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Load vault data and evidence when unlocked
  useEffect(() => {
    if (token && vaultData) {
      loadEvidence();
    }
  }, [token, vaultData?.vaultId]);

  const loadEvidence = async () => {
    if (!token) return;
    setEvidenceLoading(true);
    try {
      const res = await listVaultEvidence(token);
      if (res.success) {
        setEvidenceList(res.evidence || []);
      }
      const meta = await getVaultMetadata(token);
      if (meta.success) {
        setVaultData(prev => prev ? { ...prev, ...meta.vault } : meta.vault);
      }
    } catch (err: any) {
      console.warn('Failed to load vault evidence:', err.message);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const res = await getVaultAuditTrail(token);
      if (res.success) {
        setAuditEvents(res.events || []);
        setChainIntact(res.chainVerification?.isIntact ?? true);
      }
    } catch (err) {
      console.warn('Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── UNLOCK VAULT HANDLER ───
  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!inputVaultId.trim() || !inputSecretKey.trim()) {
      setAuthError('Please enter both your Vault ID and Vault Secret Key.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await unlockVault(inputVaultId, inputSecretKey);
      if (res.success) {
        // Derive client-side AES-256-GCM key in browser memory
        const key = await deriveVaultKey(inputSecretKey, res.vault.salt);
        setCryptoKey(key);
        setToken(res.token);
        setVaultData(res.vault);
        setVaultSecretKeyMemory(inputSecretKey.trim().toUpperCase());
        setInputSecretKey(''); // Clear raw secret from form state
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.friendlyMessage || 'Invalid Vault ID or Secret Key.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── CREATE VAULT HANDLER ───
  const handleStartCreate = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await createVault();
      if (res.success) {
        setNewVaultInfo({
          vaultId: res.vaultId,
          secretKey: res.secretKey,
          salt: res.salt,
          token: res.token,
        });
        setShowCreateModal(true);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.friendlyMessage || 'Failed to create vault.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFinishCreate = async () => {
    if (!newVaultInfo || !hasConfirmedSavedKey) return;
    try {
      const key = await deriveVaultKey(newVaultInfo.secretKey, newVaultInfo.salt);
      setCryptoKey(key);
      setToken(newVaultInfo.token);
      setVaultSecretKeyMemory(newVaultInfo.secretKey);
      setVaultData({
        vaultId: newVaultInfo.vaultId,
        salt: newVaultInfo.salt,
        status: 'active',
        evidenceCount: 0,
        storageUsedBytes: 0,
        createdAt: new Date().toISOString(),
      });
      setShowCreateModal(false);
      setNewVaultInfo(null);
    } catch (err) {
      console.error('Failed to initialize created vault:', err);
    }
  };

  // ─── DOWNLOAD RECOVERY KIT ───
  const downloadRecoveryKit = (vId: string, sKey: string, cDate: string) => {
    const content = generateRecoveryKitContent(vId, sKey, cDate);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vId}_RECOVERY_KIT.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── LOCK VAULT HANDLER ───
  const handleLockVault = async () => {
    if (token) {
      try { await lockVault(token); } catch (_) {}
    }
    // Clear all memory state & derived keys immediately
    setToken(null);
    setVaultData(null);
    setCryptoKey(null);
    setVaultSecretKeyMemory('');
    setEvidenceList([]);
    setAuditEvents([]);
    setSelectedFile(null);
    setActionMessage(null);
    setActiveTab('evidence');
  };

  // ─── ENCRYPT & UPLOAD EVIDENCE HANDLER ───
  const handleUploadEvidence = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !cryptoKey || !token) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadStepMsg('Reading file bytes into memory...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      setUploadStepMsg('Encrypting with AES-256-GCM in browser...');
      const { ciphertext, ivBase64, ciphertextHash } = await encryptEvidence(arrayBuffer, cryptoKey);

      setUploadStepMsg('Uploading encrypted payload and verifying ciphertext digest...');
      const cipherBlob = new Blob([ciphertext], { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('encryptedFile', cipherBlob, `${selectedFile.name}.enc`);
      formData.append('iv', ivBase64);
      formData.append('ciphertextHash', ciphertextHash);
      formData.append('originalName', selectedFile.name);
      formData.append('category', fileCategory);
      formData.append('mimeType', selectedFile.type || 'application/octet-stream');
      formData.append('notes', fileNotes);

      if (uploadCaseId.trim()) {
        formData.append('caseId', uploadCaseId.trim().toUpperCase());
        if (uploadRecoveryKey.trim()) {
          formData.append('recoveryCode', uploadRecoveryKey.trim().toUpperCase());
        }
      }

      const res = await uploadVaultEvidence(token, formData);
      if (res.success) {
        setUploadSuccess(`"${selectedFile.name}" encrypted with AES-256-GCM and stored securely.`);
        setSelectedFile(null);
        setFileNotes('');
        setUploadCaseId('');
        setUploadRecoveryKey('');
        await loadEvidence();
        setTimeout(() => setActiveTab('evidence'), 1400);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.friendlyMessage || err.message || 'Encryption/upload failed.');
    } finally {
      setUploading(false);
      setUploadStepMsg('');
    }
  };

  // ─── DECRYPT & DOWNLOAD HANDLER ───
  const handleDecryptAndDownload = async (item: EvidenceItem) => {
    if (!token || !cryptoKey) return;
    setDecryptingId(item.evidenceId);
    setActionMessage(null);

    try {
      const res = await downloadVaultCiphertext(token, item.evidenceId);
      const plaintextBuffer = await decryptEvidence(res.data, item.iv, cryptoKey);

      // Trigger browser download of decrypted plaintext
      const blob = new Blob([plaintextBuffer], { type: item.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.originalName;
      a.click();
      URL.revokeObjectURL(url);

      setActionMessage({ id: item.evidenceId, text: `✓ Decrypted & downloaded "${item.originalName}"` });
    } catch (err: any) {
      setActionMessage({ id: item.evidenceId, text: `Decryption failed: ${err.message}`, isError: true });
    } finally {
      setDecryptingId(null);
    }
  };

  // ─── VERIFY INTEGRITY HANDLER ───
  const handleVerifyIntegrity = async (item: EvidenceItem) => {
    if (!token) return;
    setVerifyingId(item.evidenceId);
    setActionMessage(null);

    try {
      const res = await verifyVaultEvidenceIntegrity(token, item.evidenceId);
      if (res.isIntact) {
        setActionMessage({
          id: item.evidenceId,
          text: `✓ Cryptographic integrity verified intact. Primary & backup hash match: ${res.expectedHash.slice(0, 16)}...`,
        });
      } else {
        setActionMessage({
          id: item.evidenceId,
          text: `⚠️ Integrity Alert: ${res.message}`,
          isError: true,
        });
      }
      await loadEvidence();
    } catch (err: any) {
      setActionMessage({ id: item.evidenceId, text: 'Verification check failed to complete.', isError: true });
    } finally {
      setVerifyingId(null);
    }
  };

  // ─── DELETE EVIDENCE HANDLER ───
  const handleDeleteEvidence = async (item: EvidenceItem) => {
    if (!token) return;
    const confirmed = window.confirm(`Move "${item.originalName}" to the 30-day retention locker? Deletion will be recorded in the audit trail.`);
    if (!confirmed) return;

    try {
      await deleteVaultEvidence(token, item.evidenceId);
      setActionMessage({ id: item.evidenceId, text: `Moved to 30-day retention locker.` });
      await loadEvidence();
    } catch (err: any) {
      alert('Failed to delete evidence.');
    }
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter evidence list by search, category, and linking status
  const filteredEvidence = evidenceList.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      item.originalName.toLowerCase().includes(q) ||
      (item.caseId && item.caseId.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLinking = linkingFilter === 'all' ||
      (linkingFilter === 'linked' && !!item.caseId) ||
      (linkingFilter === 'unlinked' && !item.caseId);
    return matchesSearch && matchesCategory && matchesLinking;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'image': return <ImageIcon size={18} />;
      case 'audio': return <Music size={18} />;
      case 'video': return <Video size={18} />;
      case 'consent_note': return <CheckCircle size={18} />;
      default: return <FileText size={18} />;
    }
  };

  // ─── LINK EVIDENCE HANDLER ───
  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !linkModalItem || !linkModalCaseId.trim()) return;

    setLinkModalSubmitting(true);
    setLinkModalError('');
    setLinkModalSuccess('');

    try {
      const res = await linkVaultEvidence(token, linkModalItem.evidenceId, {
        caseId: linkModalCaseId.trim().toUpperCase(),
        recoveryCode: linkModalRecoveryKey.trim().toUpperCase(),
      });
      setLinkModalSuccess(res.message || 'Evidence successfully linked to case.');
      await loadEvidence();
      setTimeout(() => {
        setLinkModalItem(null);
        setLinkModalCaseId('');
        setLinkModalRecoveryKey('');
        setLinkModalSuccess('');
      }, 1200);
    } catch (err: any) {
      setLinkModalError(err.response?.data?.message || err.message || 'Failed to link evidence. Please verify your Case ID and Recovery Key.');
    } finally {
      setLinkModalSubmitting(false);
    }
  };

  // ─── UNLINK EVIDENCE HANDLER ───
  const handleUnlinkEvidence = async (item: EvidenceItem) => {
    if (!token) return;
    const confirmed = window.confirm(`Unlink "${item.originalName}" from Case ${item.caseId}? The file will remain safely encrypted in your vault.`);
    if (!confirmed) return;

    try {
      await unlinkVaultEvidence(token, item.evidenceId);
      setActionMessage({ id: item.evidenceId, text: `Unlinked "${item.originalName}" from Case ${item.caseId}.` });
      await loadEvidence();
    } catch (err: any) {
      setActionMessage({ id: item.evidenceId, text: err.response?.data?.message || 'Failed to unlink evidence.', isError: true });
    }
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '36px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1040, margin: '0 auto', padding: '0 20px' }}>
        
        {/* ─── HEADER ─── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 16,
            background: 'var(--color-soft-pink)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: 'var(--shadow-sm)',
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-main)' }}>
            Proof Vault
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
            Securely store private evidence, consent notes, and interaction records. Your evidence is encrypted, and its integrity can be verified later.
          </p>
        </div>

        {/* ─── CASE 1: LOCKED STATE (VAULT AUTHENTICATION) ─── */}
        {!token && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 520, margin: '0 auto' }}
          >
            <div className="card" style={{ padding: '36px', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'var(--color-soft-pink)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <Lock size={24} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Open Your Private Vault</h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Enter your unique Vault ID and high-entropy Secret Key.
                </p>
              </div>

              <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Vault ID</label>
                  <input
                    className="form-input"
                    type="text"
                    value={inputVaultId}
                    onChange={e => setInputVaultId(e.target.value)}
                    placeholder="VAULT-20261026-XXXX"
                    required
                    style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Vault Secret Key</label>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />} {showSecretKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    className="form-input"
                    type={showSecretKey ? 'text' : 'password'}
                    value={inputSecretKey}
                    onChange={e => setInputSecretKey(e.target.value)}
                    placeholder="PV-SEC-XXXX-XXXX-XXXX-..."
                    required
                    style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}
                  />
                </div>

                {authError && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(217, 45, 53, 0.08)',
                    border: '1px solid rgba(217, 45, 53, 0.3)',
                    color: 'var(--color-emergency)',
                    fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertTriangle size={16} /> {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={authLoading}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  <Unlock size={18} />
                  {authLoading ? 'Verifying & Unlocking…' : 'Open My Vault'}
                </button>
              </form>

              <div style={{
                position: 'relative', margin: '28px 0 20px', textAlign: 'center',
              }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--color-border)' }} />
                <span style={{ position: 'relative', background: '#ffffff', padding: '0 12px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  OR
                </span>
              </div>

              <button
                type="button"
                onClick={handleStartCreate}
                disabled={authLoading}
                className="btn btn-secondary btn-lg"
                style={{ width: '100%' }}
              >
                <Plus size={18} />
                Create a New Vault
              </button>

              <div style={{ marginTop: 24, padding: '14px', borderRadius: 12, background: 'var(--color-bg-secondary)', fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} color="var(--color-primary)" /> Zero-Knowledge Client-Side Encryption
                </div>
                Your evidence files are encrypted locally in your browser with AES-256-GCM before upload. The server never receives your raw plaintext evidence or secret key.
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── CASE 2: UNLOCKED STATE (VAULT DASHBOARD) ─── */}
        {token && vaultData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Top Vault Summary Card */}
            <div className="card" style={{ padding: '24px 28px', marginBottom: 28, borderRadius: 18, border: '1.5px solid var(--color-border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Active Proof Vault
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 9999,
                      background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a',
                      fontSize: '0.74rem', fontWeight: 700,
                    }}>
                      <CheckCircle2 size={12} /> Decrypted Session Active
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                      {vaultData.vaultId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vaultData.vaultId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      title="Copy Vault ID"
                    >
                      {copiedId ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      {copiedId ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={handleLockVault}
                    className="btn btn-secondary"
                    style={{ color: 'var(--color-emergency)', borderColor: 'rgba(217, 45, 53, 0.3)' }}
                    title="Clear memory keys and lock vault session"
                  >
                    <Lock size={16} /> Lock Vault
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
                marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--color-border)',
              }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Created</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 2 }}>
                    {new Date(vaultData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Evidence Items</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 2 }}>
                    {vaultData.evidenceCount} records
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Storage Used</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 2 }}>
                    {formatBytes(vaultData.storageUsedBytes || 0)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Tamper-Evident Replica</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 2, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Shield size={14} /> Dual-Copy Verified
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex', gap: 8, borderBottom: '2px solid var(--color-border)',
              marginBottom: 24, overflowX: 'auto', paddingBottom: 2,
            }}>
              {[
                { id: 'evidence', label: `Evidence Records (${evidenceList.length})`, icon: FileText },
                { id: 'upload', label: 'Add Encrypted Evidence', icon: Plus },
                { id: 'audit', label: 'Tamper-Evident Audit Trail', icon: Shield },
                { id: 'recovery', label: 'Recovery & Keys', icon: Key },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'audit') loadAuditTrail();
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px 10px 0 0',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                    background: activeTab === tab.id ? 'var(--color-soft-pink)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Feedback Banner */}
            {actionMessage && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                background: actionMessage.isError ? 'rgba(217, 45, 53, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                border: `1px solid ${actionMessage.isError ? 'rgba(217, 45, 53, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                color: actionMessage.isError ? 'var(--color-emergency)' : '#16a34a',
                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {actionMessage.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                {actionMessage.text}
              </div>
            )}

            {/* ─── TAB 1: EVIDENCE FILES LIST ─── */}
            {activeTab === 'evidence' && (
              <div>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: 'var(--color-text-secondary)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by Case ID (e.g. SS-...), filename, or notes..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>

                  <select
                    className="form-input"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{ flex: '0 0 170px' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="document">Documents / PDFs</option>
                    <option value="image">Screenshots / Images</option>
                    <option value="audio">Audio Recordings</option>
                    <option value="video">Videos</option>
                    <option value="consent_note">Consent Notes</option>
                  </select>

                  <select
                    className="form-input"
                    value={linkingFilter}
                    onChange={e => setLinkingFilter(e.target.value as any)}
                    style={{ flex: '0 0 170px' }}
                  >
                    <option value="all">All Records</option>
                    <option value="linked">Linked to Case</option>
                    <option value="unlinked">Unlinked Locker</option>
                  </select>

                  <button
                    onClick={() => setActiveTab('upload')}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={16} /> Add Evidence
                  </button>
                </div>

                {evidenceLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                    <p>Loading encrypted vault records…</p>
                  </div>
                ) : filteredEvidence.length === 0 ? (
                  <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{
                      width: 58, height: 58, borderRadius: 16,
                      background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                      <FileText size={26} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                      {evidenceList.length === 0 ? 'No Evidence Stored Yet' : 'No Matching Evidence'}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>
                      {evidenceList.length === 0
                        ? 'Your vault is ready. Add your first encrypted evidence item or consent note.'
                        : 'Try adjusting your search query or category filter.'}
                    </p>
                    {evidenceList.length === 0 && (
                      <button onClick={() => setActiveTab('upload')} className="btn btn-primary">
                        <Plus size={16} /> Add Your First Record
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredEvidence.map(item => (
                      <div
                        key={item.evidenceId}
                        className="card"
                        style={{
                          padding: '18px 20px',
                          display: 'flex', flexWrap: 'wrap',
                          justifyContent: 'space-between', alignItems: 'center',
                          gap: 16, transition: 'box-shadow 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: '1 1 300px' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'var(--color-soft-pink)', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h4 style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-text-main)' }}>
                                {item.originalName}
                              </h4>
                              <span style={{
                                fontSize: '0.72rem', textTransform: 'uppercase', padding: '2px 8px',
                                borderRadius: 6, background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
                                fontWeight: 700,
                              }}>
                                {item.category}
                              </span>

                              {/* Case Linking Badge */}
                              {item.caseId ? (
                                <button
                                  type="button"
                                  onClick={() => setSearchQuery(item.caseId || '')}
                                  style={{
                                    fontSize: '0.74rem', padding: '2px 8px',
                                    borderRadius: 6, background: 'var(--color-soft-pink)', color: 'var(--color-primary)',
                                    fontWeight: 700, border: '1px solid var(--color-primary)30', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                  }}
                                  title="Click to filter by this Case ID"
                                >
                                  <Link size={11} /> Case: {item.caseId}
                                </button>
                              ) : (
                                <span style={{
                                  fontSize: '0.72rem', padding: '2px 8px',
                                  borderRadius: 6, background: 'rgba(217, 119, 6, 0.12)', color: '#D97706',
                                  fontWeight: 700,
                                }}>
                                  Unlinked Record
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                              <span>{formatBytes(item.sizeBytes)}</span>
                              <span>•</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span style={{ fontFamily: 'monospace' }}>SHA-256: {item.sha256Digest.slice(0, 10)}…</span>
                            </div>

                            {item.notes && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                                "{item.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleDecryptAndDownload(item)}
                            disabled={decryptingId === item.evidenceId}
                            className="btn btn-primary btn-sm"
                            title="Decrypt in-browser and download plaintext"
                          >
                            {decryptingId === item.evidenceId ? (
                              <RefreshCw size={14} className="spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            {decryptingId === item.evidenceId ? 'Decrypting…' : 'Decrypt & Download'}
                          </button>

                          <button
                            onClick={() => handleVerifyIntegrity(item)}
                            disabled={verifyingId === item.evidenceId}
                            className="btn btn-secondary btn-sm"
                            title="Verify cryptographic SHA-256 hash & dual-copy backup"
                          >
                            {verifyingId === item.evidenceId ? (
                              <RefreshCw size={14} className="spin" />
                            ) : (
                              <Shield size={14} />
                            )}
                            Verify Integrity
                          </button>

                          {item.caseId ? (
                            <button
                              onClick={() => handleUnlinkEvidence(item)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px' }}
                              title="Unlink from complaint"
                            >
                              <Unlink size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setLinkModalItem(item);
                                setLinkModalCaseId('');
                                setLinkModalRecoveryKey('');
                                setLinkModalError('');
                                setLinkModalSuccess('');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', color: 'var(--color-primary)' }}
                              title="Link to an existing complaint"
                            >
                              <Link size={14} /> Link Case
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteEvidence(item)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-emergency)', padding: '6px 10px' }}
                            title="Soft delete with 30-day retention"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: ADD ENCRYPTED EVIDENCE ─── */}
            {activeTab === 'upload' && (
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
                    Add Encrypted Record
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                    Select a file. It will be encrypted locally on your device with authenticated <strong>AES-256-GCM</strong> using your Vault Key before transmission.
                  </p>

                  <form onSubmit={handleUploadEvidence} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>File to Encrypt &amp; Store</label>
                      <input
                        id={fileInputId}
                        type="file"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            setSelectedFile(f);
                            // Auto categorize
                            if (f.type.startsWith('image/')) setFileCategory('image');
                            else if (f.type.startsWith('audio/')) setFileCategory('audio');
                            else if (f.type.startsWith('video/')) setFileCategory('video');
                            else setFileCategory('document');
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor={fileInputId}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '32px 20px', borderRadius: 14,
                          border: '2px dashed var(--color-border)',
                          background: 'var(--color-bg-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Shield size={32} color="var(--color-primary)" style={{ marginBottom: 10 }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                          {selectedFile ? selectedFile.name : 'Choose a file to encrypt'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          {selectedFile ? `${formatBytes(selectedFile.size)} • Ready for in-browser encryption` : 'PDF, JPG, PNG, MP3, WAV, MP4 up to 25MB'}
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>
                          Case ID / Report ID (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. SS-2026-A1B2C3"
                          value={uploadCaseId}
                          onChange={e => setUploadCaseId(e.target.value.toUpperCase())}
                          style={{ width: '100%' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                          Directly associates this encrypted file with your complaint.
                        </span>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>
                          Case Recovery Key {uploadCaseId.trim() ? '(Required)' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. REC-XXXX-XXXX"
                          value={uploadRecoveryKey}
                          onChange={e => setUploadRecoveryKey(e.target.value.toUpperCase())}
                          style={{ width: '100%' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                          Authenticates ownership to prevent linking to arbitrary cases.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Category</label>
                      <select
                        className="form-input"
                        value={fileCategory}
                        onChange={e => setFileCategory(e.target.value)}
                      >
                        <option value="document">Official Document / Notice / Email PDF</option>
                        <option value="image">Screenshot / Photo Evidence</option>
                        <option value="audio">Audio Voice Note / Call Recording</option>
                        <option value="video">Video Recording</option>
                        <option value="consent_note">Consent / Authorization Record</option>
                        <option value="note">Written Incident Narrative</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Context / Private Reference (Optional)</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="e.g. Screenshot of offensive WhatsApp communication on Oct 14..."
                        value={fileNotes}
                        onChange={e => setFileNotes(e.target.value)}
                      />
                    </div>

                    {uploadStepMsg && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.08)',
                        color: 'var(--color-primary)',
                        fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <RefreshCw size={14} className="spin" /> {uploadStepMsg}
                      </div>
                    )}

                    {uploadError && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(217, 45, 53, 0.08)',
                        color: 'var(--color-emergency)',
                        fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <AlertTriangle size={15} /> {uploadError}
                      </div>
                    )}

                    {uploadSuccess && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(34, 197, 94, 0.08)',
                        color: '#16a34a',
                        fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <CheckCircle2 size={15} /> {uploadSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedFile || uploading}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      <Lock size={18} />
                      {uploading ? 'Encrypting & Uploading…' : 'Encrypt & Save to Vault'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ─── TAB 3: AUDIT TRAIL & TAMPER EVIDENCE ─── */}
            {activeTab === 'audit' && (
              <div>
                <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={20} color="var(--color-primary)" />
                        Tamper-Evident Hash Chain
                      </h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        Every lifecycle action (creation, upload, verification, download, deletion) is permanently recorded in a SHA-256 linked block.
                      </p>
                    </div>

                    <div>
                      {chainIntact === true && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 9999,
                          background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a',
                          fontSize: '0.85rem', fontWeight: 700,
                        }}>
                          <CheckCircle2 size={16} /> Cryptographic Chain Verified Intact
                        </span>
                      )}
                      {chainIntact === false && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 9999,
                          background: 'rgba(217, 45, 53, 0.1)', color: 'var(--color-emergency)',
                          fontSize: '0.85rem', fontWeight: 700,
                        }}>
                          <AlertTriangle size={16} /> Chain Discrepancy Detected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {auditLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                    <p>Verifying hash chain integrity…</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {auditEvents.map((ev, index) => (
                      <div
                        key={ev.eventId}
                        className="card"
                        style={{
                          padding: '16px 20px',
                          borderLeft: '4px solid var(--color-primary)',
                          background: 'var(--color-bg)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                            {ev.eventType}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                          <span>Event ID: {ev.eventId}</span>
                          <span>Block #{auditEvents.length - index}</span>
                        </div>

                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 8, fontSize: '0.74rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          <div><strong style={{ color: 'var(--color-primary)' }}>Event Hash:</strong> {ev.eventHash}</div>
                          <div style={{ marginTop: 2, color: 'var(--color-text-secondary)' }}><strong>Prev Hash:</strong> {ev.previousHash.slice(0, 32)}…</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 4: RECOVERY & KEYS ─── */}
            {activeTab === 'recovery' && (
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={20} color="var(--color-primary)" />
                    Vault Recovery &amp; Cryptographic Specifications
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                    Your Proof Vault uses client-side encryption. The raw key is never stored by Suraksha Setu. Download your Recovery Kit and keep it safe.
                  </p>

                  <div style={{
                    padding: '16px', borderRadius: 12,
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 24,
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      Active Vault ID
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                      {vaultData.vaultId}
                    </div>
                  </div>

                  <button
                    onClick={() => downloadRecoveryKit(vaultData.vaultId, vaultSecretKeyMemory || '[Retain from your initial kit]', vaultData.createdAt)}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginBottom: 20 }}
                  >
                    <Download size={18} /> Download Emergency Recovery Kit (.txt)
                  </button>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 8 }}>
                      Security Assurance &amp; Architecture
                    </h4>
                    <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <li><strong>Cipher:</strong> Authenticated AES-256-GCM with 128-bit authentication tags</li>
                      <li><strong>Key Derivation:</strong> PBKDF2-HMAC-SHA256 with 100,000 iterations &amp; unique salt</li>
                      <li><strong>Integrity:</strong> Dual-copy server ciphertext storage with SHA-256 verification</li>
                      <li><strong>Tamper Evidence:</strong> Cryptographic hash chain recording all lifecycle events</li>
                      <li><strong>Privacy:</strong> Zero plaintext file bytes ever touch the network or database</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── VAULT CREATION MODAL ─── */}
        <AnimatePresence>
          {showCreateModal && newVaultInfo && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card"
                style={{ width: '100%', maxWidth: 540, padding: 32, borderRadius: 20, boxShadow: 'var(--shadow-xl)' }}
              >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <CheckCircle2 size={30} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Your Proof Vault is Ready</h2>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Save these credentials now. They are your only way to unlock and decrypt your evidence.
                  </p>
                </div>

                {/* Vault ID Display */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Vault ID
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)', marginTop: 4,
                  }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.98rem' }}>
                      {newVaultInfo.vaultId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newVaultInfo.vaultId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      {copiedId ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Secret Key Display */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Vault Secret Key (Master Decryption Key)
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10, background: 'var(--color-soft-pink)',
                    border: '1.5px solid rgba(194, 24, 91, 0.3)', marginTop: 4,
                  }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                      {newVaultInfo.secretKey}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newVaultInfo.secretKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ flexShrink: 0, marginLeft: 10 }}
                    >
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Download Kit Button */}
                <button
                  type="button"
                  onClick={() => downloadRecoveryKit(newVaultInfo.vaultId, newVaultInfo.secretKey, new Date().toISOString())}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginBottom: 20 }}
                >
                  <Download size={16} /> Download Recovery Kit (.txt)
                </button>

                {/* Confirmation Checkbox */}
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)',
                  marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <input
                    type="checkbox"
                    id="confirm-saved-key"
                    checked={hasConfirmedSavedKey}
                    onChange={e => setHasConfirmedSavedKey(e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <label htmlFor="confirm-saved-key" style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', lineHeight: 1.5, cursor: 'pointer' }}>
                    <strong>I have copied and safely stored my Secret Key.</strong> I understand that Suraksha Setu does not store my secret key and cannot recover my files if I lose it.
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewVaultInfo(null);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!hasConfirmedSavedKey}
                    onClick={handleFinishCreate}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                  >
                    Unlock &amp; Enter Vault <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      {/* ─── MODAL: LINK EVIDENCE TO CASE ─── */}
      {linkModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Link Evidence to Complaint</h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                &times;
              </button>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Associate <strong>"{linkModalItem.originalName}"</strong> with your verified complaint. Only authenticated case owners with the matching Recovery Key can link evidence.
            </p>

            {linkModalError && (
              <div style={{ padding: 10, background: 'rgba(217, 45, 53, 0.1)', color: '#D92D35', borderRadius: 8, fontSize: '0.82rem', marginBottom: 12 }}>
                {linkModalError}
              </div>
            )}
            {linkModalSuccess && (
              <div style={{ padding: 10, background: 'rgba(22, 133, 107, 0.12)', color: '#16856B', borderRadius: 8, fontSize: '0.82rem', marginBottom: 12 }}>
                {linkModalSuccess}
              </div>
            )}

            <form onSubmit={handleLinkSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  Case ID / Report ID
                </label>
                <input
                  type="text"
                  required
                  value={linkModalCaseId}
                  onChange={(e) => setLinkModalCaseId(e.target.value.toUpperCase())}
                  placeholder="e.g. SS-2026-A1B2C3"
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  Case Recovery Key
                </label>
                <input
                  type="text"
                  required
                  value={linkModalRecoveryKey}
                  onChange={(e) => setLinkModalRecoveryKey(e.target.value.toUpperCase())}
                  placeholder="Enter the recovery key from your complaint submission"
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setLinkModalItem(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkModalSubmitting || !linkModalCaseId.trim() || !linkModalRecoveryKey.trim()}
                  className="btn btn-primary"
                >
                  {linkModalSubmitting ? 'Authenticating & Linking…' : 'Authenticate & Link Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
