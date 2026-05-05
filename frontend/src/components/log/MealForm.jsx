import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAddMeal } from '../../hooks/useMeals';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export default function MealForm({ dailyLogId, onClose }) {
  const [form, setForm] = useState({ meal_type: 'breakfast', name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [estimating, setEstimating] = useState(false);
  const addMeal = useAddMeal();

  const handleEstimate = async () => {
    if (!form.name.trim()) return;
    setEstimating(true);
    try {
      const { data } = await api.post('/ai/estimate', {
        item_type: 'meal',
        name: form.name,
        meal_type: form.meal_type,
      });
      if (data.calories != null) setForm((f) => ({ ...f, calories: String(data.calories) }));
      if (data.protein_g != null) setForm((f) => ({ ...f, protein_g: String(data.protein_g) }));
      if (data.carbs_g != null) setForm((f) => ({ ...f, carbs_g: String(data.carbs_g) }));
      if (data.fat_g != null) setForm((f) => ({ ...f, fat_g: String(data.fat_g) }));
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to estimate macros. Check your AI API key.';
      toast.error(msg);
    }
    setEstimating(false);
  };

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
      <button
        type="button"
        onClick={handleEstimate}
        disabled={estimating || !form.name.trim()}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-sage-600 bg-sage-50 hover:bg-sage-100 border border-sage-200 rounded-xl px-4 py-2.5 transition-all disabled:opacity-50 cursor-pointer"
      >
        <Sparkles size={16} className={estimating ? 'animate-spin' : ''} />
        {estimating ? 'Estimating...' : 'AI Estimate — auto-fill macros'}
      </button>
      <Button type="submit" className="w-full" disabled={addMeal.isPending || !dailyLogId} pulse={!addMeal.isPending && !!dailyLogId}>
        {addMeal.isPending ? 'Adding...' : 'Add Meal'}
      </Button>
    </form>
  );
}
