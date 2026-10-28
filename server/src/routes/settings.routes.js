import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.middleware.js';
import { isDatabaseConnected } from '../config/database.js';

const router = express.Router();

// GET /api/settings/profile
router.get('/profile', protect, async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// PUT /api/settings/profile
router.put('/profile', protect, async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { name, department } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// GET /api/settings/sessions
router.get('/sessions', protect, (req, res) => {
  res.json({
    success: true,
    sessions: [
      {
        id: 'current-session',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'Browser Client',
        lastActive: new Date(),
        isCurrent: true,
      },
    ],
  });
});

export default router;
