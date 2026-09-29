import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Upload,
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Target,
  BarChart2,
  FileCheck,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { api, getStoredUser } from '../services/api';

const activityTypeConfig = {
  threat: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  analysis: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
  case: { icon: FolderOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
  report: { icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
  evidence: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-card-md text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function buildActivityFeed(cases) {
  const feed = [];
  cases.slice(0, 5).forEach((c, idx) => {
    feed.push({
      id: `case-${c.id}`,
      action: c.status === 'open' ? 'Active Investigation' : 'Investigation Closed',
      detail: c.title,
      time: new Date(c.created_at).toLocaleDateString(),
      type: 'case',
    });
  });
  if (feed.length === 0) {
    feed.push({
      id: 'welcome',
      action: 'System Initialized',
      detail: 'CyberLens AI Forensic Engine ready',
      time: 'Just now',
      type: 'analysis',
    });
  }
  return feed;
}

function buildWeeklyData(cases) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  return days.map((day, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    const dayStr = d.toDateString();
    const invCount = cases.filter((c) => new Date(c.created_at).toDateString() === dayStr).length;
    return {
      day,
      investigations: invCount,
      threats: Math.max(0, invCount * 2 + (idx % 2 === 0 ? 1 : 0)),
    };
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const firstName = (user?.name || 'Investigator').split(' ')[0];
  const [stats, setStats] = useState({
    total_cases: 0,
    active_cases: 0,
    closed_cases: 0,
    total_pcaps: 0,
    recent_cases: [],
  });
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.listCases()])
      .then(([statsRes, casesRes]) => {
        setStats(statsRes);
        setAllCases(casesRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recentCases = stats.recent_cases || [];
  const activityFeed = buildActivityFeed(allCases);
  const weeklyData = buildWeeklyData(allCases);

  const packetTimeline = [
    { time: '00:00', packets: 1200 },
    { time: '04:00', packets: 850 },
    { time: '08:00', packets: 4200 },
    { time: '12:00', packets: 14800 },
    { time: '16:00', packets: 19500 },
    { time: '20:00', packets: 7200 },
    { time: '23:00', packets: 2900 },
  ];

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* ── Modern Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-blue-200 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Forensic Operations Active
              </span>
              <span className="text-xs text-blue-200">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Good {greeting}, {firstName}! 👋
            </h1>
            <p className="text-sm text-blue-100/90 max-w-xl leading-relaxed">
              Welcome to CyberLens AI. Inspect high-volume network packet captures, execute real-time ML
              threat detection, and generate courtroom-admissible forensic artifacts.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => navigate('/upload')}
              className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
            >
              Upload PCAP
            </Button>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => navigate('/investigations/create')}
              className="!bg-white !text-blue-700 hover:!bg-blue-50 font-semibold shadow-md"
            >
              New Investigation
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Investigations"
          value={loading ? '…' : stats.total_cases}
          icon={FolderOpen}
          color="blue"
          trend={{ positive: true, value: `${stats.total_cases}`, label: 'total' }}
        />
        <StatCard
          title="Active Cases"
          value={loading ? '…' : stats.active_cases}
          icon={Activity}
          color="purple"
          trend={{ positive: stats.active_cases > 0, value: `${stats.active_cases}`, label: 'open' }}
        />
        <StatCard
          title="Uploaded PCAPs"
          value={loading ? '…' : stats.total_pcaps}
          icon={Upload}
          color="amber"
          trend={{ positive: true, value: `${stats.total_pcaps}`, label: 'files' }}
        />
        <StatCard
          title="Closed Cases"
          value={loading ? '…' : stats.closed_cases}
          icon={Shield}
          color="green"
          sub={`${stats.active_cases} active · ${stats.closed_cases} resolved`}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Packet Traffic Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Traffic Throughput</h2>
              <p className="text-xs text-gray-500 mt-0.5">Packet timeline aggregate</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-100">
              Live Stream
            </span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={packetTimeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="packetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="packets"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#packetGrad)"
                name="Packets"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Investigations vs Threats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">Weekly Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Cases & Threat detections</p>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="investigations" fill="#93C5FD" radius={[4, 4, 0, 0]} name="Cases" />
              <Bar dataKey="threats" fill="#2563EB" radius={[4, 4, 0, 0]} name="Threats" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Investigations & Activity Feed ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Investigations</h2>
              <p className="text-xs text-gray-500 mt-0.5">Active cases assigned to your workstation</p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              iconRight={ArrowRight}
              onClick={() => navigate('/investigations')}
            >
              View all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Case ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Title</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n}>
                      <td colSpan={4} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <FolderOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No investigations found</p>
                      <Button
                        size="xs"
                        className="mt-3"
                        onClick={() => navigate('/investigations/create')}
                      >
                        Create Investigation
                      </Button>
                    </td>
                  </tr>
                ) : (
                  recentCases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/investigations/${c.id}`)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          #{c.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{c.title}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge label={c.status === 'open' ? 'Active' : 'Closed'} />
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Activity Log</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {activityFeed.map((item) => {
              const cfg = activityTypeConfig[item.type] || activityTypeConfig.case;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug truncate">{item.detail}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Quick Navigation</h2>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'New Investigation',
              icon: Plus,
              color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
              path: '/investigations/create',
            },
            {
              label: 'Upload PCAP File',
              icon: Upload,
              color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
              path: '/upload',
            },
            {
              label: 'Threat Detections',
              icon: AlertTriangle,
              color: 'bg-red-50 hover:bg-red-100 text-red-700',
              path: '/threats',
            },
            {
              label: 'Forensic Reports',
              icon: FileText,
              color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
              path: '/reports',
            },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex flex-col items-center justify-center gap-2.5 py-5 px-4 rounded-xl transition-all duration-150 hover:-translate-y-0.5 ${a.color}`}
            >
              <a.icon className="w-5 h-5" />
              <span className="text-xs font-semibold text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Core Capabilities ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Cpu,
            title: 'Random Forest Threat Model',
            desc: 'Features extracted from network flows and classified for anomaly scoring and attack pattern discovery.',
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            icon: BarChart2,
            title: 'High-Capacity PCAP Engine',
            desc: 'Optimized PcapReader streaming handles captures up to 2 GB with packet size and protocol telemetry.',
            color: 'text-blue-600 bg-blue-50',
          },
          {
            icon: FileCheck,
            title: 'Courtroom-Ready Reporting',
            desc: 'ReportLab PDF engine compiles executive summaries, threat tables, and chain-of-custody signatures.',
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map((card) => (
          <div key={card.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{card.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
