import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Investigations from './pages/Investigations';
import CreateInvestigation from './pages/CreateInvestigation';
import CaseDetails from './pages/CaseDetails';
import UploadPCAP from './pages/UploadPCAP';
import PacketAnalysis from './pages/PacketAnalysis';
import ThreatDetection from './pages/ThreatDetection';
import Evidence from './pages/Evidence';
import InvestigationTimeline from './pages/InvestigationTimeline';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { getToken } from './services/api';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return getToken() ? <Navigate to="/dashboard" replace /> : children;
}

function AuthWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = () => navigate('/login', { replace: true });
    window.addEventListener('cyberlens:auth-expired', handleExpired);
    return () => window.removeEventListener('cyberlens:auth-expired', handleExpired);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthWatcher />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/investigations" element={<Investigations />} />
          <Route path="/investigations/create" element={<CreateInvestigation />} />
          <Route path="/investigations/:id" element={<CaseDetails />} />
          <Route path="/upload" element={<UploadPCAP />} />
          <Route path="/packet-analysis" element={<PacketAnalysis />} />
          <Route path="/threats" element={<ThreatDetection />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/timeline" element={<InvestigationTimeline />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
