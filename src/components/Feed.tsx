import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { PostCard } from './PostCard';
import { DiaryCard } from './DiaryCard';
import { WaterfallCard } from './WaterfallCard';

export type ViewMode = 'card' | 'diary' | 'waterfall';

interface FeedProps {
  tag?: string;
  userId?: string;
  currentUserId?: string;
}

const MODE_KEY = 'foodshare_view_mode';

function ViewSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const modes: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
    {
      key: 'card',
      label: 'Card',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="12" height="12" rx="2" /><path d="M1 5.5h12" /></svg>,
    },
    {
      key: 'diary',
      label: 'Diary',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2v10" /><path d="M6 3h6M6 6.5h5M6 10h4" /></svg>,
    },
    {
      key: 'waterfall',
      label: 'Grid',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="5" height="6" rx="1" /><rect x="8" y="1" width="5" height="4" rx="1" /><rect x="1" y="9" width="5" height="4" rx="1" /><rect x="8" y="7" width="5" height="6" rx="1" /></svg>,
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-paper-2/60 rounded-xl p-0.5">
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all ${
            mode === m.key
              ? 'bg-white/80 text-ink shadow-sm'
              : 'text-ink-4 hover:text-ink-3'
          }`}
          title={m.label}
        >
          {m.icon}
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Feed({ tag, userId, currentUserId }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [mode, setMode] = useState<ViewMode>('card');
  const observer = useRef<IntersectionObserver | null>(null);

  // Load saved mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY) as ViewMode | null;
      if (saved && ['card', 'diary', 'waterfall'].includes(saved)) setMode(saved);
    } catch {}
  }, []);

  const changeMode = (m: ViewMode) => {
    setMode(m);
    try { localStorage.setItem(MODE_KEY, m); } catch {}
  };

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
    return <div className="text-center py-8 text-ink-4 font-serif">Loading...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-3 font-hand text-ink-3">Nothing here yet</p>
        <p className="text-sm text-ink-4 font-serif">Be the first to share something delicious</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mode switcher */}
      <div className="flex justify-end mb-4">
        <ViewSwitcher mode={mode} onChange={changeMode} />
      </div>

      {/* Card mode */}
      {mode === 'card' && (
        <div className="space-y-5">
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
              <PostCard post={post} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}

      {/* Diary / Timeline mode */}
      {mode === 'diary' && (
        <div>
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
              <DiaryCard post={post} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}

      {/* Waterfall / Grid mode */}
      {mode === 'waterfall' && (
        <div style={{ columns: 2, columnGap: 12 }}>
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
              <WaterfallCard post={post} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}

      {loading && <div className="text-center py-4 text-ink-4 font-serif">Loading...</div>}
    </div>
  );
}
