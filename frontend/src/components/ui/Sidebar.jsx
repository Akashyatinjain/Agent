import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Folder, Brain, Settings, LogOut, Plus, ChevronLeft, Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { conversations, currentConversationId, setCurrentConversationId, setMessages } = useChatStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    navigate('/chat');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col justify-between w-64 bg-[#0e1320] border-r border-gray-800/80 transition-transform duration-300 shadow-2xl lg:shadow-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-16 lg:translate-x-0'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="MiniGPT Logo" className="w-8 h-8" />
            {isSidebarOpen && <span className="font-bold text-lg text-white tracking-tight">MiniGPT</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/60 transition-colors lg:hidden"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/60 transition-colors hidden lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all shadow-md shadow-slate-900/20"
        >
          <Plus className="w-4 h-4" />
          {isSidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-slate-800/80 text-white border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/50'
            }`
          }
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          {isSidebarOpen && <span>Chat</span>}
        </NavLink>

        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-slate-800/80 text-white border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/50'
            }`
          }
        >
          <Folder className="w-4 h-4 flex-shrink-0" />
          {isSidebarOpen && <span>Files & RAG</span>}
        </NavLink>

        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-slate-800/80 text-white border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/50'
            }`
          }
        >
          <Brain className="w-4 h-4 flex-shrink-0" />
          {isSidebarOpen && <span>Memories</span>}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-slate-800/80 text-white border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/50'
            }`
          }
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {isSidebarOpen && <span>Settings</span>}
        </NavLink>

        {/* History List */}
        {isSidebarOpen && conversations.length > 0 && (
          <div className="pt-4 border-t border-gray-800/80 space-y-1">
            <span className="px-3 text-xs font-semibold uppercase text-gray-500">History</span>
            {conversations.slice(0, 8).map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setCurrentConversationId(conv.id);
                  navigate('/chat');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-gray-800 text-white font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
              alt="Avatar"
              className="w-7 h-7 rounded-full bg-slate-700/80 flex-shrink-0"
            />
            {isSidebarOpen && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-gray-200 truncate">{user?.name || 'Guest User'}</span>
                <span className="text-[10px] text-gray-500 truncate">{user?.email || 'user@minigpt.dev'}</span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
