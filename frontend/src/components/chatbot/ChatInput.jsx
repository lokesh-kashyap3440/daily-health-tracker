import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim() || disabled) return;
    onSend(msg);
    setMsg('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-cream-200 bg-white p-4 sm:p-5">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Ask about diet, workouts, nutrition..."
            disabled={disabled}
            className="w-full border border-cream-300 rounded-2xl px-5 py-3.5 pr-12 text-sm bg-cream-50 text-espresso-800 placeholder:text-espresso-300 outline-none transition-all duration-200 focus:bg-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/30 focus:shadow-lg focus:shadow-sage-200/30"
          />
          <Sparkles size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso-300 pointer-events-none" />
        </div>
        <button
          type="submit"
          disabled={disabled || !msg.trim()}
          className="p-3.5 bg-gradient-to-r from-sage-600 to-sage-500 text-white rounded-2xl hover:from-sage-700 hover:to-sage-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
