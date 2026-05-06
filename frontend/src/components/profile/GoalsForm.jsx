import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Target } from 'lucide-react';

const goals = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '🏋️' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { value: 'maintenance', label: 'Maintenance', icon: '⚖️' },
  { value: 'endurance', label: 'Endurance', icon: '🏃' },
];

const levels = [
  { value: 'sedentary', label: 'Sedentary', icon: '🪑' },
  { value: 'lightly_active', label: 'Lightly Active', icon: '🚶' },
  { value: 'moderately_active', label: 'Moderately Active', icon: '🏊' },
  { value: 'very_active', label: 'Very Active', icon: '🔥' },
];

export default function GoalsForm() {
  const [form, setForm] = useState({
    fitness_goal: 'maintenance', activity_level: 'moderately_active',
    target_weight_kg: '', target_date: '', workout_days_per_week: 3,
    daily_calorie_target: 2000, daily_protein_target_g: 50,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile').then(({ data }) => {
      setForm((prev) => ({ ...prev, ...data }));
    }).catch(() => {
      toast.error('Failed to load goals');
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      const payload = {
        fitness_goal: form.fitness_goal,
        activity_level: form.activity_level,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : undefined,
        target_date: form.target_date || undefined,
        workout_days_per_week: form.workout_days_per_week ? Number(form.workout_days_per_week) : undefined,
        daily_calorie_target: form.daily_calorie_target ? Number(form.daily_calorie_target) : undefined,
        daily_protein_target_g: form.daily_protein_target_g ? Number(form.daily_protein_target_g) : undefined,
      };
      await api.put('/users/me', payload);
      toast.success('Goals updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm"><Target size={18} className="text-purple-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Fitness Goals</h2></div><Spinner /></Card>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-2 mb-5 relative">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
          <Target size={18} className="text-purple-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Fitness Goals</h2>
      </div>
      <div className="space-y-5 relative">
        <div>
          <label className="text-sm font-medium text-espresso-600 mb-2.5 block dark:text-espresso-300">Goal</label>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button key={g.value} onClick={() => setForm({ ...form, fitness_goal: g.value })}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                  form.fitness_goal === g.value
                    ? 'bg-sage-600 text-white shadow-md shadow-sage-200/50 dark:bg-sage-500 dark:shadow-dark-950/30'
                    : 'bg-cream-100 text-espresso-600 hover:bg-cream-200 border border-cream-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700 dark:border-dark-700'
                }`}
              >
                <span>{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-espresso-600 mb-2.5 block dark:text-espresso-300">Activity Level</label>
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <button key={l.value} onClick={() => setForm({ ...form, activity_level: l.value })}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                  form.activity_level === l.value
                    ? 'bg-sage-600 text-white shadow-md shadow-sage-200/50 dark:bg-sage-500 dark:shadow-dark-950/30'
                    : 'bg-cream-100 text-espresso-600 hover:bg-cream-200 border border-cream-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700 dark:border-dark-700'
                }`}
              >
                <span>{l.icon}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Target Weight (kg)" type="number" step="0.1" value={form.target_weight_kg} onChange={(e) => setForm({ ...form, target_weight_kg: e.target.value })} />
          <Input label="Target Date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          <Input label="Workout Days/Week" type="number" min="1" max="7" value={form.workout_days_per_week} onChange={(e) => setForm({ ...form, workout_days_per_week: e.target.value })} />
          <Input label="Daily Calorie Target" type="number" value={form.daily_calorie_target} onChange={(e) => setForm({ ...form, daily_calorie_target: e.target.value })} />
        </div>
        <Button onClick={save} variant="gradient">Save Goals</Button>
      </div>
    </Card>
  );
}
