import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';

export function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 1) { setResults(null); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await api.search(q);
      if (res.ok) setResults(res.data);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-paper/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto p-4">
        {/* Search bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-white/60 border border-ink/12 rounded-xl px-3 py-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#9a9079" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="6"/><path d="M13.5 13.5L18 18"/></svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索帖子、标签、用户..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
              className="flex-1 bg-transparent font-serif text-sm outline-none text-ink placeholder:text-ink-4"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null); }} className="text-ink-4 hover:text-ink-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg>
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-sm font-serif text-ink-3 hover:text-rust">取消</button>
        </div>

        {loading && <p className="text-center text-sm text-ink-4 font-serif py-4">搜索中...</p>}

        {results && !loading && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Users */}
            {results.users?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-ink-4 tracking-wider uppercase mb-2">USERS</h3>
                <div className="space-y-2">
                  {results.users.map((u: any) => (
                    <a key={u.id} href={`/user/${u.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-paper-2">
                      <div className="w-9 h-9 bg-paper-3 rounded-full flex items-center justify-center text-sm font-serif font-semibold text-ink-3 overflow-hidden">
                        {avatarSrc(u.avatar_url)
                          ? <img src={avatarSrc(u.avatar_url)!} alt="" className="w-full h-full object-cover" />
                          : u.nickname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-serif font-medium text-ink truncate">{u.nickname}</p>
                        {u.bio && <p className="text-xs font-serif text-ink-4 truncate">{u.bio}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {results.tags?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-ink-4 tracking-wider uppercase mb-2">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((t: any) => (
                    <a key={t.tag} href={`/tag/${t.tag}`} className="px-3 py-1.5 bg-paper-2 rounded-full text-xs font-mono text-rust hover:bg-paper-3">
                      #{t.tag} <span className="text-ink-4">{t.count}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {results.posts?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-ink-4 tracking-wider uppercase mb-2">POSTS</h3>
                <div className="space-y-2">
                  {results.posts.map((p: any) => (
                    <a key={p.id} href={`/post/${p.id}`} className="flex gap-3 p-2 rounded-xl hover:bg-paper-2">
                      {p.thumbnail && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-paper-2 shrink-0">
                          <img src={p.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-serif text-ink line-clamp-2">{p.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-serif text-ink-4">{p.user.nickname}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {results.posts?.length === 0 && results.tags?.length === 0 && results.users?.length === 0 && (
              <p className="text-center text-sm text-ink-4 font-serif py-8">没有找到结果</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
