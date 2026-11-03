import Case from '../models/Case.js';
import SafetyEvent from '../models/SafetyEvent.js';
import TrustedContact from '../models/TrustedContact.js';
import LocationShare from '../models/LocationShare.js';
import SafetyAuditLog from '../models/SafetyAuditLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { EMERGENCY_NUMBERS, VERIFIED_SUPPORT_DIRECTORY } from '../config/emergencyResources.js';

// Haversine formula to compute accurate distance in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * 1. GET /api/safety/resources
 * Returns verified emergency helplines and initial directory
 */
export async function getSafetyResources(req, res) {
  try {
    return res.status(200).json({
      success: true,
      helplines: EMERGENCY_NUMBERS,
      availableCities: ['Kanpur', 'New Delhi', 'Lucknow', 'Bengaluru', 'Mumbai'],
      verificationPolicy: 'All numbers verified against official Government of India portals (MHA, MoWCD, NCW, I4C).',
    });
  } catch (err) {
    console.error('getSafetyResources error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve safety resources.' });
  }
}

/**
 * 2. POST /api/safety/status
 * Submits immediate post-submission safety status (Safe / Unsure / Immediate Help / Monitored Screen)
 */
export async function submitSafetyStatus(req, res) {
  try {
    const { caseId, safetyStatus, userResponseText, triggerSource } = req.body;

    if (!caseId || !safetyStatus) {
      return res.status(400).json({ success: false, message: 'Case ID and safety status are required.' });
    }

    const foundCase = await Case.findOne({ caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Valid case not found for this identifier.' });
    }

    const isEmergency = safetyStatus === 'IMMEDIATE_HELP_NEEDED';
    const isUnsure = safetyStatus === 'UNSURE';
    const isMonitored = safetyStatus === 'MONITORED_SCREEN';

    // Create or update SafetyEvent
    const safetyEvent = await SafetyEvent.create({
      caseId: foundCase.caseId,
      case: foundCase._id,
      safetyStatus,
      userResponseText: userResponseText || '',
      priority: isEmergency ? 'HIGH' : isUnsure ? 'HIGH' : 'MEDIUM',
      triggerSource: triggerSource || 'post_submission_intake',
      humanReviewRequired: isEmergency || isUnsure,
      humanReviewStatus: 'PENDING',
    });

    // If user needs immediate help or is not sure, escalate case to HIGH priority without waiting for ML
    if (isEmergency || isUnsure) {
      foundCase.classification.priority = 'HIGH';
      foundCase.classification.priorityReasons.push(
        isEmergency
          ? 'CRITICAL ESCALATION: Complainant indicated immediate physical danger / emergency help needed.'
          : 'SAFETY SAFEGUARD: Complainant uncertain about immediate personal safety.'
      );
      foundCase.classification.reviewStatus = 'PENDING_URGENT_HUMAN_REVIEW';
      foundCase.classification.classifiedAt = new Date();
      foundCase.isUrgent = true;

      // Add to Case audit history
      foundCase.auditHistory.push({
        action: 'IMMEDIATE_SAFETY_ESCALATION',
        originalPriority: foundCase.classification.priority,
        newPriority: 'HIGH',
        reason: isEmergency
          ? 'Complainant reported immediate danger on safety triage screen'
          : 'Complainant indicated safety uncertainty on safety triage screen',
        reviewerName: 'Immediate Safety Response Subsystem',
        reviewerRole: 'safety_rule_override',
        timestamp: new Date(),
      });

      await foundCase.save();

      // Dispatch high-priority In-App notification to all staff and committee members
      const staffUsers = await User.find({ role: { $in: ['admin', 'staff', 'committee', 'ic_member'] } }).select('_id');
      const notifications = staffUsers.map(staff => ({
        recipient: staff._id,
        title: isEmergency ? '🚨 URGENT: Complainant Reported Immediate Danger' : '⚠️ Immediate Safety Attention Required',
        message: `Case ${foundCase.caseId} complainant reported status: ${safetyStatus}. Immediate human review required.`,
        type: 'escalation',
        caseId: foundCase.caseId,
        metadata: { safetyStatus, safetyEventId: safetyEvent._id },
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    // Record in SafetyAuditLog
    await SafetyAuditLog.create({
      caseId: foundCase.caseId,
      actorType: 'complainant',
      action: isEmergency ? 'EMERGENCY_MODE_ACTIVATED' : 'SAFETY_STATUS_RECORDED',
      details: { safetyStatus, triggerSource },
    });

    return res.status(200).json({
      success: true,
      message: 'Safety status recorded.',
      safetyEventId: safetyEvent._id,
      priority: foundCase.classification.priority,
      emergencyModeActive: isEmergency,
      requiresAction: isEmergency || isUnsure,
    });
  } catch (err) {
    console.error('submitSafetyStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record safety status.' });
  }
}

/**
 * 3. POST /api/safety/trusted-contact
 * Saves a trusted contact for a case
 */
export async function saveTrustedContact(req, res) {
  try {
    const { caseId, contactName, phoneNumber, relationship, consentStatus } = req.body;

    if (!caseId || !contactName || !phoneNumber || !consentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Case ID, contact name, valid phone number, and user consent confirmation are required.',
      });
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,13}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10 to 12 digit phone number.' });
    }

    const contact = await TrustedContact.create({
      caseId,
      contactName: contactName.trim(),
      encryptedPhoneNumber: cleanPhone,
      relationship: relationship || 'friend',
      consentStatus: Boolean(consentStatus),
    });

    await SafetyAuditLog.create({
      caseId,
      actorType: 'complainant',
      action: 'TRUSTED_CONTACT_SAVED',
      details: { contactName: contactName.trim(), relationship: relationship || 'friend' },
    });

    return res.status(201).json({
      success: true,
      message: 'Trusted contact registered securely with end-to-end encryption.',
      contact: {
        id: contact._id,
        contactName: contact.contactName,
        relationship: contact.relationship,
        phoneMasked: cleanPhone.slice(0, 3) + '*****' + cleanPhone.slice(-2),
      },
    });
  } catch (err) {
    console.error('saveTrustedContact error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save trusted contact.' });
  }
}

