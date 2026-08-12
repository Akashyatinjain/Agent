import React from 'react';
import { Wrench, Globe, Calculator, CloudSun } from 'lucide-react';

export const ToolCallDisplay = ({ toolCalls }) => {
  if (!toolCalls) return null;
  let tools;
  try {
    tools = typeof toolCalls === 'string' ? JSON.parse(toolCalls) : toolCalls;
  } catch {
    return null;
  }
  if (!Array.isArray(tools)) return null;

  const getToolIcon = (name) => {
    switch (name) {
      case 'weather':
        return <CloudSun className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
      default:
        return <Globe className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  return (
    <div
      className="my-2 p-2.5 rounded-xl text-xs space-y-1.5"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)'
      }}
    >
      <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
        <Wrench className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
        <span>Tools Executed</span>
      </div>
      {tools.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-1.5 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-tertiary)'
          }}
        >
          {getToolIcon(t.tool)}
          <span className="font-mono font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{t.tool}</span>
          {t.location && <span className="flex-shrink-0">({t.location})</span>}
          {t.result !== undefined && <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>= {t.result}</span>}
        </div>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
