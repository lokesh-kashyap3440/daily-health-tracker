import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';

export function useMeals(date) {
  return useQuery({
    queryKey: ['meals', date],
    queryFn: () => api.get(`/meals?start=${date}&end=${date}`).then((r) => r.data),
    enabled: !!date,
  });
}

export function useAddMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/meals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
      toast.success('Meal added');
    },
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/meals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      toast.success('Meal removed');
    },
  });
}