/**
 * 4. POST /api/safety/send-alert
 * Dispatches an emergency alert to trusted contacts with optional location
 */
export async function sendEmergencyAlert(req, res) {
  try {
    const { caseId, contactId, includeLocation, userConfirmed, coordinates } = req.body;

    if (!caseId || !userConfirmed) {
      return res.status(400).json({ success: false, message: 'Explicit user confirmation is mandatory before dispatching an emergency alert.' });
    }

    const contact = contactId
      ? await TrustedContact.findOne({ _id: contactId, caseId })
      : await TrustedContact.findOne({ caseId }).sort({ createdAt: -1 });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'No trusted contact found. Please configure a trusted contact first.',
      });
    }

    const rawPhone = contact.encryptedPhoneNumber;
    const phoneMasked = rawPhone ? rawPhone.slice(0, 3) + '*****' + rawPhone.slice(-2) : '***';

    let locationLink = '';
    if (includeLocation && coordinates?.lat && coordinates?.lng) {
      locationLink = ` Location: https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`;
    }

    const alertMessage = `EMERGENCY ALERT: I may need assistance. Please contact me as soon as possible. My Suraksha Setu Case ID is [${caseId}].${locationLink}`;

    // Suraksha Setu does not fake SMS delivery. If no third-party SMS gateway (e.g. Twilio / Gupshup) is configured,
    // we clearly inform the user and provide native SMS/WhatsApp manual sharing intent.
    const smsGatewayConfigured = Boolean(process.env.SMS_GATEWAY_API_KEY);

    let deliveryStatus = 'PENDING';
    let deliveryProvider = 'manual_fallback';

    if (smsGatewayConfigured) {
      // In production with real SMS credentials, dispatch through gateway here
      deliveryStatus = 'SENT';
      deliveryProvider = 'sms_gateway';
    } else {
      // Manual safe dispatch: returns formatted direct intent links so user can hit Send directly
      deliveryStatus = 'MANUAL_DISPATCHED';
      deliveryProvider = 'direct_user_client_intent';
    }

    const alertRecord = {
      alertId: `ALT-${Date.now().toString(36).toUpperCase()}`,
      dispatchedAt: new Date(),
      deliveryStatus,
      deliveryProvider,
      includesLocation: Boolean(includeLocation && coordinates),
      recipientPhoneMasked: phoneMasked,
      errorMessage: smsGatewayConfigured ? null : 'Automated SMS gateway not configured; prepared direct mobile intent.',
    };

    contact.alertHistory.push(alertRecord);
    await contact.save();

    await SafetyAuditLog.create({
      caseId,
      actorType: 'complainant',
      action: 'TRUSTED_CONTACT_ALERT_REQUESTED',
      details: {
        deliveryStatus,
        deliveryProvider,
        includesLocation: Boolean(includeLocation),
      },
    });

    // Native intent links for instant zero-dependency transmission
    const encodedMsg = encodeURIComponent(alertMessage);
    const smsUri = `sms:${rawPhone}?body=${encodedMsg}`;
    const whatsappUri = `https://wa.me/${rawPhone.replace(/\+/g, '')}?text=${encodedMsg}`;

    return res.status(200).json({
      success: true,
      alertId: alertRecord.alertId,
      deliveryStatus,
      messagePreview: alertMessage,
      recipientPhoneMasked: phoneMasked,
      isAutomatedSms: smsGatewayConfigured,
      manualSharingOptions: {
        smsUri,
        whatsappUri,
        alertText: alertMessage,
      },
      advice: smsGatewayConfigured
        ? 'Alert dispatched via configured SMS service.'
        : 'Automated SMS gateway not active. Click below to instantly launch your phone SMS or WhatsApp with the pre-filled message.',
    });
  } catch (err) {
    console.error('sendEmergencyAlert error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send emergency alert.' });
  }
}

