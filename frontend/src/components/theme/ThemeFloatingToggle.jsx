import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export default function ThemeFloatingToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))', left: 'max(1.5rem, env(safe-area-inset-left, 0px))' }}
            className="fixed z-[99999] p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-cream-200 shadow-lg shadow-black/5 transition-all duration-200 cursor-pointer text-espresso-400 hover:text-espresso-600 hover:shadow-xl hover:scale-105 dark:bg-dark-800/90 dark:border-dark-700 dark:text-dark-400 dark:hover:text-cream-200"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}