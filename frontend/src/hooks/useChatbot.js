import { useState, useRef, useCallback } from 'react';
import api from '../api/client';

export function useChatbot() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionRef = useRef(null);

  const createSession = useCallback(async () => {
    const { data } = await api.post('/chat/sessions', { title: 'New Chat' });
    sessionRef.current = data.id;
    setMessages([{ role: 'assistant', content: 'Hi! I\'m your health coach. How can I help you today?' }]);
    return data.id;
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isStreaming) return;
    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const { data } = await api.post('/chat/send', {
        session_id: sessionRef.current,
        message: content,
      });
      const aiMsg = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  return { messages, isStreaming, sessionId: sessionRef, sendMessage, createSession, setMessages };
}
