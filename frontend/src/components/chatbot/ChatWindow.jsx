import { useEffect, useRef } from 'react';
import ChatBubble from '../ui/ChatBubble';

export default function ChatWindow({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 bg-gradient-to-b from-cream-50/50 to-white dark:from-dark-900/50 dark:to-dark-800">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage-100 to-cream-200 flex items-center justify-center mb-5 shadow-inner dark:from-dark-700 dark:to-dark-800">
            <svg className="w-10 h-10 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-espresso-700 mb-2 dark:text-cream-200">Your Health Assistant</h3>
          <p className="text-sm text-espresso-400 max-w-xs leading-relaxed dark:text-dark-400">
            Ask me about diet plans, workout routines, nutrition advice, or anything about your wellness journey.
          </p>
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {isStreaming && (
        <ChatBubble role="assistant" content="" isStreaming={true} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