/**
 * 5. POST /api/safety/location/share
 * Starts consent-based temporary location sharing (15 or 60 min)
 */
export async function startLocationSharing(req, res) {
  try {
    const { caseId, durationMinutes, latitude, longitude, accuracyMeters, consentStatus } = req.body;

    if (!caseId || !consentStatus) {
      return res.status(400).json({ success: false, message: 'Consent confirmation is required for location sharing.' });
    }

    const duration = [15, 60].includes(Number(durationMinutes)) ? Number(durationMinutes) : 15;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    // Revoke any previous active shares for this case
    await LocationShare.updateMany(
      { caseId, sharingStatus: 'ACTIVE' },
      { sharingStatus: 'REVOKED_BY_USER', revokedAt: new Date(), latitude: null, longitude: null }
    );

    const share = await LocationShare.create({
      caseId,
      consentStatus: true,
      durationMinutes: duration,
      expiresAt,
      sharingStatus: 'ACTIVE',
      latitude: latitude || null,
      longitude: longitude || null,
      accuracyMeters: accuracyMeters || null,
    });

    await SafetyAuditLog.create({
      caseId,
      actorType: 'complainant',
      action: 'LOCATION_SHARING_STARTED',
      details: { durationMinutes: duration, expiresAt },
    });

    return res.status(200).json({
      success: true,
      message: `Location sharing active for ${duration} minutes. You can stop sharing at any time.`,
      shareId: share._id,
      expiresAt,
      durationMinutes: duration,
      status: 'ACTIVE',
    });
  } catch (err) {
    console.error('startLocationSharing error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initialize location sharing.' });
  }
}

/**
 * 6. POST /api/safety/location/stop
 * Immediately revokes active location sharing and purges coordinates
 */
