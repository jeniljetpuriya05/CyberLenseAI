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
} from 'lucide-react';
import { timelineEvents } from '../data/dummyData';

const typeConfig = {
  case_created: { icon: FolderOpen, bg: 'bg-blue-100', color: 'text-blue-600', line: 'border-blue-200' },
  pcap_uploaded: { icon: Upload, bg: 'bg-purple-100', color: 'text-purple-600', line: 'border-purple-200' },
  analysis_started: { icon: Play, bg: 'bg-amber-100', color: 'text-amber-600', line: 'border-amber-200' },
  threat_detected: { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600', line: 'border-red-200' },
  evidence_added: { icon: Archive, bg: 'bg-green-100', color: 'text-green-600', line: 'border-green-200' },
  analysis_completed: { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600', line: 'border-green-200' },
  report_generated: { icon: FileText, bg: 'bg-blue-100', color: 'text-blue-600', line: 'border-blue-200' },
};

export default function InvestigationTimeline() {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investigation Timeline</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Chronological event log · INV-2024-001 – Operation Dark Harbor
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />

            <div className="space-y-0">
              {timelineEvents.map((event, idx) => {
                const cfg = typeConfig[event.type] || typeConfig.case_created;
                const Icon = cfg.icon;
                const isLast = idx === timelineEvents.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-5">
                    {/* Icon */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} border-2 border-white flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-8'}`}>
                      <div className="bg-gray-50 hover:bg-blue-50/30 border border-gray-100 hover:border-blue-100 rounded-xl p-4 transition-all duration-150">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                          <span className="text-[10px] text-gray-400 font-mono">{event.date}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                            {event.actor === 'System' || event.actor === 'Analysis Engine'
                              ? <Cpu className="w-2.5 h-2.5 text-gray-500" />
                              : <User className="w-2.5 h-2.5 text-gray-500" />
                            }
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">{event.actor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          {/* Case progress */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Case Progress</h2>
            <div className="space-y-3">
              {[
                { label: 'Case Created', done: true },
                { label: 'PCAP Uploaded', done: true },
                { label: 'Analysis Started', done: true },
                { label: 'Threats Identified', done: true },
                { label: 'Evidence Collected', done: true },
                { label: 'Analysis Completed', done: true },
                { label: 'Report Generated', done: true },
                { label: 'Case Closed', done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-100'}`}>
                    {step.done
                      ? <CheckCircle className="w-3 h-3 text-white" />
                      : <div className="w-2 h-2 rounded-full bg-gray-300" />
                    }
                  </div>
                  <span className={`text-sm ${step.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Completion</span>
                <span className="text-xs font-semibold text-green-600">87%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>
          </div>

          {/* Event counts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Event Summary</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Total Events', value: timelineEvents.length, color: 'text-gray-900' },
                { label: 'Threats Found', value: 2, color: 'text-red-600' },
                { label: 'Evidence Added', value: 1, color: 'text-green-600' },
                { label: 'Reports Generated', value: 1, color: 'text-blue-600' },
                { label: 'Duration', value: '15 days', color: 'text-gray-900' },
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
    </div>
  );
}
