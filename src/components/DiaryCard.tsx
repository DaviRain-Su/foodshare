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

export function DiaryCard({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const toggleLike = async () => {
    if (!currentUserId) { window.location.href = '/login'; return; }
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.ok) { setLiked(res.data.liked); setLikeCount(res.data.like_count); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'));
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'));
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <div className="flex gap-3">
      {/* Timeline rail */}
      <div className="flex flex-col items-center pt-1 shrink-0 w-12">
        <span className="text-[11px] font-mono text-ink-3 tracking-wide">{formatDate(post.created_at)}</span>
        <span className="text-[9px] font-mono text-ink-4 mt-0.5">{formatTime(post.created_at)}</span>
        <div className="w-px flex-1 bg-ink/10 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        {/* User line */}
        <div className="flex items-center gap-1.5 mb-2">
          <a href={`/user/${post.user.id}`} className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-paper-3 rounded-full flex items-center justify-center text-[9px] font-serif font-semibold text-ink-3 overflow-hidden">
              {avatarSrc(post.user.avatar_url)
                ? <img src={avatarSrc(post.user.avatar_url)!} alt="" className="w-full h-full object-cover" />
                : post.user.nickname[0]}
            </div>
            <span className="text-xs font-serif text-ink-3">{post.user.nickname}</span>
          </a>
        </div>

        {/* Text - diary style, more prominent */}
        {post.content && (
          <a href={`/post/${post.id}`} className="block">
            <p className="text-[15px] font-serif text-ink leading-[1.8] mb-2 italic">{post.content}</p>
          </a>
        )}

        {/* Compact image strip */}
        {post.images.length > 0 && (
          <a href={`/post/${post.id}`} className="flex gap-1 mb-2 overflow-hidden rounded-xl">
            {post.images.slice(0, 3).map((img, i) => (
              <div key={i} className={`${post.images.length === 1 ? 'w-full aspect-[3/2]' : 'w-20 h-20'} bg-paper-2 rounded-lg overflow-hidden shrink-0`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
            {post.images.length > 3 && (
              <div className="w-20 h-20 bg-paper-2 rounded-lg flex items-center justify-center text-xs font-mono text-ink-4">+{post.images.length - 3}</div>
            )}
          </a>
        )}

        {/* Location */}
        {(post.location || post.restaurant_name) && (
          <p className="text-[10px] font-mono text-ink-4 mb-1.5 tracking-wide">
            {post.restaurant_name}{post.restaurant_name && post.location ? ' \u00b7 ' : ''}{post.location}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map(tag => (
              <a key={tag} href={`/tag/${tag}`} className="text-[10px] font-mono text-rust tracking-wide">#{tag}</a>
            ))}
          </div>
        )}

        {/* Actions - minimal */}
        <div className="flex items-center gap-4 text-[11px] text-ink-4">
          <button onClick={toggleLike} className={`flex items-center gap-1 hover:text-rust ${liked ? 'text-rust' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
            <span className="font-mono">{likeCount}</span>
          </button>
          <a href={`/post/${post.id}`} className="flex items-center gap-1 hover:text-rust">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10c0 4.4-3.6 8-8 8a8.2 8.2 0 01-4-.9L2 18l.9-4.1A8 8 0 1118 10z" /></svg>
            <span className="font-mono">{post.comment_count}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
