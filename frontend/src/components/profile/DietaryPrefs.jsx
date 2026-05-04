import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { UtensilsCrossed } from 'lucide-react';

const diets = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
];

const allergyOptions = ['Peanuts', 'Dairy', 'Shellfish', 'Gluten', 'Soy', 'Eggs', 'None'];

export default function DietaryPrefs() {
  const [prefs, setPrefs] = useState({ dietary_preference: 'non_vegetarian', allergies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile').then(({ data }) => {
      setPrefs({ dietary_preference: data.dietary_preference || 'non_vegetarian', allergies: data.allergies || [] });
    }).catch(() => {
      toast.error('Failed to load preferences');
    }).finally(() => setLoading(false));
  }, []);

  const toggleAllergy = (a) => {
    setPrefs((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a) ? prev.allergies.filter((x) => x !== a) : [...prev.allergies, a],
    }));
  };

  const save = async () => {
    try {
      await api.put('/users/me/preferences', prefs);
      toast.success('Preferences updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <Card><div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm"><UtensilsCrossed size={18} className="text-amber-600" /></div><h2 className="font-display text-base font-semibold text-espresso-800">Dietary Preferences</h2></div><Spinner /></Card>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-2 mb-5 relative">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
          <UtensilsCrossed size={18} className="text-amber-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-espresso-800">Dietary Preferences</h2>
      </div>
      <div className="space-y-5 relative">
        <div>
          <label className="text-sm font-medium text-espresso-600 mb-2.5 block">Diet Type</label>
          <div className="flex flex-wrap gap-2">
            {diets.map((d) => (
              <button
                key={d.value}
                onClick={() => setPrefs({ ...prefs, dietary_preference: d.value })}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                  prefs.dietary_preference === d.value
                    ? 'bg-sage-600 text-white shadow-md shadow-sage-200/50'
                    : 'bg-cream-100 text-espresso-600 hover:bg-cream-200 border border-cream-200'
                }`}
              >
                <span>{d.emoji}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-espresso-600 mb-2.5 block">Allergies</label>
          <div className="flex flex-wrap gap-2">
            {allergyOptions.map((a) => (
              <button
                key={a}
                onClick={() => toggleAllergy(a)}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                  prefs.allergies.includes(a)
                    ? 'bg-terracotta-100 text-terracotta-700 ring-2 ring-terracotta-400 shadow-sm'
                    : 'bg-cream-100 text-espresso-600 hover:bg-cream-200 border border-cream-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} variant="gradient">Save Preferences</Button>
      </div>
    </Card>
  );
}
