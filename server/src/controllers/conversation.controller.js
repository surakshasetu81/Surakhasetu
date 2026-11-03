import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import Case from '../models/Case.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// ─── HELPER: Generate Scoped Complainant Conversation Token ─────────────────
function generateComplainantToken(caseId) {
  return jwt.sign(
    { caseId, role: 'complainant', isComplainant: true },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// ─── 1. Authenticate Complainant via Case ID + Recovery Code ─────────────────
export async function authenticateComplainant(req, res) {
  try {
    const { caseId, recoveryCode, reportId, recoveryKey } = req.body;
    const targetCaseId = (caseId || reportId || '').toString().trim();
    const rawKey = (recoveryCode || recoveryKey || '').toString().trim().toUpperCase();

    if (!targetCaseId || !rawKey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your Case ID and Recovery Code to access this conversation.',
      });
    }

    const foundCase = await Case.findOne({ caseId: targetCaseId }).select('+recoveryCode');
    if (!foundCase || !foundCase.recoveryCode) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Case ID or Recovery Code. Please verify your credentials and try again.',
      });
    }

    const isMatch = await bcrypt.compare(rawKey, foundCase.recoveryCode);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Case ID or Recovery Code. Please verify your credentials and try again.',
      });
    }

    // Ensure a Conversation record exists
    let conversation = await Conversation.findOne({ caseId: foundCase.caseId });
    if (!conversation) {
      conversation = await Conversation.create({
        caseId: foundCase.caseId,
        caseRef: foundCase._id,
        incidentCategory: foundCase.incidentCategory,
        priority: foundCase.classification?.priority || 'MEDIUM',
        assignedStaffId: foundCase.assignedTo || null,
        isAnonymous: foundCase.isAnonymous,
        complainantPseudonym: `Complainant #${foundCase.caseId.slice(-6)}`,
        status: 'active',
      });
    }

    const token = generateComplainantToken(foundCase.caseId);

    return res.status(200).json({
      success: true,
      token,
      caseId: foundCase.caseId,
      status: conversation.status,
      unreadCount: conversation.unreadComplainantCount || 0,
      incidentCategory: conversation.incidentCategory,
      priority: conversation.priority,
      isAnonymous: conversation.isAnonymous,
      pseudonym: conversation.complainantPseudonym,
    });
  } catch (err) {
    console.error('authenticateComplainant error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate conversation session.',
    });
  }
}

// ─── 2. Dual-Participant Authorization Middleware ────────────────────────────
export async function authenticateConversationParticipant(req, res, next) {
  try {
    const targetCaseId = (req.params.caseId || req.body.caseId || '').toString().trim();
    let authHeader = req.headers.authorization;
    let caseTokenHeader = req.headers['x-case-token'];

    let bearerToken = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      bearerToken = req.cookies.token;
    }

    const tokenToVerify = caseTokenHeader || bearerToken;
    if (!tokenToVerify) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access case communications.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired conversation authentication token.',
      });
    }

    // A. Check if it's a Complainant Token
    if (decoded.role === 'complainant' || decoded.isComplainant) {
      if (decoded.caseId !== targetCaseId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Token is not authorized for this case conversation.',
        });
      }

      req.participant = {
        type: 'complainant',
        caseId: decoded.caseId,
        isComplainant: true,
      };
      return next();
    }

    // B. Check if it's a Staff / Admin User
    if (decoded.id) {
      const user = await User.findById(decoded.id).select('+isActive');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Staff account not found or deactivated.',
        });
      }

      // Check case assignment / permissions
      if (user.role === 'admin') {
        req.participant = {
          type: 'admin',
          user,
          isStaff: true,
          isAdmin: true,
        };
        return next();
      }

      // If regular staff, verify they have permission to access this case
      const foundCase = await Case.findOne({ caseId: targetCaseId }).select('assignedTo');
      if (!foundCase) {
        return res.status(404).json({
          success: false,
          message: 'Case record not found.',
        });
      }

      // Allow if assigned directly OR if case is unassigned (so committee staff can triage)
      const isAssigned = foundCase.assignedTo && foundCase.assignedTo.toString() === user._id.toString();
      const isUnassigned = !foundCase.assignedTo;

      if (!isAssigned && !isUnassigned) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: You are not assigned to this case conversation.',
        });
      }

      req.participant = {
        type: 'staff',
        user,
        isStaff: true,
        isAdmin: false,
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized communication participant.',
    });
  } catch (err) {
    console.error('authenticateConversationParticipant error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during conversation authorization.',
    });
  }
}

