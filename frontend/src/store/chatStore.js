import { create } from 'zustand';
import {
  fetchConversationsApi,
  fetchConversationByIdApi,
  renameConversationApi,
  deleteConversationApi
} from '../api/chat';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  selectedModel: 'gemini',
  selectedAgent: 'general',
  searchQuery: '',
  isGenerating: false,
  isLoadingMessages: false,
  activeRouterIntent: null,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setActiveRouterIntent: (intent) => set({ activeRouterIntent: intent }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  startNewChat: () => {
    set({
      currentConversationId: null,
      messages: [],
      activeRouterIntent: null,
      isGenerating: false,
      isLoadingMessages: false
    });
  },

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
      get().startNewChat();
      return;
    }

    set({ currentConversationId: id, isLoadingMessages: true });
    try {
      const res = await fetchConversationByIdApi(id);
      if (res.success && res.conversation) {
        set({
          messages: res.conversation.messages || [],
          selectedModel: res.conversation.model || get().selectedModel
        });
      }
    } catch (err) {
      console.warn('Failed to load conversation:', err.message);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  renameConversation: async (id, newTitle) => {
    if (!id || !newTitle?.trim()) return;
    const clean = newTitle.trim();
    // Optimistic UI update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title: clean } : c
      )
    }));

    try {
      await renameConversationApi(id, clean);
    } catch (err) {
      console.warn('Failed to rename conversation on server:', err.message);
      get().fetchConversations();
    }
  },

  deleteConversation: async (id) => {
    try {
      await deleteConversationApi(id);
      const conversations = get().conversations.filter((c) => c.id !== id);
      set({ conversations });
      if (get().currentConversationId === id) {
        get().startNewChat();
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
