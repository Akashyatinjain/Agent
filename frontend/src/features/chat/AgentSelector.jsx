import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Search, Code, FileText, BarChart3,
  Sparkles, ChevronDown, Check, Zap, Cpu
} from 'lucide-react';
import useChatStore from '../../store/chatStore';

export const AGENTS = [
  {
    id: 'auto',
    name: 'Auto Agent (Smart Router)',
    shortName: 'Auto',
    description: 'Automatically routes to the best agent or tool based on your prompt',
    icon: Sparkles,
    color: 'text-amber-500',
    tools: ['Intent Classifier', 'pgvector RAG', 'Live Tools']
  },
  {
    id: 'general',
    name: 'General Assistant',
    shortName: 'Assistant',
    description: 'Everyday conversations, explanations, and creative writing',
    icon: Bot,
    color: 'text-blue-500',
    tools: ['Direct LLM']
  },
  {
    id: 'doc_agent',
    name: 'Document Agent (RAG)',
    shortName: 'Docs',
    description: 'Searches and extracts answers from your uploaded files and notes',
    icon: FileText,
    color: 'text-emerald-500',
    tools: ['Semantic Document Search', 'Reranker']
  },
  {
    id: 'research_agent',
    name: 'Research Agent',
    shortName: 'Research',
    description: 'Live web search, real-time facts, and weather queries',
    icon: Search,
    color: 'text-purple-500',
    tools: ['Web Search', 'Weather API']
  },
  {
    id: 'coding_agent',
    name: 'Coding Agent',
    shortName: 'Coder',
    description: 'Code generation, refactoring, bug fixing, and architecture',
    icon: Code,
    color: 'text-cyan-500',
    tools: ['Code Synthesizer', 'Syntax Checker']
  },
  {
    id: 'analytics_agent',
    name: 'Analytics Agent',
    shortName: 'Analytics',
    description: 'Evaluates arithmetic expressions and structures data',
    icon: BarChart3,
    color: 'text-rose-500',
    tools: ['Safe Math Evaluator', 'Data Formatter']
  }
];

export const MODELS = [
  { id: 'gemini', name: 'Gemini Flash', provider: 'Google', icon: Sparkles },
  { id: 'mistral', name: 'Mistral AI', provider: 'Mistral', icon: Zap }
];

export const AgentSelector = () => {
  const {
    selectedAgent,
    setSelectedAgent,
    selectedModel,
    setSelectedModel,
    isGenerating
  } = useChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentAgent = AGENTS.find((a) => a.id === (selectedAgent || 'auto')) || AGENTS[0];
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        disabled={isGenerating}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-60 hover:scale-[1.02]"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-primary)'
        }}
        title="Choose Agent & Model"
      >
        <currentAgent.icon className={`w-3.5 h-3.5 ${currentAgent.color}`} />
        <span className="font-bold">{currentAgent.shortName}</span>
        <span className="text-[11px] opacity-70 hidden sm:inline">• {currentModel.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div
          className="absolute left-0 bottom-full mb-2 w-72 sm:w-84 rounded-2xl p-2.5 z-50 animate-scale-in shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {/* Agent Personas Section */}
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Available AI Agents ({AGENTS.length})</span>
          </div>

          <div className="space-y-1 my-1.5 max-h-64 overflow-y-auto pr-0.5">
            {AGENTS.map((agent) => {
              const isSelected = (selectedAgent || 'auto') === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgent(agent.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer hover:bg-[var(--bg-hover)]"
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-primary)' : '1px solid transparent'
                  }}
                >
                  <agent.icon className={`w-4 h-4 mt-0.5 shrink-0 ${agent.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {agent.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                      {agent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Underlying Model Section */}
          <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Underlying LLM Engine
            </div>
            <div className="grid grid-cols-3 gap-1 px-0.5 pt-1">
              {MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg text-center transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-accent)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <m.icon className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[10px] font-semibold truncate w-full">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
