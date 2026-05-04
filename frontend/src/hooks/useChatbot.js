import { useState, useRef, useCallback } from 'react';
import api from '../api/client';

export function useChatbot() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionRef = useRef(null);

  const createSession = useCallback(async () => {
    sessionRef.current = null;
    setMessages([{ role: 'assistant', content: 'Hi! I\'m your health coach. How can I help you today?' }]);
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
      sessionRef.current = data.session_id;
      const aiMsg = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  return { messages, isStreaming, sessionId: sessionRef, sendMessage, createSession, setMessages };
}
