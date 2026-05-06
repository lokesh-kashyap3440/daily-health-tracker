import { Bot, User } from 'lucide-react';

export default function ChatBubble({ role, content, isStreaming = false }) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}
      style={{ animationDelay: '0.05s' }}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-sage-500 to-sage-700 text-white'
          : 'bg-gradient-to-br from-cream-200 to-cream-300 text-sage-700 border border-cream-300 dark:from-dark-700 dark:to-dark-800 dark:text-sage-300 dark:border-dark-700'
      }`}>
        {isUser ? <User size={16} strokeWidth={2.5} /> : <Bot size={16} strokeWidth={2.5} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-sage-600 to-sage-700 text-white chat-tail-user'
          : 'bg-white text-espresso-700 border border-cream-200 shadow-sm chat-tail-bot dark:bg-dark-800 dark:text-espresso-200 dark:border-dark-700'
      }`}>
        {isStreaming && !content ? (
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
