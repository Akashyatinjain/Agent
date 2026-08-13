import { create } from 'zustand';
import { fetchConversationsApi, fetchConversationByIdApi, deleteConversationApi } from '../api/chat';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  selectedModel: 'gemini',
  isGenerating: false,
  isLoadingMessages: false,
  activeRouterIntent: null,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setActiveRouterIntent: (intent) => set({ activeRouterIntent: intent }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  fetchConversations: async () => {
    try {
      const res = await fetchConversationsApi();
      if (res.success && Array.isArray(res.conversations)) {
        set({ conversations: res.conversations });
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err.message);
    }
  },

  loadConversation: async (id) => {
    if (!id) {
      set({ currentConversationId: null, messages: [] });
      return;
    }

    set({ currentConversationId: id, isLoadingMessages: true });
    try {
      const res = await fetchConversationByIdApi(id);
      if (res.success && res.conversation) {
        set({ messages: res.conversation.messages || [] });
      }
    } catch (err) {
      console.warn('Failed to load conversation:', err.message);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      await deleteConversationApi(id);
      const conversations = get().conversations.filter((c) => c.id !== id);
      set({ conversations });
      if (get().currentConversationId === id) {
        set({ currentConversationId: null, messages: [] });
      }
    } catch (err) {
      console.warn('Failed to delete conversation:', err.message);
    }
  },

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

