import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, Folder, Brain, Settings, LogOut,
  Plus, Search, Trash2, Edit2, Check, X,
  FileText, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';
import ThemeToggle from './ThemeToggle';

import AgentLogo from './AgentLogo';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    deleteConversation,
    renameConversation,
    startNewChat,
    fetchConversations
  } = useChatStore();
  const { isSidebarOpen, toggleSidebar, closeSidebarOnMobile } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Global Ctrl+B / Cmd+B listener for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handleNewChat = () => {
    startNewChat();
    closeSidebarOnMobile();
    navigate('/chat');
  };

  const handleSelectConversation = (id) => {
    closeSidebarOnMobile();
    navigate(`/chat/${id}`);
  };

  const handleStartRename = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || 'Conversation');
  };

  const handleSaveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation();
    deleteConversation(id);
    if (location.pathname === `/chat/${id}`) {
      navigate('/chat');
    }
  };

  const handleLogout = () => {
    logout();
    closeSidebarOnMobile();
    navigate('/login');
  };

  // Filter and group conversations chronologically like modern GPT applications
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      (c.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const pastWeek = today - 7 * 86400000;

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filtered.forEach((conv) => {
      const convTime = new Date(conv.updatedAt || conv.createdAt).getTime();
      if (convTime >= today) {
        groups.Today.push(conv);
      } else if (convTime >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convTime >= pastWeek) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Chat & Agents' },
    { to: '/files', icon: Folder, label: 'Documents & RAG' },
    { to: '/knowledge', icon: Brain, label: 'Memory Bank' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out theme-transition overflow-x-hidden ${
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
      <div className={`p-3 shrink-0 ${isSidebarOpen ? 'space-y-2.5' : 'space-y-3 flex flex-col items-center'}`}>
        {isSidebarOpen ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <AgentLogo size={32} className="transition-transform hover:scale-105" />
              <span
                className="font-bold text-base tracking-tight truncate animate-fade-in select-none"
                style={{ color: 'var(--text-primary)' }}
              >
                Agent AI
              </span>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg transition-colors hidden lg:inline-flex cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                aria-label="Collapse sidebar"
                title="Collapse sidebar (Ctrl+B)"
              >
                <PanelLeftClose className="w-4 h-4" />
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
        ) : (
          <div className="flex items-center justify-center w-full">
            <button
              type="button"
              onClick={toggleSidebar}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <div className="w-7 h-7 flex items-center justify-center transition-transform duration-200 group-hover:scale-95 group-hover:opacity-0">
                <AgentLogo size={28} />
              </div>
              <PanelLeftOpen
                className="w-4 h-4 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110"
                style={{ color: 'var(--text-primary)' }}
              />
            </button>
          </div>
        )}

        {/* New Chat Button */}
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
            style={{
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Start a new chat (Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-90" />
              <span>New Chat</span>
            </span>
            <span className="text-[10px] opacity-70 font-mono hidden sm:inline">Ctrl+K</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNewChat}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
            style={{
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="New chat (Ctrl+K)"
            aria-label="New chat"
          >
            <Plus className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-90" />
          </button>
        )}

        {/* Search Conversations Input */}
        {isSidebarOpen && conversations.length > 3 && (
          <div className="relative flex items-center animate-fade-in w-full">
            <Search className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs transition-all duration-150 focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation & Grouped Conversations List */}
      <div className={`flex-1 ${isSidebarOpen ? 'px-2.5 py-1 space-y-1' : 'px-2 py-2 space-y-2 flex flex-col items-center'} overflow-y-auto min-h-0`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebarOnMobile}
            title={!isSidebarOpen ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                isSidebarOpen
                  ? 'w-full gap-2.5 px-3 py-2 justify-start'
                  : 'w-9 h-9 justify-center p-0'
              }`
            }
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

        {/* Chronologically Grouped Chat History */}
        {isSidebarOpen && (
          <div className="pt-2.5 mt-2 space-y-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            {Object.entries(groupedConversations).map(([groupTitle, list]) => {
              if (list.length === 0) return null;

              return (
                <div key={groupTitle} className="space-y-0.5 animate-fade-in">
                  <span
                    className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {groupTitle}
                  </span>

                  {list.map((conv) => {
                    const isSelected = currentConversationId === conv.id;
                    const isEditing = editingId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && handleSelectConversation(conv.id)}
                        className="group relative w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all duration-150 flex items-center justify-between cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                          border: isSelected ? '1px solid var(--border-primary)' : '1px solid transparent'
                        }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e, conv.id);
                                if (e.key === 'Escape') handleCancelRename(e);
                              }}
                              autoFocus
                              className="w-full px-2 py-0.5 rounded text-xs focus:outline-none"
                              style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-primary)'
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => handleSaveRename(e, conv.id)}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                              title="Save title"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {conv.title?.startsWith('📄') ? (
                                <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              )}
                              <span className="truncate">{conv.title || 'New Conversation'}</span>
                            </div>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(e, conv)}
                                className="p-1 rounded hover:text-blue-400 transition-colors cursor-pointer"
                                title="Rename conversation"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="p-1 rounded hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className={`p-3 shrink-0 ${!isSidebarOpen ? 'flex flex-col items-center gap-2' : ''}`} style={{ borderTop: '1px solid var(--border-secondary)' }}>
        {isSidebarOpen ? (
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
            </div>
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
          </div>
        ) : (
          <>
            <ThemeToggle className="mx-auto" />
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold cursor-pointer transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)'
              }}
              title={`${user?.name || 'MiniGPT User'} (${user?.email || 'user@minigpt.dev'})`}
            >
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
