import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import useChatStore from '../../store/chatStore';

export const ModelSelector = () => {
  const { selectedModel, setSelectedModel } = useChatStore();

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900/80 border border-gray-800">
      <button
        onClick={() => setSelectedModel('gemini')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          selectedModel === 'gemini'
            ? 'bg-white text-black shadow-md shadow-slate-900/20'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-gray-500" />
        <span>Gemini 1.5</span>
      </button>

      <button
        onClick={() => setSelectedModel('openai')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          selectedModel === 'openai'
            ? 'bg-white text-black shadow-md shadow-slate-900/20'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Cpu className="w-3.5 h-3.5 text-gray-500" />
        <span>GPT-4o</span>
      </button>
    </div>
  );
};

export default ModelSelector;
