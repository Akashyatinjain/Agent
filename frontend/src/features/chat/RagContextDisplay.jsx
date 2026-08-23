import React, { useState } from 'react';
import { Database, ChevronDown, FileText } from 'lucide-react';

export const RagContextDisplay = ({ ragContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!ragContext) return null;

  let chunks = [];
  try {
    chunks = typeof ragContext === 'string' ? JSON.parse(ragContext) : ragContext;
  } catch {
    return null;
  }
  
  if (!Array.isArray(chunks) || chunks.length === 0) return null;

  return (
    <div
      className="my-2 rounded-xl text-xs overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)'
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-semibold transition-colors cursor-pointer"
        style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="truncate">Retrieved Knowledge Base Sources ({chunks.length})</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
              key={chunk.id || i}
              className="p-2.5 rounded-lg space-y-1.5"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                  <FileText className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="truncate">{chunk.metadata?.filename || 'Document'}</span>
                  {chunk.metadata?.chunkIndex !== undefined && (
                    <span className="text-[10px] text-gray-500">#{chunk.metadata.chunkIndex + 1}</span>
                  )}
                </span>
                <span className="font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {typeof chunk.similarity === 'number' ? `${Math.round(chunk.similarity * 100)}% match` : 'Matched'}
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed line-clamp-3 break-words font-sans"
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