import { create } from 'zustand';

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content = theme === 'dark' ? '#121214' : '#4a6741';
  }
}

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    const { theme } = get();
    applyTheme(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ theme: newTheme });
      }
    });
  },
}));

export default useThemeStore;
