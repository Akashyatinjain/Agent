import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import { sendMessageStreamApi } from '../../api/chat';
import { Sparkles, Brain, Database, Wrench } from 'lucide-react';

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
    setActiveRouterIntent
  } = useChatStore();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    addMessage(userMsg);
    setIsGenerating(true);
    setActiveRouterIntent(null);

    const assistantMsg = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };
    addMessage(assistantMsg);

    try {
      await sendMessageStreamApi(
        {
          message: text,
          conversationId: currentConversationId,
          model: selectedModel
        },
        (eventName, data) => {
          if (eventName === 'metadata' && data.conversationId) {
            setCurrentConversationId(data.conversationId);
          } else if (eventName === 'router_intent') {
            setActiveRouterIntent(data);
          } else if (eventName === 'token' && data.chunk) {
            updateLastAssistantMessage(data.chunk);
          }
        }
      );
    } catch (err) {
      updateLastAssistantMessage('\n\n❌ Error processing message: ' + err.message);
    } finally {
      setIsGenerating(false);
      setActiveRouterIntent(null);
    }
  };

  const featureCards = [
    {
      icon: Brain,
      title: 'Intent Router',
      desc: 'Classifies whether to use LLM, RAG documents, or external tools.'
    },
    {
      icon: Database,
      title: 'pgvector RAG',
      desc: 'Upload PDFs/Notes for intelligent semantic retrieval.'
    },
    {
      icon: Wrench,
      title: 'API Tools',
      desc: 'Calculates math, checks weather, and performs live web search.'
    }
  ];

  return (
    <div
      className="flex flex-col h-full w-full relative theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6 max-w-xl mx-auto py-6 sm:py-12 px-2 animate-fade-in">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center animate-float shrink-0"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h2
                className="text-lg sm:text-2xl font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                MiniGPT AI Assistant
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Your daily life problem-solving agent with an intelligent{' '}
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Router Architecture
                </span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full pt-2">
              {featureCards.map((card, i) => (
                <div
                  key={card.title}
                  className={`p-3 sm:p-3.5 rounded-xl text-left space-y-1 sm:space-y-1.5 transition-all duration-200 animate-fade-in-up stagger-${i + 1}`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <card.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    <span
                      className="font-semibold text-xs"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {card.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id}
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <MessageBubble message={msg} />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-2.5 sm:p-4 md:p-6 theme-transition shrink-0"
        style={{
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <ChatInput onSend={handleSendMessage} disabled={isGenerating} />
      </div>
    </div>
  );
};

export default ChatWindow;