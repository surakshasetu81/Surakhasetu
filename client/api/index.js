import app from '../../server/src/app.js';
import { connectDB } from '../../server/src/config/database.js';

// Pre-warm database connection for Vercel serverless execution
connectDB().catch(err => {
  console.warn('Vercel serverless connectDB init note:', err.message);
});

export default app;

