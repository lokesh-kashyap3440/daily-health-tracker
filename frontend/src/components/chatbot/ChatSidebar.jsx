import { Plus, MessageCircle, Sparkles } from 'lucide-react';

export default function ChatSidebar({ sessions = [], activeId, onSelect, onNew }) {
  return (
    <div className="w-64 border-r border-cream-200 p-4 hidden lg:flex flex-col bg-gradient-to-b from-cream-50 to-white">
      <button
        onClick={onNew}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-sage-600 to-sage-500 text-white text-sm font-medium mb-6 hover:from-sage-700 hover:to-sage-600 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
      >
        <Sparkles size={16} />
        New Chat
      </button>

      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cream-300" />
        <span className="text-[10px] font-semibold text-espresso-400 uppercase tracking-widest">History</span>
        <div className="h-px flex-1 bg-gradient-to-r from-cream-300 to-transparent" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 -mx-1">
        {sessions.length === 0 && (
          <p className="text-xs text-espresso-400 text-center py-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 cursor-pointer ${
              s.id === activeId
                ? 'bg-sage-100 text-sage-700 font-medium shadow-sm border border-sage-200'
                : 'text-espresso-500 hover:bg-cream-200/60 hover:text-espresso-700'
            }`}
          >
            <MessageCircle size={15} strokeWidth={1.8} className={s.id === activeId ? 'text-sage-500' : 'text-espresso-400'} />
            <span className="truncate">{s.title || 'New Chat'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
