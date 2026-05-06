import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';

export default function ProfileForm() {
  const [form, setForm] = useState({ age: '', height_cm: '', weight_kg: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile').then(({ data }) => {
      setForm({
        age: data.age ?? '',
        height_cm: data.height_cm ?? '',
        weight_kg: data.weight_kg ?? '',
      });
    }).catch(() => {
      toast.error('Failed to load profile');
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        age: form.age ? Number(form.age) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      };
      await api.put('/users/me', payload);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
  };

  if (loading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm"><User size={18} className="text-sage-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Personal Info</h2></div><Spinner /></Card>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sage-100/50 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-2 mb-5 relative">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm">
          <User size={18} className="text-sage-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800 dark:text-cream-100">Personal Info</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Age" type="number" min="1" max="150" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Input label="Height (cm)" type="number" step="0.1" min="1" max="300" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
          <Input label="Weight (kg)" type="number" step="0.1" min="1" max="500" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
        </div>
        <Button type="submit" variant="gradient">Save Changes</Button>
      </form>
    </Card>
  );
}
