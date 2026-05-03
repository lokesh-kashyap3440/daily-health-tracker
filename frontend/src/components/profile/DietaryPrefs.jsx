import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../api/client';
import toast from 'react-hot-toast';

const diets = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
];

const allergyOptions = ['Peanuts', 'Dairy', 'Shellfish', 'Gluten', 'Soy', 'Eggs', 'None'];

export default function DietaryPrefs() {
  const [prefs, setPrefs] = useState({ dietary_preference: 'non_vegetarian', allergies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile').then(({ data }) => {
      setPrefs({ dietary_preference: data.dietary_preference || 'non_vegetarian', allergies: data.allergies || [] });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleAllergy = (a) => {
    setPrefs((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a) ? prev.allergies.filter((x) => x !== a) : [...prev.allergies, a],
    }));
  };

  const save = async () => {
    try {
      await api.patch('/users/me/profile', prefs);
      toast.success('Preferences updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return null;

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Dietary Preferences</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Diet Type</label>
          <div className="flex flex-wrap gap-2">
            {diets.map((d) => (
              <button
                key={d.value}
                onClick={() => setPrefs({ ...prefs, dietary_preference: d.value })}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                  prefs.dietary_preference === d.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Allergies</label>
          <div className="flex flex-wrap gap-2">
            {allergyOptions.map((a) => (
              <button
                key={a}
                onClick={() => toggleAllergy(a)}
                className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                  prefs.allergies.includes(a) ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save}>Save Preferences</Button>
      </div>
    </Card>
  );
}
