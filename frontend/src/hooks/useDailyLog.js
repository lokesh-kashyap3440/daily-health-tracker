import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export function useDailyLog(date) {
  return useQuery({
    queryKey: ['dailyLog', date],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) return api.get('/daily-logs/today').then((r) => r.data);
      return api.get(`/daily-logs/date/${date}`).then((r) => r.data);
    },
  });
}

export function useCreateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/daily-logs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
    },
  });
}
