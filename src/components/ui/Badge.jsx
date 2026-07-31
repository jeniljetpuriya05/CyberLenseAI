const severityConfig = {
  Critical: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  High: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
  Low: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  Active: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  'Under Review': 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
  Closed: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  Open: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  Investigating: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  Resolved: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  Analyzed: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  Pending: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
  Final: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  Draft: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  Completed: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  'In Progress': 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  'Not Started': 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

export default function Badge({ label, size = 'sm' }) {
  const classes = severityConfig[label] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200';
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${classes}`}
    >
      {label}
    </span>
  );
}
