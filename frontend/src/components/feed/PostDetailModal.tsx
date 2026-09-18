import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import EditPostModal from './EditPostModal';
import ConfirmModal from './ConfirmModal';

interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface Comment {
  id: number;
  content: string;
  user: UserResponse;
  postId: number;
  createdAt: string;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postAuthorId: number;
  postAuthor: string;
  postAvatar: string;
  postTimeAgo: string;
  postContent: string;
  postImage?: string;
  commentCount: number;
  onCommentAdded: (newCount: number) => void;
  isFollowing?: boolean;
  onFollowToggle?: (newStatus: boolean) => void;
  onPostDeleted?: (id: number) => void;
  onPostUpdated?: (id: number, newContent: string, newImage?: string) => void;
}

function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'hace unos momentos';
    if (diffMins < 60) return `hace ${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  } catch (err) {
    return 'hace poco';
  }
}

export default function PostDetailModal({
  isOpen,
  onClose,
  postId,
  postAuthorId,
  postAuthor,
  postAvatar,
  postTimeAgo,
  postContent,
  postImage,
  commentCount,
  onCommentAdded,
  isFollowing: propIsFollowing,
  onFollowToggle,
  onPostDeleted,
  onPostUpdated,
}: PostDetailModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [localIsFollowing, setLocalIsFollowing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Estados para Edición y Eliminación de Comentarios
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Estados para Edición y Eliminación de Publicación
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeletePostOpen, setIsConfirmDeletePostOpen] = useState(false);
  const [isConfirmDeleteCommentOpen, setIsConfirmDeleteCommentOpen] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState<number | null>(null);

  const executePostDelete = async () => {
    try {
      await api.delete(`/posts/${postId}`);
      onClose(); // Cerrar modal inmediatamente
      
      if (onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (err) {
      console.error('Error al eliminar publicación:', err);
      alert('No se pudo eliminar la publicación. Intenta de nuevo.');
    }
  };

  const executeCommentDelete = async () => {
    if (commentIdToDelete === null) return;
    try {
      await api.delete(`/comments/${commentIdToDelete}`);
      // Remover localmente del estado
      setComments((prev) => prev.filter((c) => c.id !== commentIdToDelete));
      onCommentAdded(commentCount - 1);
      setCommentIdToDelete(null);
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      alert('No se pudo eliminar el comentario. Intenta de nuevo.');
    }
  };

  const handleCommentEditSave = async (commentId: number) => {
    if (!editingCommentText.trim() || isSavingComment) return;

    try {
      setIsSavingComment(true);
      const response = await api.put(`/comments/${commentId}`, {
        content: editingCommentText.trim(),
        postId: postId,
      });

      const updatedComment = response.data;

      // Actualizar localmente
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updatedComment.content } : c))
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Error al editar comentario:', err);
      alert('No se pudo guardar el comentario. Intenta de nuevo.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const navigateToProfile = (targetUserId: number) => {
    onClose();
    if (user?.id === targetUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${targetUserId}`);
    }
  };


  // Determine actual following status (controlled by prop if present, else local state)
  const isFollowing = propIsFollowing !== undefined ? propIsFollowing : localIsFollowing;

  // Dynamic follow status checker if prop is not supplied
  useEffect(() => {
    if (propIsFollowing !== undefined) return;
    if (!isOpen || !user?.id || !postAuthorId || user.id === postAuthorId) return;

    const checkFollow = async () => {
      try {
        const response = await api.get(`/follows/${postAuthorId}/status`);
        setLocalIsFollowing(response.data);
      } catch (err) {
        console.error('Error al verificar estado de seguir:', err);
      }
    };
    checkFollow();
  }, [isOpen, postAuthorId, user?.id, propIsFollowing]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || !postAuthorId) return;

    try {
      const currentlyFollowing = isFollowing;
      
      // Update UI state immediately (optimistic UI update)
      if (onFollowToggle) {
        onFollowToggle(!currentlyFollowing);
      } else {
        setLocalIsFollowing(!currentlyFollowing);
      }

      if (currentlyFollowing) {
        await api.delete(`/follows/${postAuthorId}`);
      } else {
        await api.post(`/follows/${postAuthorId}`);
      }
    } catch (err) {
      console.error('Error al cambiar estado de seguir:', err);
      // Revert in case of API failure
      if (onFollowToggle) {
        onFollowToggle(isFollowing);
      } else {
        setLocalIsFollowing(isFollowing);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/posts/${postId}/comments`);
        setComments(response.data);
      } catch (err: any) {
        console.error('Error al cargar comentarios:', err);
        setError('No se pudieron cargar los comentarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, postId]);

  // Removed the global auto-scroll on comments state change so the modal opens at the top by default.

  if (!isOpen) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/posts/${postId}/comments`, {
        content: commentText.trim(),
        postId: postId,
      });

      const newComment = response.data;
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onCommentAdded(commentCount + 1);

      // Scroll to bottom only when the user sends a comment
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } catch (err: any) {
      console.error('Error al enviar comentario:', err);
      alert('No se pudo publicar tu comentario. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-modal-backdrop" onClick={onClose}>
      <div
        className="post-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          // Ajustar ancho máximo si no hay imagen (layout vertical)
          maxWidth: postImage ? '800px' : '600px',
        }}
      >
        {/* Header at the very top (Fixed) */}
        <div className="post-modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', textAlign: 'center', margin: '0' }}>
            Publicación de {postAuthor}
          </h3>
          <button
            className="post-modal-close-btn"
            onClick={onClose}
            title="Cerrar"
            style={{ position: 'absolute', right: '16px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body: Description + Image + Comments list */}
        <div className="post-modal-scrollable-body">
          {/* Description */}
          <div className="post-modal-description">
            <img
              src={postAvatar}
              alt={postAuthor}
              className="post-modal-avatar"
              onClick={() => navigateToProfile(postAuthorId)}
              style={{ cursor: 'pointer' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4
                    className="post-modal-author-name"
                    onClick={() => navigateToProfile(postAuthorId)}
                    style={{ margin: 0, cursor: 'pointer' }}
                  >
                    {postAuthor}
                  </h4>
                  {user?.id !== postAuthorId && (
                    <button
                      onClick={handleFollowToggle}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isFollowing ? 'var(--color-text-muted)' : 'var(--color-accent)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '0 4px',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = isFollowing ? 'var(--color-text-main)' : 'var(--color-accent-hover)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = isFollowing ? 'var(--color-text-muted)' : 'var(--color-accent)';
                      }}
                    >
                      {isFollowing ? '• Siguiendo' : '• Seguir'}
                    </button>
                  )}
                </div>

                {user?.id === postAuthorId && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '0 4px',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      • Editar
                    </button>
                    <button
                      onClick={() => setIsConfirmDeletePostOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '0 4px',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      • Eliminar
                    </button>
                  </div>
                )}
              </div>

              <>
                <p className="post-modal-description-text" style={{ margin: '0 0 6px 0', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--color-text-main)' }}>
                  {postContent}
                </p>
                <div>
                  <span className="post-modal-time">{postTimeAgo}</span>
                </div>
              </>
            </div>
          </div>

          {/* Post Image (only if it has an image) */}
          {postImage && (
            <div className="post-modal-image-side">
              {/* Blurred background copy of the image to fill empty space seamlessly */}
              <img src={postImage} alt="Blurred background" className="post-modal-image-blur-bg" />
              {/* Main foreground image shown in full, without any cropping */}
              <img src={postImage} alt="Post media" className="post-modal-image-fg" />
            </div>
          )}

          {/* Comments List Section */}
          <div className="post-modal-comments-list-section">
            {/* Loading / Error / Comments list */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
            ) : error ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', justifyContent: 'center', padding: '20px' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>💬</span>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay comentarios aún.</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>¡Sé el primero en compartir tu opinión!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const commenterName = comment.user.username || comment.user.email.split('@')[0];
                const commenterAvatar = comment.user.avatarUrl || '/images/avatar_user.png';
                const isCommentOwner = user?.id === comment.user.id;
                const isCommentEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className="post-modal-comment-item">
                    <img
                      src={commenterAvatar}
                      alt={commenterName}
                      className="post-modal-avatar"
                      onClick={() => navigateToProfile(comment.user.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="post-modal-comment-bubble">
                      <h4
                        className="post-modal-commenter-name"
                        onClick={() => navigateToProfile(comment.user.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {commenterName}
                      </h4>

                      {isCommentEditing ? (
                        <div className="comment-edit-input-wrapper">
                          <input
                            type="text"
                            className="comment-edit-input"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            disabled={isSavingComment}
                            maxLength={1000}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommentEditSave(comment.id);
                            }}
                          />
                          <div className="comment-edit-actions">
                            <button
                              type="button"
                              className="comment-action-btn"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentText('');
                              }}
                              disabled={isSavingComment}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="comment-action-btn"
                              style={{ color: 'var(--color-accent)' }}
                              onClick={() => handleCommentEditSave(comment.id)}
                              disabled={isSavingComment || !editingCommentText.trim()}
                            >
                              {isSavingComment ? '...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="post-modal-comment-content">{comment.content}</p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span className="post-modal-comment-date">{formatTimeAgo(comment.createdAt)}</span>

                            {isCommentOwner && (
                              <div className="comment-action-btns">
                                <button
                                  type="button"
                                  className="comment-action-btn"
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingCommentText(comment.content);
                                  }}
                                >
                                  Editar
                                </button>
                                  <button
                                    type="button"
                                    className="comment-action-btn danger"
                                    onClick={() => {
                                      setCommentIdToDelete(comment.id);
                                      setIsConfirmDeleteCommentOpen(true);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Footer Input (Fixed at bottom) */}
        <div className="post-modal-footer">
          <form onSubmit={handleSendComment} className="post-modal-input-wrapper">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="post-modal-input"
              disabled={submitting}
            />
            <button
              type="submit"
              className={`post-modal-send-btn ${commentText.trim() && !submitting ? 'active' : ''}`}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Premium Edit Post Modal */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        postId={postId}
        postAuthor={postAuthor}
        postAvatar={postAvatar}
        postTimeAgo={postTimeAgo}
        postContent={postContent}
        postImage={postImage}
        onPostUpdated={(id, newContent, newImageUrl) => {
          if (onPostUpdated) {
            onPostUpdated(id, newContent, newImageUrl);
          }
        }}
      />

      {/* Confirm Delete Post Modal */}
      <ConfirmModal
        isOpen={isConfirmDeletePostOpen}
        onClose={() => setIsConfirmDeletePostOpen(false)}
        onConfirm={executePostDelete}
        title="¿Eliminar publicación?"
        message="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer y borrará permanentemente todo su contenido."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />

      {/* Confirm Delete Comment Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteCommentOpen}
        onClose={() => {
          setIsConfirmDeleteCommentOpen(false);
          setCommentIdToDelete(null);
        }}
        onConfirm={executeCommentDelete}
        title="¿Eliminar comentario?"
        message="¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </div>
  );
}
