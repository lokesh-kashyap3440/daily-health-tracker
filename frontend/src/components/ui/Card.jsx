export default function Card({ children, className = '', variant = 'default', hover = false, accent = '' }) {
  const base = 'rounded-2xl border p-6 transition-all duration-300';

  const styles = {
    default: 'bg-white border-cream-200 shadow-sm hover:shadow-md',
    warm: 'bg-gradient-to-br from-cream-50 to-cream-100 border-cream-300 shadow-sm',
    glass: 'bg-white/70 backdrop-blur-xl border-cream-200/60 shadow-sm',
    highlight: 'bg-white border-l-4 border-l-sage-500 border-cream-200 shadow-sm',
    gradient: 'bg-gradient-to-br from-sage-50 via-white to-terracotta-50 border-sage-200/60 shadow-sm',
    elevated: 'bg-white border-cream-200 shadow-lg shadow-sage-900/5',
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
