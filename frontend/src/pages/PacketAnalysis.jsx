import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Globe, Server, Package, ArrowRight, TrendingUp, RefreshCw, Cpu, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';

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
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [parseDetails, setParseDetails] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('flows');

  const tabs = [
    { id: 'flows', label: 'ML Flow Analysis' },
    { id: 'protocols', label: 'Protocol Distribution' },
    { id: 'sourceips', label: 'Source IPs' },
    { id: 'destips', label: 'Destination IPs' },
  ];

  // Load cases on mount
  useEffect(() => {
    api.listCases().then((items) => {
      setCases(items);
      const savedCase = localStorage.getItem('cyberlens_selected_case');
      const nextCase = items.find((item) => String(item.id) === savedCase) || items[0];
      if (nextCase) setSelectedCase(String(nextCase.id));
    }).catch(() => {});
  }, []);

  // Fetch analysis when case changes
  useEffect(() => {
    if (!selectedCase) return;
    localStorage.setItem('cyberlens_selected_case', selectedCase);
    fetchAnalysis();
  }, [selectedCase]);

  const fetchAnalysis = () => {
    setLoading(true);
    setError('');
    api.getCaseAnalysis(selectedCase)
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
        if (data.total_packets === 0) {
          checkParseStatus();
        } else {
          setParseStatus('done');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load packet analysis');
        setLoading(false);
      });
  };

  const checkParseStatus = () => {
    api.getCase(selectedCase).then((caseData) => {
      const pcaps = caseData.pcap_files || [];
      if (pcaps.length === 0) { setParseStatus('no_pcap'); return; }
      const latest = pcaps[0];
      setParseStatus(latest.parse_status);
      setParseDetails(latest);
      if (latest.parse_status === 'processing' || latest.parse_status === 'pending') {
        setTimeout(() => fetchAnalysis(), 5000);
      }
    }).catch((err) => setError(err.message || 'Unable to read PCAP status'));
  };

  const protocols = analysis?.protocols || {};
  const totalPackets = analysis?.total_packets || 0;
  const totalFlows = analysis?.ml_total_flows || 0;
  const malFlows = analysis?.ml_malicious_flows || 0;
  const normFlows = analysis?.ml_normal_flows || 0;
  const flowResults = analysis?.ml_detection_results || [];

  const protocolTableData = Object.entries(protocols).map(([name, count]) => ({
    protocol: name,
    packets: count,
    percentage: totalPackets > 0 ? ((count / totalPackets) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.packets - a.packets);

  const protocolChartData = protocolTableData.map((p) => ({
    name: p.protocol,
    value: parseFloat(p.percentage),
  }));

  const topSrcIPs = Object.entries(analysis?.top_src_ips || {})
    .map(([ip, count]) => ({ ip, packets: count }))
    .sort((a, b) => b.packets - a.packets);

  const topDstIPs = Object.entries(analysis?.top_dst_ips || {})
    .map(([ip, count]) => ({ ip, packets: count }))
    .sort((a, b) => b.packets - a.packets);

  const timeline = analysis?.packet_timeline || [];
  const isProcessing = parseStatus === 'processing' || parseStatus === 'pending';
  const noPcap = parseStatus === 'no_pcap';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packet Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {analysis?.pcap_filename
              ? <>Analyzing: <span className="font-medium text-gray-700">{analysis.pcap_filename}</span></>
              : 'Select an investigation to view analysis'}
          </p>
        </div>
        <div className="flex gap-2.5">
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {cases.length === 0
              ? <option value="">No cases</option>
              : cases.map((c) => <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>)
            }
          </select>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAnalysis} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={TrendingUp} iconRight={ArrowRight} onClick={() => navigate('/threats')}>
            View Threats
          </Button>
        </div>
      </div>

      {/* Processing banner */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm text-blue-800 font-semibold">
                Large PCAP is being parsed and evaluated by the ML engine.
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                {parseDetails?.packet_count
                  ? `${parseDetails.packet_count.toLocaleString()} packets streamed so far. Deep ML analysis uses optimized sampling for large captures.`
                  : 'Results will appear automatically as soon as processing completes.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-white/70 border border-blue-100 rounded-full px-3 py-1">
            Auto-refresh: 5s
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* No PCAP banner */}
      {noPcap && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-amber-700 font-medium">No PCAP files uploaded for this case yet.</p>
          <Button size="sm" onClick={() => navigate('/upload')}>Upload PCAP</Button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Packets"
          value={loading ? '…' : totalPackets.toLocaleString()}
          icon={Package} color="blue"
        />
        <StatCard
          title="Extracted Flows"
          value={loading ? '…' : totalFlows.toLocaleString()}
          icon={Cpu} color="purple"
        />
        <StatCard
          title="Normal Flows"
          value={loading ? '…' : normFlows.toLocaleString()}
          icon={CheckCircle2} color="green"
        />
        <StatCard
          title="Malicious Flows"
          value={loading ? '…' : malFlows.toLocaleString()}
          icon={ShieldAlert} color="red"
        />
        <StatCard
          title="Avg Pkt Size"
          value={loading ? '…' : `${analysis?.avg_packet_size || 0} B`}
          icon={Package} color="slate"
        />
      </div>

      {/* Traffic Timeline */}
      <Card>
        <CardHeader title="Packet Volume Over Time" subtitle="Packet count grouped by minute" />
        {timeline.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
            {loading ? 'Loading…' : 'No timeline data available'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
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
        )}
      </Card>

      {/* Protocol Chart + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        <Card>
          <CardHeader title="Protocol Breakdown" subtitle="Distribution by packet count" />
          {protocolChartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
              {loading ? 'Loading…' : 'No protocol data available'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={protocolChartData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  paddingAngle={3} dataKey="value"
                >
                  {protocolChartData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Share']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Tabbed tables */}
        <Card padding={false}>
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
            {activeTab === 'flows' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Flow ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Classification</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Confidence</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Endpoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {flowResults.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-gray-400">No flow data available</td></tr>
                  ) : flowResults.slice(0, 50).map((f) => {
                    const isMal = f.prediction === 1;
                    const confPct = Math.round((f.confidence || 0) * 100);
                    return (
                      <tr key={f.flow_id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-700">{f.flow_id}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isMal ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                            {f.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900">{confPct}%</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-600 truncate max-w-[180px]">
                          {f.src_ip}:{f.src_port} &rarr; {f.dst_ip}:{f.dst_port}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

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
                  {protocolTableData.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-sm text-gray-400">No data</td></tr>
                  ) : protocolTableData.map((p) => (
                    <tr key={p.protocol} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3"><span className="text-sm font-semibold text-gray-900">{p.protocol}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-700">{p.packets.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${p.percentage}%` }} />
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSrcIPs.length === 0 ? (
                    <tr><td colSpan={2} className="px-5 py-6 text-center text-sm text-gray-400">No data</td></tr>
                  ) : topSrcIPs.map((ip) => (
                    <tr key={ip.ip} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-semibold text-blue-700">{ip.ip}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{ip.packets.toLocaleString()}</td>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topDstIPs.length === 0 ? (
                    <tr><td colSpan={2} className="px-5 py-6 text-center text-sm text-gray-400">No data</td></tr>
                  ) : topDstIPs.map((ip) => (
                    <tr key={ip.ip} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-semibold text-blue-700">{ip.ip}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{ip.packets.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl px-5 py-4 text-center">
        <p className="text-xs text-blue-800">
          Flow metadata & statistical features are analyzed using the <span className="font-semibold text-blue-900">Random Forest Threat Classifier</span>. The system works strictly with network-flow metadata without decrypting encrypted payloads.
        </p>
      </div>
    </div>
  );
}


