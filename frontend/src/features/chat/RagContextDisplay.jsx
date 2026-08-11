import React, { useState } from 'react';
import { Database, ChevronDown, FileText } from 'lucide-react';

export const RagContextDisplay = ({ ragContext }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!ragContext) return null;
  let chunks;
  try {
    chunks = typeof ragContext === 'string' ? JSON.parse(ragContext) : ragContext;
  } catch {
    return null;
  }
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="my-2 rounded-xl bg-gray-900/90 border border-white/10 text-xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-semibold text-gray-200 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-gray-300" />
          <span>Retrieved Knowledge Chunks ({chunks.length})</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-2.5 pt-0 space-y-2 border-t border-white/10">
          {chunks.map((chunk, i) => (
            <div key={i} className="p-2 rounded-lg bg-gray-950/70 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-gray-300" />
                  {chunk.metadata?.filename || 'Document'}
                </span>
                <span className="text-gray-300 font-bold">{(chunk.similarity * 100).toFixed(0)}% match</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-3 break-words">{chunk.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RagContextDisplay;
