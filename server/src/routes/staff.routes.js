import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/staff - Admin: list all staff
router.get('/', protect, authorize('admin'), async (req, res) => {
  const staff = await User.find({ role: 'staff' }).select('-password');
  res.json({ success: true, staff });
});

// POST /api/staff - Admin: create staff account
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const staff = await User.create({ name, email, password, department, role: 'staff' });
    res.status(201).json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create staff account' });
  }
});

// PATCH /api/staff/:id/deactivate - Admin: deactivate staff
router.patch('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to deactivate' });
  }
});

export default router;
