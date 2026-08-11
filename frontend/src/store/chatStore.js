import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  selectedModel: 'gemini',
  isGenerating: false,
  activeRouterIntent: null,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setActiveRouterIntent: (intent) => set({ activeRouterIntent: intent }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (chunk) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length === 0) return { messages: msgs };

      const lastIdx = msgs.length - 1;
      if (msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          content: msgs[lastIdx].content + chunk
        };
      } else {
        msgs.push({
          id: `temp-${Date.now()}`,
          role: 'assistant',
          content: chunk,
          createdAt: new Date().toISOString()
        });
      }
      return { messages: msgs };
    })
}));

export default useChatStore;
