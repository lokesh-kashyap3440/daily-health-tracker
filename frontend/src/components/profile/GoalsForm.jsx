import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import api from '../../api/client';
import toast from 'react-hot-toast';

const goals = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'endurance', label: 'Endurance' },
];

const levels = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'very_active', label: 'Very Active' },
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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      await api.patch('/users/me/profile', form);
      toast.success('Goals updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return null;

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Fitness Goals</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Goal</label>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button key={g.value} onClick={() => setForm({ ...form, fitness_goal: g.value })}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                  form.fitness_goal === g.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{g.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Activity Level</label>
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <button key={l.value} onClick={() => setForm({ ...form, activity_level: l.value })}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                  form.activity_level === l.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >{l.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Target Weight (kg)" type="number" step="0.1" value={form.target_weight_kg} onChange={(e) => setForm({ ...form, target_weight_kg: e.target.value })} />
          <Input label="Target Date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          <Input label="Workout Days/Week" type="number" min="1" max="7" value={form.workout_days_per_week} onChange={(e) => setForm({ ...form, workout_days_per_week: e.target.value })} />
          <Input label="Daily Calorie Target" type="number" value={form.daily_calorie_target} onChange={(e) => setForm({ ...form, daily_calorie_target: e.target.value })} />
        </div>
        <Button onClick={save}>Save Goals</Button>
      </div>
    </Card>
  );
}
