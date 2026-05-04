export default function Input({ label, error, className = '', icon, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-espresso-600">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-espresso-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full rounded-xl border bg-cream-50 px-4 py-2.5 text-sm text-espresso-800 placeholder:text-espresso-300 transition-all duration-200
            focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400 focus:shadow-lg focus:shadow-sage-200/30
            ${error ? 'border-terracotta-400 ring-2 ring-terracotta-400/20' : 'border-cream-300'}
            ${icon ? 'pl-10' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-terracotta-600 font-medium flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-terracotta-500" />
          {error}
        </p>
      )}
    </div>
  );
}