// ─── 3. Get Conversation Details & Messages ──────────────────────────────────
export async function getConversation(req, res) {
  try {
    const targetCaseId = req.params.caseId.trim();

    let conversation = await Conversation.findOne({ caseId: targetCaseId });
    if (!conversation) {
      const foundCase = await Case.findOne({ caseId: targetCaseId });
      if (!foundCase) {
        return res.status(404).json({ success: false, message: 'Case not found.' });
      }

      conversation = await Conversation.create({
        caseId: foundCase.caseId,
        caseRef: foundCase._id,
        incidentCategory: foundCase.incidentCategory,
        priority: foundCase.classification?.priority || 'MEDIUM',
        assignedStaffId: foundCase.assignedTo || null,
        isAnonymous: foundCase.isAnonymous,
        complainantPseudonym: `Complainant #${foundCase.caseId.slice(-6)}`,
        status: 'active',
      });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    // Sanitize message outputs based on participant role
    const sanitizedMessages = messages.map(msg => {
      const isOwnMessage =
        (req.participant.isComplainant && msg.senderType === 'complainant') ||
        (req.participant.isStaff && (msg.senderType === 'staff' || msg.senderType === 'admin'));

      return {
        _id: msg._id,
        senderType: msg.senderType,
        senderDisplayName: msg.senderDisplayName,
        content: msg.content,
        messageType: msg.messageType,
        attachments: msg.attachments || [],
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        readAt: msg.readAt,
        isOwnMessage,
      };
    });

    return res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
        caseId: conversation.caseId,
        incidentCategory: conversation.incidentCategory,
        priority: conversation.priority,
        status: conversation.status,
        isAnonymous: conversation.isAnonymous,
        complainantPseudonym: conversation.complainantPseudonym,
        assignedStaffName: conversation.assignedStaffName,
        unreadStaffCount: conversation.unreadStaffCount,
        unreadComplainantCount: conversation.unreadComplainantCount,
        evidenceRequested: conversation.evidenceRequested,
        evidenceRequestDetails: conversation.evidenceRequestDetails,
        lastMessageAt: conversation.lastMessageAt,
      },
      messages: sanitizedMessages,
    });
  } catch (err) {
    console.error('getConversation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve case conversation.',
    });
  }
}

