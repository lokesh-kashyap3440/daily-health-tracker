import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function ProfileForm() {
  const [form, setForm] = useState({ first_name: '', last_name: '', age: '', height_cm: '', weight_kg: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile').then(({ data }) => {
      setForm((prev) => ({ ...prev, ...data }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me/profile', form);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
  };

  if (loading) return null;

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Personal Info</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <Input label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Input label="Height (cm)" type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
          <Input label="Weight (kg)" type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </Card>
  );
}
