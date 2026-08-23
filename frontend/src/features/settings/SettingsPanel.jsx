import React from 'react';
import { Settings, Key, Database, Cloud, Sparkles, Cpu, Zap } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';

export const SettingsPanel = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-tertiary)'
            }}
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              System & Architecture
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Live status for AI models, pgvector database, and tool pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Theme:</span>
          <ThemeToggle />
        </div>
      </div>

      <div
        className="p-6 rounded-2xl space-y-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Multi-Provider LLMs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Multi-Provider LLM Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              { name: 'Google Gemini', model: 'gemini-1.5-flash / 2.0', icon: Sparkles, badge: 'Active' },
              { name: 'OpenAI', model: 'gpt-4o-mini / gpt-4o', icon: Cpu, badge: 'Active' },
              { name: 'Mistral AI', model: 'mistral-small-latest', icon: Zap, badge: 'Active' },
            ].map((llm) => (
              <div
                key={llm.name}
                className="p-4 rounded-xl flex items-center justify-between gap-3 min-w-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)'
                }}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <llm.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="min-w-0">
                    <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                      {llm.name}
                    </span>
                    <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {llm.model}
                    </p>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 shrink-0"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  {llm.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database & Storage Architecture */}
        <div className="pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Database & Vector Storage
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Database className="w-7 h-7 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                  Neon PostgreSQL + pgvector
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Serverless relational storage and 1536-dimensional vector similarity indexing.
                </p>
              </div>
            </div>

            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Cloud className="w-7 h-7 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                  AWS S3 & Local Hybrid Storage
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Zero-config local file buffer pipeline with optional AWS S3 bucket streaming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
