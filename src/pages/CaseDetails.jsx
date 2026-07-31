import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Activity,
  FileText,
  Shield,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { investigations, threats, pcapFiles } from '../data/dummyData';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = investigations.find((c) => c.id === id) || investigations[0];
  const caseThreats = threats.filter((t) => t.caseId === caseData.id);
  const casePCAPs = pcapFiles.filter((p) => p.caseId === caseData.id);

  const infoItems = [
    { label: 'Case ID', value: caseData.id, mono: true },
    { label: 'Created', value: caseData.created, icon: Calendar },
    { label: 'Last Updated', value: caseData.updated, icon: Calendar },
    { label: 'Investigator', value: caseData.investigator, icon: User },
    { label: 'Category', value: caseData.category, icon: Tag },
    { label: 'Analysis Status', value: caseData.analysisStatus },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/investigations')}
          className="self-start"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
              {caseData.id}
            </span>
            <Badge label={caseData.status} />
            <Badge label={caseData.priority} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{caseData.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{caseData.category} · Assigned to {caseData.investigator}</p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 self-start">
          <Button variant="outline" size="sm" icon={Upload} onClick={() => navigate('/upload')}>
            Upload PCAP
          </Button>
          <Button size="sm" icon={FileText} onClick={() => navigate('/reports')}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Case Description */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Case Description" />
            <p className="text-sm text-gray-600 leading-relaxed">{caseData.description}</p>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="space-y-3">
          {[
            { label: 'Evidence Files', value: caseData.evidenceCount, icon: Shield, color: 'text-blue-600 bg-blue-50' },
            { label: 'Threats Detected', value: caseThreats.length, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
            { label: 'PCAP Files', value: casePCAPs.length, icon: Upload, color: 'text-purple-600 bg-purple-50' },
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
      </div>

      {/* Case Info Grid */}
      <Card>
        <CardHeader title="Case Information" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-gray-500 mb-1">{item.label}</p>
              {item.label === 'Analysis Status' ? (
                <Badge label={item.value} size="md" />
              ) : (
                <p className={`text-sm font-semibold text-gray-900 ${item.mono ? 'font-mono text-blue-600' : ''}`}>
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Upload,
            label: 'Upload PCAP',
            desc: 'Add network capture files',
            color: 'border-blue-200 hover:bg-blue-50',
            action: () => navigate('/upload'),
          },
          {
            icon: Activity,
            label: 'View Analysis',
            desc: 'Review packet analytics',
            color: 'border-purple-200 hover:bg-purple-50',
            action: () => navigate('/packet-analysis'),
          },
          {
            icon: FileText,
            label: 'Generate Report',
            desc: 'Create forensic report PDF',
            color: 'border-green-200 hover:bg-green-50',
            action: () => navigate('/reports'),
          },
        ].map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className={`flex items-center gap-4 p-5 bg-white border-2 rounded-2xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-md text-left ${a.color}`}
          >
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

      {/* Threats in this case */}
      {caseThreats.length > 0 && (
        <Card>
          <CardHeader
            title="Detected Threats"
            subtitle={`${caseThreats.length} threat(s) found in this case`}
            action={
              <Button variant="secondary" size="xs" onClick={() => navigate('/threats')}>
                View All
              </Button>
            }
          />
          <div className="space-y-2.5">
            {caseThreats.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50/40 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${t.severity === 'Critical' ? 'bg-red-100' : t.severity === 'High' ? 'bg-orange-100' : 'bg-yellow-100'}`}>
                  <AlertCircle className={`w-4 h-4 ${t.severity === 'Critical' ? 'text-red-600' : t.severity === 'High' ? 'text-orange-600' : 'text-yellow-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.type}</p>
                  <p className="text-xs text-gray-500 truncate">{t.description}</p>
                </div>
                <Badge label={t.severity} />
                <Badge label={t.status} />
                <span className="text-xs text-gray-400">{t.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PCAP Files */}
      {casePCAPs.length > 0 && (
        <Card>
          <CardHeader
            title="PCAP Files"
            subtitle="Network capture files for this case"
            action={
              <Button variant="outline" size="xs" icon={Upload} onClick={() => navigate('/upload')}>
                Upload
              </Button>
            }
          />
          <div className="space-y-2.5">
            {casePCAPs.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-mono truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.size} · {p.packets.toLocaleString()} packets · {p.uploaded}</p>
                </div>
                <Badge label={p.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
