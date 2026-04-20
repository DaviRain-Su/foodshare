import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';
import { Feed } from './Feed';

export function UserProfile({ userId, currentUserId }: { userId: string; currentUserId?: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser(userId).then((res) => {
      if (res.ok) setUser(res.data.user);
      setLoading(false);
    });
  }, [userId]);

  const toggleFollow = async () => {
    if (!currentUserId) { window.location.href = '/login'; return; }
    const res = user.is_following
      ? await api.unfollowUser(userId)
      : await api.followUser(userId);
    if (res.ok) {
      setUser({
        ...user,
        is_following: res.data.following,
        follower_count: user.follower_count + (res.data.following ? 1 : -1),
      });
    }
  };

  if (loading) return <div className="text-center py-8 text-ink-4 font-serif">Loading...</div>;
  if (!user) return <div className="text-center py-8 text-ink-4 font-serif">User not found</div>;

  const isMe = currentUserId === userId;

  return (
    <div>
      <div className="bg-white/50 p-6 text-center border-b border-ink/8">
        <div className="w-20 h-20 bg-paper-3 rounded-full flex items-center justify-center text-2xl font-display text-ink-3 mx-auto mb-3 overflow-hidden">
          {avatarSrc(user.avatar_url)
            ? <img src={avatarSrc(user.avatar_url)!} alt="" className="w-full h-full object-cover" />
            : user.nickname[0]}
        </div>
        <h1 className="text-lg font-serif font-semibold text-ink">{user.nickname}</h1>
        {user.bio && <p className="text-sm font-serif text-ink-3 mt-1">{user.bio}</p>}

        <div className="flex justify-center gap-6 mt-3 text-sm font-serif">
          <div><span className="font-semibold text-ink">{user.post_count}</span> <span className="text-ink-4">posts</span></div>
          <div><span className="font-semibold text-ink">{user.follower_count}</span> <span className="text-ink-4">followers</span></div>
          <div><span className="font-semibold text-ink">{user.following_count}</span> <span className="text-ink-4">following</span></div>
        </div>

        <div className="mt-4">
          {isMe ? (
            <a href="/settings" className="inline-block px-6 py-1.5 border border-ink/15 rounded-xl text-sm font-serif text-ink-2 hover:bg-paper-2">Edit Profile</a>
          ) : (
            <button
              onClick={toggleFollow}
              className={`px-6 py-1.5 rounded-xl text-sm font-serif font-medium transition-colors ${
                user.is_following
                  ? 'border border-ink/15 text-ink-2 hover:bg-paper-2'
                  : 'bg-rust text-white hover:bg-rust-deep'
              }`}
            >
              {user.is_following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <Feed userId={userId} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
