import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS restricted to configured frontend origin
// CORS configuration: allows configured frontend origins, local dev, same-origin, Render, and Vercel domains
const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return callback(null, true);
    return callback(null, allowedOrigins[0] || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
  max: 30,
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
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(🚀 Suraksha Setu server running on port );
  });

  // Graceful shutdown
  const handleShutdown = async (signal) => {
    console.log(\n received. Initiating graceful shutdown...);
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
}

export default app;
