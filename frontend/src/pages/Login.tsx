import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/common/Logo';
import api from '../lib/axios';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (password.length < 3) {
      errors.password = 'La contraseña debe tener al menos 3 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    
    try {
      // El backend espera un objeto LoginRequest { email, password }
      const response = await api.post('/auth/login', { email, password });
      // Asumiendo que la respuesta AuthResponse contiene { token, user: { ... } }
      const { token, user } = response.data;
      
      setAuth(user || { email }, token);
      navigate('/feed');
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.response?.data?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar error de campo al escribir
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (error) setError('');
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (error) setError('');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo size="xl" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-text-muted">Bienvenido de nuevo</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6" autoComplete="off">
          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${fieldErrors.email ? 'text-red-400' : 'text-text-muted'}`} />
              <input
                id="email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className={`w-full rounded-lg border bg-input py-3 pl-11 pr-4 text-white placeholder-text-muted outline-none transition-colors focus:ring-1 ${
                  fieldErrors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-border focus:border-white focus:ring-white'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="auth-field-error">
                <AlertCircle size={14} />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${fieldErrors.password ? 'text-red-400' : 'text-text-muted'}`} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-input py-3 pl-11 pr-11 text-white placeholder-text-muted outline-none transition-colors focus:ring-1 ${
                  fieldErrors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-border focus:border-white focus:ring-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="auth-field-error">
                <AlertCircle size={14} />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-3 text-center font-semibold text-black transition-opacity hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted">
          <span>¿No tienes una cuenta? </span>
          <Link to="/register" className="font-bold text-white hover:underline">
            Regístrate
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-xs text-text-muted">
        CONNECTLY © 2026
      </footer>
    </div>
  );
}
