import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('minigpt_theme');
    if (saved) return saved;
  }
  return 'light';
};

const getInitialDesktopSidebarState = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('minigpt_desktop_sidebar_open');
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return true;
};

export const useUIStore = create((set) => ({
  isDesktopSidebarOpen: getInitialDesktopSidebarState(),
  isMobileDrawerOpen: false, // Mobile drawer ALWAYS starts closed!
  isSidebarOpen: getInitialDesktopSidebarState(), // legacy compatibility
  isKnowledgeModalOpen: false,
  isUploadModalOpen: false,
  theme: getInitialTheme(),

  toggleSidebar: () => set((state) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      const next = !state.isMobileDrawerOpen;
      return { isMobileDrawerOpen: next, isSidebarOpen: next };
    } else {
      const next = !state.isDesktopSidebarOpen;
      if (typeof window !== 'undefined') {
        localStorage.setItem('minigpt_desktop_sidebar_open', String(next));
      }
      return { isDesktopSidebarOpen: next, isSidebarOpen: next };
    }
  }),
  setSidebarOpen: (isOpen) => set((state) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      return { isMobileDrawerOpen: isOpen, isSidebarOpen: isOpen };
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('minigpt_desktop_sidebar_open', String(isOpen));
      }
      return { isDesktopSidebarOpen: isOpen, isSidebarOpen: isOpen };
    }
  }),
  openMobileDrawer: () => set({ isMobileDrawerOpen: true, isSidebarOpen: true }),
  closeMobileDrawer: () => set({ isMobileDrawerOpen: false, isSidebarOpen: false }),
  closeSidebarOnMobile: () => set({ isMobileDrawerOpen: false, isSidebarOpen: false }),
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
