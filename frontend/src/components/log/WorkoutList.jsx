import { Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

const intensityColors = { low: 'slate', medium: 'amber', high: 'red' };

export default function WorkoutList({ workouts, onDelete }) {
  if (!workouts?.length) return <p className="text-sm text-slate-400 italic">No workouts logged</p>;

  return (
    <div className="space-y-2">
      {workouts.map((w) => (
        <div key={w.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{w.workout_type}</p>
              <Badge color={intensityColors[w.intensity]}>{w.intensity}</Badge>
            </div>
            <p className="text-xs text-slate-500">{w.duration_minutes} min | {w.calories_burned} cal burned</p>
          </div>
          <button onClick={() => onDelete(w.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer text-slate-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
