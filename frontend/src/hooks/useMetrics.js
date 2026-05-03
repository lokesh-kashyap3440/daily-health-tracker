import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useMetrics(range = '1m') {
  const rangeDays = { '7d': 7, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
  const days = rangeDays[range.toLowerCase()] || 30;
  return useQuery({
    queryKey: ['metrics', range],
    queryFn: () => api.get(`/metrics/dashboard`).then((r) => r.data),
    staleTime: 300_000,
  });
}

export function useWeightHistory(range = '1m') {
  const rangeDays = { '7d': 7, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
  const days = rangeDays[range.toLowerCase()] || 30;
  return useQuery({
    queryKey: ['weightHistory', range],
    queryFn: () => api.get(`/metrics/weight?days=${days}`).then((r) => r.data),
    staleTime: 300_000,
  });
}

export function useCalorieHistory(range = '1m') {
  const rangeDays = { '7d': 7, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
  const days = rangeDays[range.toLowerCase()] || 30;
  return useQuery({
    queryKey: ['calories', range],
    queryFn: () => api.get(`/metrics/summary?days=${days}`).then((r) => r.data),
    staleTime: 300_000,
  });
}
