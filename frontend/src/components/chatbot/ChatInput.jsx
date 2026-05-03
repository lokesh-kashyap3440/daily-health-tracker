import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim() || disabled) return;
    onSend(msg);
    setMsg('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
      <div className="flex gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask about diet, workouts, nutrition..."
          disabled={disabled}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" disabled={disabled || !msg.trim()} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 cursor-pointer">
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
