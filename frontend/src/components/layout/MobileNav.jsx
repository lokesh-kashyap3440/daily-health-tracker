import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, MessageCircle, BarChart3, User } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/daily-log', icon: UtensilsCrossed, label: 'Log' },
  { to: '/chatbot', icon: MessageCircle, label: 'Chat' },
  { to: '/metrics', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="flex justify-around py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                isActive ? 'text-green-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
