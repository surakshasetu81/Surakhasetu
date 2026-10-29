/**
 * Suraksha Setu — Server-Side Deadline & Escalation Engine
 *
 * Implements:
 * 1. 60-Day Internal Service-Level Target
 * 2. 90-Day Statutory Inquiry Target under Section 11(4) of the POSH Act, 2013
 * 3. Approaching-deadline alerts (15-day and 7-day warnings)
 * 4. Automated server-side overdue status calculation
 * 5. Documented escalation and authorized referral logging
 */

import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

export const INTERNAL_TARGET_DAYS = 60;
export const STATUTORY_TARGET_DAYS = 90;

/**
 * Calculates deadline metrics for a given case based on its creation and milestone dates.
 *
 * @param {Object} caseDoc - Mongoose Case document or raw case object
 * @returns {Object} Calculated metrics
 */
export function calculateDeadlineMetrics(caseDoc) {
  const createdAt = new Date(caseDoc.createdAt || Date.now());
  const now = new Date();

  // Internal 60-day target
  const internalTargetDate = caseDoc.targetResolutionDate
    ? new Date(caseDoc.targetResolutionDate)
    : new Date(createdAt.getTime() + INTERNAL_TARGET_DAYS * 24 * 60 * 60 * 1000);

  // Statutory 90-day POSH Act deadline
  const statutoryDueDate = caseDoc.statutoryDueDate
    ? new Date(caseDoc.statutoryDueDate)
    : new Date(createdAt.getTime() + STATUTORY_TARGET_DAYS * 24 * 60 * 60 * 1000);

  const msRemaining = internalTargetDate.getTime() - now.getTime();
  const rawDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, rawDaysRemaining);

  const isResolvedOrClosed = ['resolved', 'closed', 'decision_recorded'].includes(caseDoc.status);
  const isOverdue = !isResolvedOrClosed && rawDaysRemaining <= 0;
  const overdueDays = isOverdue ? Math.abs(rawDaysRemaining) : 0;

  let escalationLevel = 'NORMAL';
  if (isOverdue) {
    escalationLevel = 'OVERDUE';
  } else if (!isResolvedOrClosed) {
    if (rawDaysRemaining <= 7) {
      escalationLevel = 'URGENT_DEADLINE';
    } else if (daysRemaining <= 15) {
      escalationLevel = 'APPROACHING_DEADLINE';
    }
  }

  return {
    internalTargetDate,
    statutoryDueDate,
    internalTargetDays: INTERNAL_TARGET_DAYS,
    statutoryTargetDays: STATUTORY_TARGET_DAYS,
    daysRemaining: isResolvedOrClosed ? 0 : daysRemaining,
    isOverdue,
    overdueDays,
    escalationLevel,
  };
}

/**
 * Scans active cases, updates deadline calculations on server, and creates notifications for overdue/approaching deadlines.
 */
export async function evaluateSystemDeadlines() {
  const activeCases = await Case.find({
    status: { $nin: ['resolved', 'closed', 'decision_recorded'] },
  });

  const alertsGenerated = [];

  for (const c of activeCases) {
    const metrics = calculateDeadlineMetrics(c);
    const wasOverdue = c.isOverdue;
    const previousLevel = c.escalation?.internalReviewStatus;

    c.isOverdue = metrics.isOverdue;
    c.overdueDays = metrics.overdueDays;
    c.daysRemaining = metrics.daysRemaining;

    // Check if new escalation alert should be generated
    if (metrics.isOverdue && !wasOverdue) {
      // 1. Create Overdue Notification for Staff & Admin
      await Notification.create({
        recipient: c.assignedTo || null,
        recipientRole: 'admin',
        caseId: c.caseId,
        title: `CRITICAL: Case ${c.caseId} has exceeded 60-Day Target`,
        message: `Case ${c.caseId} has surpassed its 60-day internal service-level target by ${metrics.overdueDays} day(s). Statutory POSH Section 11(4) deadline is in ${Math.max(0, 90 - 60 - metrics.overdueDays)} days. Immediate committee action required.`,
        type: 'CASE_OVERDUE',
        confidentiality: 'INTERNAL_STAFF',
        actionLink: `/dashboard?case=${c.caseId}`,
      });

      alertsGenerated.push({ caseId: c.caseId, type: 'OVERDUE' });
    } else if (metrics.escalationLevel === 'APPROACHING_DEADLINE' && previousLevel !== 'APPROACHING_DEADLINE') {
      await Notification.create({
        recipient: c.assignedTo || null,
        recipientRole: 'staff',
        caseId: c.caseId,
        title: `Notice: Case ${c.caseId} approaching internal deadline`,
        message: `Case ${c.caseId} has ${metrics.daysRemaining} days remaining to conclude preliminary inquiry before the 60-day target.`,
        type: 'DEADLINE_APPROACHING',
        confidentiality: 'INTERNAL_STAFF',
        actionLink: `/dashboard?case=${c.caseId}`,
      });
      alertsGenerated.push({ caseId: c.caseId, type: 'APPROACHING_DEADLINE' });
    }

    await c.save();
  }

  return { scanned: activeCases.length, alertsGenerated };
}

/**
 * Records an authorized deadline extension or formal escalation review with audit trail.
 */
export async function recordEscalationAction({ caseId, actionType, reason, authorizedUser, newTargetDate }) {
  const foundCase = await Case.findOne({ caseId });
  if (!foundCase) {
    throw new Error('Case not found');
  }

  if (actionType === 'EXTEND_TARGET') {
    if (!newTargetDate) throw new Error('newTargetDate is required for target extension');
    const oldTarget = foundCase.targetResolutionDate;
    foundCase.targetResolutionDate = new Date(newTargetDate);

    // Recalculate metrics
    const metrics = calculateDeadlineMetrics(foundCase);
    foundCase.daysRemaining = metrics.daysRemaining;
    foundCase.isOverdue = metrics.isOverdue;

    foundCase.auditHistory.push({
      action: 'INTERNAL_DEADLINE_EXTENDED',
      reason: `Extended from ${oldTarget ? oldTarget.toISOString().split('T')[0] : 'default'} to ${new Date(newTargetDate).toISOString().split('T')[0]}: ${reason}`,
      performedBy: authorizedUser._id,
      reviewerName: authorizedUser.name,
      reviewerRole: authorizedUser.role,
      timestamp: new Date(),
    });
  } else if (actionType === 'AUTHORIZED_EXTERNAL_REFERRAL') {
    foundCase.escalation.externalReportingStatus = 'AUTHORIZED_REFERRAL_INITIATED';
    foundCase.auditHistory.push({
      action: 'AUTHORIZED_EXTERNAL_REFERRAL_RECORDED',
      reason: `Referral initiated by ${authorizedUser.name} (${authorizedUser.role}): ${reason}`,
      performedBy: authorizedUser._id,
      reviewerName: authorizedUser.name,
      reviewerRole: authorizedUser.role,
      timestamp: new Date(),
    });
  }

  await foundCase.save();

  await AuditLog.create({
    action: `DEADLINE_${actionType}`,
    performedBy: authorizedUser._id,
    targetModel: 'Case',
    targetId: foundCase._id,
    details: { caseId, actionType, reason, newTargetDate },
  });

  return foundCase;
}
