export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-2xl shadow-card
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardDivider() {
  return <div className="border-t border-gray-100 -mx-5 my-4" />;
}
