const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:bg-blue-800',
  secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200',
  outline: 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-200 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800',
  'danger-outline': 'bg-white text-red-600 hover:bg-red-50 ring-1 ring-red-200',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
};

const sizes = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  sm: 'text-sm px-3.5 py-2 rounded-xl gap-2',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      {children}
      {IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}
