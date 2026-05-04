import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAddWorkout } from '../../hooks/useWorkouts';

export default function WorkoutForm({ dailyLogId, onClose }) {
  const [form, setForm] = useState({ exercise_type: '', duration_min: '', intensity: 'moderate', calories_burned: '' });
  const addWorkout = useAddWorkout();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dailyLogId) return;
    addWorkout.mutate({
      daily_log_id: dailyLogId,
      exercise_type: form.exercise_type,
      duration_min: Number(form.duration_min),
      intensity: form.intensity,
      calories_burned: form.calories_burned ? Number(form.calories_burned) : undefined,
    });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Workout type (e.g. Running)" value={form.exercise_type} onChange={(e) => setForm({ ...form, exercise_type: e.target.value })} required />
      <Input type="number" placeholder="Duration (minutes)" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} required />
      <div>
        <label className="block text-sm font-medium text-espresso-600 mb-1.5">Intensity</label>
        <select
          value={form.intensity}
          onChange={(e) => setForm({ ...form, intensity: e.target.value })}
          className="w-full border border-cream-300 rounded-xl px-4 py-2.5 text-sm bg-cream-50 text-espresso-800 outline-none transition-all duration-200 focus:bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/30"
        >
          <option value="low">Low Intensity</option>
          <option value="moderate">Moderate Intensity</option>
          <option value="high">High Intensity</option>
        </select>
      </div>
      <Input type="number" placeholder="Calories burned" value={form.calories_burned} onChange={(e) => setForm({ ...form, calories_burned: e.target.value })} />
      <Button type="submit" className="w-full" disabled={addWorkout.isPending || !dailyLogId} pulse={!addWorkout.isPending && !!dailyLogId}>
        {addWorkout.isPending ? 'Adding...' : 'Add Workout'}
      </Button>
    </form>
  );
}
