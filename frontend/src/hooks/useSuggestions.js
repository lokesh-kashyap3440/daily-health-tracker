import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions', 'today'],
    queryFn: () => api.get('/suggestions/today').then((r) => r.data),
    staleTime: 60_000,
  });
}
