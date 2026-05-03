import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';

export function useWorkouts(date) {
  return useQuery({
    queryKey: ['workouts', date],
    queryFn: () => api.get(`/workouts?start=${date}&end=${date}`).then((r) => r.data),
    enabled: !!date,
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/workouts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['dailyLog'] });
      toast.success('Workout added');
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/workouts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout removed');
    },
  });
}
