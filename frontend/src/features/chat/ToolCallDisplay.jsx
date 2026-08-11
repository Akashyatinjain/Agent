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
        return <CloudSun className="w-3.5 h-3.5 text-gray-300" />;
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-gray-300" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-gray-300" />;
    }
  };

  return (
    <div className="my-2 p-2.5 rounded-xl bg-gray-900/90 border border-white/10 text-xs space-y-1.5">
      <div className="flex items-center gap-1.5 font-semibold text-gray-200">
        <Wrench className="w-3.5 h-3.5 text-gray-300" />
        <span>Tools Executed</span>
      </div>
      {tools.map((t, i) => (
        <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-950/60 text-gray-300 overflow-hidden">
          {getToolIcon(t.tool)}
          <span className="font-mono font-medium text-gray-200 flex-shrink-0">{t.tool}</span>
          {t.location && <span className="text-gray-400 flex-shrink-0">({t.location})</span>}
          {t.result !== undefined && <span className="text-gray-200 font-bold truncate">= {t.result}</span>}
        </div>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
