import React, { useState } from 'react';
import { Database, ChevronDown, FileText } from 'lucide-react';

export const RagContextDisplay = ({ ragContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  let chunks;
  try {
    chunks = typeof ragContext === 'string' ? JSON.parse(ragContext) : ragContext;
  } catch {
    return null;
  }
  if (!chunks || chunks.length === 0) return null;

  return (
    <div
      className="my-2 rounded-xl text-xs overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-semibold transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <span>Retrieved Knowledge Chunks ({chunks.length})</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && (
        <div
          className="p-2.5 pt-0 space-y-2"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          {chunks.map((chunk, i) => (
            <div
              key={i}
              className="p-2 rounded-lg space-y-1"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                  {chunk.metadata?.filename || 'Document'}
                </span>
                <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {(chunk.similarity * 100).toFixed(0)}% match
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed line-clamp-3 break-words"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {chunk.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RagContextDisplay;