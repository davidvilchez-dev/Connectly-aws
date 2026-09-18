import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import StoriesBar from '../components/feed/StoriesBar';
import CreatePostBox from '../components/feed/CreatePostBox';
import PostCard from '../components/feed/PostCard';
import SuggestionsPanel from '../components/feed/SuggestionsPanel';
import api from '../lib/axios';
import { Loader2, AlertCircle } from 'lucide-react';

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

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/posts/feed');
        setPosts(response.data);
      } catch (err: any) {
        console.error('Error fetching feed posts:', err);
        setError('No se pudieron cargar las publicaciones. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="feed-layout">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Feed */}
      <main className="feed-main">
        <h2 className="feed-title">Inicio</h2>
        <StoriesBar />
        <CreatePostBox onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])} />

        {loading && (
          <div className="feed-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Cargando publicaciones...</span>
          </div>
        )}

        {error && (
          <div className="auth-error-banner" style={{ margin: '20px 0' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="feed-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: '12px', border: '1px dashed var(--color-border)', borderRadius: '16px', margin: '20px 0' }}>
            <span style={{ fontSize: '1.8rem' }}>✍️</span>
            <h3 style={{ margin: '0', fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-text-main)' }}>No hay publicaciones aún</h3>
            <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '340px' }}>¡Sé el primero en compartir algo con el mundo directamente desde aquí arriba o desde la pestaña Crear!</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="feed-posts">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                authorId={post.user.id}
                author={post.user.username || post.user.email.split('@')[0]}
                avatar={post.user.avatarUrl || '/images/avatar_user.png'}
                timeAgo={formatTimeAgo(post.createdAt)}
                content={post.content}
                image={post.imageUrl}
                likes={post.likesCount}
                comments={post.commentsCount}
                liked={post.liked}
                onPostDeleted={(deletedId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                }}
                onPostUpdated={(updatedId, newContent, newImageUrl) => {
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === updatedId ? { ...p, content: newContent, imageUrl: newImageUrl } : p
                    )
                  );
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <SuggestionsPanel />
    </div>
  );
}
