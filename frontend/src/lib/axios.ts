import axios from 'axios';

// La URL base del backend, ajustada al puerto 8081.
// Cambia esto mediante variables de entorno en un futuro (import.meta.env.VITE_API_URL).
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token si existe en Zustand o localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
