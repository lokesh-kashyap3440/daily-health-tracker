import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Leaf, Sparkles, Sun, Moon } from 'lucide-react';
import useThemeStore from '../store/themeStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const login = useLogin();
  const { theme, toggleTheme } = useThemeStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-100 via-cream-50 to-sage-50 px-4 relative overflow-hidden dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      {/* Animated background blobs */}
      <div className="absolute top-[-15%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-sage-200/20 blur-3xl pointer-events-none animate-blob dark:bg-sage-800/20" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-terracotta-200/15 blur-3xl pointer-events-none animate-blob dark:bg-terracotta-900/20" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cream-300/30 blur-3xl pointer-events-none animate-float-slow dark:bg-dark-800/30" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-cream-200 shadow-sm transition-colors cursor-pointer text-espresso-400 hover:text-espresso-600 dark:bg-dark-800/80 dark:border-dark-700 dark:text-dark-400 dark:hover:text-cream-200"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Decorative floating leaves */}
      <div className="absolute top-20 left-10 text-sage-200/30 animate-float-slow pointer-events-none dark:text-sage-800/30">
        <Leaf size={48} />
      </div>
      <div className="absolute bottom-20 right-10 text-sage-200/20 animate-float pointer-events-none dark:text-sage-800/20" style={{ animationDelay: '2s' }}>
        <Leaf size={36} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center shadow-xl shadow-sage-200/50 mx-auto mb-5 relative">
            <Leaf size={34} className="text-white" />
            <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse-glow" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-espresso-800 tracking-tight dark:text-cream-100">
            Health<span className="text-sage-600 dark:text-sage-400">Tracker</span>
          </h1>
          <p className="text-espresso-400 text-sm mt-2 dark:text-dark-400">Welcome back to your wellness journey</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-espresso-900/5 border border-cream-200 p-8 sm:p-10 relative dark:bg-dark-800/80 dark:border-dark-700 dark:shadow-dark-950/40">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-sage-400 via-sage-500 to-terracotta-400 rounded-full" />

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={login.isPending}
              pulse={!login.isPending}
            >
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-200 dark:border-dark-700">
            <p className="text-center text-sm text-espresso-400 dark:text-dark-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-sage-600 font-semibold hover:text-sage-700 transition-colors dark:text-sage-400 dark:hover:text-sage-300"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-espresso-400 mt-8 dark:text-dark-500">
          Your health data is encrypted and private
        </p>
      </div>
    </div>
  );
}
