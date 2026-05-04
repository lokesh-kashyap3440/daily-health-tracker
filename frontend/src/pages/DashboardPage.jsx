import { useDailyLog } from '../hooks/useDailyLog';
import SummaryCards from '../components/dashboard/SummaryCards';
import DailySuggestion from '../components/dashboard/DailySuggestion';
import QuickLog from '../components/dashboard/QuickLog';
import WeightSparkline from '../components/dashboard/WeightSparkline';
import Spinner from '../components/ui/Spinner';
import { Sparkles, Leaf } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

export default function DashboardPage() {
  const { data: log, isLoading, isError, refetch } = useDailyLog(today);

  if (isLoading) return <Spinner size="lg" label="Loading your wellness data..." />;

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Could not load your dashboard data.</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-sage-600 text-white rounded-xl text-sm font-medium hover:bg-sage-700 transition cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Computed greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-700 via-sage-600 to-sage-800 p-6 sm:p-8 md:p-10">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-sage-500/20 blur-3xl pointer-events-none animate-blob" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-terracotta-400/15 blur-3xl pointer-events-none animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-300 animate-pulse" />
            <p className="text-xs font-semibold text-sage-200 uppercase tracking-widest">
              {formattedDate}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
                {greeting}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Leaf size={16} className="text-sage-300" />
                <p className="text-sage-200 text-sm sm:text-base">
                  Here's your wellness snapshot for today
                </p>
              </div>
            </div>

            {/* Wellness score badge */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Sparkles size={18} className="text-amber-300" />
              <div>
                <p className="text-[10px] text-sage-200 uppercase tracking-wider font-medium">Wellness</p>
                <p className="text-sm font-bold text-white">Track Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard Content ──────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <DailySuggestion />
      </div>

      <div className="animate-card-reveal stagger-1">
        <SummaryCards summary={log} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="animate-card-reveal stagger-2">
          <WeightSparkline />
        </div>
        <div className="animate-card-reveal stagger-3">
          <QuickLog />
        </div>
      </div>
    </div>
  );
}
