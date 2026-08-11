import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('minigpt_user') || 'null'),
  token: localStorage.getItem('minigpt_token') || null,
  isAuthenticated: !!localStorage.getItem('minigpt_token'),

  setAuth: (user, token) => {
    localStorage.setItem('minigpt_token', token);
    localStorage.setItem('minigpt_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('minigpt_token');
    localStorage.removeItem('minigpt_user');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
