import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-espresso-900/20 p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in dark:bg-dark-800 dark:border dark:border-dark-700 dark:shadow-dark-950/40">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-sage-400 via-sage-500 to-terracotta-400 rounded-full" />

        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="font-display text-xl font-semibold text-espresso-800 dark:text-cream-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream-200 rounded-xl transition-colors cursor-pointer text-espresso-400 hover:text-espresso-600 dark:hover:bg-dark-700 dark:text-dark-400 dark:hover:text-cream-200"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
