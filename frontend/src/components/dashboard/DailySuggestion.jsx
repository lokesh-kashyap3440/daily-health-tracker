import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useSuggestions } from '../../hooks/useSuggestions';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DailySuggestion() {
  const { data, isLoading, isError, refetch } = useSuggestions();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/suggestions/refresh');
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('New suggestion generated');
    } catch {
      toast.error('Failed to refresh');
    }
    setRefreshing(false);
  };

  return (
    <Card variant="gradient" className="relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-sage-200/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-terracotta-200/15 blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm flex-shrink-0 mt-0.5 dark:from-dark-700 dark:to-dark-800">
            <Sparkles size={20} className="text-sage-600 dark:text-sage-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-espresso-800 mb-1 dark:text-cream-100">
              Daily Wellness Insight
            </h2>
            {isLoading ? (
              <Spinner size="sm" />
            ) : isError ? (
              <div className="text-sm text-espresso-500 dark:text-dark-400">
                <p>Could not load your wellness insight.</p>
                <button onClick={() => refetch()} className="text-sage-600 underline mt-1 hover:text-sage-700 cursor-pointer dark:text-sage-400 dark:hover:text-sage-300">
                  Try again
                </button>
              </div>
            ) : (
              <p className="text-sm text-espresso-600 leading-relaxed dark:text-espresso-300">
                {data?.content || 'Complete your profile to get personalized health suggestions tailored just for you.'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl hover:bg-sage-100/50 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0 dark:hover:bg-dark-700/50"
          title="Get new suggestion"
        >
          <RefreshCw size={18} className={`text-sage-500 ${refreshing ? 'animate-spin' : ''} dark:text-sage-400`} />
        </button>
      </div>
    </Card>
  );
}
