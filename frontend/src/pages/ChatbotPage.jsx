import { useEffect } from 'react';
import ChatWindow from '../components/chatbot/ChatWindow';
import ChatInput from '../components/chatbot/ChatInput';
import ChatSidebar from '../components/chatbot/ChatSidebar';
import SuggestionChips from '../components/chatbot/SuggestionChips';
import { useChatbot } from '../hooks/useChatbot';
import api from '../api/client';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function ChatbotPage() {
  const { messages, isStreaming, sendMessage, createSession } = useChatbot();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    api.get('/chat/sessions').then(({ data }) => setSessions(data)).catch(() => {});
  }, []);

  const handleNew = async () => {
    const id = await createSession();
    setActiveId(id);
    api.get('/chat/sessions').then(({ data }) => setSessions(data)).catch(() => {});
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      <ChatSidebar sessions={sessions} activeId={activeId} onSelect={setActiveId} onNew={handleNew} />
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 mx-0 lg:mx-4 overflow-hidden">
        <div className="lg:hidden p-4 border-b border-slate-200">
          <button onClick={handleNew} className="text-sm text-green-600 font-medium">+ New Chat</button>
        </div>
        <ChatWindow messages={messages} isStreaming={isStreaming} />
        <SuggestionChips onSelect={sendMessage} />
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
