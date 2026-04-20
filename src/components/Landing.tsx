import { useState, useEffect } from 'react';
import { api } from '../lib/api';

/* ── colour swatches from prototype ── */
const SWATCHES: [string, string][] = [
  ['#d4a574', '#a8703d'],
  ['#c4693d', '#7d3a1a'],
  ['#7a8c4d', '#4e5c2a'],
  ['#e8cfa5', '#c9a870'],
  ['#9c4a3a', '#5e2818'],
  ['#5a6b3a', '#2f3a1e'],
  ['#d88a54', '#9e5220'],
  ['#3d4a2a', '#1f2714'],
  ['#a87a4d', '#6b4a29'],
  ['#c9a855', '#8a7030'],
];

function FoodPlate({ idx = 0, label }: { idx?: number; label?: string }) {
  const [a, b] = SWATCHES[idx % SWATCHES.length];
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}>
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0, transparent 6px, rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.04) 7px)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 100%)' }} />
      {label && <span className="absolute left-2 bottom-1.5 font-mono text-[9px] text-white/70 tracking-wider uppercase">{label}</span>}
    </div>
  );
}

/* ── mock feed cards ── */
const CARDS = [
  { user: '林晓月', title: '外婆的雪菜黄鱼面', note: '今天特别想念外婆。雪菜的咸、黄鱼的鲜、汤底的白——', photos: [0, 3], likes: 12, tags: ['家常面', '上海味道'] },
  { user: '颜九', title: '番石榴龟苓膏', note: '夏天第一碗。微苦回甘，加一勺蜜。', photos: [4], likes: 34, tags: ['糖水', '广州'] },
  { user: '木子', title: '早安 · 酸种 + 手冲', note: '昨晚揉的酸种，今早六点半出炉。', photos: [6, 9], likes: 48, tags: ['面包', '咖啡'] },
];

function MockCard({ card, small = false }: { card: typeof CARDS[0]; small?: boolean }) {
  return (
    <div className="bg-white/80 rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* photos */}
      <div className={small ? 'h-28' : 'h-36'} style={{ display: 'grid', gridTemplateColumns: card.photos.length > 1 ? '1fr 1fr' : '1fr', gap: 1 }}>
        {card.photos.map((p, i) => <FoodPlate key={i} idx={p} />)}
      </div>
      <div className={small ? 'p-2.5' : 'p-3'}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-full bg-[#e4d8bf] flex items-center justify-center">
            <span style={{ fontSize: 9, fontFamily: 'Newsreader, serif', color: '#6b6150' }}>{card.user[0]}</span>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'Newsreader, serif', color: '#6b6150' }}>{card.user}</span>
        </div>
        <h3 style={{ fontSize: small ? 12 : 13, fontFamily: 'Newsreader, serif', fontWeight: 600, color: '#1d1a14', margin: '0 0 2px', lineHeight: 1.3 }}>{card.title}</h3>
        <p style={{ fontSize: small ? 10 : 11, fontFamily: 'Newsreader, serif', color: '#9a9079', lineHeight: 1.5, margin: 0 }}>{card.note}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {card.tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 9, fontFamily: 'Geist Mono, monospace', color: '#b7522a', letterSpacing: '0.05em' }}>#{t}</span>
          ))}
          <span className="ml-auto" style={{ fontSize: 9, fontFamily: 'Geist Mono, monospace', color: '#9a9079' }}>{card.likes} ❤</span>
        </div>
      </div>
    </div>
  );
}

/* ── iPhone frame (simplified from prototype) ── */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 280, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)', background: '#f5efe3' }}>
      {/* Dynamic Island */}
      <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-50" style={{ width: 90, height: 26, borderRadius: 18, background: '#000' }} />
      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-[14px] pb-1 relative z-10">
        <span style={{ fontFamily: '-apple-system, system-ui', fontWeight: 590, fontSize: 14, color: '#1d1a14' }}>9:41</span>
        <div className="flex gap-1 items-center">
          <svg width="14" height="10" viewBox="0 0 19 12" fill="#1d1a14"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7"/><rect x="4.8" y="5" width="3.2" height="7" rx="0.7"/><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7"/><rect x="14.4" y="0" width="3.2" height="12" rx="0.7"/></svg>
          <svg width="20" height="10" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="#1d1a14" strokeOpacity="0.35"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#1d1a14"/></svg>
        </div>
      </div>
      {/* Content */}
      <div style={{ height: 520, overflow: 'hidden' }}>
        {children}
      </div>
      {/* Home indicator */}
      <div className="flex justify-center pb-2 pt-1">
        <div style={{ width: 100, height: 4, borderRadius: 100, background: 'rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

function MockFeed() {
  return (
    <div className="px-3 pt-1 space-y-3">
      {/* App header inside phone */}
      <div className="flex items-center justify-between">
        <div>
          <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: '#1d1a14' }}>FoodShare</span>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: 12, color: '#9a9079', marginLeft: 4 }}>· 食记</span>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ece3d1] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#6b6150" strokeWidth="1.8"><circle cx="8" cy="8" r="6"/><path d="M13 13l5 5"/></svg>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#ece3d1] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#b7522a" strokeWidth="1.8"><path d="M10 2v16M2 10h16"/></svg>
          </div>
        </div>
      </div>
      {CARDS.map((c, i) => <MockCard key={i} card={c} small={i > 0} />)}
    </div>
  );
}

