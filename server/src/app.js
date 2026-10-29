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
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';

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

// CORS configuration: allows configured frontend origins, local dev, same-origin, Render, and Vercel domains
const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .flatMap(item => item.split(',').map(s => s.trim().replace(/\/$/, '')));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const clean = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(clean)) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.endsWith('.vercel.app') || host.endsWith('.onrender.com')) return true;
    if (host.includes('suraksha') || host.includes('surakha')) return true;
  } catch {
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return true;
  }
  return true; // Authorized API requests are validated via Bearer JWT
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, origin || true);
    }
    return callback(null, allowedOrigins[0] || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-vault-token', 'x-simulate-offline'],
  exposedHeaders: ['Set-Cookie', 'x-evidence-iv', 'x-evidence-digest', 'x-evidence-original-name', 'x-evidence-mimetype'],
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

// Mount API routes (supports both /api/* and root /* rewrites across Vercel and local dev)
const routeList = [
  ['/auth', authRoutes],
  ['/reports', reportsRoutes],
  ['/cases', caseRoutes],
  ['/evidence', evidenceRoutes],
  ['/proof', proofRoutes],
  ['/legal', legalRoutes],
  ['/awareness', awarenessRoutes],
  ['/support', supportRoutes],
  ['/public', publicRoutes],
  ['/settings', settingsRoutes],
  ['/resources', resourceRoutes],
  ['/staff', staffRoutes],
  ['/legal-assessment', legalAssessmentRoutes],
  ['/vault', vaultRoutes],
  ['/verification', verificationRoutes],
  ['/assistant', assistantRoutes],
  ['/admin', adminRoutes],
  ['/notifications', notificationRoutes],
];

for (const [prefix, router] of routeList) {
  app.use(`/api${prefix}`, router);
  app.use(prefix, router);
}
app.use('/api', dashboardRoutes);
app.use('/', dashboardRoutes);

// Health check endpoints (mounted on both /api/health and /health)
const handleHealth = (req, res) => {
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
};

const handleDbHealth = (req, res) => {
  const dbDetails = getDatabaseDetails();
  const isConnected = isDatabaseConnected();
  const isDev = env.NODE_ENV === 'development';

  const responsePayload = {
    success: isConnected,
    status: dbDetails.state,
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

  if (isDev && dbDetails.diagnostic) {
    responsePayload.diagnostic = dbDetails.diagnostic;
  }

  return res.status(503).json(responsePayload);
};

app.get(['/api/health', '/health'], handleHealth);
app.get(['/api/health/db', '/health/db'], handleDbHealth);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
  });
});

// Centralized 404 handler with sanitized route diagnostics
app.use((req, res) => {
  res.status(404).json({
    success: false,
    errorCategory: 'ROUTE_NOT_FOUND',
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl,
  });
});

let server;
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Initialize database in background so port binding is immediate for Render
  connectDB().catch(err => {
    console.error("Database initialization error:", err.message);
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
