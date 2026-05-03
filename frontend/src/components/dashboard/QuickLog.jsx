import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { Plus } from 'lucide-react';

const actions = [
  { label: 'Add Meal', path: '/daily-log?action=add-meal' },
  { label: 'Add Workout', path: '/daily-log?action=add-workout' },
  { label: 'Log Water', path: '/daily-log?action=water' },
  { label: 'Log Sleep', path: '/daily-log?action=sleep' },
  { label: 'Rate Mood', path: '/daily-log?action=mood' },
];

export default function QuickLog() {
  const navigate = useNavigate();
  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-3">Quick Log</h2>
      <div className="space-y-2">
        {actions.map(({ label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-600 transition cursor-pointer"
          >
            <Plus size={18} className="text-green-500" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
