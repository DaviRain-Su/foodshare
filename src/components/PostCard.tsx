import { useState } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';

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
    if (!currentUserId) { window.location.href = '/login'; return; }
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.ok) { setLiked(res.data.liked); setLikeCount(res.data.like_count); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z')).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="bg-white/60 rounded-2xl border border-ink/8 overflow-hidden">
      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative aspect-[4/3] bg-paper-2">
          <img src={post.images[imgIndex].url} alt="" className="w-full h-full object-cover" loading="lazy" />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-2 right-2 bg-ink/50 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                {imgIndex + 1}/{post.images.length}
              </div>
              {imgIndex > 0 && (
                <button onClick={() => setImgIndex(imgIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink/30 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">&lsaquo;</button>
              )}
              {imgIndex < post.images.length - 1 && (
                <button onClick={() => setImgIndex(imgIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink/30 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">&rsaquo;</button>
              )}
            </>
          )}
        </div>
      )}

      <div className="p-4">
        {/* User */}
        <div className="flex items-center gap-2 mb-2">
          <a href={`/user/${post.user.id}`} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-paper-3 rounded-full flex items-center justify-center text-xs font-serif font-semibold text-ink-3 overflow-hidden">
              {avatarSrc(post.user.avatar_url)
                ? <img src={avatarSrc(post.user.avatar_url)!} alt="" className="w-full h-full object-cover" />
                : post.user.nickname[0]}
            </div>
            <span className="text-sm font-serif font-medium text-ink-2">{post.user.nickname}</span>
          </a>
          <span className="text-[10px] font-mono text-ink-4 ml-auto tracking-wide">{timeAgo(post.created_at)}</span>
        </div>

        {/* Content */}
        {post.content && (
          <a href={`/post/${post.id}`} className="block">
            <p className="text-sm font-serif text-ink leading-relaxed mb-2 line-clamp-3">{post.content}</p>
          </a>
        )}

        {/* Location */}
        {(post.location || post.restaurant_name) && (
          <p className="text-[11px] font-mono text-ink-4 mb-2 tracking-wide">
            {post.restaurant_name && <span>{post.restaurant_name}</span>}
            {post.restaurant_name && post.location && <span> &middot; </span>}
            {post.location && <span>{post.location}</span>}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag) => (
              <a key={tag} href={`/tag/${tag}`} className="text-[11px] font-mono bg-paper-2 text-rust px-2 py-0.5 rounded-full hover:bg-paper-3 tracking-wide">#{tag}</a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 text-xs text-ink-4 border-t border-ink/6 pt-2">
          <button onClick={toggleLike} className={`flex items-center gap-1 hover:text-rust ${liked ? 'text-rust' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
            <span className="font-mono">{likeCount}</span>
          </button>
          <a href={`/post/${post.id}`} className="flex items-center gap-1 hover:text-rust">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10c0 4.4-3.6 8-8 8a8.2 8.2 0 01-4-.9L2 18l.9-4.1A8 8 0 1118 10z" /></svg>
            <span className="font-mono">{post.comment_count}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
