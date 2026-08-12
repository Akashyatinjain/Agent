import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import ModelSelector from './ModelSelector';
import useChatStore from '../../store/chatStore';

export const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const { activeRouterIntent } = useChatStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getRouterBadge = () => {
    if (!activeRouterIntent) return null;
    const pulse = activeRouterIntent.routerType ? 'animate-pulse' : '';
    const label = {
      rag: 'AI Router: Querying pgvector RAG Index',
      tool: 'AI Router: Executing Real-time Tool API',
      hybrid: 'AI Router: Synthesizing RAG + Live Tools',
    }[activeRouterIntent.routerType] || 'AI Router: Direct Knowledge Synthesis';

    return (
      <div className="flex justify-center pb-1">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium animate-scale-in ${pulse}`}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="truncate">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-2">
      {getRouterBadge()}

      <div
        className="relative rounded-2xl p-2 transition-all duration-200 theme-transition"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MiniGPT anything, search web, query documents, or solve daily problems..."
          disabled={disabled}
          className="w-full bg-transparent text-sm p-2.5 focus:outline-none resize-none"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)'
          }}
        />

        <div
          className="flex items-center justify-between pt-2 px-2"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <ModelSelector />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-3 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-40"
            style={{
              backgroundColor: !input.trim() || disabled ? 'var(--bg-hover)' : 'var(--bg-accent)',
              color: !input.trim() || disabled ? 'var(--text-muted)' : 'var(--text-on-accent)',
              boxShadow: !input.trim() || disabled ? 'none' : 'var(--shadow-sm)'
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;