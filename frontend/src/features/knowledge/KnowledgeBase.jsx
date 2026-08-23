import React, { useEffect, useState } from 'react';
import { Brain, Trash2, Tag, Sparkles, Loader2 } from 'lucide-react';
import api from '../../api/client';

export const KnowledgeBase = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/users/memories');
      if (res.data?.success && Array.isArray(res.data.memories)) {
        setMemories(res.data.memories);
      }
    } catch (e) {
      console.warn('Failed to fetch memories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/memories/${id}`);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert('Failed to delete memory');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-tertiary)'
          }}
        >
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AI Memory Bank
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Facts and preferences automatically extracted during your conversations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 flex flex-col items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading memory bank...</span>
        </div>
      ) : memories.length === 0 ? (
        <div
          className="p-8 rounded-2xl text-center text-xs sm:text-sm space-y-2"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-muted)'
          }}
        >
          <Sparkles className="w-6 h-6 mx-auto mb-1 text-amber-500" />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No memories extracted yet!</p>
          <p className="max-w-md mx-auto">
            As you chat with MiniGPT about your role, preferences, projects, or goals, key details are automatically remembered and surfaced here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-2xl space-y-3 flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <p className="text-sm font-medium leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>
                "{mem.fact}"
              </p>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <span
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full truncate max-w-[140px]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-secondary)'
                  }}
                >
                  <Tag className="w-3 h-3 shrink-0" /> {mem.category || 'general'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(mem.id)}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Remove memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
