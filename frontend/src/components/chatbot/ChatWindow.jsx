import { useEffect, useRef } from 'react';
import ChatBubble from '../ui/ChatBubble';
import Spinner from '../ui/Spinner';

export default function ChatWindow({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((msg, i) => (
        <ChatBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {isStreaming && <Spinner />}
      <div ref={bottomRef} />
    </div>
  );
}
