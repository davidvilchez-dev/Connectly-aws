import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import PostDetailModal from './PostDetailModal';
import EditPostModal from './EditPostModal';
import ConfirmModal from './ConfirmModal';

interface PostCardProps {
  id: number;
  authorId: number;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked?: boolean;
  onPostDeleted?: (id: number) => void;
  onPostUpdated?: (id: number, newContent: string, newImage?: string) => void;
}

function formatCount(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function PostCard({
  id,
  authorId,
  author,
  avatar,
  timeAgo,
  content,
  image,
  likes,
  comments,
  liked: initialLiked = false,
  onPostDeleted,
  onPostUpdated,
}: PostCardProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Estados locales para Edición y Eliminación
  const [showMenu, setShowMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú contextual al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const executePostDelete = async () => {
    try {
      await api.delete(`/posts/${id}`);
      setShowMenu(false);

      if (onPostDeleted) {
        onPostDeleted(id);
      }
    } catch (err) {
      console.error('Error al eliminar publicación:', err);
      alert('No se pudo eliminar la publicación. Intenta de nuevo.');
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.id === authorId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${authorId}`);
    }
  };

  // Check follow status
  useEffect(() => {
    if (!user?.id || !authorId || user.id === authorId) return;

    const checkFollow = async () => {
      try {
        const response = await api.get(`/follows/${authorId}/status`);
        setIsFollowing(response.data);
      } catch (err) {
        console.error('Error al verificar estado de seguir:', err);
      }
    };
    checkFollow();
  }, [authorId, user?.id]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || !authorId) return;

    try {
      const currentlyFollowing = isFollowing;
      setIsFollowing(!currentlyFollowing);

      if (currentlyFollowing) {
        await api.delete(`/follows/${authorId}`);
      } else {
        await api.post(`/follows/${authorId}`);
      }
    } catch (err) {
      console.error('Error al cambiar estado de seguir:', err);
      setIsFollowing(isFollowing);
    }
  };

  // Cargar estado de guardado/favorito desde localStorage
  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `saved_posts_${user.id}`;
    const savedIdsString = localStorage.getItem(storageKey);
    if (savedIdsString) {
      try {
        const savedIds: number[] = JSON.parse(savedIdsString);
        if (savedIds.includes(id)) {
          setSaved(true);
        }
      } catch (e) {
        console.error('Error al parsear posts guardados:', e);
      }
    }
  }, [id, user?.id]);

  const handleLike = async () => {
    try {
      // Toggle localmente primero para UI optimista
      const currentlyLiked = liked;
      setLiked(!currentlyLiked);
      setLikeCount(currentlyLiked ? likeCount - 1 : likeCount + 1);

      if (currentlyLiked) {
        await api.delete(`/posts/${id}/likes`);
      } else {
        await api.post(`/posts/${id}/likes`);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revertir en caso de error
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  const handleSaveToggle = () => {
    if (!user?.id) return;
    const storageKey = `saved_posts_${user.id}`;
    const savedIdsString = localStorage.getItem(storageKey);
    let savedIds: number[] = [];
    if (savedIdsString) {
      try {
        savedIds = JSON.parse(savedIdsString);
      } catch (e) {
        console.error('Error al leer posts guardados:', e);
      }
    }

    if (saved) {
      // Quitar de guardados
      savedIds = savedIds.filter((savedId) => savedId !== id);
      setSaved(false);
    } else {
      // Agregar a guardados
      if (!savedIds.includes(id)) {
        savedIds.push(id);
      }
      setSaved(true);
    }
    localStorage.setItem(storageKey, JSON.stringify(savedIds));
  };

  const handleCommentPublish = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      await api.post(`/posts/${id}/comments`, {
        content: commentText.trim(),
        postId: id,
      });

      setCommentText('');
      setCommentCount((prev) => prev + 1);
    } catch (err) {
      console.error('Error publishing comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      <article className="post-card">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-author-info">
            <img
              src={avatar}
              alt={author}
              className="post-author-avatar"
              onClick={handleProfileClick}
              style={{ cursor: 'pointer' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  className="post-author-name"
                  onClick={handleProfileClick}
                  style={{ cursor: 'pointer' }}
                >
                  {author}
                </h3>
                {user?.id !== authorId && (
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
                      whiteSpace: 'nowrap',
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
              <span className="post-time">{timeAgo}</span>
            </div>
          </div>
          <div className="post-more-wrapper" ref={menuRef}>
            <button className="post-more-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontal size={20} />
            </button>

            {showMenu && user?.id === authorId && (
              <div className="post-menu-dropdown">
                <button className="post-menu-item" onClick={() => { setIsEditModalOpen(true); setShowMenu(false); }}>
                  <Edit size={14} style={{ marginRight: '6px' }} />
                  Editar publicación
                </button>
                <button className="post-menu-item danger" onClick={() => { setIsConfirmDeleteOpen(true); setShowMenu(false); }}>
                  <Trash2 size={14} style={{ marginRight: '6px' }} />
                  Eliminar publicación
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <p
          className="post-content"
          onClick={() => setIsModalOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          {content}
        </p>

        {image && (
          <div
            className="post-image-wrapper"
            onClick={() => setIsModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <img src={image} alt="Post" className="post-image" />
          </div>
        )}

        {/* Post Actions */}
        <div className="post-actions">
          <div className="post-actions-left">
            <button
              className={`post-action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <Heart
                size={20}
                fill={liked ? '#ef4444' : 'none'}
                strokeWidth={liked ? 0 : 1.8}
              />
              <span>{formatCount(likeCount)}</span>
            </button>
            <button className="post-action-btn" onClick={() => setIsModalOpen(true)}>
              <MessageCircle size={20} strokeWidth={1.8} />
              <span>{formatCount(commentCount)}</span>
            </button>
          </div>
          <button
            className={`post-action-btn bookmark-btn ${saved ? 'saved' : ''}`}
            onClick={handleSaveToggle}
          >
            <Bookmark
              size={20}
              fill={saved ? '#3b82f6' : 'none'}
              strokeWidth={saved ? 0 : 1.8}
            />
          </button>
        </div>

        {/* Comment Input */}
        <div className="post-comment-input-wrapper">
          <input
            type="text"
            placeholder="Escribe un comentario..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="post-comment-input"
            disabled={isSubmittingComment}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommentPublish();
            }}
          />
          <button
            className={`post-comment-publish ${commentText.trim() && !isSubmittingComment ? 'active' : ''}`}
            disabled={!commentText.trim() || isSubmittingComment}
            onClick={handleCommentPublish}
          >
            {isSubmittingComment ? '...' : 'PUBLICAR'}
          </button>
        </div>
      </article>

      {/* Facebook-style Detail Modal */}
      <PostDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={id}
        postAuthorId={authorId}
        postAuthor={author}
        postAvatar={avatar}
        postTimeAgo={timeAgo}
        postContent={content}
        postImage={image}
        commentCount={commentCount}
        onCommentAdded={(newCount) => setCommentCount(newCount)}
        isFollowing={isFollowing}
        onFollowToggle={(newStatus) => setIsFollowing(newStatus)}
        onPostDeleted={onPostDeleted}
        onPostUpdated={onPostUpdated}
      />

      {/* Premium Edit Post Modal */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        postId={id}
        postAuthor={author}
        postAvatar={avatar}
        postTimeAgo={timeAgo}
        postContent={content}
        postImage={image}
        onPostUpdated={(postId, newContent, newImageUrl) => {
          if (onPostUpdated) {
            onPostUpdated(postId, newContent, newImageUrl);
          }
        }}
      />

      {/* Confirm Delete Post Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={executePostDelete}
        title="¿Eliminar publicación?"
        message="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer y borrará permanentemente todo su contenido."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </>
  );
}
