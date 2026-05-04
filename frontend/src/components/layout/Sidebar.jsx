import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, MessageCircle, BarChart3, User, Leaf } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily-log', icon: UtensilsCrossed, label: 'Daily Log' },
  { to: '/chatbot', icon: MessageCircle, label: 'Chatbot' },
  { to: '/metrics', icon: BarChart3, label: 'Metrics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-cream-300 bg-gradient-to-b from-cream-50 to-cream-100">
      {/* Brand - decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sage-400 via-sage-500 to-terracotta-400" />

      <div className="px-6 pt-7 pb-6 border-b border-cream-200 relative">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center shadow-md shadow-sage-200/50">
            <Leaf size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-espresso-800 leading-tight tracking-tight">
              Health<span className="text-sage-600">Tracker</span>
            </h1>
            <p className="text-[10px] text-espresso-400 font-medium uppercase tracking-widest">Your wellness companion</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-white text-sage-700 shadow-sm border border-cream-200 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-sage-500 before:rounded-full before:-ml-1'
                  : 'text-espresso-500 hover:bg-cream-200/60 hover:text-espresso-700'
              }`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-cream-200">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse" />
          <p className="text-[11px] text-espresso-400 font-medium">Wellness mode</p>
        </div>
      </div>
    </aside>
  );
}
