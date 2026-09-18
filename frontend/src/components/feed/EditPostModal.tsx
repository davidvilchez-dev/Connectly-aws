import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postAuthor: string;
  postAvatar: string;
  postTimeAgo: string;
  postContent: string;
  postImage?: string;
  onPostUpdated: (id: number, newContent: string, newImage?: string) => void;
}

export default function EditPostModal({
  isOpen,
  onClose,
  postId,
  postAuthor,
  postAvatar,
  postTimeAgo,
  postContent,
  postImage,
  onPostUpdated,
}: EditPostModalProps) {
  const [editContent, setEditContent] = useState(postContent);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(postImage || null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estados cuando cambia el post original o se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEditContent(postContent);
      setEditImagePreview(postImage || null);
      setEditImageFile(null);
      setRemoveCurrentImage(false);
    }
  }, [isOpen, postContent, postImage]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setRemoveCurrentImage(false);
      const reader = new FileReader();
      reader.onload = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    setRemoveCurrentImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('content', editContent.trim());
      formData.append('removeImage', String(removeCurrentImage));
      if (editImageFile) {
        formData.append('image', editImageFile);
      }

      const response = await api.put(`/posts/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedPost = response.data;
      onPostUpdated(postId, updatedPost.content, updatedPost.imageUrl);
      onClose();
    } catch (err) {
      console.error('Error al guardar edición del post:', err);
      alert('No se pudo guardar la publicación. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="post-modal-backdrop" onClick={onClose} style={{ zIndex: 3000 }}>
      <div
        className="post-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: editImagePreview ? '800px' : '600px',
          height: 'auto',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="post-modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', textAlign: 'center', margin: '0' }}>
            Editar publicación
          </h3>
          <button
            className="post-modal-close-btn"
            onClick={onClose}
            title="Cerrar"
            style={{ position: 'absolute', right: '16px' }}
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="post-modal-scrollable-body" style={{ padding: '0' }}>
          {/* Details & Editor Area */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Author details */}
            <div className="post-modal-description" style={{ padding: '0', border: 'none', background: 'transparent' }}>
              <img src={postAvatar} alt={postAuthor} className="post-modal-avatar" />
              <div>
                <h4 className="post-modal-author-name">{postAuthor}</h4>
                <span className="post-modal-time">{postTimeAgo}</span>
              </div>
            </div>

            {/* Spacious Textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contenido de la publicación
              </label>
              <textarea
                className="post-edit-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="¿Qué estás pensando?"
                maxLength={2000}
                disabled={isSaving}
                style={{
                  minHeight: '140px',
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  padding: '14px',
                }}
              />
            </div>

            {/* Image Selection Actions */}
            {!editImagePreview && (
              <div>
                <div className="post-edit-image-section" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="post-edit-image-action-btn"
                    style={{ color: 'var(--color-accent)' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <Upload size={14} style={{ marginRight: '6px', display: 'inline' }} />
                    Añadir Foto / Imagen
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Visualizar la imagen del post si existe/está seleccionada */}
          {editImagePreview && (
            <div className="post-modal-image-side" style={{ height: '350px', borderTop: '1px solid var(--color-border)', borderBottom: 'none', position: 'relative' }}>
              <img src={editImagePreview} alt="Blurred background" className="post-modal-image-blur-bg" />
              <img src={editImagePreview} alt="Preview" className="post-modal-image-fg" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              
              {/* Circular X close button in top-right corner */}
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isSaving}
                title="Quitar Imagen"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="post-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              className="post-edit-btn cancel"
              onClick={onClose}
              disabled={isSaving}
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="post-edit-btn save"
              disabled={isSaving || !editContent.trim()}
              style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
