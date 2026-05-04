import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { useCalorieHistory } from '../../hooks/useMetrics';
import { Flame, Clock, Dumbbell } from 'lucide-react';

export default function CalorieChart() {
  const { data, isLoading, isError } = useCalorieHistory('1m');

  if (isLoading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm"><Flame size={18} className="text-amber-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800">Calorie Balance</h2></div><Spinner /></Card>;

  if (isError || !data) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
            <Flame size={18} className="text-amber-600" />
          </div>
          <h2 className="font-display text-base font-semibold text-espresso-800">Calorie Balance</h2>
        </div>
        <EmptyState title="No data yet" description="Log meals and workouts to see your calorie balance." />
      </Card>
    );
  }

  const stats = [
    { label: 'Avg Daily Calories', value: data.avg_daily_calories ?? '--', unit: 'kcal', icon: Flame, color: 'text-amber-600', bg: 'from-amber-100 to-orange-100' },
    { label: 'Total Workouts', value: data.total_workouts ?? '--', unit: 'sessions', icon: Dumbbell, color: 'text-purple-600', bg: 'from-purple-100 to-violet-100' },
    { label: 'Avg Sleep', value: data.avg_sleep_hours ?? '--', unit: 'hrs', icon: Clock, color: 'text-indigo-600', bg: 'from-indigo-100 to-blue-100' },
  ];

  return (
    <Card hover>
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
          <Flame size={18} className="text-amber-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800">30-Day Summary</h2>
      </div>
      <div className="space-y-4">
        {stats.map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-colors">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${bg} shadow-sm`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider">{label}</p>
              <p className="font-display text-lg font-bold text-espresso-800">
                {value} <span className="text-sm font-normal text-espresso-400">{unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
