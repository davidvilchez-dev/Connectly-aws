import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/common/Logo';
import api from '../lib/axios';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: { username?: string; email?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio';
    } else if (username.trim().length < 3) {
      errors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
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
      // El backend espera RegisterRequest { username, email, password }
      const response = await api.post('/auth/register', { username, email, password });
      
      const { token, user } = response.data;
      setAuth(user || { username, email }, token);
      navigate('/feed');
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.response?.data?.message || 'No se pudo crear la cuenta. El correo o usuario ya podría estar en uso.');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar error de campo al escribir
  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
          <h2 className="text-2xl font-bold">Crear cuenta</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6" autoComplete="off">
          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white" htmlFor="username">
              Usuario
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${fieldErrors.username ? 'text-red-400' : 'text-text-muted'}`} />
              <input
                id="username"
                type="text"
                autoComplete="off"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value, setUsername)}
                placeholder="Tu nombre de usuario"
                className={`w-full rounded-lg border bg-input py-3 pl-11 pr-4 text-white placeholder-text-muted outline-none transition-colors focus:ring-1 ${
                  fieldErrors.username
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-border focus:border-white focus:ring-white'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="auth-field-error">
                <AlertCircle size={14} />
                {fieldErrors.username}
              </p>
            )}
          </div>

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
                onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                placeholder="ejemplo@esencia.com"
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
                onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
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
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
          <span>Ya tengo una cuenta {`->`} </span>
          <Link to="/login" className="font-bold text-white hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 text-xs text-text-muted">
        CONNECTLY © 2026
      </footer>
    </div>
  );
}
