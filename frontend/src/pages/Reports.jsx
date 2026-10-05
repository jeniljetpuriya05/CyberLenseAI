import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  Loader,
  Eye,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { api } from '../services/api';

const ITEMS_PER_PAGE = 5;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingCaseId, setGeneratingCaseId] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [selectedCase, setSelectedCase] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const caseList = await api.listCases();
      setCases(caseList);
      if (caseList.length > 0 && !selectedCase) {
        setSelectedCase(String(caseList[0].id));
      }

      // Try fetching all reports via the new endpoint
      let reportRows = [];
      try {
        const all = await api.listAllReports();
        if (Array.isArray(all)) {
          reportRows = all.map((r) => ({
            id: `RPT-${r.id}`,
            reportId: r.id,
            rawCaseId: r.case_id,
            name: `${r.case_title} – Forensic Report`,
            caseId: `#${r.case_id}`,
            caseName: r.case_title,
            generatedBy: 'Forensic Investigator',
            generatedOn: new Date(r.generated_at).toLocaleDateString(),
            status: r.is_court_ready ? 'Final' : 'Draft',
            size: r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'Ready',
            downloadUrl: r.download_url,
          }));
        }
      } catch (_) {
        // Fallback: query each case for reports
        await Promise.all(
          caseList.map(async (c) => {
            try {
              const r = await api.getReport(c.id);
              if (r && r.id) {
                reportRows.push({
                  id: `RPT-${r.id}`,
                  reportId: r.id,
                  rawCaseId: c.id,
                  name: `${c.title} – Forensic Report`,
                  caseId: `#${c.id}`,
                  caseName: c.title,
                  generatedBy: 'Forensic Investigator',
                  generatedOn: new Date(r.generated_at).toLocaleDateString(),
                  status: r.is_court_ready ? 'Final' : 'Draft',
                  size: 'Ready',
                  downloadUrl: r.download_url,
                });
              }
            } catch (__) {}
          })
        );
      }

      reportRows.sort((a, b) => b.reportId - a.reportId);
      setReports(reportRows);
    } catch (err) {
      setError(err.message || 'Failed to load forensic reports');
    } finally {
      setLoading(false);
    }
  }, [selectedCase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Polling to wait for PDF generation to finish
  useEffect(() => {
    if (!generating || !generatingCaseId) return;
    const interval = setInterval(async () => {
      try {
        const r = await api.getReport(generatingCaseId);
        if (r && r.is_court_ready) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          setGeneratingCaseId(null);
          fetchReports();
        }
      } catch (_) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [generating, generatingCaseId, fetchReports]);

  const totalPages = Math.max(1, Math.ceil(reports.length / ITEMS_PER_PAGE));
  const paged = reports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleGenerate = async () => {
    if (!selectedCase) return;
    setGenerating(true);
    setGenerateError('');
    try {
      const caseIdNum = Number(selectedCase);
      setGeneratingCaseId(caseIdNum);
      await api.generateReport(caseIdNum);
    } catch (err) {
      setGenerateError(err.message || 'Failed to start report generation');
      setGenerating(false);
      setGeneratingCaseId(null);
    }
  };

  const handleDownload = async (caseId, reportName) => {
    setDownloadingId(caseId);
    try {
      const token = localStorage.getItem('cyberlens_token');
      const url = `${API_BASE}/cases/${caseId}/report/download`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to download report PDF');
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${reportName || `forensic_report_case_${caseId}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      alert('Download error: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const openPreview = async (report) => {
    setPreviewingId(report.rawCaseId);
    try {
      const token = localStorage.getItem('cyberlens_token');
      const url = `${API_BASE}/cases/${report.rawCaseId}/report/download`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to preview report PDF');
      }
      const blob = await res.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewReport(report);
    } catch (err) {
      alert('Preview error: ' + err.message);
    } finally {
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewReport(null);
  };

  const resetModal = () => {
    setShowGenerate(false);
    setGenerated(false);
    setGenerating(false);
    setGeneratingCaseId(null);
    setGenerateError('');
  };

  const finalCount = reports.filter((r) => r.status === 'Final').length;
  const draftCount = reports.filter((r) => r.status === 'Draft').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forensic Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading forensic reports…'
              : `${reports.length} report${reports.length === 1 ? '' : 's'} · ${finalCount} court-ready`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchReports}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button icon={Plus} size="sm" onClick={() => setShowGenerate(true)}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat counters */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Reports',
            value: reports.length,
            icon: FileText,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Court-Ready',
            value: finalCount,
            icon: CheckCircle,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'In Progress',
            value: draftCount,
            icon: Clock,
            color: 'text-amber-600 bg-amber-50',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Report ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Report Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">Case</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No forensic reports generated yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Generate automated PDF reports containing packet analytics, threat findings, and chain of custody.
                    </p>
                    <Button size="xs" className="mt-4" onClick={() => setShowGenerate(true)}>
                      Generate First Report
                    </Button>
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {r.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 max-w-xs truncate">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-blue-600 font-semibold font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                        {r.caseId}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={r.status} />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{r.generatedOn}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={previewingId === r.rawCaseId ? Loader : Eye}
                          onClick={() => openPreview(r)}
                          disabled={previewingId === r.rawCaseId || r.status !== 'Final'}
                        >
                          {previewingId === r.rawCaseId ? 'Opening…' : 'Preview'}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={downloadingId === r.rawCaseId ? Loader : Download}
                          onClick={() => handleDownload(r.rawCaseId, r.name)}
                          disabled={downloadingId === r.rawCaseId || r.status !== 'Final'}
                        >
                          {downloadingId === r.rawCaseId ? 'Downloading…' : 'PDF'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && reports.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, reports.length)} of {reports.length} reports
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      <Modal isOpen={showGenerate} onClose={resetModal} title="Generate Forensic Report">
        {!generated ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Target Investigation
              </label>
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                disabled={generating}
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {cases.length === 0 && <option value="">No investigations available</option>}
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} – {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Sections Included
              </label>
              <div className="space-y-2">
                {[
                  'Executive Summary & Anomaly Score',
                  'Protocol Distribution & Top Talkers',
                  'Threat Findings & Severity Classifications',
                  'IP Address Analysis (Top Source & Dest)',
                  'Forensic Chain of Custody & Investigator Signoff',
                ].map((s) => (
                  <label key={s} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      disabled
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {generating && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Compiling PDF document…</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Formatting tables, extracting metadata, and rendering signature block.
                  </p>
                </div>
              </div>
            )}

            {generateError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetModal} disabled={generating} fullWidth>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedCase || cases.length === 0}
                fullWidth
                icon={generating ? undefined : FileText}
              >
                {generating ? 'Compiling…' : 'Generate Court-Ready PDF'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Report Successfully Generated</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Your forensic report is ready and verified for chain-of-custody compliance.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={resetModal}>
                Close
              </Button>
              <Button
                icon={Download}
                onClick={() => {
                  handleDownload(Number(selectedCase), `Forensic_Report_Case_${selectedCase}`);
                  resetModal();
                }}
              >
                Download PDF Now
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(previewReport)} onClose={closePreview} title={previewReport?.name || 'Report Preview'} width="xl">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{previewReport?.caseName}</p>
              <p className="text-xs text-gray-500">{previewReport?.id} · {previewReport?.generatedOn}</p>
            </div>
            <Button
              size="sm"
              icon={Download}
              onClick={() => handleDownload(previewReport.rawCaseId, previewReport.name)}
            >
              Download PDF
            </Button>
          </div>
          {previewUrl ? (
            <iframe
              title="Forensic report preview"
              src={previewUrl}
              className="h-[70vh] w-full rounded-xl border border-gray-200 bg-gray-50"
            />
          ) : (
            <div className="h-80 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
              Preparing preview…
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
