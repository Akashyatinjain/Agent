import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './ui/Sidebar';
import ThemeToggle from './ui/ThemeToggle';
import useUIStore from '../store/uiStore';

export const Layout = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div
      className="flex h-[100dvh] w-full overflow-hidden theme-transition relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Sidebar />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-label="Close menu backdrop"
        />
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Mobile Top Navigation Header */}
        <header
          className="flex lg:hidden items-center justify-between px-4 py-2.5 shrink-0 z-30 theme-transition"
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}
              >
                M
              </div>
              <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                MiniGPT
              </span>
            </div>
          </div>

          <ThemeToggle />
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
