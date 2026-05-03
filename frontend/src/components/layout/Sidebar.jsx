import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, MessageCircle, BarChart3, User } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily-log', icon: UtensilsCrossed, label: 'Daily Log' },
  { to: '/chatbot', icon: MessageCircle, label: 'Chatbot' },
  { to: '/metrics', icon: BarChart3, label: 'Metrics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
          <span className="text-2xl">💪</span> HealthTracker
        </h1>
      </div>
      <nav className="flex-1 px-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-sm font-medium transition ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
