import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ExternalLink, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/report', label: 'Report' },
  { to: '/track', label: 'Track a Case' },
  { to: '/proof-vault', label: 'Proof Vault' },
  { to: '/legal', label: 'Legal Framework' },
  { to: '/respondent', label: 'Respondent Portal' },
  { to: '/counselling-support', label: 'Counselling & Support' },
];

const QUICK_EXIT_URL = 'https://www.google.com';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Exact & reliable active item detection
  const isItemActive = (to: string): boolean => {
    if (to === '/') {
      return currentPath === '/';
    }
    if (to === '/proof-vault') {
      return currentPath === '/proof-vault' || currentPath === '/proof-saver';
    }
    if (to === '/legal') {
      return currentPath === '/legal' || currentPath === '/legal-framework';
    }
    return currentPath === to || currentPath.startsWith(to + '/');
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Keyboard accessibility: Escape key closes the mobile drawer
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const handleQuickExit = () => {
    window.location.href = QUICK_EXIT_URL;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav
        className="navbar"
        style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'none' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="navbar-container">
          {/* Left section: Dedicated Brand Container */}
          <div className="navbar-left">
            <Link to="/" className="navbar-brand" aria-label="Suraksha Setu Home">
              <div className="navbar-logo-icon">
                <img
                  src="/images/suraksha-setu-emblem.png"
                  alt="Suraksha Setu"
                  width={36}
                  height={36}
                  className="navbar-brand-img"
                />
              </div>
              <span className="navbar-brand-name">
                Suraksha Setu
              </span>
            </Link>
          </div>

          {/* Center section: Dedicated Navigation Container */}
          <div className="navbar-center desktop-nav" role="menubar">
            {navItems.map(item => {
              const active = isItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-link${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  role="menuitem"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right section: Dedicated Action Controls Container */}
          <div className="navbar-right navbar-actions">
            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              id="theme-toggle-btn"
              type="button"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Staff auth */}
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-secondary btn-nav btn-staff-desktop" id="dashboard-btn">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-nav btn-staff-desktop" id="logout-btn" type="button">
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/staff-login" className="btn btn-secondary btn-nav btn-staff-desktop" id="staff-signin-btn">
                <LogIn size={15} /> Staff Sign In
              </Link>
            )}

            {/* Quick Exit */}
            <button
              onClick={handleQuickExit}
              className="btn btn-quick-exit btn-nav"
              id="quick-exit-btn"
              type="button"
              aria-label="Quickly leave this page"
            >
              <ExternalLink size={14} /> Quick Exit
            </button>

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              className="mobile-hamburger theme-toggle"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-haspopup="dialog"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              id="mobile-menu-btn"
              type="button"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="mobile-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-nav-menu"
              className="mobile-menu"
              role="dialog"
              aria-label="Navigation Menu"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src="/images/suraksha-setu-emblem.png"
                    alt=""
                    width={28}
                    height={28}
                    style={{ borderRadius: 6 }}
                  />
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                    Suraksha Setu
                  </span>
                </div>
                <button
                  className="theme-toggle"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navItems.map(item => {
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link${active ? ' active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                      style={{ padding: '10px 14px', fontSize: '0.92rem' }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--color-border)' }}>
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false); }}
                      className="btn btn-secondary"
                      type="button"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/staff-login" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>
                    <LogIn size={16} /> Staff Sign In
                  </Link>
                )}
                <button onClick={handleQuickExit} className="btn btn-quick-exit" type="button">
                  <ExternalLink size={16} /> Quick Exit
                </button>
                <button onClick={toggleTheme} className="btn btn-secondary" type="button">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
