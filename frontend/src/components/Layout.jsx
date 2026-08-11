import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './ui/Sidebar';
import useUIStore from '../store/uiStore';

export const Layout = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#090d16]">
      <Sidebar />

      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
        aria-hidden={!isSidebarOpen}
      />

      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-lg shadow-slate-950/40 backdrop-blur-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
