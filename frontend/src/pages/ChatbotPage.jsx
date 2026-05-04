import { useEffect, useCallback } from 'react';
import ChatWindow from '../components/chatbot/ChatWindow';
import ChatInput from '../components/chatbot/ChatInput';
import ChatSidebar from '../components/chatbot/ChatSidebar';
import SuggestionChips from '../components/chatbot/SuggestionChips';
import { useChatbot } from '../hooks/useChatbot';
import api from '../api/client';
import { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

export default function ChatbotPage() {
  const { messages, isStreaming, sessionId, sendMessage, createSession, setMessages } = useChatbot();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/sessions');
      setSessions(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    createSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNew = () => {
    createSession();
    setActiveId(null);
    fetchSessions();
  };

  const handleSelectSession = async (id) => {
    setActiveId(id);
    try {
      const { data } = await api.get(`/chat/history/${id}`);
      sessionId.current = data.id;
      setMessages(data.messages.map(m => ({
        role: m.role,
        content: m.content,
      })));
    } catch {
      setMessages([{ role: 'assistant', content: 'Could not load this conversation.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm">
          <MessageCircle size={20} className="text-sage-600" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-espresso-800 tracking-tight">
            AI Health Coach
          </h1>
          <p className="text-xs sm:text-sm text-espresso-400">Get personalized wellness advice</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-1 min-h-0 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-cream-200 overflow-hidden">
        <ChatSidebar sessions={sessions} activeId={activeId} onSelect={handleSelectSession} onNew={handleNew} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile new chat button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-cream-200 bg-cream-50/50">
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:text-sage-700 px-3 py-1.5 rounded-xl hover:bg-sage-50 transition-all cursor-pointer"
            >
              <Sparkles size={16} /> New Chat
            </button>
          </div>
          <ChatWindow messages={messages} isStreaming={isStreaming} />
          <SuggestionChips onSelect={sendMessage} />
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