// ─── 4. Send Message ─────────────────────────────────────────────────────────
export async function sendMessage(req, res) {
  try {
    const targetCaseId = req.params.caseId.trim();
    const { content, messageType = 'text', attachments = [] } = req.body;

    const trimmedContent = (content || '').toString().trim();
    if (!trimmedContent && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message content or an attachment is required.',
      });
    }

    if (trimmedContent.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds the 4000 character maximum limit.',
      });
    }

    let conversation = await Conversation.findOne({ caseId: targetCaseId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation does not exist for this case.',
      });
    }

    if (conversation.status === 'closed' || conversation.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'This conversation has been concluded. Please request case reopening to continue messaging.',
      });
    }

    let senderType;
    let senderId = null;
    let senderDisplayName;

    if (req.participant.isComplainant) {
      senderType = 'complainant';
      senderId = null; // NEVER link internal User IDs or personal records to anonymous messages
      senderDisplayName = conversation.complainantPseudonym || 'Complainant';

      // Increment staff unread count
      conversation.unreadStaffCount = (conversation.unreadStaffCount || 0) + 1;
      conversation.status = 'awaiting_staff';

      // Create internal staff notification
      try {
        await Notification.create({
          recipient: conversation.assignedStaffId || null,
          recipientRole: conversation.assignedStaffId ? 'staff' : 'committee',
          caseId: targetCaseId,
          title: `New Message on Case ${targetCaseId}`,
          message: `The complainant sent a new message regarding ${conversation.incidentCategory}.`,
          type: 'NEW_MESSAGE',
          confidentiality: 'INTERNAL_STAFF',
          actionLink: `/dashboard?tab=communications&caseId=${targetCaseId}`,
        });
      } catch (notifErr) {
        console.warn('Failed to dispatch staff message notification:', notifErr.message);
      }
    } else {
      senderType = req.participant.isAdmin ? 'admin' : 'staff';
      senderId = req.participant.user._id;
      senderDisplayName = req.participant.user.name || 'Safety Committee Officer';

      // Increment complainant unread count
      conversation.unreadComplainantCount = (conversation.unreadComplainantCount || 0) + 1;
      conversation.status = 'awaiting_complainant';

      // If staff has replied, record staff name
      conversation.assignedStaffId = req.participant.user._id;
      conversation.assignedStaffName = req.participant.user.name || 'Safety Committee Officer';
    }

    // Clean attachment objects
    const cleanAttachments = (Array.isArray(attachments) ? attachments : []).map(att => ({
      originalName: String(att.originalName || 'file').slice(0, 150),
      filename: String(att.filename || '').slice(0, 200),
      fileUrl: String(att.fileUrl || '').slice(0, 500),
      sizeBytes: Number(att.sizeBytes) || 0,
      mimeType: String(att.mimeType || 'application/octet-stream').slice(0, 100),
      evidenceId: att.evidenceId ? String(att.evidenceId) : null,
      uploadedAt: new Date(),
    }));

    const message = await Message.create({
      conversationId: conversation._id,
      caseId: targetCaseId,
      senderType,
      senderId,
      senderDisplayName,
      content: trimmedContent,
      messageType,
      attachments: cleanAttachments,
      isRead: false,
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = trimmedContent.slice(0, 140);
    conversation.lastSenderType = senderType;
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        senderType: message.senderType,
        senderDisplayName: message.senderDisplayName,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: message.isRead,
        isOwnMessage: true,
      },
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
    });
  }
}

// ─── 5. Mark Conversation as Read ────────────────────────────────────────────
export async function markAsRead(req, res) {
  try {
    const targetCaseId = req.params.caseId.trim();
    const conversation = await Conversation.findOne({ caseId: targetCaseId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const now = new Date();

    if (req.participant.isComplainant) {
      conversation.unreadComplainantCount = 0;
      await Message.updateMany(
        {
          conversationId: conversation._id,
          senderType: { $in: ['staff', 'admin', 'system'] },
          isRead: false,
        },
        { $set: { isRead: true, readAt: now, readBy: 'complainant' } }
      );
    } else {
      conversation.unreadStaffCount = 0;
      await Message.updateMany(
        {
          conversationId: conversation._id,
          senderType: 'complainant',
          isRead: false,
        },
        { $set: { isRead: true, readAt: now, readBy: 'staff' } }
      );
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      unreadComplainantCount: conversation.unreadComplainantCount,
      unreadStaffCount: conversation.unreadStaffCount,
    });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark messages as read.' });
  }
}

// ─── 6. Request Additional Evidence (Staff Only) ─────────────────────────────
export async function requestAdditionalEvidence(req, res) {
  try {
    if (!req.participant.isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Only authorized staff members may issue evidence requests.',
      });
    }

    const targetCaseId = req.params.caseId.trim();
    const { instructions } = req.body;

    const trimmedInstructions = (instructions || '').toString().trim();
    if (!trimmedInstructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide clear guidance or questions for the evidence request.',
      });
    }

    const conversation = await Conversation.findOne({ caseId: targetCaseId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      caseId: targetCaseId,
      senderType: req.participant.isAdmin ? 'admin' : 'staff',
      senderId: req.participant.user._id,
      senderDisplayName: req.participant.user.name || 'Safety Committee Officer',
      content: trimmedInstructions,
      messageType: 'evidence_request',
      isRead: false,
    });

    conversation.evidenceRequested = true;
    conversation.evidenceRequestDetails = {
      requestedAt: new Date(),
      requestedBy: req.participant.user._id,
      instructions: trimmedInstructions,
      isFulfilled: false,
    };
    conversation.unreadComplainantCount = (conversation.unreadComplainantCount || 0) + 1;
    conversation.status = 'evidence_requested';
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = `Evidence Request: ${trimmedInstructions.slice(0, 100)}`;
    conversation.lastSenderType = req.participant.isAdmin ? 'admin' : 'staff';
    await conversation.save();

    return res.status(201).json({
      success: true,
      message,
      conversationStatus: conversation.status,
    });
  } catch (err) {
    console.error('requestAdditionalEvidence error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit evidence request.',
    });
  }
}