/* ── Calendar Grid ── */
const CAL_ENTRIES: Record<number, number> = { 1: 0, 3: 2, 5: 4, 9: 7, 11: 3, 14: 8, 16: 6, 18: 9, 20: 0 };

function MiniCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-7 gap-1">
      {['日','一','二','三','四','五','六'].map(d => (
        <div key={d} className="text-center" style={{ fontSize: 9, fontFamily: 'Geist Mono, monospace', color: '#9a9079', padding: '2px 0' }}>{d}</div>
      ))}
      {/* offset: April 2026 starts on Wednesday (index 3) */}
      {[0,1,2].map(i => <div key={`pad-${i}`} />)}
      {days.map(d => {
        const has = CAL_ENTRIES[d] !== undefined;
        return (
          <div key={d} className="aspect-square rounded-lg overflow-hidden relative" style={{ background: has ? undefined : '#ece3d1' }}>
            {has ? <FoodPlate idx={CAL_ENTRIES[d]} /> : null}
            <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 8, fontFamily: 'Geist Mono, monospace', color: has ? 'rgba(255,255,255,0.85)' : '#9a9079', fontWeight: has ? 600 : 400 }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Landing ── */
export function Landing() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.getMe().then((res) => {
      if (res.ok) window.location.href = '/feed';
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return (
    <div className="min-h-screen">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Decorative food swatches - top corners */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-bl-[80px] overflow-hidden"><FoodPlate idx={0} /></div>
        <div className="absolute top-12 left-0 w-20 h-20 opacity-15 rounded-r-[40px] overflow-hidden"><FoodPlate idx={5} /></div>

        <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
          {/* Mono badge */}
          <div className="inline-block mb-6">
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.15em', color: '#9a9079', textTransform: 'uppercase' }}>食物日记 · FOOD DIARY</span>
          </div>

          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 56, color: '#1d1a14', lineHeight: 1.1, margin: '0 0 8px', fontWeight: 400 }}>
            FoodShare
          </h1>
          <p style={{ fontFamily: 'Caveat, cursive', fontSize: 28, color: '#6b6150', margin: '0 0 24px' }}>食记</p>

          <p style={{ fontFamily: 'Newsreader, serif', fontSize: 19, color: '#3a352a', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 8px' }}>
            一本属于你的食物日记。
          </p>
          <p style={{ fontFamily: 'Newsreader, serif', fontSize: 15, color: '#6b6150', lineHeight: 1.8, maxWidth: 380, margin: '0 auto 32px' }}>
            记录每一顿饭的温度，分享给在乎的人。<br/>不是社交网络，是食物的私人笔记。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
            <a href="/register"
              className="flex-1 py-3 bg-[#b7522a] text-white rounded-2xl text-center hover:bg-[#8a3a1d] transition-colors"
              style={{ fontFamily: 'Newsreader, serif', fontWeight: 500, fontSize: 15 }}>
              开始记录
            </a>
            <a href="/login"
              className="flex-1 py-3 border border-[rgba(29,26,20,0.15)] text-[#3a352a] rounded-2xl text-center hover:bg-[#ece3d1] transition-colors"
              style={{ fontFamily: 'Newsreader, serif', fontSize: 15 }}>
              登录
            </a>
          </div>
        </div>
      </section>

      {/* ─── PHONE PREVIEW ─── */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ece3d1]/30 to-transparent" />
        <div className="relative z-10">
          <p className="text-center mb-8" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: '#9a9079', textTransform: 'uppercase' }}>↓ 预览 ↓</p>
          <PhoneFrame>
            <MockFeed />
          </PhoneFrame>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center mb-12" style={{ fontFamily: 'Instrument Serif, serif', fontSize: 32, color: '#1d1a14', fontWeight: 400 }}>
            简单、温暖、私密
          </h2>

          <div className="grid gap-6">
            {[
              { icon: <><circle cx="10" cy="10" r="8"/><path d="M10 6v8M6 10h8"/></>, color: '#b7522a', title: '拍照记录', desc: '一张照片，几句心情，记住这一餐的味道。支持标签、位置和餐厅名称。' },
              { icon: <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>, color: '#5a6b3a', title: '和朋友分享', desc: '不是千万人的广场，是几十个朋友的小圈子。点赞、评论、关注。' },
              { icon: <><path d="M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/><path d="M10 6v4l3 3"/></>, color: '#6b6150', title: '食物日历', desc: '每一天吃了什么，一目了然。回看上个月的餐桌，就像翻日记。' },
              { icon: <><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M3 8h14M8 3v14"/></>, color: '#9a9079', title: '地图与位置', desc: '自动获取位置，在地图上标记你吃过的每一个地方。' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/40" style={{ border: '1px solid rgba(29,26,20,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ece3d1' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={f.color} strokeWidth="1.5">{f.icon}</svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Newsreader, serif', fontWeight: 600, color: '#1d1a14', margin: '0 0 4px', fontSize: 15 }}>{f.title}</h3>
                  <p style={{ fontFamily: 'Newsreader, serif', color: '#6b6150', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALENDAR PREVIEW ─── */}
      <section className="py-12 px-6">
        <div className="max-w-xs mx-auto">
          <div className="text-center mb-6">
            <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: '#9a9079', textTransform: 'uppercase' }}>食物日历</p>
            <p style={{ fontFamily: 'Instrument Serif, serif', fontSize: 24, color: '#1d1a14', marginTop: 4 }}>四月 · 2026</p>
          </div>
          <div className="bg-white/50 rounded-2xl p-4" style={{ border: '1px solid rgba(29,26,20,0.06)' }}>
            <MiniCalendar />
          </div>
          <p className="text-center mt-4" style={{ fontFamily: 'Caveat, cursive', fontSize: 16, color: '#9a9079' }}>每一格都是一顿饭的记忆</p>
        </div>
      </section>

      {/* ─── TESTIMONIAL / QUOTE ─── */}
      <section className="py-12 px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/40 rounded-2xl p-8" style={{ border: '1px solid rgba(29,26,20,0.06)' }}>
            <p style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 17, color: '#3a352a', lineHeight: 1.8, margin: '0 0 12px' }}>
              “女儿今天回家。蒜苗必须切得斜，肉必须煮到刚变色再切片——这是我父亲教我的。”
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden"><FoodPlate idx={1} /></div>
              <div>
                <p style={{ fontFamily: 'Newsreader, serif', fontWeight: 600, fontSize: 13, color: '#1d1a14', margin: 0 }}>祁山</p>
                <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#9a9079', margin: 0 }}>@qishan · 回锅肉</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section className="py-12 px-6">
        <div className="max-w-sm mx-auto text-center">
          <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: '#9a9079', textTransform: 'uppercase', marginBottom: 12 }}>TECH</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Cloudflare Workers', 'D1 (SQLite)', 'R2 Storage', 'Astro', 'React', 'Tailwind CSS', 'PWA'].map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-[#ece3d1] text-[#6b6150]" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>{t}</span>
            ))}
          </div>
          <p className="mt-6" style={{ fontFamily: 'Newsreader, serif', fontSize: 14, color: '#6b6150', lineHeight: 1.7 }}>
            全站运行在 Cloudflare 免费层。无广告，无订阅，无算法推荐。<br/>只有食物和朋友。
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 px-6">
        <div className="max-w-sm mx-auto text-center">
          <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, color: '#1d1a14', fontWeight: 400, marginBottom: 8 }}>
            开始你的食记
          </h2>
          <p style={{ fontFamily: 'Caveat, cursive', fontSize: 18, color: '#9a9079', marginBottom: 24 }}>从下一顿饭开始</p>
          <a href="/register"
            className="inline-block px-10 py-3 bg-[#b7522a] text-white rounded-2xl hover:bg-[#8a3a1d] transition-colors"
            style={{ fontFamily: 'Newsreader, serif', fontWeight: 500, fontSize: 15 }}>
            免费注册
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 text-center border-t" style={{ borderColor: 'rgba(29,26,20,0.08)' }}>
        <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: '#9a9079', letterSpacing: '0.1em' }}>
          BUILT WITH CLOUDFLARE · <a href="https://github.com/DaviRain-Su/foodshare" className="hover:text-[#b7522a]" style={{ color: '#9a9079', textDecoration: 'none' }}>OPEN SOURCE</a>
        </p>
      </footer>
    </div>
  );
}
