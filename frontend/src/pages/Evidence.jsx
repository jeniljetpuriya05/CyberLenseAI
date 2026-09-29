import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Eye,
  File,
  FileText,
  Archive,
  HardDrive,
  Tag,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  Upload,
  Loader,
  CheckCircle,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { api } from '../services/api';

const typeIconMap = {
  PCAP: { icon: HardDrive, color: 'bg-blue-50 text-blue-600' },
  'Memory Dump': { icon: HardDrive, color: 'bg-purple-50 text-purple-600' },
  Text: { icon: FileText, color: 'bg-green-50 text-green-600' },
  Archive: { icon: Archive, color: 'bg-amber-50 text-amber-600' },
  'Log File': { icon: File, color: 'bg-slate-50 text-slate-600' },
  Executable: { icon: File, color: 'bg-red-50 text-red-600' },
};

const EXT_TYPE_MAP = {
  pcap: 'PCAP',
  pcapng: 'PCAP',
  dmp: 'Memory Dump',
  txt: 'Text',
  log: 'Log File',
  zip: 'Archive',
  gz: 'Archive',
  tar: 'Archive',
  exe: 'Executable',
  dll: 'Executable',
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function fileToEvidence(pcap, caseTitle, caseId) {
  const ext = (pcap.filename || '').split('.').pop().toLowerCase();
  const type = EXT_TYPE_MAP[ext] || 'PCAP';
  const tags = [ext, 'network'];
  if (pcap.parse_status === 'done') tags.push('analyzed');
  if (pcap.parse_status === 'pending' || pcap.parse_status === 'processing') tags.push('pending');
  return {
    id: `EV-${pcap.id}`,
    pcapId: pcap.id,
    name: pcap.filename,
    caseId: `#${caseId}`,
    caseName: caseTitle || `Case #${caseId}`,
    rawCaseId: caseId,
    type,
    size: formatBytes(pcap.file_size),
    rawSize: pcap.file_size || 0,
    uploaded: new Date(pcap.uploaded_at).toLocaleDateString(),
    uploadedAt: pcap.uploaded_at,
    uploadedBy: 'Investigator',
    packetCount: pcap.packet_count || 0,
    description: `${type} packet capture file. Total packets: ${
      pcap.packet_count ? pcap.packet_count.toLocaleString() : 'Pending parse'
    }. Status: ${pcap.parse_status}.`,
    tags,
    parse_status: pcap.parse_status,
  };
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-100 rounded-xl flex-1" />
        <div className="h-8 bg-gray-100 rounded-xl flex-1" />
      </div>
    </div>
  );
}

export default function Evidence() {
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch cases to aggregate all uploaded evidence across cases
      const cases = await api.listCases();
      const items = [];
      await Promise.all(
        cases.map(async (c) => {
          try {
            const detail = await api.getCase(c.id);
            (detail.pcap_files || []).forEach((pcap) => {
              items.push(fileToEvidence(pcap, c.title, c.id));
            });
          } catch (_) {}
        })
      );
      // Sort newest first
      items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setEvidence(items);
    } catch (err) {
      setError(err.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence, refreshKey]);

  const allTags = ['All', ...new Set(evidence.flatMap((e) => e.tags))];

  const filtered = evidence.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.caseName.toLowerCase().includes(q) ||
      e.tags.some((t) => t.includes(q));
    const matchTag = selectedTag === 'All' || e.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  const handlePreview = (item) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  const handleDownload = async (item) => {
    setDownloadingId(item.id);
    try {
      const token = localStorage.getItem('cyberlens_token');
      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1'}/pcap/${item.pcapId}/download`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = item.name;
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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Locker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? (
              'Retrieving live evidence records…'
            ) : (
              `${evidence.length} evidence file${evidence.length === 1 ? '' : 's'} across ${
                new Set(evidence.map((e) => e.rawCaseId)).size
              } active case${new Set(evidence.map((e) => e.rawCaseId)).size === 1 ? '' : 's'}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button icon={Plus} size="sm" onClick={() => navigate('/upload')}>
            Add Evidence
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

      {/* Filters bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search evidence by file name, case, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center shadow-card">
          <Upload className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700">No evidence items found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {search || selectedTag !== 'All'
              ? 'No evidence matches your current search filters. Try clearing them.'
              : 'Upload PCAP files into your investigations to store and track live evidence.'}
          </p>
          <Button size="sm" icon={Plus} className="mt-5" onClick={() => navigate('/upload')}>
            Upload First PCAP
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const cfg = typeIconMap[item.type] || typeIconMap.PCAP;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate font-mono" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.size} · {item.type}
                      </p>
                    </div>
                    {item.parse_status === 'processing' && (
                      <Loader className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0 mt-1" />
                    )}
                    {item.parse_status === 'done' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" title="Analyzed" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  {/* Case reference */}
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="font-semibold text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                      {item.caseId}
                    </span>
                    <span className="truncate">{item.caseName}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-[10px] bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-2 py-0.5 rounded-full font-medium transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {/* Meta */}
                  <div className="text-[11px] text-gray-400 mb-3 border-t border-gray-100 pt-3">
                    Uploaded on {item.uploaded} · {item.uploadedBy}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Eye}
                      fullWidth
                      onClick={() => handlePreview(item)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={downloadingId === item.id ? Loader : Download}
                      fullWidth
                      disabled={downloadingId === item.id}
                      onClick={() => handleDownload(item)}
                    >
                      {downloadingId === item.id ? 'Saving…' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Evidence Details">
        {previewItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              {[
                ['Evidence ID', previewItem.id],
                ['File Name', previewItem.name],
                ['Evidence Type', previewItem.type],
                ['File Size', previewItem.size],
                ['Associated Case', `${previewItem.caseId} – ${previewItem.caseName}`],
                ['Uploaded On', previewItem.uploaded],
                ['Parse Status', previewItem.parse_status],
                ['Packet Count', previewItem.packetCount ? previewItem.packetCount.toLocaleString() : 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between text-xs gap-3">
                  <span className="font-semibold text-gray-500">{label}:</span>
                  <span className="font-mono text-gray-900 text-right break-all">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)} fullWidth>
                Close
              </Button>
              <Button
                icon={Download}
                onClick={() => {
                  handleDownload(previewItem);
                  setShowPreview(false);
                }}
                fullWidth
              >
                Download Evidence File
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
