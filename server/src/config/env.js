import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform(v => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/suraksha-setu'),
  JWT_SECRET: z.string().default('suraksha_setu_dev_secret_key_2024'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('suraksha_cookie_secret_2024'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(v => parseInt(v, 10)),
  UPLOAD_DIR: z.string().default('uploads/'),
  ML_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation error:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
