import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isAuthenticated: !!sessionStorage.getItem('access_token'),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setProfile: (profile) => set({ profile }),
  logout: () => {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, profile: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
