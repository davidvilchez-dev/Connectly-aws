import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Bienvenido al Dashboard</h1>
        {user?.email && <p className="text-text-muted mb-8">{user.email}</p>}
        {user?.username && <p className="text-text-muted mb-8">@{user.username}</p>}
        
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition-opacity hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}