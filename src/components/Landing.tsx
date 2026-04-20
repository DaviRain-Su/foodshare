import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function Landing() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.getMe().then((res) => {
      if (res.ok) {
        // 已登录，直接跳转 Feed
        window.location.href = '/feed';
      }
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl font-display text-ink leading-tight">FoodShare</h1>
          <p className="text-2xl font-hand text-ink-3 mt-2">食记</p>
        </div>

        <p className="text-lg font-serif text-ink-2 max-w-md leading-relaxed mb-2">
          一本属于你的食物日记。
        </p>
        <p className="text-sm font-serif text-ink-3 max-w-sm leading-relaxed mb-10">
          记录每一顿饭的温度，分享给在乎的人。<br/>
          不是社交网络，是食物的私人笔记。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <a href="/register"
            className="flex-1 py-3 bg-rust text-white rounded-xl font-serif font-medium text-center hover:bg-rust-deep transition-colors">
            开始记录
          </a>
          <a href="/login"
            className="flex-1 py-3 border border-ink/15 text-ink-2 rounded-xl font-serif text-center hover:bg-paper-2 transition-colors">
            登录
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white/40 border-t border-ink/8 py-16 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-display text-ink text-center mb-10">简单、温暖、私密</h2>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-paper-2 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#b7522a" strokeWidth="1.5"><circle cx="10" cy="10" r="8" /><path d="M10 6v8M6 10h8" /></svg>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ink mb-1">拍照记录</h3>
                <p className="text-sm font-serif text-ink-3 leading-relaxed">一张照片，几句心情，记住这一餐的味道。支持标签、位置和餐厅名称。</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-paper-2 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#5a6b3a" strokeWidth="1.5"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ink mb-1">和朋友分享</h3>
                <p className="text-sm font-serif text-ink-3 leading-relaxed">不是千万人的广场，是几十个朋友的小圈子。点赞、评论、关注，仅此而已。</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-paper-2 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6b6150" strokeWidth="1.5"><path d="M17 10a7 7 0 11-14 0 7 7 0 0114 0z" /><path d="M10 6v4l3 3" /></svg>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ink mb-1">零成本运行</h3>
                <p className="text-sm font-serif text-ink-3 leading-relaxed">全站运行在 Cloudflare 免费层。无广告，无订阅，无算法推荐。只有食物。</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-paper-2 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9a9079" strokeWidth="1.5"><rect x="3" y="3" width="14" height="14" rx="3" /><path d="M3 8h14M8 3v14" /></svg>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ink mb-1">地图与位置</h3>
                <p className="text-sm font-serif text-ink-3 leading-relaxed">自动获取位置，在地图上标记你吃过的每一个地方。开源地图，完全免费。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center">
        <p className="text-xs font-mono text-ink-4 tracking-wider">BUILT WITH CLOUDFLARE · OPEN SOURCE</p>
      </div>
    </div>
  );
}
