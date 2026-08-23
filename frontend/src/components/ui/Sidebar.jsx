import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Folder, Brain, Settings, LogOut,
  Plus, ChevronLeft, Hash, X, Trash2
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';
import ThemeToggle from './ThemeToggle';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    loadConversation,
    deleteConversation,
    fetchConversations,
    setCurrentConversationId,
    setMessages
  } = useChatStore();
  const { isSidebarOpen, toggleSidebar, closeSidebarOnMobile } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    closeSidebarOnMobile();
    navigate('/chat');
  };

  const handleSelectConversation = (id) => {
    loadConversation(id);
    closeSidebarOnMobile();
    navigate('/chat');
  };

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  const handleLogout = () => {
    logout();
    closeSidebarOnMobile();
    navigate('/login');
  };

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Chat & Agents' },
    { to: '/files', icon: Folder, label: 'Documents & RAG' },
    { to: '/knowledge', icon: Brain, label: 'Memory Bank' },
    { to: '/settings', icon: Settings, label: 'Settings & Models' },
  ];

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto flex flex-col justify-between shrink-0 transition-all duration-300 theme-transition ${
        isSidebarOpen
          ? 'w-72 lg:w-64 translate-x-0'
          : '-translate-x-full lg:translate-x-0 lg:w-16'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
        boxShadow: isSidebarOpen ? 'var(--shadow-xl)' : 'none'
      }}
    >
      {/* Top Header */}
      <div className="p-3.5 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs"
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
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg transition-colors hidden lg:inline-flex cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Toggle sidebar"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg transition-colors lg:hidden cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-on-accent)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Start a new conversation"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {isSidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation & Conversations */}
      <div className="flex-1 px-2.5 py-1 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebarOnMobile}
            title={!isSidebarOpen ? item.label : undefined}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150`}
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: isActive ? '1px solid var(--border-primary)' : '1px solid transparent'
            })}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {/* Conversation History */}
        {isSidebarOpen && conversations.length > 0 && (
          <div className="pt-3 mt-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            <span
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Recent Chats
            </span>
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {conversations.slice(0, 20).map((conv) => {
                const isSelected = currentConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="group relative w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 flex items-center justify-between cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      border: isSelected ? '1px solid var(--border-primary)' : '1px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="truncate">{conv.title || 'Conversation'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shrink-0 ml-1 cursor-pointer"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-secondary)' }}>
        <div
          className="flex items-center justify-between p-2 rounded-xl transition-colors min-w-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
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
                  className="text-xs font-bold truncate leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.name || 'MiniGPT User'}
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
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors shrink-0 ml-1 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
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
