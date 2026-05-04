import { useState } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { useWeightHistory } from '../../hooks/useMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ranges = ['1W', '1M', '3M', '6M', '1Y'];

export default function WeightChart() {
  const [range, setRange] = useState('1M');
  const { data, isLoading, isError } = useWeightHistory(range.toLowerCase());

  if (isLoading) return <Card><h2 className="font-display text-base font-semibold text-espresso-800 mb-4">Weight Trend</h2><Spinner /></Card>;

  if (isError || !data) {
    return (
      <Card>
        <h2 className="font-display text-base font-semibold text-espresso-800 mb-4">Weight Trend</h2>
        <EmptyState title="No data yet" description="Log your weight to see trends." />
      </Card>
    );
  }

  const records = data.records || [];

  return (
    <Card hover>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-espresso-800">Weight Trend</h2>
        <div className="flex gap-1 bg-cream-100 rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                r === range
                  ? 'bg-white text-sage-700 shadow-sm'
                  : 'text-espresso-400 hover:text-espresso-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {records.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={records}>
            <defs>
              <linearGradient id="weightChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B8F71" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6B8F71" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7E0" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A8937C' }} axisLine={{ stroke: '#EDE7E0' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8937C' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #FDF3E7',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#3D3228', fontWeight: 600, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="weight_kg" fill="url(#weightChartGrad)" strokeWidth={0} />
            <Line type="monotone" dataKey="weight_kg" stroke="#6B8F71" strokeWidth={2.5} dot={{ r: 3, fill: '#6B8F71', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#6B8F71', stroke: 'white', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No data" description="Start logging your weight to see the trend." />
      )}
    </Card>
  );
}
