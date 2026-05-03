import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAddWorkout } from '../../hooks/useWorkouts';

export default function WorkoutForm({ date, onClose }) {
  const [form, setForm] = useState({ workout_type: '', duration_minutes: '', intensity: 'medium', calories_burned: '' });
  const addWorkout = useAddWorkout();

  const handleSubmit = (e) => {
    e.preventDefault();
    addWorkout.mutate({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      calories_burned: Number(form.calories_burned) || 0,
      log_date: date,
    });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Workout type (e.g. Running)" value={form.workout_type} onChange={(e) => setForm({ ...form, workout_type: e.target.value })} required />
      <Input type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />
      <select
        value={form.intensity}
        onChange={(e) => setForm({ ...form, intensity: e.target.value })}
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="low">Low Intensity</option>
        <option value="medium">Medium Intensity</option>
        <option value="high">High Intensity</option>
      </select>
      <Input type="number" placeholder="Calories burned" value={form.calories_burned} onChange={(e) => setForm({ ...form, calories_burned: e.target.value })} />
      <Button type="submit" className="w-full" disabled={addWorkout.isPending}>Add Workout</Button>
    </form>
  );
}
