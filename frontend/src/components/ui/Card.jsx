export default function Card({ children, className = '', variant = 'default', hover = false, accent = '' }) {
  const base = 'rounded-2xl border p-6 transition-all duration-300';

  const styles = {
    default: 'bg-white border-cream-200 shadow-sm hover:shadow-md dark:bg-dark-800 dark:border-dark-700 dark:hover:shadow-dark-950/40',
    warm: 'bg-gradient-to-br from-cream-50 to-cream-100 border-cream-300 shadow-sm dark:bg-dark-800 dark:from-dark-800 dark:to-dark-900 dark:border-dark-700',
    glass: 'bg-white/70 backdrop-blur-xl border-cream-200/60 shadow-sm dark:bg-dark-800/70 dark:border-dark-700/60',
    highlight: 'bg-white border-l-4 border-l-sage-500 border-cream-200 shadow-sm dark:bg-dark-800 dark:border-dark-700 dark:border-l-sage-500',
    gradient: 'bg-gradient-to-br from-sage-50 via-white to-terracotta-50 border-sage-200/60 shadow-sm dark:from-dark-800 dark:via-dark-800 dark:to-dark-900 dark:border-dark-700',
    elevated: 'bg-white border-cream-200 shadow-lg shadow-sage-900/5 dark:bg-dark-800 dark:border-dark-700 dark:shadow-dark-950/30',
    ghost: 'bg-transparent border-transparent',
  };

  const hoverClass = hover
    ? 'card-tilt cursor-pointer'
    : '';

  const accentClass = accent
    ? `border-l-4 border-l-${accent}`
    : '';

  return (
    <div className={`${base} ${styles[variant] || styles.default} ${hoverClass} ${accentClass} ${className}`}>
      {children}
    </div>
  );
}
