import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Globe,
  Server,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  protocolData,
  protocolChartData,
  topSourceIPs,
  topDestIPs,
  packetTimelineData,
} from '../data/dummyData';

const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-card-md text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PacketAnalysis() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('protocols');

  const tabs = [
    { id: 'protocols', label: 'Protocol Distribution' },
    { id: 'sourceips', label: 'Source IPs' },
    { id: 'destips', label: 'Destination IPs' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packet Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Analyzing: <span className="font-medium text-gray-700">capture_2024_06_15_harbor.pcap</span> · INV-2024-001
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={TrendingUp}
          iconRight={ArrowRight}
          onClick={() => navigate('/threats')}
        >
          View Threats
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Packets" value="1,245,678" icon={Package} color="blue" />
        <StatCard title="Protocols" value="7" icon={Activity} color="purple" />
        <StatCard title="Unique Src IPs" value="43" icon={Globe} color="amber" />
        <StatCard title="Unique Dst IPs" value="29" icon={Server} color="green" />
        <StatCard title="Avg Pkt Size" value="487 B" icon={Package} color="slate" />
      </div>

      {/* Traffic Timeline */}
      <Card>
        <CardHeader
          title="Packet Volume Over Time"
          subtitle="Hourly packet count distribution"
        />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={packetTimelineData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="pkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="packets" stroke="#2563EB" strokeWidth={2} fill="url(#pkGrad)" name="Packets" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Protocol Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        <Card>
          <CardHeader title="Protocol Breakdown" subtitle="Distribution by packet count" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={protocolChartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {protocolChartData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
              />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Share']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Tabbed tables */}
        <Card padding={false}>
          {/* Tabs */}
          <div className="px-5 pt-4 border-b border-gray-100">
            <div className="flex gap-0.5 -mb-px">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all
                    ${activeTab === t.id
                      ? 'text-blue-700 border-blue-600 bg-blue-50/30'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {activeTab === 'protocols' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Protocol</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Packets</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {protocolData.map((p) => (
                    <tr key={p.protocol} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-gray-900">{p.protocol}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{p.packets.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10">{p.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'sourceips' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">IP Address</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Packets</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5 hidden sm:table-cell">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSourceIPs.map((ip) => (
                    <tr key={ip.ip} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-semibold text-blue-700">{ip.ip}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{ip.packets.toLocaleString()}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{ip.flag} {ip.location}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'destips' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">IP Address</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Packets</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5 hidden sm:table-cell">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topDestIPs.map((ip) => (
                    <tr key={ip.ip} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-semibold text-blue-700">{ip.ip}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{ip.packets.toLocaleString()}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{ip.flag} {ip.location}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
