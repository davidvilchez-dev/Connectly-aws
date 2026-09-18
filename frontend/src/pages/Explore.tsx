import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/axios';
import { Loader2, AlertCircle, Heart, MessageCircle, Bookmark, Compass, Users } from 'lucide-react';
import PostDetailModal from '../components/feed/PostDetailModal';
import { useAuthStore } from '../store/authStore';

interface PostUser {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  user: PostUser;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
}

function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'hace unos momentos';
    if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    
    return past.toLocaleDateString();
  } catch (err) {
    return 'hace poco';
  }
}

function formatCount(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const user = useAuthStore((state) => state.user);
  const [likedPosts, setLikedPosts] = useState<{ [key: number]: boolean }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: number]: boolean }>({});

  // Tabs states
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchFollowingList = async () => {
      try {
        const res = await api.get(`/users/${user.id}/following`);
        setFollowingIds(res.data.map((u: any) => u.id));
      } catch (err) {
        console.error('Error fetching following list:', err);
      }
    };
    fetchFollowingList();
  }, [user?.id]);

  useEffect(() => {
    const fetchExplorePosts = async () => {
      try {
        const response = await api.get('/posts/explore');
        setPosts(response.data);
        
        // Cargar likes y guardados iniciales
        const initialLikes: { [key: number]: boolean } = {};
        const initialSaves: { [key: number]: boolean } = {};
        
        response.data.forEach((p: Post) => {
          if (p.liked) {
            initialLikes[p.id] = true;
          }
        });
        
        if (user?.id) {
          const storageKey = `saved_posts_${user.id}`;
          const savedIdsString = localStorage.getItem(storageKey);
          if (savedIdsString) {
            try {
              const savedIds: number[] = JSON.parse(savedIdsString);
              response.data.forEach((p: Post) => {
                if (savedIds.includes(p.id)) {
                  initialSaves[p.id] = true;
                }
              });
            } catch (e) {
              console.error(e);
            }
          }
        }
        
        setLikedPosts(initialLikes);
        setSavedPosts(initialSaves);
      } catch (err: any) {
        console.error('Error fetching explore posts:', err);
        setError('No se pudieron cargar las publicaciones de explorar. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, [user?.id]);

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    const isLiked = likedPosts[postId];
    
    // UI Optimista
    setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 };
      }
      return p;
    }));

    try {
      if (isLiked) {
        await api.delete(`/posts/${postId}/likes`);
      } else {
        await api.post(`/posts/${postId}/likes`);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revertir
      setLikedPosts(prev => ({ ...prev, [postId]: isLiked }));
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1 };
        }
        return p;
      }));
    }
  };

  const handleSaveToggle = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!user?.id) return;
    
    const isSaved = savedPosts[postId];
    const storageKey = `saved_posts_${user.id}`;
    const savedIdsString = localStorage.getItem(storageKey);
    let savedIds: number[] = [];
    
    if (savedIdsString) {
      try {
        savedIds = JSON.parse(savedIdsString);
      } catch (e) {
        console.error(e);
      }
    }

    if (isSaved) {
      savedIds = savedIds.filter(id => id !== postId);
      setSavedPosts(prev => ({ ...prev, [postId]: false }));
    } else {
      if (!savedIds.includes(postId)) {
        savedIds.push(postId);
      }
      setSavedPosts(prev => ({ ...prev, [postId]: true }));
    }
    
    localStorage.setItem(storageKey, JSON.stringify(savedIds));
  };

  const displayedPosts = activeTab === 'all'
    ? posts
    : posts.filter(post => followingIds.includes(post.user.id));

  return (
    <div className="feed-layout explore-layout">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Explore Content */}
      <main className="feed-main explore-main">
        <div className="explore-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="feed-title" style={{ margin: 0 }}>Explorar</h2>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Descubre las perspectivas más recientes de la comunidad.
          </p>
        </div>

        {/* Explore Tabs Header */}
        <div className="explore-tabs-header">
          <button
            className={`explore-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Compass size={16} />
            <span>Todos</span>
          </button>
          <button
            className={`explore-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <Users size={16} />
            <span>Seguidos</span>
          </button>
        </div>

        {loading && (
          <div className="feed-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Cargando explorar...</span>
          </div>
        )}

        {error && (
          <div className="auth-error-banner" style={{ margin: '20px 0' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && displayedPosts.length === 0 && (
          activeTab === 'following' ? (
            <div className="explore-empty-following">
              <Users size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.8 }} />
              <h3 style={{ margin: '0', fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                No hay publicaciones de tus seguidos
              </h3>
              <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '380px', lineHeight: '1.5' }}>
                Aún no sigues a nadie o las personas que sigues no han publicado nada. ¡Busca usuarios en el buscador del panel lateral y comienza a seguirlos!
              </p>
            </div>
          ) : (
            <div className="feed-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: '12px', border: '1px dashed var(--color-border)', borderRadius: '16px', margin: '20px 0' }}>
              <Compass size={40} style={{ color: 'var(--color-text-muted)' }} />
              <h3 style={{ margin: '0', fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-text-main)' }}>No hay publicaciones para explorar</h3>
              <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '340px' }}>Las publicaciones compartidas en la comunidad aparecerán aquí.</p>
            </div>
          )
        )}

        {!loading && !error && displayedPosts.length > 0 && (
          <div className="explore-masonry">
            {displayedPosts.map((post) => {
              const displayName = post.user.username || post.user.email.split('@')[0];
              const avatar = post.user.avatarUrl || '/images/avatar_user.png';
              const isLiked = likedPosts[post.id] || false;
              const isSaved = savedPosts[post.id] || false;

              return (
                <div
                  key={post.id}
                  className="explore-card"
                  onClick={() => setSelectedPost(post)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="explore-card-image-wrapper">
                      <img src={post.imageUrl} alt="Publicación" className="explore-card-img" />
                    </div>
                  )}

                  {/* Post Details */}
                  <div className="explore-card-content">
                    {/* Header: Author Info */}
                    <div className="explore-card-header">
                      <img src={avatar} alt={displayName} className="explore-card-avatar" />
                      <div className="explore-card-author-info">
                        <span className="explore-card-username">@{displayName}</span>
                        <span className="explore-card-time">{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Text Body */}
                    <p className="explore-card-body-text">{post.content}</p>

                    {/* Footer Actions */}
                    <div className="explore-card-footer">
                      <div className="explore-card-actions-left">
                        <button
                          className={`explore-action-btn ${isLiked ? 'liked' : ''}`}
                          onClick={(e) => handleLike(e, post.id)}
                        >
                          <Heart
                            size={16}
                            fill={isLiked ? '#ef4444' : 'none'}
                            strokeWidth={isLiked ? 0 : 1.8}
                          />
                          <span>{formatCount(post.likesCount)}</span>
                        </button>
                        <button className="explore-action-btn">
                          <MessageCircle size={16} strokeWidth={1.8} />
                          <span>{formatCount(post.commentsCount)}</span>
                        </button>
                      </div>
                      <button
                        className={`explore-action-btn bookmark-btn ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => handleSaveToggle(e, post.id)}
                      >
                        <Bookmark
                          size={16}
                          fill={isSaved ? '#3b82f6' : 'none'}
                          strokeWidth={isSaved ? 0 : 1.8}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          postId={selectedPost.id}
          postAuthorId={selectedPost.user.id}
          postAuthor={selectedPost.user.username || selectedPost.user.email.split('@')[0]}
          postAvatar={selectedPost.user.avatarUrl || '/images/avatar_user.png'}
          postTimeAgo={formatTimeAgo(selectedPost.createdAt)}
          postContent={selectedPost.content}
          postImage={selectedPost.imageUrl}
          commentCount={selectedPost.commentsCount}
          onCommentAdded={(newCount) => {
            // Actualizar localmente el contador de comentarios
            setPosts((prev) =>
              prev.map((p) =>
                p.id === selectedPost.id ? { ...p, commentsCount: newCount } : p
              )
            );
          }}
          onFollowToggle={(newStatus) => {
            if (newStatus) {
              setFollowingIds((prev) => [...prev, selectedPost.user.id]);
            } else {
              setFollowingIds((prev) => prev.filter((id) => id !== selectedPost.user.id));
            }
          }}
          onPostDeleted={(deletedId) => {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setSelectedPost(null);
          }}
          onPostUpdated={(updatedId, newContent, newImageUrl) => {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === updatedId ? { ...p, content: newContent, imageUrl: newImageUrl } : p
              )
            );
            setSelectedPost((prev) =>
              prev ? { ...prev, content: newContent, imageUrl: newImageUrl } : null
            );
          }}
        />
      )}
    </div>
  );
}
