import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 group ${className}`}
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-primary)',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${isDark
            ? 'opacity-0 rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{ color: 'var(--text-secondary)' }}
        />
        <Moon
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
          }`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
