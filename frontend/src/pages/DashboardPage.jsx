import { useDailyLog } from '../hooks/useDailyLog';
import SummaryCards from '../components/dashboard/SummaryCards';
import DailySuggestion from '../components/dashboard/DailySuggestion';
import QuickLog from '../components/dashboard/QuickLog';
import WeightSparkline from '../components/dashboard/WeightSparkline';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const today = new Date().toISOString().split('T')[0];

export default function DashboardPage() {
  const { data: log, isLoading } = useDailyLog(today);
  const navigate = useNavigate();

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <DailySuggestion />

      <SummaryCards summary={log} />

      <WeightSparkline />

      <QuickLog />
    </div>
  );
}
