import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import LegalPage from './pages/LegalPage';
import ProofVaultPage from './pages/ProofVaultPage';
import RespondentPortalPage from './pages/RespondentPortalPage';
import StaffLoginPage from './pages/StaffLoginPage';
import DashboardPage from './pages/DashboardPage';
import CounsellingSupport from './pages/CounsellingSupport';
import StaticPolicyPage from './pages/StaticPolicyPage';

function NotFoundPage() {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--color-primary)' }}>404</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: 24 }}>Page not found</p>
        <a href="/" className="btn btn-primary">Return Home</a>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Core Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/track-case" element={<TrackPage />} />
            <Route path="/cases" element={<TrackPage />} />
            
            {/* Legal Pages & Aliases */}
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/legal-framework" element={<LegalPage />} />
            
            {/* Counselling & Support */}
            <Route path="/counselling-support" element={<CounsellingSupport />} />
            <Route path="/counselling" element={<CounsellingSupport />} />
            
            {/* Evidence & Proof Vault */}
            <Route path="/proof-vault" element={<ProofVaultPage />} />
            <Route path="/proof-saver" element={<ProofVaultPage />} />
            <Route path="/vault" element={<ProofVaultPage />} />
            <Route path="/evidence" element={<ProofVaultPage />} />
            
            {/* Portals & Auth */}
            <Route path="/respondent" element={<RespondentPortalPage />} />
            <Route path="/staff-login" element={<StaffLoginPage />} />
            <Route path="/login" element={<StaffLoginPage />} />
            <Route path="/admin" element={<StaffLoginPage />} />
            <Route path="/admin-login" element={<StaffLoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Static Policy & Information Pages */}
            <Route path="/privacy" element={<StaticPolicyPage />} />
            <Route path="/terms" element={<StaticPolicyPage />} />
            <Route path="/disclaimer" element={<StaticPolicyPage />} />
            <Route path="/accessibility" element={<StaticPolicyPage />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
