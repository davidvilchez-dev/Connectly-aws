import { useState, useEffect, useRef } from 'react';
import { Home, Compass, PlusSquare, User, LogOut, Search, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../common/Logo';
import api from '../../lib/axios';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/feed' },
  { icon: Compass, label: 'Explorar', path: '/explore' },
  { icon: PlusSquare, label: 'Crear', path: '/create' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showLogout, setShowLogout] = useState(false);

  const displayName = user?.username || user?.email?.split('@')[0] || 'Usuario';

  // Estados del Buscador de Usuarios
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic fuera del buscador
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchFocus = async () => {
    setShowDropdown(true);
    if (usersLoaded) return;

    try {
      setLoadingSearch(true);
      const response = await api.get('/users');
      // Filtrar al propio usuario conectado para que no se busque a sí mismo
      const filtered = response.data.filter((u: any) => u.id !== user?.id);
      setAllUsers(filtered);
      setUsersLoaded(true);
    } catch (err) {
      console.error('Error al precargar usuarios para el buscador:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const filteredUsers = allUsers.filter((u: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true; // Si está vacío pero enfocado, mostrar todos
    
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return username.includes(query) || email.includes(query);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/feed" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="sidebar-logo">
          <Logo size="md" />
        </div>
      </Link>

      {/* Buscador de Usuarios Premium Autocontenido */}
      <div className="sidebar-search-container" ref={searchRef}>
        <div className="sidebar-search-wrapper">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
            onFocus={handleSearchFocus}
          />
          <Search className="sidebar-search-icon" size={16} />
          {loadingSearch && (
            <Loader2 className="sidebar-search-loading-icon animate-spin" size={16} style={{ position: 'absolute', right: '12px', color: 'var(--color-accent)' }} />
          )}
        </div>

        {showDropdown && (
          <div className="sidebar-search-dropdown">
            {loadingSearch && allUsers.length === 0 ? (
              <div className="sidebar-search-loading">
                <Loader2 className="animate-spin" size={14} />
                <span>Cargando...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="sidebar-search-no-results">
                <span>Sin resultados</span>
              </div>
            ) : (
              filteredUsers.map((u: any) => {
                const name = u.username || u.email.split('@')[0];
                const avatar = u.avatarUrl || '/images/avatar_user.png';
                return (
                  <div
                    key={u.id}
                    className="sidebar-search-item"
                    onClick={() => {
                      navigate(`/profile/${u.id}`);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <img src={avatar} alt={name} className="sidebar-search-avatar" />
                    <div className="sidebar-search-info">
                      <span className="sidebar-search-name">@{name}</span>
                      <span className="sidebar-search-email">{u.email}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-nav-icon" strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile (bottom) */}
      <div
        className="sidebar-profile-wrapper"
        onMouseEnter={() => setShowLogout(true)}
        onMouseLeave={() => setShowLogout(false)}
      >
        {/* Logout Popup */}
        <div className={`sidebar-logout-popup ${showLogout ? 'visible' : ''}`}>
          <div className="sidebar-logout-popup-inner">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="sidebar-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <img
            src={user?.avatarUrl || "/images/avatar_user.png"}
            alt="Tu perfil"
            className="sidebar-profile-avatar"
          />
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">Tu Perfil</span>
            <span className="sidebar-profile-username">@{displayName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
