import Card from '../ui/Card';
import { Flame, Droplets, Dumbbell, Moon } from 'lucide-react';

function computeTotals(summary) {
  if (!summary) return { totalCalories: '--', waterGlasses: '--', workoutMinutes: '--', sleepHours: '--' };
  const meals = summary.meals || [];
  const workouts = summary.workouts || [];
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const workoutMinutes = workouts.reduce((sum, w) => sum + (w.duration_min || 0), 0);
  return {
    totalCalories: totalCalories || '--',
    waterGlasses: summary.water_glasses ?? '--',
    workoutMinutes: workoutMinutes || '--',
    sleepHours: summary.sleep_hours ?? '--',
  };
}

export default function SummaryCards({ summary }) {
  const { totalCalories, waterGlasses, workoutMinutes, sleepHours } = computeTotals(summary);
  const items = [
    {
      label: 'Calories',
      value: totalCalories,
      goal: 2000,
      unit: 'kcal',
      icon: Flame,
      gradient: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      accent: 'amber',
    },
    {
      label: 'Water',
      value: waterGlasses,
      goal: 8,
      unit: 'glasses',
      icon: Droplets,
      gradient: 'from-sky-100 to-blue-100',
      iconColor: 'text-sky-600',
      accent: 'blue',
    },
    {
      label: 'Workout',
      value: workoutMinutes,
      unit: 'min',
      icon: Dumbbell,
      gradient: 'from-purple-100 to-violet-100',
      iconColor: 'text-purple-600',
      accent: 'purple',
    },
    {
      label: 'Sleep',
      value: sleepHours,
      goal: 8,
      unit: 'hrs',
      icon: Moon,
      gradient: 'from-indigo-100 to-blue-100',
      iconColor: 'text-indigo-600',
      accent: 'indigo',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map(({ label, value, goal, unit, icon: Icon, gradient, iconColor, accent }, i) => (
        <Card
          key={label}
          hover
          className={`animate-card-reveal stagger-${i + 1} relative overflow-hidden group`}
        >
          {/* Subtle gradient decoration */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${gradient} opacity-40 rounded-bl-full transition-transform duration-300 group-hover:scale-150`} />

          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-sm`}>
              <Icon size={22} className={iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-espresso-400 font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-espresso-800 font-display truncate">
                {value}
                <span className="text-xs sm:text-sm font-normal text-espresso-400 ml-1">
                  {goal ? `/${goal}` : ''} <span className="text-[10px]">{unit}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          {goal && typeof value === 'number' && (
            <div className="mt-3 h-1 bg-cream-200 rounded-full overflow-hidden relative z-10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  accent === 'amber' ? 'bg-amber-400' :
                  accent === 'blue' ? 'bg-sky-400' :
                  accent === 'purple' ? 'bg-purple-400' :
                  'bg-indigo-400'
                }`}
                style={{ width: `${Math.min((value / goal) * 100, 100)}%` }}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
