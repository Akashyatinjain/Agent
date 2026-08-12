import React from 'react';
import { Cpu, Sparkles, Zap } from 'lucide-react';
import useChatStore from '../../store/chatStore';

const models = [
  { id: 'gemini', label: 'Gemini 3.6', shortLabel: 'Gemini', icon: Sparkles },
  { id: 'openai', label: 'GPT-4o', shortLabel: 'GPT-4o', icon: Cpu },
  { id: 'mistral', label: 'Mistral AI', shortLabel: 'Mistral', icon: Zap },
];

export const ModelSelector = () => {
  const { selectedModel, setSelectedModel } = useChatStore();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl max-w-full overflow-x-auto shrink-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)'
      }}
    >
      {models.map((m) => {
        const isActive = selectedModel === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModel(m.id)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 shrink-0"
            style={{
              backgroundColor: isActive ? 'var(--bg-accent)' : 'transparent',
              color: isActive ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <m.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModelSelector;