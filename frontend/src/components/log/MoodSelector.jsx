import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

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
      await api.post('/daily-logs', { log_date: date, mood_rating: value });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
    } catch {}
  };

  return (
    <div className="flex gap-3">
      {moods.map(({ value, emoji, label }) => (
        <button
          key={value}
          onClick={() => select(value)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition ${mood === value ? 'bg-green-50 ring-2 ring-green-500' : 'hover:bg-slate-50'}`}
        >
          <span className="text-3xl">{emoji}</span>
          <span className="text-xs text-slate-500">{label}</span>
        </button>
      ))}
    </div>
  );
}
