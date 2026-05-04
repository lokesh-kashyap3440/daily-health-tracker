import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { useMetrics } from '../../hooks/useMetrics';
import { Moon, Droplets } from 'lucide-react';

export default function SleepChart() {
  const { data, isLoading, isError } = useMetrics('1m');

  if (isLoading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 shadow-sm"><Moon size={18} className="text-indigo-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800">Sleep & Recovery</h2></div><Spinner /></Card>;

  if (isError || !data) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 shadow-sm">
            <Moon size={18} className="text-indigo-600" />
          </div>
          <h2 className="font-display text-base font-semibold text-espresso-800">Sleep & Recovery</h2>
        </div>
        <EmptyState title="No data yet" description="Log your sleep to see patterns here." />
      </Card>
    );
  }

  return (
    <Card hover>
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 shadow-sm">
          <Moon size={18} className="text-indigo-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800">Sleep & Recovery</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 shadow-sm">
            <Moon size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider">Avg Sleep</p>
            <p className="font-display text-3xl font-bold text-espresso-800">
              {data.avg_sleep_hours ?? '--'} <span className="text-base font-normal text-espresso-400">hrs</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50 pt-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 shadow-sm">
            <Droplets size={24} className="text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider">Avg Water</p>
            <p className="font-display text-2xl font-bold text-espresso-800">
              {data.avg_water_glasses ?? '--'} <span className="text-sm font-normal text-espresso-400">glasses</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
