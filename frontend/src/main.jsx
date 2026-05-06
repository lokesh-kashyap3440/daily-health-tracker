import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import useThemeStore from './store/themeStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeInitializer({ children }) {
  const initTheme = useThemeStore((s) => s.initTheme);
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => { initTheme(); }, [initTheme]);
  return children;
}

function ToasterWithTheme() {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: theme === 'dark' ? '#2e2e32' : 'white',
          color: theme === 'dark' ? '#fefcf9' : '#3d3228',
          border: theme === 'dark' ? '1px solid #434348' : '1px solid #fdf3e7',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <App />
      </ThemeInitializer>
      <ToasterWithTheme />
    </QueryClientProvider>
  </StrictMode>
);
