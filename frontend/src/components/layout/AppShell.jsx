import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-cream-100 grain-overlay dark:bg-dark-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 page-enter">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
