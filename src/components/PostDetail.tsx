import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';
import { MiniMap } from './MiniMap';

interface PostDetailProps {
  postId: string;
  currentUserId?: string;
}

export function PostDetail({ postId, currentUserId }: PostDetailProps) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [postRes, commentsRes] = await Promise.all([
        api.getPost(postId),
        api.getComments(postId),
      ]);
      if (postRes.ok) {
        setPost(postRes.data.post);
        setLiked(postRes.data.post.is_liked);
        setLikeCount(postRes.data.post.like_count);
      }
      if (commentsRes.ok) {
        setComments(commentsRes.data.comments);
      }
      setLoading(false);
    })();
  }, [postId]);

  const toggleLike = async () => {
    if (!currentUserId) { window.location.href = '/login'; return; }
    const res = liked ? await api.unlikePost(postId) : await api.likePost(postId);
    if (res.ok) { setLiked(res.data.liked); setLikeCount(res.data.like_count); }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) { window.location.href = '/login'; return; }
    if (!commentText.trim()) return;
    const res = await api.createComment(postId, commentText);
    if (res.ok) {
      setComments([...comments, res.data.comment]);
      setCommentText('');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const res = await api.deletePost(postId);
    if (res.ok) window.location.href = '/';
  };

  const deleteComment = async (commentId: string) => {
    const res = await api.deleteComment(commentId);
    if (res.ok) setComments(comments.filter((c) => c.id !== commentId));
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!post) return <div className="text-center py-8 text-gray-400">Post not found</div>;

  return (
    <div className="max-w-lg mx-auto">
      {/* Images */}
      <div className="relative aspect-square bg-gray-100">
        <img src={post.images[imgIndex]?.url} alt="" className="w-full h-full object-cover" />
        {post.images.length > 1 && (
          <>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {imgIndex + 1}/{post.images.length}
            </div>
            {imgIndex > 0 && (
              <button onClick={() => setImgIndex(imgIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full">&lt;</button>
            )}
            {imgIndex < post.images.length - 1 && (
              <button onClick={() => setImgIndex(imgIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full">&gt;</button>
            )}
          </>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-2">
          <a href={`/user/${post.user.id}`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center font-medium text-orange-700 overflow-hidden">
              {avatarSrc(post.user.avatar_url)
                ? <img src={avatarSrc(post.user.avatar_url)!} alt="" className="w-full h-full object-cover" />
                : post.user.nickname[0]}
            </div>
            <span className="font-medium">{post.user.nickname}</span>
          </a>
          {currentUserId === post.user.id && (
            <button onClick={handleDelete} className="ml-auto text-xs text-red-400 hover:text-red-600">Delete</button>
          )}
        </div>

        {post.content && <p className="text-sm">{post.content}</p>}

        {(post.location || post.restaurant_name) && (
          <p className="text-xs text-gray-400">
            {post.restaurant_name}{post.restaurant_name && post.location && ' · '}{post.location}
          </p>
        )}

        {post.latitude && post.longitude && (
          <MiniMap lat={post.latitude} lng={post.longitude} />
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag: string) => (
              <a key={tag} href={`/tag/${tag}`} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">#{tag}</a>
            ))}
          </div>
        )}

        {/* Like */}
        <div className="flex items-center gap-4 text-sm border-t border-b border-gray-100 py-2">
          <button onClick={toggleLike} className="flex items-center gap-1 hover:text-red-500">
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          <span className="text-gray-400">💬 {comments.length}</span>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-xs font-medium text-orange-700 shrink-0 overflow-hidden">
                {avatarSrc(c.user.avatar_url)
                  ? <img src={avatarSrc(c.user.avatar_url)!} alt="" className="w-full h-full object-cover" />
                  : c.user.nickname[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <a href={`/user/${c.user.id}`} className="text-sm font-medium hover:underline">{c.user.nickname}</a>
                  {(currentUserId === c.user.id || currentUserId === post.user.id) && (
                    <button onClick={() => deleteComment(c.id)} className="text-xs text-gray-300 hover:text-red-400 ml-auto">delete</button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <form onSubmit={submitComment} className="flex gap-2">
          <input
            placeholder={currentUserId ? 'Add a comment...' : 'Login to comment'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={500}
            disabled={!currentUserId}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!currentUserId || !commentText.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
