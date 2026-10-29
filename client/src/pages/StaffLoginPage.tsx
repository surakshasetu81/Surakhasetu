import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function StaffLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const returnTo = searchParams.get('returnTo');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Preserve safe relative return destination
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        navigate(returnTo);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      let message = '';
      if (!err?.response) {
        message = 'Unable to reach backend server. If the server is on Render free-tier, it may take 30–50s to wake up from sleep. Please wait a moment and try again.';
      } else if (err.response.status === 401) {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (err.response.status === 405) {
        message = 'Authentication endpoint returned 405 Method Not Allowed. The request was intercepted by a static page rewrite rather than reaching the backend.';
      } else if (err.response.status === 404) {
        message = 'Authentication endpoint not found (404). Please ensure the backend server is deployed and online.';
      } else {
        message = err.response.data?.message || err.friendlyMessage || 'Login failed. Please verify your connection and credentials.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            padding: 6,
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <img
              src="/images/suraksha-setu-emblem.png"
              alt="Suraksha Setu — सुरक्षित कार्यस्थल, सशक्त समाज"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              width={68}
              height={68}
            />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Staff Sign In</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            For authorized committee members and administrators only.
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@organization.com"
                id="staff-email-input"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                id="staff-password-input"
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px dashed rgba(99, 102, 241, 0.3)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 2 }}>Demo Admin Credentials:</div>
                <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>admin@surakshasetu.org / Admin@12345</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@surakshasetu.org');
                  setPassword('Admin@12345');
                }}
                style={{
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                Auto-fill
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(217, 45, 53, 0.08)',
                border: '1px solid rgba(217, 45, 53, 0.3)',
                color: 'var(--color-emergency)',
                fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="staff-login-submit-btn"
              style={{ marginTop: 4 }}
            >
              <LogIn size={16} />
              {loading ? 'Signing in (connecting to server)…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 20 }}>
          This portal is for authorized personnel only. Public users should use the{' '}
          <a href="/report" style={{ color: 'var(--color-primary)' }}>Report page</a>.
        </p>
      </motion.div>
    </main>
  );
}
