import React from 'react';

export const Loader = ({ label = 'Processing request...' }) => {
  return (
    <div className="flex items-center gap-3 p-4 glass-panel rounded-2xl border border-white/10 max-w-sm">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      <span className="text-sm font-medium text-gray-200 animate-pulse">{label}</span>
    </div>
  );
};

export default Loader;
