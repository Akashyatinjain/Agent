import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';
import { sendMessageStreamApi } from '../../api/chat';
import { getFilesApi } from '../../api/files';
import {
  Sparkles, Loader2, ArrowDown,
  FileText, Menu, Plus, Compass, Code, Search
} from 'lucide-react';
import { AGENTS } from './AgentSelector';

export const ChatWindow = () => {
  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    currentConversationId,
    setCurrentConversationId,
    selectedModel,
    selectedAgent,
    isGenerating,
    setIsGenerating,
    isLoadingMessages,
    setActiveRouterIntent,
    fetchConversations,
    startNewChat
  } = useChatStore();

  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeSelectedDoc, setActiveSelectedDoc] = useState(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(currentConversationId);
  const abortControllerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const containerRef = useRef(null);
  const composerInputRef = useRef(null);

  const fetchUserFiles = async () => {
    try {
      const res = await getFilesApi();
      if (res.success && Array.isArray(res.files)) {
        setUploadedFiles(res.files);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserFiles();
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  const handleNewChatClick = useCallback(() => {
    startNewChat();
    setActiveSelectedDoc(null);
    navigate('/chat');
  }, [startNewChat, navigate]);

  // Global Ctrl+K / Cmd+K listener for instant New Chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChatClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChatClick]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isGenerating]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  const handleToggleDocTarget = (file) => {
    setActiveSelectedDoc((prev) => (prev?.id === file.id ? null : file));
  };

  const handleSendMessage = async (text, attachedFile = null) => {
    if (!text || isGenerating) return;

    const fileToAttach = attachedFile || activeSelectedDoc || null;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      attachedFile: fileToAttach,
      createdAt: new Date().toISOString()
    };

    addMessage(userMsg);
    setIsGenerating(true);
    setActiveRouterIntent(null);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };
    addMessage(assistantMsg);

    abortControllerRef.current = new AbortController();

    try {
      await sendMessageStreamApi(
        {
          message: text,
          conversationId: activeConversationIdRef.current,
          model: selectedModel,
          attachedFile: fileToAttach
        },
        (eventName, data) => {
          if (eventName === 'metadata' && data?.conversationId) {
            activeConversationIdRef.current = data.conversationId;
            setCurrentConversationId(data.conversationId);
            if (window.location.pathname !== `/chat/${data.conversationId}`) {
              window.history.replaceState(null, '', `/chat/${data.conversationId}`);
            }
          } else if (eventName === 'router_intent') {
            setActiveRouterIntent(data);
          } else if (eventName === 'token' && data?.chunk) {
            updateLastAssistantMessage(data.chunk);
          } else if (eventName === 'error') {
            updateLastAssistantMessage(`\n\n⚠️ ${data.message || 'Error receiving stream.'}`);
          }
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateLastAssistantMessage(`\n\n❌ Error: ${err.message || 'Failed to communicate with AI server.'}`);
      }
    } finally {
      setIsGenerating(false);
      setActiveRouterIntent(null);
      abortControllerRef.current = null;
      fetchConversations();
      fetchUserFiles();
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setActiveRouterIntent(null);
    }
  };

  const handleRegenerate = (lastUserMessage, attachedDoc = null) => {
    if (lastUserMessage && !isGenerating) {
      handleSendMessage(lastUserMessage, attachedDoc);
    }
  };

  const currentAgentObj = AGENTS.find((a) => a.id === (selectedAgent || 'auto')) || AGENTS[0];

  // Clean prompt cards
  const promptCategories = useMemo(() => [
    {
      icon: FileText,
      tag: 'Documents & RAG',
      title: uploadedFiles.length > 0 ? `Analyze ${uploadedFiles[0].name.slice(0, 24)}...` : 'Analyze uploaded document',
      desc: 'Extract key insights, certifications, and questions from your files',
      prompt: uploadedFiles.length > 0
        ? `Review and summarize key details from ${uploadedFiles[0].name}`
        : 'Analyze and review my uploaded document in detail'
    },
    {
      icon: Compass,
      tag: 'Resume Review',
      title: 'Review my resume',
      desc: 'Get structured feedback on strengths, gaps, and improvements',
      prompt: 'Review my resume: highlight key strengths, gaps, and suggested improvements'
    },
    {
      icon: Search,
      tag: 'Live Research',
      title: 'Real-time weather & web',
      desc: 'Query live forecasts, temperatures, and current web facts',
      prompt: 'What is the current weather in Tokyo and forecast for this week?'
    },
    {
      icon: Code,
      tag: 'Logic & Code',
      title: 'Calculate & logic evaluation',
      desc: 'Evaluate expressions and structure data seamlessly',
      prompt: 'Calculate 1450 * 12 - (3400 / 4) + 18% of 2500'
    }
  ], [uploadedFiles]);

  return (
    <div
      className="flex flex-col h-full w-full relative theme-transition min-h-0"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Sleek Top Navigation Header */}
      <header
        className="px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10"
        style={{
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg transition-colors lg:hidden cursor-pointer"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Agent AI
            </span>
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-tertiary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <currentAgentObj.icon className={`w-3 h-3 ${currentAgentObj.color}`} />
              <span>{currentAgentObj.name}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {uploadedFiles.length > 0 && (
            <Link
              to="/files"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)'
              }}
              title="View all uploaded documents"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{uploadedFiles.length} doc{uploadedFiles.length > 1 ? 's' : ''}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleNewChatClick}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            title="New Chat (Ctrl+K)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Target Document Bar (Only if user has uploaded docs; clickable to toggle targeting) */}
      {uploadedFiles.length > 0 && (
        <div
          className="px-3.5 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs shrink-0 overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-secondary)'
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold flex items-center gap-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
              Target Document:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {uploadedFiles.slice(0, 3).map((f) => {
                const isTargeted = activeSelectedDoc?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleToggleDocTarget(f)}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium text-[11px] transition-all shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: isTargeted ? 'var(--bg-accent)' : 'var(--bg-card)',
                      color: isTargeted ? 'var(--text-on-accent)' : 'var(--text-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                    title={isTargeted ? `Targeting ${f.name} (Click to unselect)` : `Click to target ${f.name}`}
                  >
                    <FileText className="w-3 h-3 shrink-0 text-blue-400" />
                    <span className="truncate max-w-[130px] sm:max-w-[180px]">{f.name}</span>
                    {isTargeted && <span className="text-[10px] ml-0.5 opacity-80">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4"
      >
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 animate-fade-in my-auto">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Loading conversation...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center space-y-5 sm:space-y-6 max-w-2xl mx-auto py-4 sm:py-8 px-2 animate-fade-in my-auto">
            {/* Header Greeting */}
            <div className="space-y-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-xs"
                style={{
                  backgroundColor: 'var(--bg-accent)',
                  color: 'var(--text-on-accent)'
                }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                What can I help with today?
              </h2>
              <p className="text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Ask questions, search through your documents, or run live tools naturally.
              </p>
            </div>

            {/* Prompt Suggestion Cards (GPT Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              {promptCategories.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => handleSendMessage(card.prompt, null)}
                  className="p-3.5 rounded-2xl text-left space-y-1.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      {card.tag}
                    </span>
                    <card.icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLastAssistant = !isGenerating && i === messages.length - 1 && msg.role === 'assistant';
            const prevUserMsg = i > 0 && messages[i - 1]?.role === 'user' ? messages[i - 1] : null;

            return (
              <div
                key={msg.id || i}
                className="animate-fade-in"
              >
                <MessageBubble
                  message={msg}
                  isStreaming={isGenerating && i === messages.length - 1 && msg.role === 'assistant'}
                  onRegenerate={isLastAssistant && prevUserMsg ? () => handleRegenerate(prevUserMsg.content, prevUserMsg.attachedFile) : null}
                  onRetry={isLastAssistant && prevUserMsg && msg.content.includes('Error') ? () => handleRegenerate(prevUserMsg.content, prevUserMsg.attachedFile) : null}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-20 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Sticky Message Composer */}
      <div
        className="p-2 sm:p-4 md:p-6 theme-transition shrink-0"
        style={{
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <ChatInput
          ref={composerInputRef}
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          disabled={isLoadingMessages}
          isGenerating={isGenerating}
          activeDocument={activeSelectedDoc}
        />
      </div>
    </div>
  );
};

export default ChatWindow;