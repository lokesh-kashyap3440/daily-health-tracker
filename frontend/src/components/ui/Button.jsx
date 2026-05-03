import { twMerge } from 'tailwind-merge';

const variants = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-slate-100 text-slate-600',
};

const sizes = {
  sm: 'py-1.5 px-3 text-sm',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3 px-6 text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
