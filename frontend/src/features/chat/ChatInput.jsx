import React, { useState } from 'react';
import { Send, Paperclip, Sparkles, Database, Wrench, Globe } from 'lucide-react';
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
    const baseBadge = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-gray-200 border border-white/10 text-xs font-semibold max-w-full overflow-hidden';
    const pulse = activeRouterIntent.routerType ? 'animate-pulse' : '';
    const label = {
      rag: 'AI Router: Querying pgvector RAG Index',
      tool: 'AI Router: Executing Real-time Tool API',
      hybrid: 'AI Router: Synthesizing RAG + Live Tools',
      default: 'AI Router: Direct Knowledge Synthesis'
    }[activeRouterIntent.routerType] || 'AI Router: Direct Knowledge Synthesis';

    return (
      <div className={`${baseBadge} ${pulse}`}>
        <Sparkles className="w-3.5 h-3.5 text-gray-300" />
        <span className="truncate">{label}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-2">
      {getRouterBadge()}

      <div className="relative glass-panel rounded-2xl p-2 border border-white/10 focus-within:border-white/20 transition-all shadow-xl">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MiniGPT anything, search web, query documents, or solve daily problems..."
          disabled={disabled}
          className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 p-2.5 focus:outline-none resize-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/10 px-2">
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <ModelSelector />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-3 rounded-xl bg-white text-black disabled:opacity-40 transition-all shadow-md shadow-slate-900/20 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
