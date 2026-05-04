import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { Plus, Utensils, Dumbbell, Droplets, Moon, Smile } from 'lucide-react';

const actions = [
  { label: 'Add Meal', path: '/daily-log?action=add-meal', icon: Utensils, color: 'from-amber-100 to-orange-100', iconColor: 'text-amber-600' },
  { label: 'Add Workout', path: '/daily-log?action=add-workout', icon: Dumbbell, color: 'from-purple-100 to-violet-100', iconColor: 'text-purple-600' },
  { label: 'Log Water', path: '/daily-log?action=water', icon: Droplets, color: 'from-sky-100 to-blue-100', iconColor: 'text-sky-600' },
  { label: 'Log Sleep', path: '/daily-log?action=sleep', icon: Moon, color: 'from-indigo-100 to-blue-100', iconColor: 'text-indigo-600' },
  { label: 'Rate Mood', path: '/daily-log?action=mood', icon: Smile, color: 'from-green-100 to-emerald-100', iconColor: 'text-green-600' },
];

export default function QuickLog() {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-espresso-800">Quick Actions</h2>
        <span className="text-[10px] text-espresso-400 font-medium uppercase tracking-wider">One tap log</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {actions.map(({ label, path, icon: Icon, color, iconColor }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="group flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-cream-50 hover:bg-white border border-cream-200 hover:border-sage-300 transition-all duration-200 hover:shadow-md active:scale-95 cursor-pointer"
          >
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-sm transition-transform duration-200 group-hover:scale-110`}>
              <Icon size={18} className={iconColor} />
            </div>
            <span className="text-xs font-medium text-espresso-600">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
