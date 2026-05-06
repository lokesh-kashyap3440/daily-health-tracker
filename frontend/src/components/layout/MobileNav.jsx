import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, MessageCircle, BarChart3, User, Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/daily-log', icon: UtensilsCrossed, label: 'Log' },
  { to: '/chatbot', icon: MessageCircle, label: 'Chat' },
  { to: '/metrics', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream-50/95 backdrop-blur-xl border-t border-cream-200 safe-area-bottom dark:bg-dark-950/95 dark:border-dark-700">
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-sage-400/30 to-transparent dark:via-sage-600/30" />

      <div className="flex justify-around py-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-sage-700 dark:text-sage-400'
                  : 'text-espresso-400 hover:text-espresso-600 dark:text-dark-400 dark:hover:text-cream-200'
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
                    ? 'bg-sage-100 shadow-sm scale-110 dark:bg-dark-800'
                    : 'hover:bg-cream-200 dark:hover:bg-dark-800'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Theme toggle button */}
      <div className="absolute -top-12 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-cream-50/90 backdrop-blur-sm border border-cream-200 shadow-sm transition-colors cursor-pointer text-espresso-400 hover:text-espresso-600 dark:bg-dark-800/90 dark:border-dark-700 dark:text-dark-400 dark:hover:text-cream-200"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
}
