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

    // Temp assistant bubble placeholder
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

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-xl mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 animate-bounce">
              <Sparkles className="w-8 h-8 text-gray-200" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">MiniGPT AI Assistant</h2>
              <p className="text-sm text-gray-400">
                Your daily life problem-solving agent with an intelligent <span className="text-gray-200 font-semibold">Router Architecture</span>.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
              <div className="p-3.5 rounded-xl glass-panel border border-white/10 text-left space-y-1">
                <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                  <Brain className="w-4 h-4" />
                  <span>Intent Router</span>
                </div>
                <p className="text-[11px] text-gray-400">Classifies whether to use LLM, RAG documents, or external tools.</p>
              </div>

              <div className="p-3.5 rounded-xl glass-panel border border-white/10 text-left space-y-1">
                <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                  <Database className="w-4 h-4" />
                  <span>pgvector RAG</span>
                </div>
                <p className="text-[11px] text-gray-400">Upload PDFs/Notes for intelligent semantic retrieval.</p>
              </div>

              <div className="p-3.5 rounded-xl glass-panel border border-white/10 text-left space-y-1">
                <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                  <Wrench className="w-4 h-4" />
                  <span>API Tools</span>
                </div>
                <p className="text-[11px] text-gray-400">Calculates math, checks weather, and performs live web search.</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-4 sm:p-6 border-t border-gray-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <ChatInput onSend={handleSendMessage} disabled={isGenerating} />
      </div>
    </div>
  );
};

export default ChatWindow;
