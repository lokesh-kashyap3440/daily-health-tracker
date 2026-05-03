import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAddMeal } from '../../hooks/useMeals';

export default function MealForm({ date, onClose }) {
  const [form, setForm] = useState({ meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const addMeal = useAddMeal();

  const handleSubmit = (e) => {
    e.preventDefault();
    addMeal.mutate({
      ...form,
      calories: Number(form.calories) || 0,
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fat_g: Number(form.fat_g) || 0,
      log_date: date,
    });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        value={form.meal_type}
        onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
        <option value="snack">Snack</option>
      </select>
      <Input placeholder="Food name" value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} required />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
        <Input type="number" placeholder="Protein (g)" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
        <Input type="number" placeholder="Carbs (g)" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
        <Input type="number" placeholder="Fat (g)" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
      </div>
      <Button type="submit" className="w-full" disabled={addMeal.isPending}>Add Meal</Button>
    </form>
  );
}
