import { useState } from 'react';
import { api } from '../lib/api';

interface Post {
  id: string;
  user: { id: string; nickname: string; avatar_url: string | null };
  content: string;
  images: { url: string }[];
  tags: string[];
  location: string | null;
  restaurant_name: string | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
}

export function PostCard({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [imgIndex, setImgIndex] = useState(0);

  const toggleLike = async () => {
    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.ok) {
      setLiked(res.data.liked);
      setLikeCount(res.data.like_count);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={post.images[imgIndex].url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                {imgIndex + 1}/{post.images.length}
              </div>
              {imgIndex > 0 && (
                <button
                  onClick={() => setImgIndex(imgIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                  &lt;
                </button>
              )}
              {imgIndex < post.images.length - 1 && (
                <button
                  onClick={() => setImgIndex(imgIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                  &gt;
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/user/${post.user.id}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium text-orange-700 overflow-hidden">
              {post.user.avatar_url
                ? <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : post.user.nickname[0]}
            </div>
            <span className="font-medium text-sm">{post.user.nickname}</span>
          </a>
          <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.created_at)}</span>
        </div>

        {post.content && (
          <a href={`/post/${post.id}`} className="block">
            <p className="text-sm text-gray-800 mb-2 line-clamp-3">{post.content}</p>
          </a>
        )}

        {(post.location || post.restaurant_name) && (
          <p className="text-xs text-gray-400 mb-2">
            {post.restaurant_name && <span>{post.restaurant_name}</span>}
            {post.restaurant_name && post.location && <span> · </span>}
            {post.location && <span>{post.location}</span>}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/tag/${tag}`}
                className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full hover:bg-orange-100"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button onClick={toggleLike} className="flex items-center gap-1 hover:text-red-500">
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          <a href={`/post/${post.id}`} className="flex items-center gap-1 hover:text-orange-500">
            <span>💬</span>
            <span>{post.comment_count}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
