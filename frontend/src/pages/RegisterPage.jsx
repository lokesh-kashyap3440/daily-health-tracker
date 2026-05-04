import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Leaf, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const register = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    register.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-100 via-cream-50 to-sage-50 px-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-sage-200/20 blur-3xl pointer-events-none animate-blob" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-terracotta-200/15 blur-3xl pointer-events-none animate-blob" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-cream-300/30 blur-3xl pointer-events-none animate-float-slow" />

      {/* Decorative floating leaves */}
      <div className="absolute top-20 right-10 text-sage-200/30 animate-float-slow pointer-events-none">
        <Leaf size={48} />
      </div>
      <div className="absolute bottom-20 left-10 text-sage-200/20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        <Leaf size={36} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center shadow-xl shadow-sage-200/50 mx-auto mb-5 relative">
            <Leaf size={34} className="text-white" />
            <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse-glow" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-espresso-800 tracking-tight">
            Join Health<span className="text-sage-600">Tracker</span>
          </h1>
          <p className="text-espresso-400 text-sm mt-2">Start your wellness journey today</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-espresso-900/5 border border-cream-200 p-8 sm:p-10 relative">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-sage-400 via-sage-500 to-terracotta-400 rounded-full" />

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              <Input label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={register.isPending}
              pulse={!register.isPending}
            >
              {register.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-200">
            <p className="text-center text-sm text-espresso-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-sage-600 font-semibold hover:text-sage-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-espresso-400 mt-8">
          Free forever. No hidden fees.
        </p>
      </div>
    </div>
  );
}
