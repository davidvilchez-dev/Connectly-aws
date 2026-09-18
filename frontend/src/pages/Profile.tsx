import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid, Bookmark, Heart, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import PostDetailModal from '../components/feed/PostDetailModal';

interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user?: any;
  author?: string;
  avatar?: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
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

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const loggedInUser = useAuthStore((state) => state.user);

  const isOwnProfile = !id || Number(id) === loggedInUser?.id;
  const profileUserId = isOwnProfile ? loggedInUser?.id : Number(id);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!profileUserId) {
      setError('No se pudo identificar al usuario');
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');

        if (isOwnProfile && loggedInUser) {
          setUser(loggedInUser);
        }

        // 1. Obtener detalles del perfil de usuario
        const profileRes = await api.get(`/users/${profileUserId}`);
        setUser(profileRes.data);

        // 2. Obtener publicaciones del usuario
        const postsRes = await api.get(`/users/${profileUserId}/posts`);
        setPosts(postsRes.data);

        // 3. Obtener publicaciones guardadas si es el perfil propio
        if (isOwnProfile) {
          const savedIdsString = localStorage.getItem(`saved_posts_${profileUserId}`);
          if (savedIdsString) {
            try {
              const savedIds: number[] = JSON.parse(savedIdsString);
              if (savedIds.length > 0) {
                const allPostsRes = await api.get('/posts/explore');
                const allPosts: any[] = allPostsRes.data;
                const filteredSaved = allPosts.filter((p: any) => savedIds.includes(p.id));
                setSavedPosts(filteredSaved);
              } else {
                setSavedPosts([]);
              }
            } catch (e) {
              console.error('Error al cargar guardados:', e);
            }
          }
        } else {
          setSavedPosts([]);
          setActiveTab('posts'); // Forzar pestaña posts en perfiles externos
        }

        // 4. Obtener Seguidores para ajustar contadores
        try {
          const followersRes = await api.get(`/users/${profileUserId}/followers`);
          setFollowersCount(followersRes.data ? followersRes.data.length : 0);
        } catch (err) {
          setFollowersCount(0);
        }

        // 5. Obtener Seguidos para ajustar contadores
        try {
          const followingRes = await api.get(`/users/${profileUserId}/following`);
          setFollowingCount(followingRes.data ? followingRes.data.length : 0);
        } catch (err) {
          setFollowingCount(0);
        }

        // 6. Obtener estado de seguimiento si no es el perfil propio
        if (!isOwnProfile) {
          try {
            const followStatusRes = await api.get(`/follows/${profileUserId}/status`);
            setIsFollowing(!!followStatusRes.data);
          } catch (err) {
            setIsFollowing(false);
          }
        }

      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError('No se pudo cargar el perfil. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileUserId, isOwnProfile, loggedInUser]);

  const handleFollowToggle = async () => {
    if (!profileUserId) return;
    try {
      if (isFollowing) {
        await api.delete(`/follows/${profileUserId}`);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/follows/${profileUserId}`);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'David';
  const bioText = user?.bio || "";

  return (
    <div className="feed-layout explore-layout">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Profile Feed */}
      <main className="feed-main" style={{ borderRight: 'none' }}>
        {loading && (
          <div className="feed-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Cargando perfil...</span>
          </div>
        )}

        {error && !loading && (
          <div className="auth-error-banner" style={{ margin: '20px 0' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && user && (
          <div className="profile-container">
            {/* Profile Header */}
            <header className="profile-header">
              <div className="profile-avatar-wrapper">
                <img
                  src={user.avatarUrl || "/images/avatar_user.png"}
                  alt={displayName}
                  className="profile-avatar"
                />
              </div>

              <div className="profile-details">
                <div className="profile-top-row">
                  <h2 className="profile-username">{displayName}</h2>
                  {isOwnProfile ? (
                    <button className="profile-edit-btn" onClick={() => navigate('/profile/edit')}>
                      Editar Perfil
                    </button>
                  ) : (
                    <button
                      className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>

                <div className="profile-stats">
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">{posts.length}</span>
                    <span>posts</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">
                      {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}
                    </span>
                    <span>seguidores</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">{followingCount}</span>
                    <span>seguidos</span>
                  </div>
                </div>

                <p className="profile-bio">{bioText}</p>
              </div>
            </header>

            {/* Profile Tabs Header */}
            <div className="profile-tabs-header">
              <button
                className={`profile-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                <Grid size={14} />
                <span>Publicaciones</span>
              </button>
              {isOwnProfile && (
                <button
                  className={`profile-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                  <Bookmark size={14} />
                  <span>Guardados</span>
                </button>
              )}
            </div>

            {/* Profile Grid Area */}
            {activeTab === 'posts' && (
              <div className="profile-posts-grid">
                {posts.length === 0 ? (
                  <div className="profile-empty-posts">
                    <span style={{ fontSize: '2rem' }}>📸</span>
                    <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>Aún no hay publicaciones</h3>
                    <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>Las fotos y textos que publiques aparecerán aquí.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="profile-grid-item"
                      onClick={() => setSelectedPost({
                        ...post,
                        author: displayName,
                        avatar: user.avatarUrl || "/images/avatar_user.png"
                      })}
                    >
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="Publicación" />
                      ) : (
                        <div className="profile-grid-text-only">
                          <p>{post.content}</p>
                        </div>
                      )}
                      <div className="profile-grid-overlay">
                        <div className="profile-overlay-stat">
                          <Heart size={18} fill="white" strokeWidth={0} />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="profile-overlay-stat">
                          <MessageCircle size={18} fill="white" strokeWidth={0} />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Saved Tab Area */}
            {activeTab === 'saved' && (
              <div className="profile-posts-grid">
                {savedPosts.length === 0 ? (
                  <div className="profile-empty-posts" style={{ gridColumn: 'span 3' }}>
                    <span style={{ fontSize: '2rem' }}>🔖</span>
                    <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>Guardar fotos y videos</h3>
                    <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '300px' }}>Guarda fotos y videos que quieras volver a ver. Nadie recibirá ninguna notificación y solo tú podrás ver lo que guardaste.</p>
                  </div>
                ) : (
                  savedPosts.map((post) => {
                    const postAuthorName = post.user?.username || post.user?.email?.split('@')[0] || 'Usuario';
                    const postAuthorAvatar = post.user?.avatarUrl || "/images/avatar_user.png";
                    return (
                      <div
                        key={post.id}
                        className="profile-grid-item"
                        onClick={() => setSelectedPost({
                          ...post,
                          author: postAuthorName,
                          avatar: postAuthorAvatar
                        })}
                      >
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="Publicación Guardada" />
                        ) : (
                          <div className="profile-grid-text-only">
                            <p>{post.content}</p>
                          </div>
                        )}
                        <div className="profile-grid-overlay">
                          <div className="profile-overlay-stat">
                            <Heart size={18} fill="white" strokeWidth={0} />
                            <span>{post.likesCount}</span>
                          </div>
                          <div className="profile-overlay-stat">
                            <MessageCircle size={18} fill="white" strokeWidth={0} />
                            <span>{post.commentsCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Facebook-style Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          postId={selectedPost.id}
          postAuthorId={selectedPost.user?.id || user?.id || 0}
          postAuthor={selectedPost.author || ''}
          postAvatar={selectedPost.avatar || ''}
          postTimeAgo={formatTimeAgo(selectedPost.createdAt)}
          postContent={selectedPost.content}
          postImage={selectedPost.imageUrl}
          commentCount={selectedPost.commentsCount}
          onCommentAdded={(newCount) => {
            // Sincronizar el número de comentarios en el feed local y en la selección activa
            setPosts((prev) =>
              prev.map((p) => (p.id === selectedPost.id ? { ...p, commentsCount: newCount } : p))
            );
            setSavedPosts((prev) =>
              prev.map((p) => (p.id === selectedPost.id ? { ...p, commentsCount: newCount } : p))
            );
            setSelectedPost((prev) => (prev ? { ...prev, commentsCount: newCount } : null));
          }}
          onPostDeleted={(deletedId) => {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setSelectedPost(null);
          }}
          onPostUpdated={(updatedId, newContent, newImageUrl) => {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === updatedId ? { ...p, content: newContent, imageUrl: newImageUrl } : p
              )
            );
            setSavedPosts((prev) =>
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
