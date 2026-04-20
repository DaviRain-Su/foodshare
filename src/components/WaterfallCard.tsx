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

export function WaterfallCard({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) { window.location.href = '/login'; return; }
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.ok) { setLiked(res.data.liked); setLikeCount(res.data.like_count); }
  };

  return (
    <a href={`/post/${post.id}`} className="block bg-white/60 rounded-2xl border border-ink/8 overflow-hidden break-inside-avoid mb-3 hover:shadow-sm transition-shadow">
      {/* Image */}
      {post.images.length > 0 && (
        <div className="bg-paper-2">
          <img src={post.images[0].url} alt="" className="w-full object-cover" loading="lazy" style={{ maxHeight: 280 }} />
        </div>
      )}

      <div className="p-2.5">
        {/* Content - truncated */}
        {post.content && (
          <p className="text-xs font-serif text-ink leading-relaxed mb-1.5 line-clamp-2">{post.content}</p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] font-mono text-rust tracking-wide">#{tag}</span>
            ))}
          </div>
        )}

        {/* Bottom: user + like */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-4 h-4 bg-paper-3 rounded-full flex items-center justify-center text-[8px] font-serif font-semibold text-ink-3 overflow-hidden shrink-0">
              {avatarSrc(post.user.avatar_url)
                ? <img src={avatarSrc(post.user.avatar_url)!} alt="" className="w-full h-full object-cover" />
                : post.user.nickname[0]}
            </div>
            <span className="text-[10px] font-serif text-ink-4 truncate">{post.user.nickname}</span>
          </div>
          <button onClick={toggleLike} className={`flex items-center gap-0.5 text-[10px] hover:text-rust ${liked ? 'text-rust' : 'text-ink-4'}`}>
            <svg width="10" height="10" viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
            <span className="font-mono">{likeCount}</span>
          </button>
        </div>
      </div>
    </a>
  );
}
