import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Moon } from 'lucide-react';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function SleepTracker({ sleepHours = 0, sleepQuality = 0, date }) {
  const [hours, setHours] = useState(sleepHours);
  const [quality, setQuality] = useState(sleepQuality);
  const qc = useQueryClient();
  const debounceRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  useEffect(() => {
    setHours(sleepHours);
    setQuality(sleepQuality);
  }, [sleepHours, sleepQuality]);

  const saveHours = useCallback((h, q) => {
    const hoursNum = Number(h);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (isToday) {
          await api.put('/daily-logs/sleep', { hours: hoursNum });
        } else {
          await api.post('/daily-logs', { log_date: date, sleep_hours: hoursNum, water_glasses: undefined, mood_rating: undefined });
        }
        qc.invalidateQueries({ queryKey: ['dailyLog'] });
        toast.success('Sleep updated');
      } catch { toast.error('Failed to update sleep'); }
    }, 600);
  }, [date, qc, isToday]);

  const saveQuality = useCallback((q) => {
    try {
      if (isToday) {
        api.put('/daily-logs/sleep', { hours: Number(hours) });
      }
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
      toast.success('Sleep quality updated');
    } catch { toast.error('Failed to update sleep quality'); }
  }, [hours, qc, isToday]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Moon size={22} className="text-indigo-500" />
        <div className="flex items-center gap-2 bg-white rounded-xl border border-cream-200 px-3 py-2 shadow-sm">
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={hours || ''}
            placeholder="0"
            onChange={(e) => { setHours(e.target.value); saveHours(e.target.value, quality); }}
            className="w-16 text-center text-sm font-semibold text-espresso-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-espresso-400 font-medium">hours</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-espresso-500 mb-2">Sleep Quality</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => { setQuality(i); saveQuality(i); }}
              className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 p-1 ${
                i <= quality ? 'text-amber-400' : 'text-cream-300 hover:text-amber-200'
              }`}
            >
              <Star size={26} fill={i <= quality ? '#F59E0B' : 'none'} />
            </button>
          ))}
          <span className="text-xs text-espresso-400 ml-2 font-medium">
            {quality === 0 ? 'Not set' :
             quality <= 2 ? 'Poor' :
             quality === 3 ? 'Fair' :
             quality === 4 ? 'Good' : 'Great'}
          </span>
        </div>
      </div>
    </div>
  );
}
