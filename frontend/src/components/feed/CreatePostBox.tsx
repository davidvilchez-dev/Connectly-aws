import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Image, Smile, X, Loader2, AlertCircle, Send } from 'lucide-react';
import api from '../../lib/axios';

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

interface CreatePostBoxProps {
  onPostCreated?: (newPost: any) => void;
}

export default function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
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

      const response = await api.post('/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Limpiar campos tras éxito
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = '40px';

      if (onPostCreated) {
        onPostCreated(response.data);
      }
    } catch (err: any) {
      console.error('Error al publicar:', err);
      setError(err.response?.data?.message || 'Error al crear la publicación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const canPublish = content.trim().length > 0 && !loading;

  return (
    <div className="create-post-box">
      {error && (
        <div className="auth-error-banner" style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      <div className="create-post-top" style={{ alignItems: 'flex-start' }}>
        <img
          src={user?.avatarUrl || "/images/avatar_user.png"}
          alt="Tu avatar"
          className="create-post-avatar"
          style={{ marginTop: '2px' }}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError('');
            // Auto-grow
            const el = textareaRef.current;
            if (el) {
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 150) + 'px';
            }
          }}
          placeholder="¿Qué estás pensando?"
          className="create-post-input"
          style={{
            resize: 'none',
            height: '40px',
            minHeight: '40px',
            borderRadius: '16px',
            padding: '10px 18px',
            overflowY: 'hidden',
            scrollbarWidth: 'none'
          }}
          disabled={loading}
        />
      </div>

      {imagePreview && (
        <div className="create-page-image-preview" style={{ marginTop: '8px', marginBottom: '12px' }}>
          <img src={imagePreview} alt="Vista previa" style={{ borderRadius: '12px' }} />
          <button className="create-page-image-remove" onClick={removeImage} style={{ top: '8px', right: '8px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />

      <div className="create-post-actions" style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
        <div className="create-post-media-buttons" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="create-post-media-btn"
            title="Imagen"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Image size={20} />
          </button>
          
          <div ref={emojiPickerRef} style={{ position: 'relative' }}>
            <button
              className={`create-post-media-btn ${showEmojiPicker ? 'active' : ''}`}
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
          className="create-post-publish-btn"
          onClick={handleSubmit}
          disabled={!canPublish}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: canPublish ? 'var(--color-accent)' : 'var(--color-input)',
            color: canPublish ? '#ffffff' : 'var(--color-text-muted)',
            cursor: canPublish ? 'pointer' : 'not-allowed',
            border: canPublish ? 'none' : '1px solid var(--color-border)',
            padding: '8px 20px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Publicando...</span>
            </>
          ) : (
            <>
              <span>Publicar</span>
              <Send size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
