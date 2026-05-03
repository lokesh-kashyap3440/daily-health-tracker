import Card from '../ui/Card';
import { useCalorieHistory } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CalorieChart() {
  const { data, isLoading } = useCalorieHistory('1m');

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-4">Calorie Balance</h2>
      {isLoading ? <Spinner /> : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.calories || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
            <Tooltip />
            <Legend />
            <Bar dataKey="consumed" name="Consumed" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="burned" name="Burned" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
