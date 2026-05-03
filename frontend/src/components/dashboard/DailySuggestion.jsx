import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useSuggestions } from '../../hooks/useSuggestions';
import api from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DailySuggestion() {
  const { data, isLoading } = useSuggestions();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/suggestions/refresh');
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('New suggestion generated');
    } catch {
      toast.error('Failed to refresh');
    }
    setRefreshing(false);
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} className="text-green-600" />
          <h2 className="font-semibold text-green-800">Daily AI Suggestion</h2>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="p-1.5 hover:bg-green-100 rounded-lg cursor-pointer disabled:opacity-50">
          <RefreshCw size={18} className={`text-green-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {isLoading ? <Spinner /> : (
        <p className="text-sm text-slate-700 leading-relaxed">{data?.content || 'Complete your profile to get personalized health suggestions.'}</p>
      )}
    </Card>
  );
}
