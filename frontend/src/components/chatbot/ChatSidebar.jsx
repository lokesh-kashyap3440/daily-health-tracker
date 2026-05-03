import { Plus, MessageCircle } from 'lucide-react';

export default function ChatSidebar({ sessions = [], activeId, onSelect, onNew }) {
  return (
    <div className="w-64 border-r border-slate-200 p-4 hidden lg:block">
      <button onClick={onNew} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium mb-4 hover:bg-green-700 cursor-pointer">
        <Plus size={18} /> New Chat
      </button>
      <div className="space-y-1">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left cursor-pointer ${
              s.id === activeId ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageCircle size={16} />
            <span className="truncate">{s.title || 'New Chat'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
