import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Activity,
  CloudUpload,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const SAMPLE_FILES = [
  { name: 'capture_2024_06_15_harbor.pcap', size: '142.3 MB', status: 'Analyzed', packets: '1,245,678' },
  { name: 'phishing_traffic_alfa.pcapng', size: '38.7 MB', status: 'Analyzed', packets: '324,190' },
];

export default function UploadPCAP() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [done, setDone] = useState({});
  const [selectedCase, setSelectedCase] = useState('INV-2024-001');

  const onDrop = useCallback((accepted, rejected) => {
    const valid = accepted.filter(
      (f) => f.name.endsWith('.pcap') || f.name.endsWith('.pcapng')
    );
    setFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, id: crypto.randomUUID() }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/octet-stream': ['.pcap', '.pcapng'] },
    multiple: true,
  });

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const simulateUpload = () => {
    if (files.length === 0) return;
    setUploading(true);
    const initial = {};
    files.forEach((f) => { initial[f.id] = 0; });
    setProgress(initial);
    setDone({});

    files.forEach((f) => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += Math.random() * 18 + 5;
        if (pct >= 100) {
          pct = 100;
          clearInterval(interval);
          setDone((p) => ({ ...p, [f.id]: true }));
        }
        setProgress((p) => ({ ...p, [f.id]: Math.min(100, Math.round(pct)) }));
      }, 200);
    });

    setTimeout(() => setUploading(false), files.length * 1800 + 500);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload PCAP</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload network capture files for AI-powered forensic analysis
        </p>
      </div>

      {/* Case selection */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Associate with Investigation
        </label>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="w-full max-w-xs text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="INV-2024-001">INV-2024-001 – Operation Dark Harbor</option>
          <option value="INV-2024-002">INV-2024-002 – Phishing Campaign Alfa</option>
          <option value="INV-2024-004">INV-2024-004 – Ransomware Bravo</option>
          <option value="INV-2024-007">INV-2024-007 – Zero-Day Exploit Echo</option>
        </select>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <CloudUpload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {isDragActive ? 'Drop your files here' : 'Drag & drop PCAP files'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or <span className="text-blue-600 font-medium">browse to choose files</span>
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-200">
              .pcap
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-200">
              .pcapng
            </span>
          </div>
          <p className="text-xs text-gray-400">Maximum file size: 2 GB per file</p>
        </div>
      </div>

      {/* Files queued */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Upload Queue ({files.length} file{files.length > 1 ? 's' : ''})
            </p>
            {!uploading && (
              <button
                onClick={() => setFiles([])}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {files.map(({ file, id }) => (
              <div key={id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate font-mono">{file.name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {done[id] ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : !uploading ? (
                          <button
                            onClick={() => removeFile(id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatBytes(file.size)}</p>
                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {done[id] ? 'Complete' : 'Uploading…'}
                          </span>
                          <span className="text-xs font-medium text-blue-600">
                            {progress[id] || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${done[id] ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${progress[id] || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
            <Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>
              Clear
            </Button>
            <Button
              icon={uploading ? Activity : Upload}
              onClick={simulateUpload}
              disabled={uploading || Object.keys(done).length === files.length && files.length > 0}
            >
              {uploading ? 'Uploading…' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Already uploaded files */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Previously Uploaded Files</p>
          <p className="text-xs text-gray-500 mt-0.5">Associated with {selectedCase}</p>
        </div>
        <div className="divide-y divide-gray-50">
          {SAMPLE_FILES.map((f) => (
            <div key={f.name} className="px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 font-mono truncate">{f.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.size} · {f.packets} packets</p>
              </div>
              <Badge label={f.status} />
              <Button
                variant="secondary"
                size="xs"
                icon={Activity}
                onClick={() => navigate('/packet-analysis')}
              >
                Analyze
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
