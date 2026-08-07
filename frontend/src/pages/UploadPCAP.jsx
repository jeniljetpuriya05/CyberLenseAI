import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Upload, File, X, CheckCircle, AlertCircle, Activity, CloudUpload, Plus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const ALLOWED_EXT = ['.pcap', '.pcapng'];

export default function UploadPCAP() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [done, setDone] = useState({});
  const [selectedCase, setSelectedCase] = useState('');
  const [cases, setCases] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [rejectedError, setRejectedError] = useState('');
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    api.listCases()
      .then((items) => {
        setCases(items);
        if (items.length > 0) setSelectedCase(String(items[0].id));
      })
      .catch((err) => setUploadError(err.message))
      .finally(() => setLoadingCases(false));
  }, []);

  // Load real uploaded files for selected case
  useEffect(() => {
    if (!selectedCase) { setUploadedFiles([]); return; }
    api.getCase(selectedCase)
      .then((data) => setUploadedFiles(data.pcap_files || []))
      .catch(() => setUploadedFiles([]));
  }, [selectedCase, done]);

  const onDrop = useCallback((accepted, rejected) => {
    setRejectedError('');

    // Filter strictly by extension even if dropzone passes them
    const valid = [];
    const invalid = [];
    accepted.forEach((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      if (ALLOWED_EXT.includes(ext)) valid.push(f);
      else invalid.push(f.name);
    });
    rejected.forEach((r) => invalid.push(r.file.name));

    if (invalid.length > 0) {
      setRejectedError(`Only .pcap and .pcapng files are allowed. Rejected: ${invalid.join(', ')}`);
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, id: crypto.randomUUID() }))]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/octet-stream': ['.pcap', '.pcapng'], 'application/vnd.tcpdump.pcap': ['.pcap', '.pcapng'] },
    multiple: true,
  });

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadFiles = async () => {
    if (files.length === 0 || !selectedCase) return;
    setUploading(true);
    setUploadError('');
    const initial = {};
    files.forEach((f) => { initial[f.id] = 0; });
    setProgress(initial);
    setDone({});

    for (const item of files) {
      try {
        setProgress((p) => ({ ...p, [item.id]: 30 }));
        const uploaded = await api.uploadPcap(selectedCase, item.file);
        setProgress((p) => ({ ...p, [item.id]: 100 }));
        setDone((p) => ({ ...p, [item.id]: uploaded.pcap_id }));
      } catch (err) {
        setUploadError(err.message);
        setProgress((p) => ({ ...p, [item.id]: 0 }));
      }
    }
    setUploading(false);
  };

  const noCases = !loadingCases && cases.length === 0;

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload PCAP</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload network capture files for forensic analysis</p>
      </div>

      {/* No cases banner */}
      {noCases && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">No investigations found</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You must create an investigation before uploading PCAP files.
            </p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => navigate('/investigations/create')}>
            Create Investigation
          </Button>
        </div>
      )}

      {/* Case selection */}
      {!noCases && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Associate with Investigation
          </label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full max-w-xs text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>
            ))}
          </select>
          {uploadError && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Drop zone — disabled if no cases */}
      <div
        {...(noCases ? {} : getRootProps())}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
          ${noCases
            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
            : isDragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.01] cursor-pointer'
              : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
          }`}
      >
        {!noCases && <input {...getInputProps()} />}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <CloudUpload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {noCases ? 'Create an investigation first' : isDragActive ? 'Drop your files here' : 'Drag & drop PCAP files'}
            </p>
            {!noCases && (
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-blue-600 font-medium">browse to choose files</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-200">.pcap</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-200">.pcapng</span>
          </div>
          <p className="text-xs text-gray-400">Only .pcap and .pcapng files accepted · Max 2 GB</p>
        </div>
      </div>

      {/* Rejected file error */}
      {rejectedError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{rejectedError}</p>
          <button onClick={() => setRejectedError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload queue */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Upload Queue ({files.length} file{files.length > 1 ? 's' : ''})
            </p>
            {!uploading && (
              <button onClick={() => setFiles([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
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
                          <button onClick={() => removeFile(id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatBytes(file.size)}</p>
                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{done[id] ? 'Complete' : 'Uploading…'}</span>
                          <span className="text-xs font-medium text-blue-600">{progress[id] || 0}%</span>
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
            <Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>Clear</Button>
            <Button
              icon={uploading ? Activity : Upload}
              onClick={uploadFiles}
              disabled={uploading || !selectedCase || Object.keys(done).length === files.length}
            >
              {uploading ? 'Uploading…' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Previously uploaded files from DB */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Previously Uploaded Files</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedCase ? `Case #${selectedCase}` : 'Select a case to view files'}
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {uploadedFiles.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No files uploaded for this case yet.
            </div>
          ) : uploadedFiles.map((f) => (
            <div key={f.id} className="px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 font-mono truncate">{f.filename}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatBytes(f.file_size)} · {f.packet_count ? `${f.packet_count.toLocaleString()} packets` : 'Parsing…'} · {new Date(f.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <Badge label={f.parse_status === 'done' ? 'Analyzed' : f.parse_status === 'failed' ? 'Failed' : 'Pending'} />
              <Button variant="secondary" size="xs" icon={Activity} onClick={() => navigate('/packet-analysis')}>
                Analyze
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
