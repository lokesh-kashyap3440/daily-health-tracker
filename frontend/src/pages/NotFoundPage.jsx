import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Leaf } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 via-cream-50 to-sage-50 px-4 relative overflow-hidden dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] rounded-full bg-sage-200/15 blur-3xl pointer-events-none animate-blob dark:bg-sage-800/15" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-terracotta-200/10 blur-3xl pointer-events-none animate-blob dark:bg-terracotta-900/10" style={{ animationDelay: '3s' }} />

      <div className="text-center relative z-10 animate-slide-up">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center shadow-lg mx-auto mb-6 dark:from-dark-800 dark:to-dark-900">
          <Leaf size={40} className="text-sage-500 dark:text-sage-400" />
        </div>
        <h1 className="font-display text-7xl font-bold text-espresso-800 mb-2 tracking-tight dark:text-cream-100">404</h1>
        <p className="text-espresso-400 text-lg mb-2 dark:text-dark-400">Page not found</p>
        <p className="text-espresso-400 text-sm mb-8 max-w-sm mx-auto dark:text-dark-400">
          Looks like you've wandered off the wellness path. Let's get you back on track.
        </p>
        <Link to="/dashboard">
          <Button size="lg" variant="gradient">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
