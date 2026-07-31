import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Main app layout */}
        <Route element={<Layout />}>
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
