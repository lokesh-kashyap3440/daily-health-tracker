import { create } from 'zustand';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  if (theme === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#121214' : '#4a6741');
  }
}

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage may be unavailable (private browsing, storage full)
    }
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    // Apply the initial theme (inline script already did this, but this is
    // the React-side confirmation to handle any timing edge cases)
    const { theme } = get();
    applyTheme(theme);

    // Listen for OS-level theme changes (only when user hasn't set a preference)
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        try {
          const stored = localStorage.getItem('theme');
          if (!stored) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            set({ theme: newTheme });
          }
        } catch {
          // ignore localStorage errors
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      // matchMedia not available
    }
  },
}));

export default useThemeStore;