// ─── 7. Upload Conversation Attachment ───────────────────────────────────────
export async function uploadAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file received for upload.',
      });
    }

    const fileUrl = `/uploads/evidence/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      attachment: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        fileUrl,
        sizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('uploadAttachment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Attachment upload failed.',
    });
  }
}

// ─── 8. Staff / Admin: List All Case Conversations ───────────────────────────
export async function getStaffConversations(req, res) {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Filter by staff assignment (admins see everything)
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedStaffId: req.user._id },
        { assignedStaffId: null }, // Unassigned queue accessible to committee members
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { caseId: searchRegex },
          { incidentCategory: searchRegex },
          { complainantPseudonym: searchRegex },
          { lastMessagePreview: searchRegex },
        ],
      });
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ unreadStaffCount: -1, lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Conversation.countDocuments(query),
    ]);

    const totalUnreadStaff = await Conversation.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$unreadStaffCount' } } },
    ]);

    return res.status(200).json({
      success: true,
      total,
      unreadTotal: totalUnreadStaff[0]?.total || 0,
      conversations,
    });
  } catch (err) {
    console.error('getStaffConversations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff case conversations.',
    });
  }
}

// ─── 9. Staff / Admin: Communication Overview Stats ──────────────────────────
export async function getStaffCommunicationStats(req, res) {
  try {
    const baseQuery = req.user.role === 'admin'
      ? {}
      : { $or: [{ assignedStaffId: req.user._id }, { assignedStaffId: null }] };

    const [
      totalConversations,
      unreadConversations,
      pendingComplainantResponses,
      highPriorityCount,
      evidenceRequestedCount,
    ] = await Promise.all([
      Conversation.countDocuments(baseQuery),
      Conversation.countDocuments({ ...baseQuery, unreadStaffCount: { $gt: 0 } }),
      Conversation.countDocuments({ ...baseQuery, status: 'awaiting_staff' }),
      Conversation.countDocuments({ ...baseQuery, priority: 'HIGH' }),
      Conversation.countDocuments({ ...baseQuery, evidenceRequested: true }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalConversations,
        unreadConversations,
        pendingComplainantResponses,
        highPriorityCount,
        evidenceRequestedCount,
      },
    });
  } catch (err) {
    console.error('getStaffCommunicationStats error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve communication statistics.',
    });
  }
}

// ─── 10. Update Conversation Status ──────────────────────────────────────────
export async function updateConversationStatus(req, res) {
  try {
    const targetCaseId = req.params.caseId.trim();
    const { status } = req.body;

    const allowed = ['active', 'awaiting_complainant', 'awaiting_staff', 'evidence_requested', 'closed', 'archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const conversation = await Conversation.findOne({ caseId: targetCaseId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    conversation.status = status;

    // Add a system event message recording status update
    await Message.create({
      conversationId: conversation._id,
      caseId: targetCaseId,
      senderType: 'system',
      senderDisplayName: 'Suraksha Setu Security',
      content: `Case communication status updated to: ${status.replace('_', ' ').toUpperCase()}`,
      messageType: 'case_update',
      isRead: false,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(200).json({
      success: true,
      status: conversation.status,
    });
  } catch (err) {
    console.error('updateConversationStatus error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update conversation status.',
    });
  }
}

