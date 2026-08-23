import React, { useState } from 'react';
import { Wrench, Globe, Calculator, CloudSun, ChevronDown, CheckCircle2 } from 'lucide-react';

export const ToolCallDisplay = ({ toolCalls }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!toolCalls) return null;

  let tools = [];
  try {
    tools = typeof toolCalls === 'string' ? JSON.parse(toolCalls) : toolCalls;
  } catch {
    return null;
  }
  
  if (!Array.isArray(tools) || tools.length === 0) return null;

  const getToolIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'weather':
        return <CloudSun className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />;
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />;
      default:
        return <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

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
          <Wrench className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="truncate">Executed Live Tools ({tools.length})</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && (
        <div
          className="p-2.5 pt-0 space-y-1.5"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          {tools.map((t, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)',
                color: 'var(--text-tertiary)'
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getToolIcon(t.tool)}
                <span className="font-mono font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                  {t.tool}
                </span>
                {t.location && (
                  <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    ({t.location})
                  </span>
                )}
                {t.expression && (
                  <span className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                    [{t.expression}]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.result !== undefined && (
                  <span className="font-bold text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                    = {t.result}
                  </span>
                )}
                {t.temperature && (
                  <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    {t.temperature} ({t.condition || 'Clear'})
                  </span>
                )}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolCallDisplay;
