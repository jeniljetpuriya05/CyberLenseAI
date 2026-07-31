import { useState } from 'react';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  Shield,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import { threats } from '../data/dummyData';

const ITEMS_PER_PAGE = 6;

const riskBarColor = (score) => {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-400';
  if (score >= 40) return 'bg-yellow-400';
  return 'bg-gray-300';
};

const SeverityIcon = ({ severity }) => {
  if (severity === 'Critical') return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (severity === 'High') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  if (severity === 'Medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <Info className="w-4 h-4 text-gray-400" />;
};

export default function ThreatDetection() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'Investigating', 'Resolved'];

  const filtered = threats.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.type.toLowerCase().includes(q) ||
      t.sourceIP.toLowerCase().includes(q) ||
      t.destIP.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);
    const matchSev = severityFilter === 'All' || t.severity === severityFilter;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchSev && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts = {
    Critical: threats.filter((t) => t.severity === 'Critical').length,
    High: threats.filter((t) => t.severity === 'High').length,
    Medium: threats.filter((t) => t.severity === 'Medium').length,
    Low: threats.filter((t) => t.severity === 'Low').length,
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Threat Detection</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          AI-classified threats across all investigations
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: counts.Critical, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle, iconColor: 'text-red-500' },
          { label: 'High', count: counts.High, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle, iconColor: 'text-orange-500' },
          { label: 'Medium', count: counts.Medium, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-500' },
          { label: 'Low', count: counts.Low, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Info, iconColor: 'text-gray-400' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setSeverityFilter(s.label === severityFilter ? 'All' : s.label); setCurrentPage(1); }}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-card-md
              ${severityFilter === s.label ? `${s.bg} ${s.border}` : 'bg-white border-gray-200'}`}
          >
            <s.icon className={`w-6 h-6 ${s.iconColor}`} />
            <div className="text-left">
              <p className={`text-2xl font-bold ${severityFilter === s.label ? s.text : 'text-gray-900'}`}>{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by type, IP address, ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                    ${statusFilter === s ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Threats Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Threat ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Risk Score</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">Source IP</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">Dest IP</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Severity</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No threats match your filters.</p>
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                        {t.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <SeverityIcon severity={t.severity} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t.type}</p>
                          <p className="text-xs text-gray-400 hidden lg:block max-w-[200px] truncate">{t.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`${riskBarColor(t.riskScore)} h-1.5 rounded-full`}
                            style={{ width: `${t.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{t.riskScore}</span>
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
                    <td className="px-5 py-4"><Badge label={t.severity} /></td>
                    <td className="px-5 py-4"><Badge label={t.status} /></td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{t.time}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} threats
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
