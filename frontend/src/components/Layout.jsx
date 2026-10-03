import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import Sidebar from './ui/Sidebar';
import ThemeToggle from './ui/ThemeToggle';
import useUIStore from '../store/uiStore';
import useChatStore from '../store/chatStore';

export const Layout = () => {
  const { isMobileDrawerOpen, toggleSidebar, closeMobileDrawer } = useUIStore();
  const { startNewChat } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isChatRoute = location.pathname === '/chat' || location.pathname.startsWith('/chat/');

  // Ensure mobile drawer is cleanly closed if screen rotates or expands to desktop
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleMql = (e) => {
      if (e.matches) {
        closeMobileDrawer();
      }
    };
    mql.addEventListener('change', handleMql);
    return () => mql.removeEventListener('change', handleMql);
  }, [closeMobileDrawer]);

  const handleNewChat = () => {
    startNewChat();
    navigate('/chat');
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/files')) return 'Documents & RAG';
    if (location.pathname.startsWith('/knowledge')) return 'Memory Bank';
    if (location.pathname.startsWith('/settings')) return 'Settings';
    return 'Agent AI';
  };

  return (
    <div
      className="fixed inset-0 flex h-full h-[100dvh] w-full overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Sidebar />

      {/* Mobile overlay - lightweight without laggy backdrop-blur */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-200"
          onClick={closeMobileDrawer}
          aria-label="Close menu backdrop"
        />
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Mobile Top Navigation Header (shown only on non-chat pages to prevent double header) */}
        {!isChatRoute && (
          <header
            className="flex lg:hidden items-center justify-between px-3.5 py-2.5 shrink-0 z-30 theme-transition"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              borderBottom: '1px solid var(--border-primary)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-xl transition-colors cursor-pointer"
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
                <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {getPageTitle()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="p-2 rounded-xl transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                title="New Chat"
                aria-label="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <ThemeToggle />
            </div>
          </header>
        )}

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
