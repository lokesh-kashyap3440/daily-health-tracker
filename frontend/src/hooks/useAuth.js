import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      sessionStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Login failed'),
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: () => {
      toast.success('Account created! Please log in.');
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Registration failed'),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return () => {
    api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };
}
