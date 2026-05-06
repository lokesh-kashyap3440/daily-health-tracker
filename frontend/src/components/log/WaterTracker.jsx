import { Droplets } from 'lucide-react';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function WaterTracker({ glasses = 0, date }) {
  const qc = useQueryClient();

  const toggle = async (idx) => {
    const newCount = idx + 1 === glasses ? glasses - 1 : idx + 1;
    try {
      await api.put(`/daily-logs/water?log_date=${date}`, { glasses: newCount });
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
                ? 'text-sky-500 bg-sky-100 shadow-sm shadow-sky-200/50 dark:bg-sky-900 dark:text-sky-300 dark:shadow-dark-950/30'
                : 'text-cream-300 bg-cream-100 hover:bg-cream-200 dark:text-dark-600 dark:bg-dark-800 dark:hover:bg-dark-700'
            }`}
          >
            <Droplets size={24} fill={i < glasses ? '#0EA5E9' : 'none'} />
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-espresso-500 font-medium dark:text-dark-400">
          <span className="font-bold text-espresso-700 dark:text-cream-100">{glasses}</span> of 8 glasses
        </p>
        <div className="h-1.5 flex-1 max-w-[120px] bg-cream-200 rounded-full overflow-hidden ml-3 dark:bg-dark-700">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(glasses / 8) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
