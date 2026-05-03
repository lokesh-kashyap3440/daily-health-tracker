import { useState } from 'react';
import Card from '../ui/Card';
import { useWeightHistory } from '../../hooks/useMetrics';
import Spinner from '../ui/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ranges = ['1W', '1M', '3M', '6M', '1Y'];

export default function WeightChart() {
  const [range, setRange] = useState('1M');
  const { data, isLoading } = useWeightHistory(range.toLowerCase());

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Weight Trend</h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer ${r === range ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? <Spinner /> : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data?.weights || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="weight_kg" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
