import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGODB_URI;

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB Atlas.');

    // 1. Admin Account
    let admin = await User.findOne({ email: 'admin@surakshasetu.org' });
    if (!admin) {
      admin = await User.create({
        name: 'Internal Committee Admin',
        email: 'admin@surakshasetu.org',
        password: 'AdminPassword123!',
        role: 'admin',
        department: 'Internal Complaints Committee (ICC)',
        isActive: true,
      });
      console.log('✅ Admin user created: admin@surakshasetu.org');
    } else {
      console.log('ℹ️ Admin user already exists: admin@surakshasetu.org');
    }

    // 2. Staff Account
    let staff = await User.findOne({ email: 'staff@surakshasetu.org' });
    if (!staff) {
      staff = await User.create({
        name: 'Safety Support Staff',
        email: 'staff@surakshasetu.org',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'Case Triage & Support',
        isActive: true,
      });
      console.log('✅ Staff user created: staff@surakshasetu.org');
    } else {
      console.log('ℹ️ Staff user already exists: staff@surakshasetu.org');
    }

    console.log('\n=========================================');
    console.log('STAFF LOGIN CREDENTIALS:');
    console.log('-----------------------------------------');
    console.log('Admin Account:');
    console.log('  Email:    admin@surakshasetu.org');
    console.log('  Password: AdminPassword123!');
    console.log('  Role:     admin (full committee access)');
    console.log('-----------------------------------------');
    console.log('Staff Account:');
    console.log('  Email:    staff@surakshasetu.org');
    console.log('  Password: StaffPassword123!');
    console.log('  Role:     staff (triage & case review)');
    console.log('=========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

seed();
