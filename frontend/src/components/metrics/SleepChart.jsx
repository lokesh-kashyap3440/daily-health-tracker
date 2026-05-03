import Card from '../ui/Card';
import { useMetrics } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SleepChart() {
  const { data, isLoading } = useMetrics('1m');

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Sleep Pattern</h2>
      {isLoading ? <Spinner /> : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.sleep_data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" domain={[0, 12]} />
            <Tooltip />
            <Bar dataKey="hours" name="Sleep Hours" fill="#818CF8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
