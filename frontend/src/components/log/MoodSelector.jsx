import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const moods = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

export default function MoodSelector({ mood = 0, date }) {
  const qc = useQueryClient();

  const select = async (value) => {
    try {
      await api.put(`/daily-logs/mood?log_date=${date}`, { rating: value });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
      toast.success('Mood updated');
    } catch { toast.error('Failed to update mood'); }
  };

  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x">
      {moods.map(({ value, emoji, label }) => {
        const isActive = mood === value;
        return (
          <button
            key={value}
            onClick={() => select(value)}
            className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 snap-start min-w-[70px] sm:min-w-[80px] ${
              isActive
                ? 'bg-gradient-to-b from-sage-100 to-sage-50 ring-2 ring-sage-400 shadow-md scale-105'
                : 'bg-white/60 hover:bg-cream-100 border border-cream-200 hover:border-cream-300 hover:shadow-sm dark:bg-dark-800/60 dark:hover:bg-dark-700 dark:border-dark-700 dark:hover:border-dark-600'
            }`}
          >
            <span className={`text-3xl sm:text-4xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
              {emoji}
            </span>
            <span className={`text-xs font-medium ${isActive ? 'text-sage-700 font-semibold dark:text-sage-300' : 'text-espresso-400 dark:text-dark-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
