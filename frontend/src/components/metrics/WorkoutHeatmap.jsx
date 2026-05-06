import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { useMetrics } from '../../hooks/useMetrics';
import { Dumbbell, Smile } from 'lucide-react';

export default function WorkoutHeatmap() {
  const { data, isLoading, isError } = useMetrics('1m');

  if (isLoading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm"><Dumbbell size={18} className="text-purple-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Workout Frequency</h2></div><Spinner /></Card>;

  if (isError || !data) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
            <Dumbbell size={18} className="text-purple-600" />
          </div>
          <h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Workout Frequency</h2>
        </div>
        <EmptyState title="No data yet" description="Log workouts to see your frequency." />
      </Card>
    );
  }

  return (
    <Card hover>
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
          <Dumbbell size={18} className="text-purple-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Workout Frequency</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50 dark:bg-dark-800">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
            <Dumbbell size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider dark:text-dark-400">Total Workouts (30d)</p>
            <p className="font-display text-3xl font-bold text-espresso-800 dark:text-cream-100">{data.total_workouts ?? '--'}</p>
          </div>
        </div>
        {data.avg_mood && (
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50 pt-4 dark:bg-dark-800">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm">
              <Smile size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider dark:text-dark-400">Avg Mood Rating</p>
              <p className="font-display text-xl font-bold text-espresso-800 dark:text-cream-100">
                {data.avg_mood} <span className="text-sm font-normal text-espresso-400 dark:text-dark-400">/ 5</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
