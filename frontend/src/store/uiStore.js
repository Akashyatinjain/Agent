import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('minigpt_theme');
    if (saved) return saved;
  }
  return 'light';
};

const getInitialSidebarState = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1024;
  }
  return true;
};

export const useUIStore = create((set) => ({
  isSidebarOpen: getInitialSidebarState(),
  isKnowledgeModalOpen: false,
  isUploadModalOpen: false,
  theme: getInitialTheme(),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebarOnMobile: () => set((state) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return { isSidebarOpen: false };
    }
    return state;
  }),
  setKnowledgeModalOpen: (isOpen) => set({ isKnowledgeModalOpen: isOpen }),
  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('minigpt_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
  setTheme: (theme) => {
    localStorage.setItem('minigpt_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    return set({ theme });
  }
}));

export default useUIStore;
