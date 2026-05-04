import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAddMeal } from '../../hooks/useMeals';

export default function MealForm({ dailyLogId, onClose }) {
  const [form, setForm] = useState({ meal_type: 'breakfast', name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const addMeal = useAddMeal();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dailyLogId) return;
    addMeal.mutate({
      daily_log_id: dailyLogId,
      meal_type: form.meal_type,
      name: form.name,
      calories: form.calories ? Number(form.calories) : undefined,
      protein_g: form.protein_g ? Number(form.protein_g) : undefined,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
      fat_g: form.fat_g ? Number(form.fat_g) : undefined,
    });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-espresso-600 mb-1.5">Meal Type</label>
        <select
          value={form.meal_type}
          onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
          className="w-full border border-cream-300 rounded-xl px-4 py-2.5 text-sm bg-cream-50 text-espresso-800 outline-none transition-all duration-200 focus:bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/30"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>
      <Input placeholder="Food name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <div className="grid grid-cols-2 gap-3">
        <Input type="number" placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
        <Input type="number" placeholder="Protein (g)" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
        <Input type="number" placeholder="Carbs (g)" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
        <Input type="number" placeholder="Fat (g)" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
      </div>
      <Button type="submit" className="w-full" disabled={addMeal.isPending || !dailyLogId} pulse={!addMeal.isPending && !!dailyLogId}>
        {addMeal.isPending ? 'Adding...' : 'Add Meal'}
      </Button>
    </form>
  );
}
