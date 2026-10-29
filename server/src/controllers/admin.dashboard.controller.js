/**
 * Suraksha Setu — Live Main Admin Dashboard & Analytics Controller
 *
 * Implements real-time database-backed KPI statistics:
 * 1. Total complaints received
 * 2. Newly submitted complaints
 * 3. Cases awaiting assignment
 * 4. Cases under investigation
 * 5. Cases awaiting authorized decision
 * 6. Resolved and closed cases
 * 7. High-priority & immediate-safety cases
 * 8. Approaching-deadline cases (< 15 days)
 * 9. Overdue cases (> 60-day target)
 * 10. Average case resolution duration (days)
 * 11. Cases resolved within 60-day target period
 */

import Case from '../models/Case.js';
import User from '../models/User.js';
import { calculateDeadlineMetrics } from '../services/deadlineService.js';

export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const { from, to, organization, priority, status } = req.query;

    const baseFilter = {};

    // Date range filter
    if (from || to) {
      baseFilter.createdAt = {};
      if (from) baseFilter.createdAt.$gte = new Date(from);
      if (to) baseFilter.createdAt.$lte = new Date(to);
    }

    // Organization filter
    if (organization) {
      baseFilter['organizationVerification.organizationName'] = new RegExp(organization, 'i');
    }

    // Priority filter
    if (priority) {
      baseFilter['classification.priority'] = priority;
    }

    // Status filter
    if (status) {
      baseFilter.status = status;
    }

    const now = new Date();

    // 1. Total complaints
    const totalComplaints = await Case.countDocuments(baseFilter);

    // 2. Newly submitted complaints
    const newlySubmitted = await Case.countDocuments({
      ...baseFilter,
      status: { $in: ['submitted', 'awaiting_review'] },
    });

    // 3. Awaiting assignment (unassigned and not resolved/closed)
    const awaitingAssignment = await Case.countDocuments({
      ...baseFilter,
      assignedTo: null,
      status: { $nin: ['resolved', 'closed'] },
    });

    // 4. Cases under investigation / inquiry in progress
    const underInvestigation = await Case.countDocuments({
      ...baseFilter,
      status: { $in: ['inquiry_in_progress', 'under_review', 'under_preliminary_assessment', 'acknowledged'] },
    });

    // 5. Cases awaiting authorized decision
    const awaitingDecision = await Case.countDocuments({
      ...baseFilter,
      status: { $in: ['awaiting_authorized_decision', 'decision_recorded', 'additional_info_required'] },
    });

    // 6. Resolved and closed cases
    const resolvedAndClosed = await Case.countDocuments({
      ...baseFilter,
      status: { $in: ['resolved', 'closed'] },
    });

    // 7. High priority / urgent risk
    const highPriorityCases = await Case.countDocuments({
      ...baseFilter,
      $or: [
        { 'classification.priority': 'HIGH' },
        { isUrgent: true },
        { 'safetyIndicators.immediateDangerReported': true },
      ],
      status: { $nin: ['resolved', 'closed'] },
    });

    // Fetch active cases to calculate accurate live deadline and overdue counts
    const activeCases = await Case.find({
      ...baseFilter,
      status: { $nin: ['resolved', 'closed'] },
    }).select('caseId createdAt targetResolutionDate statutoryDueDate status isOverdue daysRemaining');

    let approachingDeadlineCount = 0;
    let overdueCasesCount = 0;

    for (const c of activeCases) {
      const metrics = calculateDeadlineMetrics(c);
      if (metrics.isOverdue) {
        overdueCasesCount++;
      } else if (metrics.daysRemaining <= 15) {
        approachingDeadlineCount++;
      }
    }

    // 10 & 11. Average resolution time & cases resolved within 60 days
    const closedCases = await Case.find({
      ...baseFilter,
      status: { $in: ['resolved', 'closed'] },
    }).select('createdAt updatedAt');

    let totalResolutionDays = 0;
    let resolvedWithinTargetCount = 0;

    for (const c of closedCases) {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      const durationDays = Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)));
      totalResolutionDays += durationDays;

      if (durationDays <= 60) {
        resolvedWithinTargetCount++;
      }
    }

    const averageResolutionDays = closedCases.length > 0
      ? Math.round((totalResolutionDays / closedCases.length) * 10) / 10
      : 0;

    // Category Breakdown
    const categoryAggregation = await Case.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$incidentCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Priority Breakdown
    const priorityAggregation = await Case.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$classification.priority', count: { $sum: 1 } } },
    ]);

    // Staff count & Active status
    const totalStaff = await User.countDocuments({
      role: { $in: ['admin', 'staff', 'ic_member', 'case_officer', 'auditor'] },
      isActive: true,
    });

    res.json({
      success: true,
      metrics: {
        totalComplaints,
        newlySubmitted,
        awaitingAssignment,
        underInvestigation,
        awaitingDecision,
        resolvedAndClosed,
        highPriorityCases,
        approachingDeadlineCount,
        overdueCasesCount,
        averageResolutionDays,
        resolvedWithinTargetCount,
        closedCasesTotal: closedCases.length,
        totalActiveStaff: totalStaff,
        categoryBreakdown: categoryAggregation.map(c => ({ category: c._id || 'other', count: c.count })),
        priorityBreakdown: priorityAggregation.map(p => ({ priority: p._id || 'MEDIUM', count: p.count })),
        generatedAt: now.toISOString(),
      },
    });
  } catch (err) {
    console.error('getAdminDashboardMetrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate admin dashboard metrics' });
  }
};
