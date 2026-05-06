import { Trash2, Flame } from 'lucide-react';
import Badge from '../ui/Badge';

const intensityColors = { low: 'slate', moderate: 'amber', high: 'red' };
const intensityLabels = { low: 'Low', moderate: 'Med', high: 'High' };

export default function WorkoutList({ workouts, onDelete }) {
  if (!workouts?.length) return <p className="text-sm text-espresso-400 italic py-2 dark:text-dark-400">No workouts logged</p>;

  return (
    <div className="space-y-2">
      {workouts.map((w, i) => (
        <div key={w.id} className="group flex items-center justify-between bg-white rounded-xl p-3 border border-cream-200 hover:border-sage-200 hover:shadow-sm transition-all duration-200 animate-card-reveal dark:bg-dark-800 dark:border-dark-700 dark:hover:border-sage-700" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${
              w.intensity === 'high' ? 'bg-terracotta-100' :
              w.intensity === 'moderate' ? 'bg-amber-100' :
              'bg-cream-200'
            }`}>
              <Flame size={16} className={
                w.intensity === 'high' ? 'text-terracotta-500' :
                w.intensity === 'moderate' ? 'text-amber-500' :
                'text-espresso-400'
              } />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-espresso-800 truncate dark:text-cream-100">{w.exercise_type}</p>
                <Badge color={intensityColors[w.intensity] || 'slate'} size="sm">{intensityLabels[w.intensity] || w.intensity}</Badge>
              </div>
              <p className="text-xs text-espresso-400 mt-0.5 dark:text-dark-400">
                <span className="font-medium text-espresso-500 dark:text-dark-300">{w.duration_min}</span> min
                {w.calories_burned > 0 && (
                  <>
                    <span className="mx-1.5 text-cream-300">|</span>
                    <span className="font-medium text-amber-600">{w.calories_burned}</span> cal burned
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(w.id)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-terracotta-50 transition-all cursor-pointer text-espresso-400 hover:text-terracotta-500 flex-shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
