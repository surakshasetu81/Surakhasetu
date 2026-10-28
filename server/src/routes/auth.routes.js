import express from 'express';
import { login, logout, getMe, createAdmin } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/setup-admin', createAdmin); // First-time admin setup only

export default router;
