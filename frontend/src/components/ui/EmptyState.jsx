export default function EmptyState({ icon, title, description, action, variant = 'default' }) {
  const variants = {
    default: 'py-12',
    compact: 'py-6',
    large: 'py-20',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${variants[variant]} text-center px-6`}>
      {icon && (
        <div className="mb-5 relative">
          <div className="absolute inset-0 bg-sage-200/30 rounded-full blur-xl scale-150 dark:bg-dark-700/40" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-100 to-cream-200 flex items-center justify-center shadow-inner dark:from-dark-700 dark:to-dark-800">
            <span className="text-3xl">{icon}</span>
          </div>
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-espresso-700 mb-2 dark:text-cream-200">{title}</h3>
      {description && (
        <p className="text-sm text-espresso-400 mb-6 max-w-xs leading-relaxed dark:text-dark-400">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
