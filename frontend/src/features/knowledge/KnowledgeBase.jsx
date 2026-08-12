import React, { useEffect, useState } from 'react';
import { Brain, Trash2, Tag } from 'lucide-react';
import api from '../../api/client';

export const KnowledgeBase = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/users/memories');
      if (res.data.success) {
        setMemories(res.data.memories);
      }
    } catch (e) {
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
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
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
            Facts automatically remembered by MiniGPT during your conversations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Loading memories...</div>
      ) : memories.length === 0 ? (
        <div
          className="p-8 rounded-2xl text-center text-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-muted)'
          }}
        >
          No memories extracted yet! As you chat with MiniGPT, personal facts, preferences, and details will be automatically remembered here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-2xl space-y-2 flex flex-col justify-between"
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
                  <Tag className="w-3 h-3" /> {mem.category}
                </span>
                <button
                  onClick={() => handleDelete(mem.id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
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
