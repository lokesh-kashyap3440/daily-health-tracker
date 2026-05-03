import Card from '../ui/Card';
import { Flame, Droplets, Dumbbell, Moon } from 'lucide-react';

export default function SummaryCards({ summary }) {
  const items = [
    { label: 'Calories', value: summary?.total_calories ?? '--', goal: summary?.calorie_target, unit: 'kcal', icon: Flame, color: 'text-orange-500' },
    { label: 'Water', value: summary?.water_glasses ?? '--', goal: 8, unit: 'glasses', icon: Droplets, color: 'text-blue-500' },
    { label: 'Workout', value: summary?.workout_minutes ?? '--', unit: 'min', icon: Dumbbell, color: 'text-purple-500' },
    { label: 'Sleep', value: summary?.sleep_hours ?? '--', unit: 'hrs', icon: Moon, color: 'text-indigo-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ label, value, goal, unit, icon: Icon, color }) => (
        <Card key={label} className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-slate-800">
              {value}{goal ? <span className="text-sm font-normal text-slate-400">/{goal} {unit}</span> : ` ${unit}`}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
