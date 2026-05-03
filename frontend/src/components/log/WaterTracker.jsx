import { Droplets } from 'lucide-react';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function WaterTracker({ glasses = 0, date }) {
  const qc = useQueryClient();

  const toggle = async (idx) => {
    const newCount = idx + 1 === glasses ? glasses - 1 : idx + 1;
    try {
      await api.post('/daily-logs', { log_date: date, water_glasses: newCount });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
    } catch {}
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`p-2 rounded-xl text-2xl cursor-pointer transition ${i < glasses ? 'text-blue-500 bg-blue-50' : 'text-slate-300 bg-slate-50'}`}
          >
            <Droplets size={24} fill={i < glasses ? '#3B82F6' : 'none'} />
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-2">{glasses} of 8 glasses</p>
    </div>
  );
}
