import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications - Get current user notifications and unread count
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Retrieve notifications addressed specifically to user, or to their role, or to all
    const query = {
      $or: [
        { recipient: userId },
        { recipientRole: userRole },
        { recipientRole: 'all' },
      ],
      confidentiality: 'INTERNAL_STAFF',
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all user notifications as read
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const query = {
      $or: [
        { recipient: userId },
        { recipientRole: userRole },
        { recipientRole: 'all' },
      ],
      isRead: false,
    };

    await Notification.updateMany(query, {
      $set: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
});

export default router;
