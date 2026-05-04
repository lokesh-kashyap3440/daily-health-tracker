const variants = {
  primary: 'bg-sage-600 hover:bg-sage-700 text-white shadow-sm hover:shadow-md active:scale-[0.97]',
  secondary: 'bg-white border border-cream-300 hover:bg-cream-50 text-espresso-700 shadow-sm',
  danger: 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-sm active:scale-[0.97]',
  ghost: 'hover:bg-cream-200/60 text-espresso-500',
  gradient: 'bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-700 hover:to-sage-600 text-white shadow-md hover:shadow-lg active:scale-[0.97] animate-gradient',
  outline_sage: 'border-2 border-sage-400 text-sage-700 hover:bg-sage-50 active:scale-[0.97]',
};

const sizes = {
  sm: 'py-1.5 px-3 text-sm',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3 px-7 text-base',
  xl: 'py-4 px-10 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  pulse = false,
  icon,
  ...props
}) {
  const pulseClass = pulse ? 'animate-pulse-glow' : '';

  return (
    <button
      className={`font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${pulseClass} ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}
