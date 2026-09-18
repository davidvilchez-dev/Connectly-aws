import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

interface SuggestionUser {
  id: number;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

export default function SuggestionsPanel() {
  const navigate = useNavigate();
  const loggedInUser = useAuthStore((state) => state.user);
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedInUser) return;

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users');
        const allUsers: any[] = response.data;

        const usersList = allUsers
          .filter((u) => u.id !== loggedInUser.id)
          .map((u) => {
            const name = u.username || u.email.split('@')[0];
            return {
              id: u.id,
              username: name,
              avatar: u.avatarUrl || '/images/avatar_user.png',
              isFollowing: false,
            };
          });

        // Check follow status for each user
        const listWithFollowStatus = await Promise.all(
          usersList.map(async (user) => {
            try {
              const statusRes = await api.get(`/follows/${user.id}/status`);
              return { ...user, isFollowing: statusRes.data };
            } catch (err) {
              return user;
            }
          })
        );

        // Filter out users that are already followed
        const nonFollowedUsers = listWithFollowStatus.filter((u) => !u.isFollowing);

        // Take up to 5 suggestions
        setSuggestions(nonFollowedUsers.slice(0, 5));
      } catch (err) {
        console.error('Error al cargar sugerencias dinámicas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [loggedInUser]);

  const handleFollowToggle = async (userId: number) => {
    try {
      // Toggle local state optimistic
      setSuggestions((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, isFollowing: true } : s))
      );

      await api.post(`/follows/${userId}`);
      
      // After a short timeout, remove them from suggestions since they are now followed
      setTimeout(() => {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
      }, 800);
    } catch (err) {
      console.error('Error al seguir usuario desde sugerencias:', err);
      // Revert in case of failure
      setSuggestions((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, isFollowing: false } : s))
      );
    }
  };

  if (loading || suggestions.length === 0) {
    return null; // Don't show the panel if loading or empty
  }

  return (
    <aside className="suggestions-panel">
      <h3 className="suggestions-title">Sugerencias</h3>
      <div className="suggestions-list">
        {suggestions.map((user) => (
          <div key={user.id} className="suggestion-item">
            <div 
              className="suggestion-user-info"
              onClick={() => navigate(`/profile/${user.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="suggestion-avatar"
              />
              <span className="suggestion-username">{user.username}</span>
            </div>
            <button 
              className="suggestion-follow-btn" 
              onClick={() => handleFollowToggle(user.id)}
              disabled={user.isFollowing}
            >
              {user.isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

