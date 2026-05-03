import Card from '../ui/Card';
import { useWeightHistory } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function WeightSparkline() {
  const { data, isLoading } = useWeightHistory('7d');
  const weights = data?.weights || [];
  const latest = weights[weights.length - 1]?.weight_kg;
  const first = weights[0]?.weight_kg;
  const change = latest && first ? (latest - first).toFixed(1) : null;

  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-2">Weight Trend</h2>
      {isLoading ? <Spinner /> : (
        <>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weights}>
                <Line type="monotone" dataKey="weight_kg" stroke="#16A34A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-slate-500">Last 7 days</span>
            {change && (
              <span className={change < 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {change > 0 ? '+' : ''}{change} kg
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
