import Card from '../ui/Card';
import { useMetrics } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutHeatmap() {
  const { data, isLoading } = useMetrics('1m');

  const counts = dayNames.map((_, i) => data?.workouts_by_day?.[i] || 0);
  const maxCount = Math.max(...counts, 1);

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Workout Frequency</h2>
      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {dayNames.map((day, i) => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-10">{day}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6">
                <div
                  className="bg-green-500 h-6 rounded-full transition-all"
                  style={{ width: `${(counts[i] / maxCount) * 100}%`, minWidth: counts[i] > 0 ? '20px' : '0' }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600 w-6">{counts[i]}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
