import React from 'react';
import { Settings, Key, Database, Cloud } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export const SettingsPanel = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Account Settings</h2>
          <p className="text-xs text-gray-400">Manage LLM configurations, storage endpoints, and system parameters.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-300" /> Multi-Provider LLM Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/80 border border-white/10 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white truncate block">Google Gemini API</span>
                <p className="text-xs text-gray-400">gemini-1.5-flash</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-gray-200 border border-white/10">Active</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/80 border border-white/10 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white truncate block">OpenAI API</span>
                <p className="text-xs text-gray-400">gpt-4o-mini</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-gray-200 border border-white/10">Active</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-300" /> Infrastructure Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center gap-3 min-w-0">
              <Database className="w-8 h-8 text-gray-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white truncate block">Neon PostgreSQL</span>
                <p className="text-xs text-gray-400 truncate">Serverless DB + pgvector vector embeddings</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center gap-3 min-w-0">
              <Cloud className="w-8 h-8 text-gray-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white truncate block">AWS S3 Bucket</span>
                <p className="text-xs text-gray-400 truncate">Document storage pipeline for RAG</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
