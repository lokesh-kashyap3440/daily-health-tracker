import { useState } from 'react';
import { Star, Moon } from 'lucide-react';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function SleepTracker({ sleepHours = 0, sleepQuality = 0, date }) {
  const [hours, setHours] = useState(sleepHours);
  const [quality, setQuality] = useState(sleepQuality);
  const qc = useQueryClient();

  const save = async (h, q) => {
    try {
      await api.post('/daily-logs', { log_date: date, sleep_hours: h, sleep_quality: q });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
    } catch {}
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Moon size={20} className="text-indigo-500" />
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={hours || ''}
          placeholder="Hours"
          onChange={(e) => { setHours(e.target.value); save(Number(e.target.value), quality); }}
          className="w-24 border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        <span className="text-sm text-slate-500">hours</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => { setQuality(i); save(hours, i); }}
            className={`cursor-pointer ${i <= quality ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <Star size={24} fill={i <= quality ? '#F59E0B' : 'none'} />
          </button>
        ))}
        <span className="text-sm text-slate-500 ml-2">Quality</span>
      </div>
    </div>
  );
}