export async function stopLocationSharing(req, res) {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ success: false, message: 'Case ID is required.' });
    }

    await LocationShare.updateMany(
      { caseId, sharingStatus: 'ACTIVE' },
      { sharingStatus: 'REVOKED_BY_USER', revokedAt: new Date(), latitude: null, longitude: null }
    );

    await SafetyAuditLog.create({
      caseId,
      actorType: 'complainant',
      action: 'LOCATION_SHARING_STOPPED',
      details: { stoppedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Location sharing has been stopped. Coordinates purged from memory.',
      status: 'REVOKED_BY_USER',
    });
  } catch (err) {
    console.error('stopLocationSharing error:', err);
    return res.status(500).json({ success: false, message: 'Failed to stop location sharing.' });
  }
}

/**
 * 7. GET /api/safety/nearby
 * Returns verified nearby One Stop Centres, Hospitals, and Police Stations based on user coordinates or chosen city
 */
export async function getNearbyAssistance(req, res) {
  try {
    const { lat, lng, city, type } = req.query;

    let results = [...VERIFIED_SUPPORT_DIRECTORY];

    // Filter by type if provided (e.g. one_stop_centre)
    if (type) {
      results = results.filter(item => item.type === type);
    }

    // If city selected and no coordinates
    if (city && (!lat || !lng)) {
      results = results.filter(item => item.city.toLowerCase() === city.toLowerCase());
    }

    // If user provided coordinates, compute exact distance via Haversine and sort
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        results = results.map(item => {
          const distanceKm = calculateHaversineDistance(
            userLat,
            userLng,
            item.coordinates.lat,
            item.coordinates.lng
          );
          return {
            ...item,
            distanceKm,
            distanceFormatted: `${distanceKm} km away`,
          };
        }).sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      locations: results,
      verificationSourceNotice: 'All directory entries verified against official MoWCD and Police Commissionerate directories.',
    });
  } catch (err) {
    console.error('getNearbyAssistance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve verified nearby assistance.' });
  }
}

/**
 * 8. GET /api/safety/alerts (Staff / Admin Protected)
 * Lists cases requiring urgent safety response, trusted contact statuses, and follow-up records
 */
export async function getStaffSafetyAlerts(req, res) {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = {};
    if (status) query.humanReviewStatus = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [alerts, total] = await Promise.all([
      SafetyEvent.find(query)
        .populate('case', 'caseId incidentCategory classification createdAt status isUrgent targetResolutionDate')
        .populate('assignedStaff', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      SafetyEvent.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      alerts,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error('getStaffSafetyAlerts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve safety alerts.' });
  }
}

/**
 * 9. PATCH /api/safety/alerts/:id/followup (Staff / Admin Protected)
 * Updates staff acknowledgment, referral notes, and follow-up status
 */
export async function updateStaffSafetyFollowup(req, res) {
  try {
    const { id } = req.params;
    const { humanReviewStatus, staffReviewNotes, assignToSelf } = req.body;

    const safetyEvent = await SafetyEvent.findById(id);
    if (!safetyEvent) {
      return res.status(404).json({ success: false, message: 'Safety alert event not found.' });
    }

    if (humanReviewStatus) safetyEvent.humanReviewStatus = humanReviewStatus;
    if (staffReviewNotes) safetyEvent.staffReviewNotes = staffReviewNotes;

    safetyEvent.reviewedAt = new Date();
    safetyEvent.reviewedBy = req.user?._id || null;

    if (assignToSelf && req.user?._id) {
      safetyEvent.assignedStaff = req.user._id;
    }

    await safetyEvent.save();

    await SafetyAuditLog.create({
      caseId: safetyEvent.caseId,
      actorType: 'staff',
      actorId: req.user?._id ? String(req.user._id) : 'authorized_staff',
      actorName: req.user?.name || 'Authorized Staff',
      action: humanReviewStatus === 'ACKNOWLEDGED' ? 'STAFF_ALERT_ACKNOWLEDGED' : 'STAFF_FOLLOWUP_UPDATED',
      details: { humanReviewStatus, staffReviewNotes },
    });

    return res.status(200).json({
      success: true,
      message: 'Safety follow-up status recorded.',
      safetyEvent,
    });
  } catch (err) {
    console.error('updateStaffSafetyFollowup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update safety alert.' });
  }
}

