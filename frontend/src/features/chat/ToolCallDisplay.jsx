import React, { useState } from 'react';
import {
  CheckCircle2, ChevronDown, Wrench, Search,
  Calculator, CloudSun, Check
} from 'lucide-react';

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

  const formatToolActivity = (t) => {
    const name = t.tool?.toLowerCase();
    if (name === 'weather') {
      return `Checked weather forecast for ${t.location || 'requested location'}`;
    }
    if (name === 'calculator') {
      return `Evaluated expression: ${t.expression || ''} ${t.result !== undefined ? `(= ${t.result})` : ''}`;
    }
    if (name === 'web_search') {
      return `Searched web for recent information`;
    }
    return `Executed ${t.tool || 'tool'}`;
  };

  const getToolIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'weather':
        return <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      default:
        return <Search className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    }
  };

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
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Agent Activity ({tools.length} step{tools.length > 1 ? 's' : ''} completed)</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
            {isOpen ? 'Hide details' : 'View steps'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="p-2.5 pt-0 space-y-1.5"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          {tools.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getToolIcon(t.tool)}
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatToolActivity(t)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold shrink-0">
                <Check className="w-3 h-3" /> Done
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolCallDisplay;
