import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <span className="text-6xl mb-4">🏥</span>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-slate-500 mb-6">Page not found</p>
      <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
    </div>
  );
}
