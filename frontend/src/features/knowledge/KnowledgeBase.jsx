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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Memory Bank</h2>
          <p className="text-xs text-gray-400">Facts automatically remembered by MiniGPT during your conversations.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12 text-sm">Loading memories...</div>
      ) : memories.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-gray-800 text-center text-gray-400 text-sm">
          No memories extracted yet! As you chat with MiniGPT, personal facts, preferences, and details will be automatically remembered here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memories.map((mem) => (
            <div key={mem.id} className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-2 flex flex-col justify-between">
              <p className="text-sm text-gray-200 font-medium leading-relaxed">"{mem.fact}"</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-200 bg-white/5 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3 text-gray-300" /> {mem.category}
                </span>
                <button
                  onClick={() => handleDelete(mem.id)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
