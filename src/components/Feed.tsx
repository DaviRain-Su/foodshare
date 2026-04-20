import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { PostCard } from './PostCard';

interface FeedProps {
  tag?: string;
  userId?: string;
  currentUserId?: string;
}

export function Feed({ tag, userId, currentUserId }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const res = await api.getPosts({
      cursor: cursor ?? undefined,
      tag,
      user_id: userId,
    });
    if (res.ok) {
      setPosts((prev) => [...prev, ...res.data.posts]);
      setCursor(res.data.next_cursor);
      setHasMore(res.data.has_more);
    }
    setLoading(false);
    setInitial(false);
  }, [cursor, hasMore, loading, tag, userId]);

  useEffect(() => {
    loadMore();
  }, []);

  // Infinite scroll
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore],
  );

  if (initial && loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">🍽️</p>
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
          <PostCard post={post} currentUserId={currentUserId} />
        </div>
      ))}
      {loading && <div className="text-center py-4 text-gray-400">Loading...</div>}
    </div>
  );
}
