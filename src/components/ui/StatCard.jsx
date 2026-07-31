const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600',
    text: 'text-blue-700',
    badge: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-600',
    text: 'text-green-700',
    badge: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-600',
    text: 'text-red-700',
    badge: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-700',
    badge: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-600',
    text: 'text-purple-700',
    badge: 'text-purple-600',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-slate-500',
    text: 'text-slate-700',
    badge: 'text-slate-600',
  },
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend, sub }) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-gray-400 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
