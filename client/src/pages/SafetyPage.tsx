import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, PhoneCall, HeartHandshake, MapPin, Share2, Lock,
  AlertTriangle, CheckCircle2, EyeOff,
  Printer, ArrowLeft, Navigation, Upload, Shield
} from 'lucide-react';
import {
  getSafetyResources,
  submitSafetyStatus,
  saveTrustedContact,
  sendEmergencyAlert,
  startLocationSharing,
  stopLocationSharing,
  getNearbyAssistance,
  type EmergencyNumberResource,
  type NearbyLocationResource
} from '../services/api';

export default function SafetyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const caseId = searchParams.get('caseId') || 'SS-CONFIDENTIAL';
  const initialMode = searchParams.get('mode') || '';

  // Core safety state
  const [safetyChoice, setSafetyChoice] = useState<'SAFE' | 'UNSURE' | 'IMMEDIATE_HELP_NEEDED' | 'MONITORED_SCREEN' | null>(
    initialMode === 'emergency' ? 'IMMEDIATE_HELP_NEEDED' : null
  );
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Helplines & Resources from backend
  const [, setHelplines] = useState<EmergencyNumberResource[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocationResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Kanpur');

  // Trusted Contact Form & Alerts
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [contactConsent, setContactConsent] = useState(false);
  const [savedContact, setSavedContact] = useState<{ id: string; contactName: string; phoneMasked: string } | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [alertResult, setAlertResult] = useState<any>(null);
  const [includeLocationInAlert, setIncludeLocationInAlert] = useState(false);

  // Live Location Sharing
  const [locationSharingActive, setLocationSharingActive] = useState(false);
  const [locationDuration, setLocationDuration] = useState<15 | 60>(15);
  const [locationExpiresAt, setLocationExpiresAt] = useState<string | null>(null);
  const [, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locationPending, setLocationPending] = useState(false);

  // Discreet Mode (quick mask screen if someone walks up)
  const [discreetMaskActive, setDiscreetMaskActive] = useState(false);

  // Load backend verified emergency directory
  useEffect(() => {
    async function loadData() {
      try {
        const [resResources, resNearby] = await Promise.all([
          getSafetyResources(),
          getNearbyAssistance({ city: selectedCity }),
        ]);
        if (resResources.success) {
          setHelplines(resResources.helplines || []);
        }
        if (resNearby.success) {
          setNearbyLocations(resNearby.locations || []);
        }
      } catch (err) {
        console.warn('Initial resources load notice:', err);
      } finally {
        setLoadingResources(false);
      }
    }
    loadData();
  }, [selectedCity]);

  // Handle immediate choice selection
  const handleSelectSafetyStatus = async (status: 'SAFE' | 'UNSURE' | 'IMMEDIATE_HELP_NEEDED' | 'MONITORED_SCREEN') => {
    if (status === 'MONITORED_SCREEN') {
      setDiscreetMaskActive(true);
      return;
    }

    setSafetyChoice(status);
    setSubmittingStatus(true);
    try {
      await submitSafetyStatus({
        caseId,
        safetyStatus: status,
        triggerSource: 'post_submission_intake',
      });
    } catch (err) {
      console.error('Failed to submit safety status:', err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Location retrieval helper
  const obtainBrowserCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          resolve(coords);
        },
        (err) => {
          let msg = 'Unable to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) msg = 'Location access permission was denied.';
          if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location signal unavailable.';
          if (err.code === err.TIMEOUT) msg = 'Location request timed out.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Save Trusted Contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactConsent) return;
    setSavingContact(true);
    try {
      const res = await saveTrustedContact({
        caseId,
        contactName: contactName.trim(),
        phoneNumber: contactPhone.trim(),
        relationship,
        consentStatus: contactConsent,
      });
      if (res.success) {
        setSavedContact(res.contact);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save trusted contact.');
    } finally {
      setSavingContact(false);
    }
  };

  // Dispatch Emergency Alert to Trusted Contact
  const handleSendAlert = async () => {
    if (!savedContact) return;
    setAlertSending(true);
    setAlertResult(null);

    let coordsToSend: { lat: number; lng: number } | undefined = undefined;
    if (includeLocationInAlert) {
      try {
        coordsToSend = await obtainBrowserCoordinates();
      } catch (err: any) {
        setLocationError(err.message || 'Could not fetch coordinates for alert.');
      }
    }

    try {
      const res = await sendEmergencyAlert({
        caseId,
        contactId: savedContact.id,
        includeLocation: includeLocationInAlert,
        userConfirmed: true,
        coordinates: coordsToSend,
      });
      setAlertResult(res);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch alert.');
    } finally {
      setAlertSending(false);
    }
  };

  // Start consent-based location sharing
  const handleStartLocationSharing = async (mins: 15 | 60) => {
    setLocationPending(true);
    setLocationError('');
    try {
      const coords = await obtainBrowserCoordinates();
      const res = await startLocationSharing({
        caseId,
        durationMinutes: mins,
        latitude: coords.lat,
        longitude: coords.lng,
        consentStatus: true,
      });
      if (res.success) {
        setLocationSharingActive(true);
        setLocationDuration(mins);
        setLocationExpiresAt(res.expiresAt);
        // Refresh nearby places using actual coordinates
        const nearbyRes = await getNearbyAssistance({ lat: coords.lat, lng: coords.lng });
        if (nearbyRes.success) setNearbyLocations(nearbyRes.locations);
      }
    } catch (err: any) {
      setLocationError(err.message || 'Permission denied or location unavailable.');
    } finally {
      setLocationPending(false);
    }
  };

  // Stop location sharing
  const handleStopLocationSharing = async () => {
    try {
      await stopLocationSharing(caseId);
      setLocationSharingActive(false);
      setLocationExpiresAt(null);
      setUserCoords(null);
    } catch (err) {
      console.error('Stop sharing error:', err);
    }
  };

  // Print safety plan
  const handlePrintPlan = () => {
    window.print();
  };

  // Discreet Screen Overlay: disguises page as a standard neutral reference article
  if (discreetMaskActive) {
    return (
      <main style={{ minHeight: '100vh', background: '#F9FAFB', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#1F2937' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', background: '#FFF', padding: 36, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Public Domain Reference Notes</span>
            <button
              onClick={() => setDiscreetMaskActive(false)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Resume Safe Portal
            </button>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Standard Working Procedures and Guidelines (General Article)</h1>
          <p style={{ lineHeight: 1.7, color: '#4B5563', fontSize: '0.92rem' }}>
            This reference document covers basic organizational frameworks, routine task administration, and general workplace compliance documentation standards. Records should be kept in accordance with prevailing recordkeeping schedules.
          </p>
          <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>Status: Neutral display mode active. Click 'Resume Safe Portal' above when your screen is private.</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        padding: '24px 16px 80px',
        color: 'var(--color-text-main)',
      }}
      role="main"
      aria-label="Immediate Safety Response Portal"
    >
      <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>
        
        {/* Discreet Screen Quick Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => navigate(`/track?reportId=${encodeURIComponent(caseId)}`)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back to Case Tracking
          </button>

          <button
            onClick={() => setDiscreetMaskActive(true)}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(217, 119, 6, 0.08)',
              color: '#D97706',
              borderColor: 'rgba(217, 119, 6, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
            }}
            title="Immediately disguise this screen if someone is watching"
          >
            <EyeOff size={14} /> Someone may be monitoring my screen
          </button>
        </div>

        {/* ─── HEADER & CASE IDENTIFIER ───────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              margin: '0 auto 12px',
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
            <ShieldAlert size={26} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.2rem)',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            Your Safety Comes First
          </h1>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', margin: '0 0 12px' }}>
            Complaint Submitted Successfully. Confidential Case Reference: <strong style={{ color: 'var(--color-primary)' }}>{caseId}</strong>
          </p>

          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: 'var(--color-soft-pink)',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            Immediate Safety Check & Emergency Options
          </div>
        </div>

        {/* ─── TRIAGE CHECK: ARE YOU SAFE RIGHT NOW? ─────────────────────────── */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(20px, 3vw, 32px)',
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: 6 }}>
              Are you safe right now?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Please select the option that best reflects your immediate situation. Help options adjust instantly.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {/* Option 1: Yes, I am safe */}
            <button
              type="button"
              onClick={() => handleSelectSafetyStatus('SAFE')}
              disabled={submittingStatus}
              style={{
                padding: '18px 16px',
                borderRadius: 'var(--radius-lg)',
                border: safetyChoice === 'SAFE' ? '2.5px solid var(--color-success)' : '1.5px solid var(--color-border)',
                background: safetyChoice === 'SAFE' ? 'rgba(22, 133, 107, 0.08)' : 'var(--color-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-success)' }}>
                  1. Yes, I am safe.
                </span>
                {safetyChoice === 'SAFE' && <CheckCircle2 size={18} color="var(--color-success)" />}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                I am currently in a safe environment. Show counselling, support resources, and my personal safety plan.
              </p>
            </button>

            {/* Option 2: No, I need immediate help */}
            <button
              type="button"
              onClick={() => handleSelectSafetyStatus('IMMEDIATE_HELP_NEEDED')}
              disabled={submittingStatus}
              style={{
                padding: '18px 16px',
                borderRadius: 'var(--radius-lg)',
                border: safetyChoice === 'IMMEDIATE_HELP_NEEDED' ? '2.5px solid #D92D35' : '1.5px solid var(--color-border)',
                background: safetyChoice === 'IMMEDIATE_HELP_NEEDED' ? 'rgba(217, 45, 53, 0.08)' : 'var(--color-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#D92D35' }}>
                  2. No, I need help.
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#D92D35', color: '#FFF', padding: '2px 6px', borderRadius: 4 }}>
                  EMERGENCY
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                I may be in danger right now. Open Emergency Assistance Mode with direct one-touch 112/181 calling.
              </p>
            </button>

            {/* Option 3: I am not sure */}
            <button
              type="button"
              onClick={() => handleSelectSafetyStatus('UNSURE')}
              disabled={submittingStatus}
              style={{
                padding: '18px 16px',
                borderRadius: 'var(--radius-lg)',
                border: safetyChoice === 'UNSURE' ? '2.5px solid #D97706' : '1.5px solid var(--color-border)',
                background: safetyChoice === 'UNSURE' ? 'rgba(217, 119, 6, 0.08)' : 'var(--color-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#D97706' }}>
                  3. I am not sure.
                </span>
                <AlertTriangle size={18} color="#D97706" />
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                I am uncertain or uneasy about my immediate safety. Show precautionary helplines and safety guidance.
              </p>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            DYNAMIC SAFETY RESPONSE PANELS
            ══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* ─────────────────────────────────────────────────────────────────
              PATH A: NO, I NEED IMMEDIATE HELP (EMERGENCY ASSISTANCE MODE)
              ───────────────────────────────────────────────────────────────── */}
          {safetyChoice === 'IMMEDIATE_HELP_NEEDED' && (
            <motion.section
              key="emergency-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 30 }}
            >
              {/* Emergency Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #B71C1C, #D92D35)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(217, 45, 53, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <ShieldAlert size={28} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    Emergency Assistance Mode Active
                  </h2>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '0.92rem', opacity: 0.95, lineHeight: 1.5 }}>
                  If you are in imminent physical danger, please contact statutory emergency services immediately. Your case has been flagged for <strong>HIGH-PRIORITY HUMAN REVIEW</strong> by authorized personnel.
                </p>

                {/* Important Legal Transparency Notice */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <strong>System Transparency:</strong> Suraksha Setu does not automatically dispatch police or contact emergency services without your explicit call authorization. Click the large call buttons below to initiate direct phone contact.
                </div>
              </div>

              {/* Large Direct Calling Buttons (112, 181, 1098, NCW) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {/* 112 National Emergency */}
                <a
                  href="tel:112"
                  className="btn"
                  style={{
                    background: '#D92D35',
                    color: '#FFF',
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 6px 18px rgba(217, 45, 53, 0.25)',
                    border: 'none',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneCall size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>Call 112</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>National Emergency (Police, Medical, Fire)</div>
                  </div>
                </a>

                {/* 181 Women Helpline */}
                <a
                  href="tel:181"
                  className="btn"
                  style={{
                    background: 'var(--color-primary)',
                    color: '#FFF',
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 6px 18px rgba(194, 24, 91, 0.25)',
                    border: 'none',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeartHandshake size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>Call 181</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Women Helpline (Mission Shakti) — 24/7</div>
                  </div>
                </a>

                {/* 1098 Childline */}
                <a
                  href="tel:1098"
                  className="btn btn-secondary"
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <PhoneCall size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>Call 1098</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Childline (For minors & children)</div>
                  </div>
                </a>

                {/* NCW 24/7 Helpline */}
                <a
                  href="tel:7827170170"
                  className="btn btn-secondary"
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <PhoneCall size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>07827170170</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>NCW 24/7 Violence Helpline</div>
                  </div>
                </a>
              </div>
            </motion.section>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PATH B: I AM NOT SURE (PRECAUTIONARY HELPLINES & STEP GUIDANCE)
              ───────────────────────────────────────────────────────────────── */}
          {safetyChoice === 'UNSURE' && (
            <motion.section
              key="unsure-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              style={{
                background: 'rgba(217, 119, 6, 0.06)',
                border: '1.5px solid rgba(217, 119, 6, 0.3)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <AlertTriangle size={24} color="#D97706" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#D97706' }}>
                  Safety Precaution Guidance
                </h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                It is completely normal to feel uncertain in high-stress situations. Your case has been noted for expedited human follow-up. Keep the numbers below on speed dial and consider notifying a trusted person.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <a href="tel:112" className="btn btn-sm" style={{ background: '#D92D35', color: '#FFF' }}>
                  <PhoneCall size={14} /> Call 112 (Police)
                </a>
                <a href="tel:181" className="btn btn-sm btn-primary">
                  <HeartHandshake size={14} /> Call 181 (Women Helpline)
                </a>
              </div>
            </motion.section>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PATH C: YES, I AM SAFE (REASSURANCE & SUPPORT RESOURCES)
              ───────────────────────────────────────────────────────────────── */}
          {safetyChoice === 'SAFE' && (
            <motion.section
              key="safe-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              style={{
                background: 'rgba(22, 133, 107, 0.06)',
                border: '1.5px solid rgba(22, 133, 107, 0.25)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <CheckCircle2 size={24} color="var(--color-success)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-success)' }}>
                  You are in a safe space
                </h3>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                We are glad you are currently safe. You can explore free psychological counselling, generate your personal safety plan, configure a trusted contact for future alerts, or return to your case dashboard.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <a href="/counselling-support" className="btn btn-primary btn-sm">
                  Access Free Counselling
                </a>
                <a href={`/track?reportId=${encodeURIComponent(caseId)}`} className="btn btn-secondary btn-sm">
                  View Case Dashboard
                </a>
              </div>
            </motion.section>
          )}

        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3: TRUSTED CONTACT ALERT SYSTEM (WITH SAFE INTENT FALLBACK)
            ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Share2 size={22} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Trusted Contact Emergency Alert (Optional)
            </h3>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Register a trusted friend, family member, or counsellor. You can send a one-touch alert containing your Case ID and optional location. <strong>No sensitive complaint details are ever revealed.</strong>
          </p>

          {!savedContact ? (
            <form onSubmit={handleSaveContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister / Advocate Sharma"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-main)',
                  }}
                >
                  <option value="friend">Friend</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse / Partner</option>
                  <option value="colleague">Colleague</option>
                  <option value="lawyer">Legal Counsel</option>
                  <option value="counsellor">Counsellor</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={contactConsent}
                    onChange={e => setContactConsent(e.target.checked)}
                  />
                  <span>I authorize Suraksha Setu to securely store this contact with encryption for emergency alerts.</span>
                </label>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                <button
                  type="submit"
                  disabled={savingContact || !contactConsent}
                  className="btn btn-primary"
                  style={{ minWidth: 160 }}
                >
                  {savingContact ? 'Encrypting & Saving...' : 'Save Trusted Contact'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ background: 'var(--color-bg-secondary)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{savedContact.contactName}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    Mobile: {savedContact.phoneMasked} • End-to-end encrypted
                  </div>
                </div>
                <button
                  onClick={() => setSavedContact(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.76rem' }}
                >
                  Change Contact
                </button>
              </div>

              {/* Message Preview Box */}
              <div style={{ background: 'var(--color-card)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 14 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Message Preview (What will be sent):
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic' }}>
                  "I may need assistance. Please contact me as soon as possible. My Suraksha Setu Case ID is [{caseId}]."
                  {includeLocationInAlert && ' [Includes Google Maps Location Link]'}
                </p>
              </div>

              {/* Location Option Checkbox */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeLocationInAlert}
                    onChange={e => setIncludeLocationInAlert(e.target.checked)}
                  />
                  <span>Attach my current GPS location link to this alert</span>
                </label>
              </div>

              {/* Dispatch Action */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleSendAlert}
                  disabled={alertSending}
                  className="btn"
                  style={{
                    background: '#D92D35',
                    color: '#FFF',
                    fontWeight: 800,
                    minWidth: 200,
                    border: 'none',
                  }}
                >
                  {alertSending ? 'Preparing Alert...' : 'Send Emergency Alert'}
                </button>

                {alertResult?.deliveryStatus && (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: alertResult.deliveryStatus === 'SENT' ? 'rgba(22, 133, 107, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                      color: alertResult.deliveryStatus === 'SENT' ? 'var(--color-success)' : '#D97706',
                    }}
                  >
                    Status: {alertResult.deliveryStatus}
                  </span>
                )}
              </div>

              {/* Safe Fallback Sharing Intent Buttons */}
              {alertResult?.manualSharingOptions && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    {alertResult.advice}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <a
                      href={alertResult.manualSharingOptions.smsUri}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      Open Phone SMS
                    </a>
                    <a
                      href={alertResult.manualSharingOptions.whatsappUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 700, color: '#16856B' }}
                    >
                      Open WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(alertResult.manualSharingOptions.alertText);
                        alert('Alert message copied to clipboard.');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Copy Alert Text
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4: CONSENT-BASED LOCATION SHARING (15 MIN / 1 HOUR)
            ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <MapPin size={22} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Consent-Based Location Sharing
            </h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Would you like to share your current location with your trusted contact? We never collect your location silently. Sharing stops automatically when the duration expires.
          </p>

          {locationError && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(217, 45, 53, 0.08)', color: '#D92D35', fontSize: '0.82rem', marginBottom: 12 }}>
              {locationError}
            </div>
          )}

          {!locationSharingActive ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleStartLocationSharing(15)}
                disabled={locationPending}
                className="btn btn-secondary"
                style={{ fontWeight: 700 }}
              >
                Share for 15 Minutes
              </button>
              <button
                type="button"
                onClick={() => handleStartLocationSharing(60)}
                disabled={locationPending}
                className="btn btn-secondary"
                style={{ fontWeight: 700 }}
              >
                Share for 1 Hour
              </button>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                {locationPending ? 'Requesting GPS access...' : 'Or choose not to share.'}
              </span>
            </div>
          ) : (
            <div style={{ background: 'rgba(22, 133, 107, 0.08)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(22, 133, 107, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '0.96rem' }}>
                    Location Sharing Active ({locationDuration} minutes)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Auto-expires at: {locationExpiresAt ? new Date(locationExpiresAt).toLocaleTimeString() : 'In 15 mins'}
                  </div>
                </div>
                <button
                  onClick={handleStopLocationSharing}
                  className="btn btn-sm"
                  style={{ background: '#D92D35', color: '#FFF', fontWeight: 700, border: 'none' }}
                >
                  Stop Sharing Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5: VERIFIED NEARBY HELP & ONE STOP CENTRES
            ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HeartHandshake size={22} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Verified Nearby Assistance & One Stop Centres
              </h3>
            </div>

            {/* City Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>City:</span>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                }}
              >
                <option value="Kanpur">Kanpur</option>
                <option value="New Delhi">New Delhi</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
          </div>

          <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            One Stop Centres (Sakhi Centres) offer comprehensive medical care, police facilitation, legal aid, psycho-social counselling, and temporary safe shelter (up to 5 days) under one roof.
          </p>

          {/* Directory Listings */}
          {loadingResources ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
              Loading verified official directories...
            </div>
          ) : nearbyLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                No registered directory locations for this area.
              </p>
              <a href="tel:181" className="btn btn-primary btn-sm">
                Call Women Helpline 181 for Local Center
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {nearbyLocations.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    background: 'var(--color-bg-secondary)',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: loc.type === 'one_stop_centre' ? 'var(--color-soft-pink)' : 'rgba(37, 99, 235, 0.12)',
                          color: loc.type === 'one_stop_centre' ? 'var(--color-primary)' : '#2563EB',
                        }}
                      >
                        {loc.category}
                      </span>
                      {loc.distanceFormatted && (
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {loc.distanceFormatted}
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '0.96rem', fontWeight: 800 }}>
                      {loc.officialName}
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {loc.address}
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {loc.operatingHours}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                    <a
                      href={`tel:${loc.phone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      <PhoneCall size={12} /> Call Centre
                    </a>
                    <a
                      href={loc.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      <Navigation size={12} /> Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6: PERSONAL SAFETY PLAN (PRINTABLE & DOWNLOADABLE)
            ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={22} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Your Personal Safety Plan
              </h3>
            </div>
            <button
              onClick={handlePrintPlan}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Printer size={14} /> Print / Save Safety Plan
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>1.</span>
              <span><strong>Move to a safer location:</strong> If you feel threatened in your immediate area, relocate to a well-lit, public, or secure environment.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>2.</span>
              <span><strong>Contact someone you trust:</strong> Share your location with a reliable friend, family member, or designated advocate.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>3.</span>
              <span><strong>Call 112 or 181:</strong> If you encounter active aggression or immediate physical threats, dial 112 immediately.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>4.</span>
              <span><strong>Preserve relevant evidence:</strong> Do not delete messages, call logs, screenshots, or CCTV references. Upload them into your secure Proof Vault.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>5.</span>
              <span><strong>Keep Case Reference Secure:</strong> Store your Case Reference (<code>{caseId}</code>) safely. Never share your private Recovery Key.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>6.</span>
              <span><strong>Consider contacting a verified One Stop Centre:</strong> For immediate medical examination, emergency shelter, or legal protection orders.</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 7: EVIDENCE PROTECTION (PROOF VAULT INTEGRATION)
            ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="card"
          style={{
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Lock size={22} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Immediate Evidence Protection (Proof Vault)
            </h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Preserve screenshots, audio notes, and PDFs with client-side AES-256-GCM encryption and SHA-256 cryptographic hashing. Evidence is securely linked to your Case ID (<code>{caseId}</code>).
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              onClick={() => navigate(`/proof-vault?caseId=${encodeURIComponent(caseId)}`)}
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              <Upload size={16} /> Open Proof Vault & Link Evidence
            </button>
            <button
              onClick={() => navigate(`/track?reportId=${encodeURIComponent(caseId)}`)}
              className="btn btn-secondary"
            >
              Return to Case Tracking
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
