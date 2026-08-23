import React, { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

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
      className="my-2.5 rounded-xl text-xs overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
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
          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
          <span className="truncate">Sources ({chunks.length})</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
            {isOpen ? 'Hide sources' : 'View sources'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="p-2.5 pt-0 space-y-2"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          {chunks.map((chunk, i) => {
            const filename = chunk.metadata?.filename || 'Document';
            const pageInfo = chunk.metadata?.pageNumber ? ` • Page ${chunk.metadata.pageNumber}` : '';
            const sectionInfo = chunk.metadata?.section ? ` • ${chunk.metadata.section}` : '';

            return (
              <div
                key={chunk.id || i}
                className="p-2.5 rounded-lg space-y-1"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-secondary)'
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span className="truncate">{filename}</span>
                  <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                    {pageInfo}{sectionInfo}
                  </span>
                </div>
                <p
                  className="text-[11px] leading-relaxed line-clamp-3 font-sans break-words pl-5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  "{chunk.content}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RagContextDisplay;