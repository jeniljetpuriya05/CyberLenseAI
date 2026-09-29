import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  Shield,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { api } from '../services/api';

const ITEMS_PER_PAGE = 8;

const SeverityIcon = ({ severity }) => {
  if (severity === 'Critical') return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (severity === 'High') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  if (severity === 'Medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <Info className="w-4 h-4 text-gray-400" />;
};

export default function ThreatDetection() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Load cases on mount
  useEffect(() => {
    api.listCases()
      .then((items) => {
        setCases(items);
        const savedCase = localStorage.getItem('cyberlens_selected_case');
        const nextCase = items.find((item) => String(item.id) === savedCase) || items[0];
        if (nextCase) setSelectedCase(String(nextCase.id));
      })
      .catch((err) => setErrorMsg(err.message || 'Failed to load cases'));
  }, []);

  // Fetch analysis whenever selected case changes
  useEffect(() => {
    if (!selectedCase) return;
    localStorage.setItem('cyberlens_selected_case', selectedCase);
    loadCaseThreats(selectedCase);
  }, [selectedCase]);

  const loadCaseThreats = (caseId) => {
    setLoading(true);
    setErrorMsg('');
    api.getCaseAnalysis(caseId)
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to retrieve analysis');
        setLoading(false);
      });
  };

  const mlStatus = analysis?.ml_model_status || 'none';
  const totalFlows = analysis?.ml_total_flows || 0;
  const normalFlows = analysis?.ml_normal_flows || 0;
  const maliciousFlows = analysis?.ml_malicious_flows || 0;
  const flowResults = analysis?.ml_detection_results || [];
  const detectedThreats = analysis?.threats_detected || [];

  // Combine heuristic threats and ML flow threats for display
  const combinedThreats = [];

  // 1. Add ML flow records
  flowResults.forEach((f, idx) => {
    const isMal = f.prediction === 1;
    const confPct = Math.round((f.confidence || 0) * 100);
    combinedThreats.push({
      id: f.flow_id || `FLOW-${String(idx + 1).padStart(4, '0')}`,
      source: 'ML Engine',
      type: isMal ? 'Malicious Flow' : 'Normal Flow',
      severity: isMal ? (confPct >= 80 ? 'Critical' : 'High') : 'Low',
      confidence: confPct,
      label: f.label || (isMal ? 'Malicious' : 'Normal'),
      isMalicious: isMal,
      sourceIP: f.src_ip || '—',
      destIP: f.dst_ip || '—',
      port: f.dst_port ? `${f.dst_port}` : '—',
      protocol: f.protocol || 'TCP',
      packets: f.total_packets || 0,
      description: isMal
        ? `ML classified as Malicious with ${confPct}% model confidence (${f.protocol} traffic)`
        : `Verified Normal traffic (${confPct}% model confidence)`,
    });
  });

  // 2. Add any additional heuristic threats detected if not redundant
  detectedThreats.forEach((t, idx) => {
    if (t.type !== 'ML Flow Threat') {
      combinedThreats.push({
        id: `THR-${String(idx + 1).padStart(3, '0')}`,
        source: 'Heuristic Rule',
        type: t.type || 'Anomaly',
        severity: t.severity || 'Medium',
        confidence: t.confidence ? Math.round(t.confidence * 100) : 85,
        label: 'Threat',
        isMalicious: true,
        sourceIP: t.src_ip || '—',
        destIP: t.dst_ip || '—',
        port: t.dst_port ? `${t.dst_port}` : '—',
        protocol: t.protocol || 'IP',
        packets: t.packet_count || 0,
        description: t.description || `${t.type} heuristic pattern identified`,
      });
    }
  });

  const filtered = combinedThreats.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.type.toLowerCase().includes(q) ||
      t.sourceIP.toLowerCase().includes(q) ||
      t.destIP.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.protocol.toLowerCase().includes(q);
    const matchSev = severityFilter === 'All' || t.severity === severityFilter;
    const matchType = typeFilter === 'All' || (typeFilter === 'Malicious' ? t.isMalicious : !t.isMalicious);
    return matchSearch && matchSev && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Threat Detection</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Machine Learning flow classification & forensic threat analysis
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <select
            value={selectedCase}
            onChange={(e) => { setSelectedCase(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {cases.length === 0
              ? <option value="">No investigations</option>
              : cases.map((c) => <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>)
            }
          </select>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => loadCaseThreats(selectedCase)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Banners */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-700 font-medium">Analyzing PCAP and evaluating ML flow predictions...</p>
        </div>
      )}

      {mlStatus === 'no_model' && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Trained ML Model Not Found</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Trained ML model not found. Please train the model first by placing the CIC-IDS2017 dataset into <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">backend/ml/dataset/</code> and running <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">python ml/train_model.py</code>.
            </p>
          </div>
        </div>
      )}

      {mlStatus === 'error' && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Required ML Features Could Not Be Extracted</p>
            <p className="text-xs text-red-700 mt-0.5">An error occurred during network flow feature transformation.</p>
          </div>
        </div>
      )}

      {/* ML Flow Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : totalFlows.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Network Flows</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{loading ? '…' : normalFlows.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Normal Flows (0)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{loading ? '…' : maliciousFlows.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Malicious Flows (1)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {loading ? '…' : mlStatus === 'completed' ? 'Active' : mlStatus === 'no_model' ? 'No Model' : 'Idle'}
              </p>
              <p className="text-xs text-gray-500">ML Engine Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by flow ID, IP address, protocol, or type…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSeverityFilter(s); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                    ${severityFilter === s ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Identifier</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Classification</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Model Confidence</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">Source IP</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">Dest IP</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Protocol</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      {totalFlows === 0
                        ? 'No PCAP flows analyzed yet for this case.'
                        : 'No threats or flows match the specified filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-lg ${t.isMalicious ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                        {t.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <SeverityIcon severity={t.severity} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t.type}</p>
                          <p className="text-xs text-gray-400 hidden lg:block max-w-[220px] truncate">{t.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${t.isMalicious ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${t.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{t.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {t.sourceIP}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-gray-700">{t.destIP}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-gray-600">{t.protocol}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={t.severity} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing {filtered.length > 0 ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length) : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} items
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}


