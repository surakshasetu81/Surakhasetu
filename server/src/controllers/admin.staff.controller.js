/**
 * Suraksha Setu — Main Admin Staff Management Controller
 *
 * Implements:
 * 1. Role-based staff account provisioning with unique Staff IDs
 * 2. Least-privilege role assignment (admin, ic_member, case_officer, auditor)
 * 3. Workload calculation (active assigned cases per staff member)
 * 4. Activation, deactivation, and revocation with mandatory audit reasons
 * 5. Secure password reset and first-time setup enforcement
 * 6. Append-only audit logging
 */

import crypto from 'crypto';
import User from '../models/User.js';
import Case from '../models/Case.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// Helper to generate sequential or unique Staff IDs (e.g. STF-2026-001)
const generateStaffId = async () => {
  const currentYear = new Date().getFullYear();
  const count = await User.countDocuments({ staffId: new RegExp(`^STF-${currentYear}-`) });
  const sequence = String(count + 1).padStart(3, '0');
  return `STF-${currentYear}-${sequence}`;
};

/**
 * GET /api/admin/staff - Main Admin: List all staff members with assigned case workload
 */
export const getAllStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({
      role: { $in: ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor'] },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    // Calculate workload: number of open cases assigned to each staff
    const staffWithWorkload = await Promise.all(
      staffMembers.map(async (member) => {
        const assignedCount = await Case.countDocuments({
          assignedTo: member._id,
          status: { $nin: ['resolved', 'closed', 'decision_recorded'] },
        });

        const memberObj = member.toObject();
        memberObj.assignedCasesCount = assignedCount;
        return memberObj;
      })
    );

    res.json({
      success: true,
      count: staffWithWorkload.length,
      staff: staffWithWorkload,
    });
  } catch (err) {
    console.error('getAllStaff error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve staff directory' });
  }
};

/**
 * POST /api/admin/staff - Main Admin: Provision new staff member with unique Staff ID
 */
export const createStaffAccount = async (req, res) => {
  try {
    const { name, email, department, designation, role = 'case_officer', initialPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Staff member name is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid official email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user account with this email already exists' });
    }

    const ALLOWED_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor'];
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    const staffId = await generateStaffId();
    // Temporary password (either supplied or generated securely)
    const tempPassword = initialPassword && initialPassword.length >= 8
      ? initialPassword
      : `Setu@${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newStaff = await User.create({
      staffId,
      name: name.trim(),
      email: normalizedEmail,
      department: department?.trim() || 'Internal Complaints Committee',
      designation: designation?.trim() || 'Authorized Case Officer',
      role,
      password: tempPassword,
      mustChangePassword: true,
      isActive: true,
    });

    // Record immutable audit entry
    await AuditLog.create({
      action: 'STAFF_ACCOUNT_PROVISIONED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: newStaff._id,
      details: {
        staffId,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        department: newStaff.department,
        designation: newStaff.designation,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Staff account successfully created for ${newStaff.name} with ID ${staffId}`,
      staff: {
        _id: newStaff._id,
        staffId: newStaff.staffId,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        department: newStaff.department,
        designation: newStaff.designation,
        isActive: newStaff.isActive,
        mustChangePassword: newStaff.mustChangePassword,
        createdAt: newStaff.createdAt,
      },
      initialCredentials: {
        staffId,
        email: newStaff.email,
        temporaryPassword: tempPassword,
        instruction: 'Staff member will be prompted to set a permanent password upon first login.',
      },
    });
  } catch (err) {
    console.error('createStaffAccount error:', err);
    res.status(500).json({ success: false, message: 'Failed to provision staff account' });
  }
};

/**
 * PATCH /api/admin/staff/:id/role - Main Admin: Update staff role & designation
 */
export const updateStaffRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department, designation } = req.body;

    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const previousRole = staff.role;
    if (role) {
      const ALLOWED_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor'];
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
      staff.role = role;
    }
    if (department) staff.department = department.trim();
    if (designation) staff.designation = designation.trim();

    await staff.save();

    await AuditLog.create({
      action: 'STAFF_ROLE_UPDATED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: staff._id,
      details: {
        staffId: staff.staffId,
        email: staff.email,
        previousRole,
        newRole: staff.role,
        department: staff.department,
        designation: staff.designation,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Staff privileges updated for ${staff.name}`,
      staff,
    });
  } catch (err) {
    console.error('updateStaffRole error:', err);
    res.status(500).json({ success: false, message: 'Failed to update staff role' });
  }
};

/**
 * PATCH /api/admin/staff/:id/status - Main Admin: Activate, Deactivate, or Revoke staff access
 */
export const toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (isActive === false && (!reason || reason.trim().length < 5)) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason (minimum 5 characters) is required to deactivate or revoke staff access',
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id && isActive === false) {
      return res.status(400).json({ success: false, message: 'Administrators cannot deactivate their own account' });
    }

    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    staff.isActive = Boolean(isActive);
    if (!staff.isActive) {
      staff.revokedAt = new Date();
      staff.revokedReason = reason?.trim();
    } else {
      staff.revokedAt = null;
      staff.revokedReason = null;
    }

    await staff.save();

    await AuditLog.create({
      action: staff.isActive ? 'STAFF_ACCOUNT_ACTIVATED' : 'STAFF_ACCOUNT_REVOKED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: staff._id,
      details: {
        staffId: staff.staffId,
        email: staff.email,
        isActive: staff.isActive,
        reason: staff.revokedReason,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Staff member ${staff.name} is now ${staff.isActive ? 'Active' : 'Deactivated'}`,
      staff,
    });
  } catch (err) {
    console.error('toggleStaffStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to modify staff access status' });
  }
};

/**
 * POST /api/admin/staff/:id/reset-password - Main Admin: Initiate secure password reset
 */
export const resetStaffPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const tempPassword = `Reset@${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    staff.password = tempPassword;
    staff.mustChangePassword = true;
    await staff.save();

    await AuditLog.create({
      action: 'STAFF_PASSWORD_RESET_INITIATED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: staff._id,
      details: { staffId: staff.staffId, email: staff.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Password reset initiated for ${staff.name}. A temporary password has been generated.`,
      temporaryCredentials: {
        staffId: staff.staffId,
        email: staff.email,
        temporaryPassword: tempPassword,
        note: 'Staff must change password upon next sign in.',
      },
    });
  } catch (err) {
    console.error('resetStaffPassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

