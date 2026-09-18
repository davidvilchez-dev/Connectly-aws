import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function EditProfile() {
  const navigate = useNavigate();
  const loggedInUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/login');
      return;
    }
    // Si el usuario no tiene bio, se inicializa con string vacío para cumplir la especificación
    setUsername(loggedInUser.username || '');
    setBio(loggedInUser.bio || '');
    setAvatarUrl(loggedInUser.avatarUrl || '');
  }, [loggedInUser, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      setImageFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let updatedUser = loggedInUser;

      // 1. Actualizar perfil básico (username, bio)
      const profileRes = await api.put(`/users/${loggedInUser.id}`, {
        username: username.trim(),
        bio: bio.trim(),
      });
      updatedUser = profileRes.data;

      // 2. Si hay nueva imagen, subirla a través del endpoint multipart
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const avatarRes = await api.put(`/users/${loggedInUser.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updatedUser = avatarRes.data;
      }

      // 3. Sincronizar el estado global de Zustand y actualizar localStorage
      updateUser(updatedUser);
      setSuccess(true);
      
      // Esperar brevemente y redirigir
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err: any) {
      console.error('Error al guardar el perfil:', err);
      setError(err.response?.data?.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feed-layout explore-layout">
      <Sidebar />
      <main className="feed-main" style={{ borderRight: 'none' }}>
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <h1 className="edit-profile-title">Editar Perfil</h1>
            <p className="edit-profile-subtitle">Personaliza tu presencia digital en Esencia.</p>
          </div>

          <div className="edit-profile-card">
            {error && (
              <div className="auth-error-banner" style={{ marginBottom: '24px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-error-banner" style={{ marginBottom: '24px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                <Check size={18} />
                <span>¡Perfil actualizado con éxito! Redirigiendo...</span>
              </div>
            )}

            <form onSubmit={handleSave} className="edit-profile-form">
              {/* Avatar Section */}
              <div className="edit-profile-avatar-section">
                <div className="edit-profile-avatar-preview-wrapper">
                  <img
                    src={imagePreview || avatarUrl || "/images/avatar_user.png"}
                    alt={username || "Avatar"}
                    className="edit-profile-avatar-preview"
                  />
                </div>
                <span className="edit-profile-avatar-label">Foto de Perfil</span>
                <button
                  type="button"
                  className="edit-profile-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  SUBIR FOTO DE PERFIL
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Form Fields */}
              <div className="edit-profile-form-group">
                <label className="edit-profile-label">Usuario</label>
                <input
                  type="text"
                  className="edit-profile-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nombre de usuario"
                  maxLength={50}
                  required
                />
              </div>

              <div className="edit-profile-form-group">
                <label className="edit-profile-label">Bio</label>
                <textarea
                  className="edit-profile-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escribe una pequeña biografía sobre ti..."
                  rows={4}
                  maxLength={250}
                />
              </div>

              {/* Action Buttons */}
              <div className="edit-profile-actions">
                <button
                  type="button"
                  className="edit-profile-btn-cancel"
                  onClick={() => navigate('/profile')}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="edit-profile-btn-save"
                  disabled={loading}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <Loader2 className="animate-spin" size={16} />
                      Guardando...
                    </div>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
