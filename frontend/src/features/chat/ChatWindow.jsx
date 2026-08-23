import React, { useEffect, useRef, useState, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import { sendMessageStreamApi } from '../../api/chat';
import { getFilesApi } from '../../api/files';
import { Sparkles, Brain, Database, Wrench, Loader2, ArrowDown, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChatWindow = () => {
  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    currentConversationId,
    setCurrentConversationId,
    selectedModel,
    isGenerating,
    setIsGenerating,
    isLoadingMessages,
    setActiveRouterIntent,
    fetchConversations
  } = useChatStore();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeSelectedDoc, setActiveSelectedDoc] = useState(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(currentConversationId);
  const abortControllerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const containerRef = useRef(null);

  const fetchUserFiles = async () => {
    try {
      const res = await getFilesApi();
      if (res.success && Array.isArray(res.files)) {
        setUploadedFiles(res.files);
        if (res.files.length > 0 && !activeSelectedDoc) {
          setActiveSelectedDoc(res.files[0]);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserFiles();
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

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

  const handleRegenerate = (lastUserMessage) => {
    if (lastUserMessage && !isGenerating) {
      handleSendMessage(lastUserMessage);
    }
  };

  const promptStarters = useMemo(() => [
    {
      title: 'Analyze Document',
      prompt: uploadedFiles.length > 0
        ? `Review and extract the key details from ${uploadedFiles[0].name}`
        : 'Analyze and review my uploaded document in detail',
      icon: '📄'
    },
    {
      title: 'Resume Review',
      prompt: 'Review my resume: highlight key strengths, gaps, and suggested improvements',
      icon: '💼'
    },
    {
      title: 'Real-time Weather',
      prompt: 'What is the current weather in Tokyo and forecast for this week?',
      icon: '🌤️'
    },
    {
      title: 'Math Calculation',
      prompt: 'Calculate 1450 * 12 - (3400 / 4) + 18% of 2500',
      icon: '🔢'
    }
  ], [uploadedFiles]);

  const featureCards = useMemo(() => [
    {
      icon: Brain,
      title: 'AI Intent Router',
      desc: 'Intelligently classifies intent to choose LLM, pgvector RAG, or Live Tool APIs.'
    },
    {
      icon: Database,
      title: 'pgvector RAG',
      desc: 'Instant semantic retrieval across your uploaded notes, resumes & documents.'
    },
    {
      icon: Wrench,
      title: 'Live API Tools',
      desc: 'Calculates math expressions, checks live weather, and searches the web.'
    }
  ], []);

  return (
    <div
      className="flex flex-col h-full w-full relative theme-transition min-h-0"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Uploaded Documents Indicator Bar */}
      {uploadedFiles.length > 0 && (
        <div
          className="px-3 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs shrink-0 overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold flex items-center gap-1.5 shrink-0" style={{ color: 'var(--text-secondary)' }}>
              <Database className="w-3.5 h-3.5 text-emerald-500" /> Active RAG Documents:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {uploadedFiles.slice(0, 3).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveSelectedDoc(f)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: activeSelectedDoc?.id === f.id ? 'var(--bg-accent)' : 'var(--bg-card)',
                    color: activeSelectedDoc?.id === f.id ? 'var(--text-on-accent)' : 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  title={`Click to target "${f.name}"`}
                >
                  <FileText className="w-3 h-3 shrink-0 text-blue-400" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{f.name}</span>
                  <span className="text-[10px] opacity-75">({f.chunkCount || 0} chunks)</span>
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/files"
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors shrink-0 hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            Manage Files <ChevronRight className="w-3 h-3" />
          </Link>
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
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Loading conversation history...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto py-4 sm:py-8 px-2 animate-fade-in my-auto">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center animate-float shrink-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                MiniGPT AI Assistant
              </h2>
              <p className="text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Ask anything, run real-time tools, or query your uploaded documents with intelligent routing.
              </p>
            </div>

            {/* Active Document Card if user has uploaded a file */}
            {uploadedFiles.length > 0 && (
              <div
                className="p-3.5 rounded-2xl w-full flex items-center justify-between gap-3 text-left animate-scale-in"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {uploadedFiles[0].name}
                    </span>
                    <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Indexed into pgvector RAG ({uploadedFiles[0].chunkCount || 0} chunks ready)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendMessage(`Analyze and summarize all key points from ${uploadedFiles[0].name}`, uploadedFiles[0])}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-on-accent)'
                  }}
                >
                  Analyze File
                </button>
              </div>
            )}

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {featureCards.map((card, i) => (
                <div
                  key={card.title}
                  className="p-3 sm:p-3.5 rounded-xl text-left space-y-1 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <card.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                      {card.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Prompt Starters */}
            <div className="w-full pt-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase block mb-2" style={{ color: 'var(--text-muted)' }}>
                Suggested Questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {promptStarters.map((starter) => (
                  <button
                    key={starter.title}
                    onClick={() => handleSendMessage(starter.prompt, uploadedFiles[0] || null)}
                    className="p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left group cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span>{starter.icon}</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{starter.title}:</span>
                      <span className="truncate" style={{ color: 'var(--text-tertiary)' }}>{starter.prompt}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLastAssistant = !isGenerating && i === messages.length - 1 && msg.role === 'assistant';
            const prevUserMsg = i > 0 && messages[i - 1]?.role === 'user' ? messages[i - 1].content : null;

            return (
              <div
                key={msg.id || i}
                className="animate-fade-in"
              >
                <MessageBubble
                  message={msg}
                  isStreaming={isGenerating && i === messages.length - 1 && msg.role === 'assistant'}
                  onRegenerate={isLastAssistant && prevUserMsg ? () => handleRegenerate(prevUserMsg) : null}
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

      {/* Message Composer */}
      <div
        className="p-2 sm:p-4 md:p-6 theme-transition shrink-0"
        style={{
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <ChatInput
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