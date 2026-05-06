import Card from '../ui/Card';
import { Plus, Utensils, Dumbbell, Droplets, Moon, Smile } from 'lucide-react';

const actions = [
  { key: 'meal', label: 'Add Meal', icon: Utensils, color: 'from-amber-100 to-orange-100', iconColor: 'text-amber-600' },
  { key: 'workout', label: 'Add Workout', icon: Dumbbell, color: 'from-purple-100 to-violet-100', iconColor: 'text-purple-600' },
  { key: 'water', label: 'Log Water', icon: Droplets, color: 'from-sky-100 to-blue-100', iconColor: 'text-sky-600' },
  { key: 'sleep', label: 'Log Sleep', icon: Moon, color: 'from-indigo-100 to-blue-100', iconColor: 'text-indigo-600' },
  { key: 'mood', label: 'Rate Mood', icon: Smile, color: 'from-green-100 to-emerald-100', iconColor: 'text-green-600' },
];

export default function QuickLog({ onAction }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Quick Actions</h2>
        <span className="text-[10px] text-espresso-400 font-medium uppercase tracking-wider dark:text-dark-400">One tap log</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {actions.map(({ key, label, icon: Icon, color, iconColor }) => (
          <button
            key={key}
            onClick={() => onAction(key)}
            className="group flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-cream-50 hover:bg-white border border-cream-200 hover:border-sage-300 transition-all duration-200 hover:shadow-md active:scale-95 cursor-pointer dark:bg-dark-800 dark:hover:bg-dark-700 dark:border-dark-700 dark:hover:border-sage-600 dark:hover:shadow-dark-950/30"
          >
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-sm transition-transform duration-200 group-hover:scale-110 dark:opacity-90`}>
              <Icon size={18} className={iconColor} />
            </div>
            <span className="text-xs font-medium text-espresso-600 dark:text-dark-300">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
