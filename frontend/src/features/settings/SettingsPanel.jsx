import React from 'react';
import { Settings, Key, Database, Cloud, Moon, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

export const SettingsPanel = () => {
  const { user } = useAuthStore();
  const { theme } = useUIStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
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
              System & Settings
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Manage LLM configurations, appearance theme, and infrastructure endpoints.
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
        {/* LLMs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Multi-Provider LLM Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Google Gemini API', model: 'gemini-3.6-flash', status: 'Active' },
              { name: 'OpenAI API', model: 'gpt-4o', status: 'Active' },
              { name: 'Mistral AI API', model: 'mistral-medium-latest', status: 'Active' },
            ].map((llm) => (
              <div
                key={llm.name}
                className="p-4 rounded-xl flex items-center justify-between gap-3 min-w-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)'
                }}
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold truncate block" style={{ color: 'var(--text-primary)' }}>{llm.name}</span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{llm.model}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  {llm.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Infrastructure Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Database className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-sm font-semibold truncate block" style={{ color: 'var(--text-primary)' }}>Neon PostgreSQL</span>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Serverless DB + pgvector vector embeddings</p>
              </div>
            </div>

            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Cloud className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-sm font-semibold truncate block" style={{ color: 'var(--text-primary)' }}>AWS S3 Bucket</span>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Document storage pipeline for RAG</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
