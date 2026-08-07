import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Activity, FileText, Shield, Calendar,
  User, AlertCircle, Trash2, Edit2, CheckCircle, X,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { api } from '../services/api';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getCase(id)
      .then((data) => { setCaseData(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  const startEdit = () => {
    setEditForm({ title: caseData.title, description: caseData.description || '', status: caseData.status });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await api.updateCase(id, editForm);
      setCaseData((prev) => ({ ...prev, ...updated }));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteCase(id);
      navigate('/investigations');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading case…</div>;
  if (error && !caseData) return <div className="flex items-center justify-center h-64 text-red-500 text-sm">{error}</div>;
  if (!caseData) return null;

  const pcapFiles = caseData.pcap_files || [];
  const analysis = caseData.analysis_summary;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/investigations')} className="self-start" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">#{caseData.id}</span>
            <Badge label={caseData.status === 'open' ? 'Active' : 'Closed'} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
          {caseData.description && <p className="text-sm text-gray-500 mt-1">{caseData.description}</p>}
        </div>
        <div className="flex gap-2.5 flex-shrink-0 self-start">
          <Button variant="outline" size="sm" icon={Edit2} onClick={startEdit}>Edit</Button>
          <Button variant="outline" size="sm" icon={Upload} onClick={() => navigate('/upload')}>Upload PCAP</Button>
          <Button variant="outline" size="sm" icon={Trash2} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader title="Edit Case" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button icon={CheckCircle} onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
              <Button variant="outline" icon={X} onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'PCAP Files', value: pcapFiles.length, icon: Upload, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Packets', value: analysis?.total_packets?.toLocaleString() ?? '—', icon: Activity, color: 'text-purple-600 bg-purple-50' },
          { label: 'Anomaly Score', value: analysis ? `${(analysis.anomaly_score * 100).toFixed(1)}%` : '—', icon: Shield, color: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Case info */}
      <Card>
        <CardHeader title="Case Information" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Case ID</p>
            <p className="text-sm font-mono font-semibold text-blue-600">#{caseData.id}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
            <Badge label={caseData.status === 'open' ? 'Active' : 'Closed'} size="md" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
            <p className="text-sm font-semibold text-gray-900">{new Date(caseData.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Upload, label: 'Upload PCAP', desc: 'Add network capture files', color: 'border-blue-200 hover:bg-blue-50', action: () => navigate('/upload') },
          { icon: Activity, label: 'View Analysis', desc: 'Review packet analytics', color: 'border-purple-200 hover:bg-purple-50', action: () => navigate('/packet-analysis') },
          { icon: FileText, label: 'Generate Report', desc: 'Create forensic report PDF', color: 'border-green-200 hover:bg-green-50', action: () => navigate('/reports') },
        ].map((a) => (
          <button key={a.label} onClick={a.action}
            className={`flex items-center gap-4 p-5 bg-white border-2 rounded-2xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-md text-left ${a.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <a.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* PCAP Files */}
      {pcapFiles.length > 0 && (
        <Card>
          <CardHeader title="PCAP Files" subtitle="Network capture files for this case"
            action={<Button variant="outline" size="xs" icon={Upload} onClick={() => navigate('/upload')}>Upload</Button>}
          />
          <div className="space-y-2.5">
            {pcapFiles.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-mono truncate">{p.filename}</p>
                  <p className="text-xs text-gray-500">
                    {p.file_size ? `${(p.file_size / 1024 / 1024).toFixed(1)} MB` : '—'} ·{' '}
                    {p.packet_count ? `${p.packet_count.toLocaleString()} packets` : 'Parsing…'} ·{' '}
                    {new Date(p.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge label={p.parse_status === 'done' ? 'Analyzed' : p.parse_status === 'failed' ? 'Failed' : 'Pending'} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
