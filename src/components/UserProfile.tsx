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

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!user) return <div className="text-center py-8 text-gray-400">User not found</div>;

  const isMe = currentUserId === userId;

  return (
    <div>
      <div className="bg-white p-6 text-center border-b">
        <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center text-2xl font-bold text-orange-700 mx-auto mb-3 overflow-hidden">
          {avatarSrc(user.avatar_url)
            ? <img src={avatarSrc(user.avatar_url)!} alt="" className="w-full h-full object-cover" />
            : user.nickname[0]}
        </div>
        <h1 className="text-lg font-bold">{user.nickname}</h1>
        {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}

        <div className="flex justify-center gap-6 mt-3 text-sm">
          <div><span className="font-bold">{user.post_count}</span> <span className="text-gray-400">posts</span></div>
          <div><span className="font-bold">{user.follower_count}</span> <span className="text-gray-400">followers</span></div>
          <div><span className="font-bold">{user.following_count}</span> <span className="text-gray-400">following</span></div>
        </div>

        <div className="mt-4">
          {isMe ? (
            <a href="/settings" className="inline-block px-6 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Edit Profile</a>
          ) : (
            <button
              onClick={toggleFollow}
              className={`px-6 py-1.5 rounded-lg text-sm font-medium ${
                user.is_following
                  ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
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
