import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import ThemeFloatingToggle from './components/theme/ThemeFloatingToggle';

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <ThemeFloatingToggle />
    </BrowserRouter>
  );
}
