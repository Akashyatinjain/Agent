import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  isKnowledgeModalOpen: false,
  isUploadModalOpen: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setKnowledgeModalOpen: (isOpen) => set({ isKnowledgeModalOpen: isOpen }),
  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen })
}));

export default useUIStore;
