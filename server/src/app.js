import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { connectDB, closeDB, getDatabaseStatus, getDatabaseDetails, isDatabaseConnected } from './config/database.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import caseRoutes from './routes/case.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import proofRoutes from './routes/proof.routes.js';
import legalRoutes from './routes/legal.routes.js';
import awarenessRoutes from './routes/awareness.routes.js';
import supportRoutes from './routes/support.routes.js';
import publicRoutes from './routes/public.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import staffRoutes from './routes/staff.routes.js';
import legalAssessmentRoutes from './routes/legalAssessment.routes.js';
import vaultRoutes from './routes/vault.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import assistantRoutes from './routes/assistant.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local upload storage directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/evidence'),
  path.join(__dirname, '../uploads/vault_encrypted'),
  path.join(__dirname, '../uploads/vault_backup'),
];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS configuration supporting local development, Vercel deployments, and production URLs
const configuredOrigins = [
  env.FRONTEND_ORIGIN,
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .flatMap(item => item.split(',').map(s => s.trim().replace(/\/$/, '')));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health checks)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    if (configuredOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Auto-allow any Vercel or Render domain preview or production deployment
    try {
      const parsedUrl = new URL(origin);
      if (
        parsedUrl.hostname.endsWith('.vercel.app') ||
        parsedUrl.hostname.endsWith('.onrender.com') ||
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch (_) {}

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vault-token', 'x-simulate-offline'],
  exposedHeaders: ['x-evidence-iv', 'x-evidence-digest', 'x-evidence-original-name', 'x-evidence-mimetype'],
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/cases', strictLimiter);
app.use('/api/reports', strictLimiter);
app.use('/api/auth', strictLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Static uploads directory (restricted)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/proof', proofRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/awareness', awarenessRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/legal-assessment', legalAssessmentRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/assistant', assistantRoutes);

// General Health check endpoint
app.get('/api/health', (req, res) => {
  const dbDetails = getDatabaseDetails();
  const isConnected = isDatabaseConnected();
  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    status: isConnected ? 'healthy' : 'database_unavailable',
    server: 'Suraksha Setu API Server',
    database: dbDetails,
    isDatabaseConnected: isConnected,
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Database Health check endpoint
app.get('/api/health/db', (req, res) => {
  const dbDetails = getDatabaseDetails();
  const isConnected = isDatabaseConnected();
  const isDev = env.NODE_ENV === 'development';

  const responsePayload = {
    success: isConnected,
    status: dbDetails.state, // 'CONNECTED', 'DISCONNECTED', 'CONFIGURATION_MISSING', 'CONNECTION_ATTEMPT_FAILED'
    connected: isConnected,
    timestamp: new Date().toISOString(),
  };

  if (isConnected) {
    responsePayload.database = {
      name: dbDetails.databaseName,
      host: dbDetails.host,
    };
    return res.status(200).json(responsePayload);
  }

  // In development mode, provide sanitized technical diagnostic without leaking credentials
  if (isDev && dbDetails.diagnostic) {
    responsePayload.diagnostic = dbDetails.diagnostic;
  }

  return res.status(503).json(responsePayload);
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

let server;
if (!process.env.VERCEL) {
  const PORT = env.PORT || 5000;
  // Initialize database before listening
  connectDB().then(() => {
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Suraksha Setu server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Database initialization error:', err);
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Suraksha Setu server running on port ${PORT} (database degraded)`);
    });
  });

  // Graceful shutdown
  const handleShutdown = async (signal) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    if (server) {
      server.close(async () => {
        await closeDB();
        console.log('Server process terminated gracefully.');
        process.exit(0);
      });
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
} else {
  // On Vercel serverless environment
  connectDB().catch(console.error);
}

export default app;
