import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

interface StoryUser {
  id: number;
  username: string;
  avatar: string;
  isOwn: boolean;
}

export default function StoriesBar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [stories, setStories] = useState<StoryUser[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadStories = async () => {
      try {
        const response = await api.get('/users');
        const allUsers: any[] = response.data;
        
        const uniqueUsers = new Map<number, StoryUser>();
        
        // Add "Tú" (the logged-in user) at the first position
        uniqueUsers.set(user.id, {
          id: user.id,
          username: 'Tú',
          avatar: user.avatarUrl || '/images/avatar_user.png',
          isOwn: true,
        });

        // Add other unique authors from explore posts
        allUsers.forEach((u: any) => {
          if (u.id !== user.id) {
            const name = u.username || u.email.split('@')[0];
            uniqueUsers.set(u.id, {
              id: u.id,
              username: name,
              avatar: u.avatarUrl || '/images/avatar_user.png',
              isOwn: false,
            });
          }
        });

        setStories(Array.from(uniqueUsers.values()));
      } catch (err) {
        console.error('Error al cargar historias dinámicas:', err);
        // Fallback en caso de error
        setStories([
          { id: user.id, username: 'Tú', avatar: user.avatarUrl || '/images/avatar_user.png', isOwn: true }
        ]);
      }
    };

    loadStories();
  }, [user, user?.avatarUrl]);

  const handleStoryClick = (story: StoryUser) => {
    if (story.isOwn) {
      navigate('/profile');
    } else {
      navigate(`/profile/${story.id}`);
    }
  };

  return (
    <div className="stories-bar">
      {stories.map((story) => (
        <button key={story.id} className="story-item" onClick={() => handleStoryClick(story)}>
          <div className="story-ring">
            <img
              src={story.avatar}
              alt={story.username}
              className="story-avatar"
            />
          </div>
          <span className="story-username">{story.username}</span>
        </button>
      ))}
    </div>
  );
}

