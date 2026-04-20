import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface CalendarPost {
  id: string;
  images: { url: string }[];
  content: string;
  created_at: string;
}

export function Calendar({ currentUserId }: { currentUserId?: string }) {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    setLoading(true);
    // Load all posts (we'll filter client-side; for MVP this is fine)
    api.getPosts({ limit: 100, user_id: currentUserId }).then(res => {
      if (res.ok) setPosts(res.data.posts);
      setLoading(false);
    });
  }, [currentUserId]);

  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDay = new Date(month.year, month.month, 1).getDay(); // 0=Sun
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group posts by day
  const postsByDay: Record<number, CalendarPost[]> = {};
  posts.forEach(p => {
    const d = new Date(p.created_at + (p.created_at.includes('Z') ? '' : 'Z'));
    if (d.getFullYear() === month.year && d.getMonth() === month.month) {
      const day = d.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(p);
    }
  });

  const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

  const prevMonth = () => {
    setMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 });
  };
  const nextMonth = () => {
    setMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 });
  };

  const today = new Date();
  const isToday = (d: number) => month.year === today.getFullYear() && month.month === today.getMonth() && d === today.getDate();

  return (
    <div className="max-w-sm mx-auto">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-rust rounded-lg hover:bg-paper-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5" /></svg>
        </button>
        <div className="text-center">
          <p className="text-xl font-display text-ink">{monthNames[month.month]}</p>
          <p className="text-[11px] font-mono text-ink-4 tracking-wider">{month.year}</p>
        </div>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-rust rounded-lg hover:bg-paper-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3l5 5-5 5" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日','一','二','三','四','五','六'].map(d => (
          <div key={d} className="text-center py-1 text-[10px] font-mono text-ink-4 tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 text-ink-4 font-serif text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for first day */}
          {Array.from({ length: firstDay }, (_, i) => <div key={`pad-${i}`} />)}
          {days.map(d => {
            const dayPosts = postsByDay[d];
            const hasPost = dayPosts && dayPosts.length > 0;
            const firstImage = hasPost && dayPosts[0].images.length > 0 ? dayPosts[0].images[0].url : null;

            return (
              <div
                key={d}
                className={`aspect-square rounded-xl overflow-hidden relative cursor-default ${
                  hasPost ? 'ring-1 ring-ink/8' : 'bg-paper-2/60'
                } ${isToday(d) ? 'ring-2 ring-rust/40' : ''}`}
              >
                {firstImage ? (
                  <a href={`/post/${dayPosts![0].id}`} className="block w-full h-full">
                    <img src={firstImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </a>
                ) : hasPost ? (
                  <a href={`/post/${dayPosts![0].id}`} className="block w-full h-full bg-rust/10 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#b7522a" strokeWidth="1.5"><path d="M4 6h12M4 10h12M4 14h8" /></svg>
                  </a>
                ) : null}
                {/* Day number */}
                <span className={`absolute ${firstImage ? 'bottom-0.5 right-1 text-white/90' : hasPost ? 'bottom-0.5 right-1 text-rust' : 'inset-0 flex items-center justify-center text-ink-4'} text-[9px] font-mono font-medium`}>
                  {d}
                </span>
                {/* Post count badge */}
                {hasPost && dayPosts!.length > 1 && (
                  <span className="absolute top-0.5 left-0.5 bg-rust text-white text-[7px] font-mono font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {dayPosts!.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-mono text-ink-4 tracking-wide">
        <span>{Object.keys(postsByDay).length} days recorded</span>
        <span>·</span>
        <span>{posts.filter(p => {
          const d = new Date(p.created_at + (p.created_at.includes('Z') ? '' : 'Z'));
          return d.getFullYear() === month.year && d.getMonth() === month.month;
        }).length} posts</span>
      </div>
    </div>
  );
}
