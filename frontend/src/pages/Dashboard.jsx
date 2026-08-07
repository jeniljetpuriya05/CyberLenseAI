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
import { weeklyData, packetTimelineData, activityFeed } from '../data/dummyData';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const firstName = (user?.name || 'Investigator').split(' ')[0];
  const [stats, setStats] = useState({ total_cases: 0, active_cases: 0, closed_cases: 0, total_pcaps: 0, recent_cases: [] });

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(() => {});
  }, []);

  const recentCases = stats.recent_cases;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening across your investigations today.
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => navigate('/upload')}
          >
            Upload PCAP
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => navigate('/investigations/create')}
          >
            New Investigation
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Investigations"
          value={stats.total_cases}
          icon={FolderOpen}
          color="blue"
          trend={{ positive: true, value: `${stats.total_cases}`, label: 'total' }}
        />
        <StatCard
          title="Active Cases"
          value={stats.active_cases}
          icon={Activity}
          color="purple"
          trend={{ positive: true, value: `${stats.active_cases}`, label: 'open' }}
        />
        <StatCard
          title="Uploaded PCAPs"
          value={stats.total_pcaps}
          icon={Upload}
          color="amber"
          trend={{ positive: true, value: `${stats.total_pcaps}`, label: 'files' }}
        />
        <StatCard
          title="Closed Cases"
          value={stats.closed_cases}
          icon={Shield}
          color="red"
          sub={`${stats.active_cases} open · ${stats.closed_cases} closed`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Packet traffic chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Packet Traffic</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 24 hours · INV-2024-001</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium ring-1 ring-blue-100">
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={packetTimelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="packetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
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

        {/* Weekly activity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">Weekly Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Investigations vs Threats</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="investigations" fill="#BFDBFE" radius={[4, 4, 0, 0]} name="Investigations" />
              <Bar dataKey="threats" fill="#2563EB" radius={[4, 4, 0, 0]} name="Threats" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Investigations + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Investigations Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Investigations</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest active cases</p>
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
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Case ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/investigations/${c.id}`)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        #{c.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{c.title}</p>
                    </td>
                    <td className="px-4 py-3.5"><Badge label={c.status === 'open' ? 'Active' : 'Closed'} /></td>
                    <td className="px-4 py-3.5"><Badge label="Medium" /></td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Activity Feed</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {activityFeed.map((item) => {
              const cfg = activityTypeConfig[item.type] || activityTypeConfig.case;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
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

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Investigation', icon: Plus, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', path: '/investigations/create' },
            { label: 'Upload PCAP File', icon: Upload, color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', path: '/upload' },
            { label: 'View Threats', icon: AlertTriangle, color: 'bg-red-50 hover:bg-red-100 text-red-700', path: '/threats' },
            { label: 'Generate Report', icon: FileText, color: 'bg-green-50 hover:bg-green-100 text-green-700', path: '/reports' },
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
    </div>
  );
}
