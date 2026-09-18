import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Smile, Send, X, Upload, AlertCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const EMOJI_CATEGORIES = {
  smileys: {
    icon: '😊',
    label: 'Caras',
    emojis: ['😊', '😂', '🥰', '😍', '🤣', '😅', '😎', '😜', '🤔', '🙄', '😢', '😡', '😱', '😴', '🤤', '🤩', '🥳', '🤯']
  },
  gestures: {
    icon: '👍',
    label: 'Gestos',
    emojis: ['👍', '👎', '👊', '✌️', '👌', '👋', '🙌', '👏', '🤝', '🙏', '🔥', '✨', '💯', '🚀', '⭐', '💥', '🎉', '💡']
  },
  hearts: {
    icon: '❤️',
    label: 'Varios',
    emojis: ['❤️', '💖', '💕', '💔', '💙', '💜', '🖤', '💻', '🎮', '🍕', '🍻', '☕', '🌎', '👑', '🌈', '🎁', '🎈', '👀']
  }
};

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'smileys' | 'gestures' | 'hearts'>('smileys');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newContent = before + emoji + after;
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        
        // Auto-grow
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen no debe superar los 10MB');
        return;
      }
      setImageFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Escribe algo para publicar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post('/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/feed');
    } catch (err: any) {
      console.error('Error al publicar:', err);
      setError(err.response?.data?.message || 'Error al crear la publicación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const canPublish = content.trim().length > 0 && !loading;

  return (
    <div className="feed-layout explore-layout">
      <Sidebar />

      <main className="feed-main create-main-container">
        <div className="create-page">
          {/* Header */}
          <div className="create-page-header">
            <div className="create-page-header-left">
              <img
                src={user?.avatarUrl || "/images/avatar_user.png"}
                alt="Tu avatar"
                className="create-page-avatar"
              />
              <div>
                <h2 className="create-page-title">Nueva Publicación</h2>
                <span className="create-page-visibility">Compartiendo con: Público</span>
              </div>
            </div>
            <button
              className="create-page-close"
              onClick={() => navigate('/feed')}
              title="Cerrar"
            >
              <X size={22} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-banner" style={{ margin: '0 0 16px 0' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            className="create-page-textarea"
            placeholder="Comparte algo con el mundo..."
            value={content}
            rows={1}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
              // Auto-grow
              const el = textareaRef.current;
              if (el) {
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 300) + 'px';
              }
            }}
            maxLength={2000}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="create-page-image-preview">
              <img src={imagePreview} alt="Vista previa" />
              <button className="create-page-image-remove" onClick={removeImage}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Upload Area */}
          {!imagePreview && (
            <div className="create-page-upload-section">
              <label className="create-page-upload-label">Subir imagen</label>
              <button
                className="create-page-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                <span>Seleccionar archivo</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            style={{ display: 'none' }}
          />

          {/* Bottom Actions */}
          <div className="create-page-bottom">
            <div className="create-page-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="create-page-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Agregar imagen"
                disabled={loading}
              >
                <Image size={20} />
              </button>
              
              <div ref={emojiPickerRef} style={{ position: 'relative' }}>
                <button
                  className={`create-page-tool-btn ${showEmojiPicker ? 'active' : ''}`}
                  title="Emoji"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={loading}
                  type="button"
                  style={{
                    background: showEmojiPicker ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderRadius: '50%',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Smile size={20} style={{ color: showEmojiPicker ? 'var(--color-accent)' : 'inherit' }} />
                </button>

                {showEmojiPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '12px',
                      width: '280px',
                      background: 'rgba(23, 23, 37, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                      padding: '12px',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', gap: '6px' }}>
                      {Object.entries(EMOJI_CATEGORIES).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setActiveCategory(key as any)}
                          type="button"
                          style={{
                            flex: 1,
                            background: activeCategory === key ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'background 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{value.icon}</span>
                          <span style={{ fontSize: '0.65rem', color: activeCategory === key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                            {value.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Emoji Grid */}
                    <div
                      className="emoji-grid-scroll"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '6px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        paddingRight: '2px'
                      }}
                    >
                      {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          type="button"
                          className="emoji-item-btn"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.4rem',
                            padding: '4px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s, background 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className={`create-page-publish ${canPublish ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!canPublish}
            >
              {loading ? (
                <span className="create-page-publish-loading">Publicando...</span>
              ) : (
                <>
                  Publicar
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}
