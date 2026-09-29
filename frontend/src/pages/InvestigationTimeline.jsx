import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Upload,
  Play,
  AlertCircle,
  Archive,
  FileText,
  CheckCircle,
  User,
  Cpu,
  RefreshCw,
  Plus,
  Loader,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const typeConfig = {
  case_created: { icon: FolderOpen, bg: 'bg-blue-100', color: 'text-blue-600' },
  pcap_uploaded: { icon: Upload, bg: 'bg-purple-100', color: 'text-purple-600' },
  analysis_started: { icon: Play, bg: 'bg-amber-100', color: 'text-amber-600' },
  threat_detected: { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  evidence_added: { icon: Archive, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  analysis_completed: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  report_generated: { icon: FileText, bg: 'bg-blue-100', color: 'text-blue-600' },
};

function buildTimelineFromCase(caseData, analysisData, reportData) {
  const events = [];
  let id = 1;

  // 1. Case Created event
  if (caseData?.created_at) {
    events.push({
      id: id++,
      type: 'case_created',
      title: 'Investigation Initiated',
      description: `Case "${caseData.title}" was registered in CyberLens AI locker.`,
      date: new Date(caseData.created_at).toLocaleString(),
      timestamp: new Date(caseData.created_at).getTime(),
      actor: 'Forensic Investigator',
    });
  }

  // 2. PCAP uploads & analysis milestones
  (caseData?.pcap_files || []).forEach((pcap) => {
    const sizeMb = pcap.file_size ? (pcap.file_size / (1024 * 1024)).toFixed(1) : 0;
    const pcapDate = new Date(pcap.uploaded_at);

    events.push({
      id: id++,
      type: 'pcap_uploaded',
      title: 'Evidence PCAP Ingested',
      description: `Packet capture "${pcap.filename}" (${sizeMb} MB) uploaded for forensic audit.`,
      date: pcapDate.toLocaleString(),
      timestamp: pcapDate.getTime(),
      actor: 'Evidence Locker',
    });

    if (pcap.parse_status === 'processing') {
      events.push({
        id: id++,
        type: 'analysis_started',
        title: 'Deep Packet Inspection Active',
        description: `Streaming packet decoding and flow classification running on "${pcap.filename}".`,
        date: pcapDate.toLocaleString(),
        timestamp: pcapDate.getTime() + 1000,
        actor: 'Analysis Engine',
      });
    }

    if (pcap.parse_status === 'done') {
      events.push({
        id: id++,
        type: 'analysis_completed',
        title: 'Packet Parsing Completed',
        description: `Successfully analyzed ${
          pcap.packet_count ? pcap.packet_count.toLocaleString() : 'all'
        } packets from "${pcap.filename}".`,
        date: pcapDate.toLocaleString(),
        timestamp: pcapDate.getTime() + 2000,
        actor: 'Analysis Engine',
      });
    }
  });

  // 3. Threat detection events from latest analysis
  const threats = analysisData?.threats_detected || [];
  threats.slice(0, 5).forEach((t, idx) => {
    events.push({
      id: id++,
      type: 'threat_detected',
      title: `Threat Identified: ${t.type || 'Malicious Flow'}`,
      description: `Severity: ${t.severity || 'Medium'}. Source: ${t.src_ip || 'N/A'} ➔ Target: ${
        t.dst_ip || 'N/A'
      }. ${t.description || ''}`,
      date: 'During PCAP Analysis',
      timestamp: Date.now() - (threats.length - idx) * 60000,
      actor: 'ML Threat Engine',
    });
  });

  // 4. Report generation events
  if (reportData?.is_court_ready) {
    events.push({
      id: id++,
      type: 'report_generated',
      title: 'Court-Ready Report Compiled',
      description: `Forensic PDF report signed with chain-of-custody verification.`,
      date: new Date(reportData.generated_at).toLocaleString(),
      timestamp: new Date(reportData.generated_at).getTime(),
      actor: 'ReportLab Engine',
    });
  }

  // Sort events chronologically
  events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  return events;
}

function calculateProgress(caseData, analysisData, reportData) {
  const pcaps = caseData?.pcap_files || [];
  const hasPcaps = pcaps.length > 0;
  const analysisStarted = pcaps.some(
    (p) => p.parse_status === 'processing' || p.parse_status === 'done'
  );
  const analysisDone = pcaps.some((p) => p.parse_status === 'done');
  const threatsFound = (analysisData?.threats_detected || []).length > 0;
  const reportGenerated = !!reportData?.is_court_ready;
  const caseClosed = caseData?.status === 'closed';

  const steps = [
    { label: 'Case Created', done: true },
    { label: 'PCAP Ingested', done: hasPcaps },
    { label: 'Analysis Started', done: analysisStarted },
    { label: 'Threats Identified', done: threatsFound },
    { label: 'Evidence Verified', done: hasPcaps },
    { label: 'Analysis Completed', done: analysisDone },
    { label: 'Report Generated', done: reportGenerated },
    { label: 'Case Closed', done: caseClosed },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return { steps, percent };
}

export default function InvestigationTimeline() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load cases
  useEffect(() => {
    api.listCases()
      .then((items) => {
        setCases(items);
        const stored = localStorage.getItem('cyberlens_selected_case');
        const match = items.find((c) => String(c.id) === stored) || items[0];
        if (match) setSelectedCaseId(String(match.id));
      })
      .catch((err) => setError(err.message || 'Failed to fetch cases'))
      .finally(() => setLoading(false));
  }, []);

  // Load selected case full details
  useEffect(() => {
    if (!selectedCaseId) {
      setCaseData(null);
      setAnalysisData(null);
      setReportData(null);
      return;
    }

    setLoading(true);
    localStorage.setItem('cyberlens_selected_case', selectedCaseId);

    Promise.all([
      api.getCase(selectedCaseId).catch(() => null),
      api.getCaseAnalysis(selectedCaseId).catch(() => null),
      api.getReport(selectedCaseId).catch(() => null),
    ])
      .then(([cDetail, aDetail, rDetail]) => {
        setCaseData(cDetail);
        setAnalysisData(aDetail);
        setReportData(rDetail);
      })
      .catch((err) => setError(err.message || 'Error loading timeline data'))
      .finally(() => setLoading(false));
  }, [selectedCaseId]);

  const events = buildTimelineFromCase(caseData, analysisData, reportData);
  const { steps, percent } = calculateProgress(caseData, analysisData, reportData);

  const pcapsCount = caseData?.pcap_files?.length || 0;
  const threatsCount = (analysisData?.threats_detected || []).length;
  const reportsCount = reportData?.is_court_ready ? 1 : 0;

  let durationText = 'Active';
  if (caseData?.created_at) {
    const start = new Date(caseData.created_at);
    const days = Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
    durationText = `${days} day${days === 1 ? '' : 's'}`;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigation Timeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {caseData ? (
              <span>
                Chronological chain of events for{' '}
                <strong className="text-gray-800 font-semibold">
                  #{caseData.id} – {caseData.title}
                </strong>
              </span>
            ) : (
              'Select an investigation to view timeline logs'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {cases.length === 0 && <option value="">No cases registered</option>}
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} – {c.title}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => setSelectedCaseId((prev) => prev)}
            disabled={loading || !selectedCaseId}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cases.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center shadow-card">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700">No investigations created yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Create an investigation and upload PCAP files to generate an automated forensic timeline.
          </p>
          <Button
            size="sm"
            icon={Plus}
            className="mt-4"
            onClick={() => navigate('/investigations/create')}
          >
            Create Investigation
          </Button>
        </div>
      )}

      {cases.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timeline Column */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-500">Building forensic timeline…</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No events logged for this investigation yet.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />

                <div className="space-y-0">
                  {events.map((event, idx) => {
                    const cfg = typeConfig[event.type] || typeConfig.case_created;
                    const Icon = cfg.icon;
                    const isLast = idx === events.length - 1;

                    return (
                      <div key={event.id} className="relative flex gap-5">
                        {/* Icon */}
                        <div className="flex-shrink-0 relative z-10">
                          <div
                            className={`w-10 h-10 rounded-full ${cfg.bg} border-2 border-white flex items-center justify-center shadow-sm`}
                          >
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                        </div>

                        {/* Event Content Card */}
                        <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-7'}`}>
                          <div className="bg-gray-50/80 hover:bg-blue-50/30 border border-gray-100 hover:border-blue-100 rounded-xl p-4 transition-all duration-150">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                              <span className="text-[11px] text-gray-400 font-mono">
                                {event.date}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                                {event.actor === 'Analysis Engine' ||
                                event.actor === 'ML Threat Engine' ||
                                event.actor === 'ReportLab Engine' ? (
                                  <Cpu className="w-2.5 h-2.5 text-gray-500" />
                                ) : (
                                  <User className="w-2.5 h-2.5 text-gray-500" />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium">
                                {event.actor}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-4">
            {/* Case Progress Checklist */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Case Progress</h2>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done ? 'bg-emerald-500' : 'bg-gray-100'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        step.done ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Pipeline Completion</span>
                  <span
                    className={`text-xs font-semibold ${
                      percent >= 75
                        ? 'text-emerald-600'
                        : percent >= 40
                        ? 'text-amber-600'
                        : 'text-red-500'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      percent >= 75
                        ? 'bg-emerald-500'
                        : percent >= 40
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Event Summary Counts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Event Summary</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Total Events', value: events.length, color: 'text-gray-900' },
                  { label: 'PCAPs Uploaded', value: pcapsCount, color: 'text-purple-600' },
                  { label: 'Threats Detected', value: threatsCount, color: 'text-red-600' },
                  { label: 'Reports Finalized', value: reportsCount, color: 'text-blue-600' },
                  { label: 'Duration Active', value: durationText, color: 'text-gray-700' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
