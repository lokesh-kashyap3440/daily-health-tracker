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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream-50/95 backdrop-blur-xl border-t border-cream-200 safe-area-bottom">
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-sage-400/30 to-transparent" />

      <div className="flex justify-around py-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-sage-700'
                  : 'text-espresso-400 hover:text-espresso-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-sage-500 rounded-full" />
                )}
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-sage-100 shadow-sm scale-110'
                    : 'hover:bg-cream-200'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
