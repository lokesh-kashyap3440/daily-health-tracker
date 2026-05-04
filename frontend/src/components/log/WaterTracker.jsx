import { Droplets } from 'lucide-react';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function WaterTracker({ glasses = 0, date }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  const toggle = async (idx) => {
    const newCount = idx + 1 === glasses ? glasses - 1 : idx + 1;
    try {
      if (isToday) {
        await api.put('/daily-logs/water', { glasses: newCount });
      } else {
        await api.post('/daily-logs', { log_date: date, water_glasses: newCount, sleep_hours: undefined, mood_rating: undefined });
      }
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
      toast.success(`Water updated to ${newCount} glasses`);
    } catch { toast.error('Failed to update water'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`p-2.5 rounded-xl text-2xl cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
              i < glasses
                ? 'text-sky-500 bg-sky-100 shadow-sm shadow-sky-200/50'
                : 'text-cream-300 bg-cream-100 hover:bg-cream-200'
            }`}
          >
            <Droplets size={24} fill={i < glasses ? '#0EA5E9' : 'none'} />
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-espresso-500 font-medium">
          <span className="font-bold text-espresso-700">{glasses}</span> of 8 glasses
        </p>
        <div className="h-1.5 flex-1 max-w-[120px] bg-cream-200 rounded-full overflow-hidden ml-3">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(glasses / 8) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
