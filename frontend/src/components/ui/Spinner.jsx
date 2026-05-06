export default function Spinner({ className = '', size = 'md', label = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col justify-center items-center py-8 gap-3 ${className}`}>
      <div className={`${sizes[size]} border-sage-200 border-t-sage-600 rounded-full animate-spin dark:border-dark-700 dark:border-t-sage-400`} />
      {label && (
        <p className="text-xs text-espresso-400 font-medium animate-pulse dark:text-dark-400">{label}</p>
      )}
    </div>
  );
}
