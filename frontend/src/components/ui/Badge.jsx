const colors = {
  green: 'bg-sage-100 text-sage-700 border-sage-200 dark:bg-sage-900 dark:text-sage-300 dark:border-sage-700',
  blue: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-700',
  amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
  red: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200 dark:bg-terracotta-900 dark:text-terracotta-300 dark:border-terracotta-700',
  slate: 'bg-espresso-100 text-espresso-600 border-espresso-200 dark:bg-dark-800 dark:text-dark-300 dark:border-dark-700',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
  cream: 'bg-cream-200 text-espresso-600 border-cream-300 dark:bg-dark-700 dark:text-dark-300 dark:border-dark-600',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function Badge({
  children,
  color = 'slate',
  size = 'md',
  className = '',
  dot = false,
  pulse = false,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colors[color]} ${sizes[size]} ${pulse ? 'animate-pulse-glow' : ''} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          color === 'green' ? 'bg-sage-500' :
          color === 'red' ? 'bg-terracotta-500' :
          color === 'amber' ? 'bg-amber-500' :
          color === 'blue' ? 'bg-sky-500' :
          'bg-espresso-400'
        }`} />
      )}
      {children}
    </span>
  );
}
