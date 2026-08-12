import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Folder, Brain, Settings, LogOut,
  Plus, ChevronLeft, Menu, Hash, X
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';
import ThemeToggle from './ThemeToggle';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { conversations, currentConversationId, setCurrentConversationId, setMessages } = useChatStore();
  const { isSidebarOpen, toggleSidebar, closeSidebarOnMobile } = useUIStore();
  const navigate = useNavigate();

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    closeSidebarOnMobile();
    navigate('/chat');
  };

  const handleLogout = () => {
    logout();
    closeSidebarOnMobile();
    navigate('/login');
  };

  const handleNavClick = () => {
    closeSidebarOnMobile();
  };

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/files', icon: Folder, label: 'Files & RAG' },
    { to: '/knowledge', icon: Brain, label: 'Memories' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 theme-transition ${
        isSidebarOpen
          ? 'w-72 sm:w-64 translate-x-0'
          : '-translate-x-full lg:w-16 lg:translate-x-0'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
        boxShadow: isSidebarOpen ? 'var(--shadow-xl)' : 'none'
      }}
    >
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)'
              }}
            >
              M
            </div>
            {isSidebarOpen && (
              <span
                className="font-bold text-base tracking-tight truncate animate-fade-in"
                style={{ color: 'var(--text-primary)' }}
              >
                MiniGPT
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isSidebarOpen && <ThemeToggle />}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg transition-colors hidden lg:inline-flex"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Toggle sidebar"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg transition-colors lg:hidden"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-on-accent)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus className="w-4 h-4" />
          {isSidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            title={item.label}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200`}
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: isActive ? '1px solid var(--border-primary)' : '1px solid transparent'
            })}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Conversation History */}
        {isSidebarOpen && conversations.length > 0 && (
          <div className="pt-4 mt-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            <span
              className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Recent
            </span>
            {conversations.slice(0, 8).map((conv, i) => (
              <button
                key={conv.id}
                onClick={() => {
                  setCurrentConversationId(conv.id);
                  closeSidebarOnMobile();
                  navigate('/chat');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all duration-200 flex items-center gap-2 animate-fade-in`}
                style={{
                  backgroundColor: currentConversationId === conv.id ? 'var(--bg-hover)' : 'transparent',
                  color: currentConversationId === conv.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  animationDelay: `${i * 30}ms`
                }}
              >
                <Hash className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="truncate">{conv.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
        <div
          className="flex items-center justify-between p-2.5 rounded-xl transition-colors min-w-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)'
              }}
            >
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                <span
                  className="text-xs font-semibold truncate leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.name || 'Guest User'}
                </span>
                <span
                  className="text-[10px] truncate leading-tight"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {user?.email || 'user@minigpt.dev'}
                </span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0 ml-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
