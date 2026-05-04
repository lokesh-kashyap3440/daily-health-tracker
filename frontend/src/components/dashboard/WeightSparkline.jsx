import Card from '../ui/Card';
import { useWeightHistory } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function WeightSparkline() {
  const { data, isLoading } = useWeightHistory('7d');
  const weights = data?.records || [];
  const latest = weights[weights.length - 1]?.weight_kg;
  const first = weights[0]?.weight_kg;
  const change = latest && first ? (latest - first).toFixed(1) : null;

  const isDown = change && parseFloat(change) < 0;
  const isUp = change && parseFloat(change) > 0;

  return (
    <Card hover>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-semibold text-espresso-800">Weight Trend</h2>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isDown ? 'bg-green-100 text-green-700' : isUp ? 'bg-terracotta-100 text-terracotta-700' : 'bg-cream-200 text-espresso-500'
          }`}>
            {isDown ? <TrendingDown size={14} /> : isUp ? <TrendingUp size={14} /> : <Minus size={14} />}
            {change > 0 ? '+' : ''}{change} kg
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <div className="h-20 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weights}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B8F71" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6B8F71" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="weight_kg" stroke="#6B8F71" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="weight_kg" fill="url(#weightGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-espresso-400 font-medium">Last 7 days</span>
            {latest && (
              <span className="text-sm font-bold text-espresso-700 font-display">
                {latest} <span className="text-xs font-normal text-espresso-400">kg</span>
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
