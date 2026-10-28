import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { sanitizeMongoUri } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load exact environment configuration from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

async function verifyConnection() {
  console.log('========================================================================');
  console.log('SURAKSHA SETU — MONGODB ATLAS LIVE CONNECTION VERIFICATION');
  console.log('========================================================================\n');

  if (!uri) {
    console.error('❌ FAILED: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  const sanitized = sanitizeMongoUri(uri);
  console.log(`Connecting to: ${sanitized}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    console.log(`Connected to host: ${conn.connection.host}`);
    console.log(`Active database: ${conn.connection.name}`);

    // Perform a harmless database operation: admin ping
    console.log('Executing harmless database operation (admin ping)...');
    const adminDb = conn.connection.db.admin();
    const pingResult = await adminDb.ping();
    console.log('Ping response:', pingResult);

    if (pingResult && pingResult.ok === 1) {
      console.log('✅ ATLAS_VERIFICATION_SUCCESS: Database is live, responsive, and operational.');
    } else {
      throw new Error('Unexpected ping result: ' + JSON.stringify(pingResult));
    }

    // List collections to verify read capability
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Available collections count: ${collections.length} [${collections.map(c => c.name).join(', ')}]`);

    // Clean disconnect
    await mongoose.disconnect();
    console.log('Clean disconnect completed.\n');
    process.exit(0);
  } catch (err) {
    const safeMsg = (err.message || '').replace(/:([^@]+)@/, ':****@');
    console.error(`❌ ATLAS_VERIFICATION_FAILED: ${safeMsg}`);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

verifyConnection();
