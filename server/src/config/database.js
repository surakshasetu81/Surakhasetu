import mongoose from 'mongoose';
import { env } from './env.js';

let reconnectInterval = null;
let memoryServerInstance = null;

export const seedDefaultUsers = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    let admin = await User.findOne({ email: 'admin@surakshasetu.org' });
    if (!admin) {
      await User.create({
        name: 'Internal Committee Admin',
        email: 'admin@surakshasetu.org',
        password: 'Admin@12345',
        role: 'admin',
        department: 'Internal Complaints Committee (ICC)',
        isActive: true,
      });
      console.log('🌱 Seeded default admin account: admin@surakshasetu.org / Admin@12345');
    } else {
      const matchesStandard = await admin.comparePassword('Admin@12345');
      if (!matchesStandard && (await admin.comparePassword('AdminPassword123!'))) {
        admin.password = 'Admin@12345';
        await admin.save();
        console.log('🔄 Updated admin password to standard demo credentials: Admin@12345');
      }
    }
    let staff = await User.findOne({ email: 'staff@surakshasetu.org' });
    if (!staff) {
      await User.create({
        name: 'Safety Support Staff',
        email: 'staff@surakshasetu.org',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'Case Triage & Support',
        isActive: true,
      });
      console.log('🌱 Seeded default staff account: staff@surakshasetu.org / StaffPassword123!');
    }
  } catch (err) {
    console.warn('ℹ️ Seeding note:', err.message);
  }
};

const startMemoryDB = async () => {
  if (env.NODE_ENV === 'production') {
    console.warn('⚠️  NODE_ENV=production: In-memory fallback is disabled in production. External MongoDB connection required.');
    return null;
  }
  try {
    console.log('📦 Starting local embedded MongoDB database instance...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    const conn = await mongoose.connect(memUri);
    lastConnectionError = null;
    lastDiagnosticCategory = null;
    console.log(`✅ Local MongoDB running and connected [Database: ${conn.connection.name}]`);
    await seedDefaultUsers();
    return conn;
  } catch (memErr) {
    console.error('❌ Failed to launch local in-memory MongoDB:', memErr.message);
    return null;
  }
};

/**
 * Mask credentials in MongoDB connection string for safe logging and error reporting
 * e.g., mongodb+srv://user:pass@host -> mongodb+srv://user:****@host
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1****$3');
};

/**
 * Validate MongoDB URI structure and check for unreplaced placeholder tokens
 */
export const validateMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return { valid: false, error: 'MONGODB_URI is empty or undefined.' };
  }
  if (uri.includes('<db_password>')) {
    return {
      valid: false,
      error: "MONGODB_URI contains '<db_password>' placeholder. Please update server/.env with the actual database user password.",
    };
  }
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      error: 'MONGODB_URI must begin with standard protocol: mongodb:// or mongodb+srv://',
    };
  }
  return { valid: true };
};

export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
};

let lastConnectionError = null;
let lastConnectionAttemptAt = null;
let lastDiagnosticCategory = null;

export const getDatabaseDetails = () => {
  const status = getDatabaseStatus();
  const connected = isDatabaseConnected();
  const uri = env.MONGODB_URI;
  const validation = validateMongoUri(uri);

  let state = 'DISCONNECTED';
  if (connected) {
    state = 'CONNECTED';
  } else if (!validation.valid) {
    state = 'CONFIGURATION_MISSING';
  } else if (lastConnectionError) {
    state = 'CONNECTION_ATTEMPT_FAILED';
  }

  return {
    status,
    state,
    connected,
    host: connected && mongoose.connection.host ? mongoose.connection.host : null,
    databaseName: connected && mongoose.connection.name ? mongoose.connection.name : null,
    lastAttemptAt: lastConnectionAttemptAt,
    diagnostic: lastDiagnosticCategory ? {
      category: lastDiagnosticCategory,
      summary: lastConnectionError,
    } : null,
  };
};

// Bind Mongoose lifecycle connection events
mongoose.connection.on('connected', () => {
  lastConnectionError = null;
  lastDiagnosticCategory = null;
  console.log(`✅ MongoDB Mongoose connected: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Mongoose connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  // Avoid leaking credentials in error messages
  const safeMessage = err.message ? err.message.replace(/:([^@]+)@/, ':****@') : 'Database connection error';
  lastConnectionError = safeMessage;
  console.error('❌ MongoDB connection runtime error:', safeMessage);
});

export const connectDB = async () => {
  const uri = env.MONGODB_URI;
  const validation = validateMongoUri(uri);
  lastConnectionAttemptAt = new Date().toISOString();

  if (!validation.valid) {
    lastDiagnosticCategory = 'CONFIGURATION_MISSING';
    lastConnectionError = validation.error;
    console.warn(`ℹ️  No remote MongoDB configured (${validation.error}). Falling back to local embedded database...`);
    return await startMemoryDB();
  }

  try {
    const maskedUri = sanitizeMongoUri(uri);
    console.log(`📡 Connecting to MongoDB cluster at ${maskedUri}...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
    });

    lastConnectionError = null;
    lastDiagnosticCategory = null;
    console.log(`✅ MongoDB connected successfully to host: ${conn.connection.host} [Database: ${conn.connection.name}]`);
    await seedDefaultUsers();
    return conn;
  } catch (error) {
    const rawMsg = error.message || '';
    const safeError = rawMsg.replace(/:([^@]+)@/, ':****@');

    if (rawMsg.includes('bad auth') || rawMsg.includes('authentication failed')) {
      lastDiagnosticCategory = 'AUTHENTICATION_FAILURE';
      lastConnectionError = 'MongoDB Atlas rejected the database user credentials (bad auth).';
    } else if (rawMsg.includes('ssl3_read_bytes') || rawMsg.includes('alert number 80') || rawMsg.includes('whitelist') || rawMsg.includes('Could not connect to any servers')) {
      lastDiagnosticCategory = 'ATLAS_NETWORK_OR_TLS_RESTRICTION';
      lastConnectionError = 'Atlas network restriction or cluster offline.';
    } else if (rawMsg.includes('ENOTFOUND') || rawMsg.includes('querySrv')) {
      lastDiagnosticCategory = 'DNS_RESOLUTION_FAILED';
      lastConnectionError = 'Could not resolve MongoDB cluster hostname via DNS.';
    } else {
      lastDiagnosticCategory = 'DATABASE_CONNECTION_ERROR';
      lastConnectionError = safeError;
    }

    console.warn(`⚠️  Remote MongoDB connection attempt failed: ${safeError}`);
    if (env.NODE_ENV === 'production') {
      console.warn(`⚠️  Diagnostic [${lastDiagnosticCategory}]: ${lastConnectionError}`);
      console.log('🔄 Scheduling automatic background reconnection retry every 5s...');
      if (!reconnectInterval) {
        reconnectInterval = setInterval(async () => {
          if (!isDatabaseConnected()) {
            try {
              const retryConn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 8000,
                maxPoolSize: 10,
              });
              if (isDatabaseConnected()) {
                lastConnectionError = null;
                lastDiagnosticCategory = null;
                console.log(`✅ Automatic reconnection to MongoDB Atlas succeeded! [Host: ${retryConn.connection.host}]`);
                clearInterval(reconnectInterval);
                reconnectInterval = null;
                await seedDefaultUsers();
              }
            } catch (_) {
              // keep waiting for network or credentials to be updated
            }
          } else {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
          }
        }, 5000);
      }
      return null;
    }

    console.log('🔄 Automatically falling back to local embedded MongoDB database for full functionality...');
    return await startMemoryDB();
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
    console.log('Local embedded MongoDB stopped.');
  }
};
