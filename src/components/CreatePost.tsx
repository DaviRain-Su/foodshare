import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { CONSTANTS } from '../lib/constants';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList) => {
    const remaining = CONSTANTS.POST_IMAGES_MAX - files.length;
    const toAdd = Array.from(newFiles).slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < CONSTANTS.TAGS_MAX_COUNT) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const getLocation = async () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh`,
        { headers: { 'User-Agent': 'FoodShare/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address;
        const parts = [addr?.road, addr?.suburb || addr?.neighbourhood, addr?.city || addr?.town || addr?.county].filter(Boolean);
        setLocation(parts.join('，') || data.display_name?.split(',').slice(0, 3).join(',') || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { setError('At least 1 image required'); return; }
    setError('');
    setLoading(true);
    try {
      const imageKeys: string[] = [];
      for (const file of files) {
        const res = await api.uploadImage(file, 'post');
        if (!res.ok) throw new Error(res.data.error?.message || 'Upload failed');
        imageKeys.push(res.data.image_key);
      }
      const res = await api.createPost({
        content,
        image_keys: imageKeys,
        tags: tags.length > 0 ? tags : undefined,
        location: location || undefined,
        restaurant_name: restaurantName || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      if (!res.ok) throw new Error(res.data.error?.message || 'Post failed');
      window.location.href = '/feed';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-display text-ink">New Post</h1>
      {error && <p className="text-sm font-serif text-rust">{error}</p>}

      {/* Images */}
      <div>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
              <button type="button" onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 bg-rust text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow-sm">
                ×
              </button>
            </div>
          ))}
          {files.length < CONSTANTS.POST_IMAGES_MAX && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-ink/15 rounded-xl flex items-center justify-center text-ink-4 hover:border-rust/40 hover:text-rust transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <p className="text-[11px] font-mono text-ink-4 mt-1.5 tracking-wide">{files.length}/{CONSTANTS.POST_IMAGES_MAX} IMAGES</p>
      </div>

      {/* Content */}
      <textarea
        placeholder="今天吃了什么？"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={CONSTANTS.POST_CONTENT_MAX_LENGTH}
        rows={3}
        className="w-full px-4 py-3 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40 resize-none placeholder:text-ink-4"
      />

      {/* Tags */}
      <div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span key={t} className="text-xs font-mono bg-paper-2 text-rust px-2.5 py-1 rounded-full flex items-center gap-1 tracking-wide">
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-rust-deep">×</button>
              </span>
            ))}
          </div>
        )}
        {tags.length < CONSTANTS.TAGS_MAX_COUNT && (
          <div className="flex gap-2">
            <input
              placeholder="添加标签"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              maxLength={CONSTANTS.TAG_MAX_LENGTH}
              className="flex-1 px-3 py-2 bg-white/60 border border-ink/12 rounded-xl text-sm font-serif focus:outline-none focus:ring-2 focus:ring-rust/30 placeholder:text-ink-4"
            />
            <button type="button" onClick={addTag}
              className="px-4 py-2 bg-paper-2 rounded-xl text-sm font-serif text-ink-3 hover:bg-paper-3">Add</button>
          </div>
        )}
      </div>

      {/* Location & Restaurant */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            placeholder="位置"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={CONSTANTS.LOCATION_MAX_LENGTH}
            className="flex-1 px-3 py-2 bg-white/60 border border-ink/12 rounded-xl text-sm font-serif focus:outline-none focus:ring-2 focus:ring-rust/30 placeholder:text-ink-4"
          />
          <button type="button" onClick={getLocation} disabled={locating}
            className="px-3 py-2 bg-paper-2 rounded-xl text-sm font-serif text-ink-3 hover:bg-paper-3 disabled:opacity-50 shrink-0">
            {locating ? '...' : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>
            )}
          </button>
        </div>
        {coords && <p className="text-[10px] font-mono text-olive tracking-wide">✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
        <input
          placeholder="餐厅名称"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          maxLength={CONSTANTS.RESTAURANT_NAME_MAX_LENGTH}
          className="w-full px-3 py-2 bg-white/60 border border-ink/12 rounded-xl text-sm font-serif focus:outline-none focus:ring-2 focus:ring-rust/30 placeholder:text-ink-4"
        />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-rust text-white rounded-xl font-serif font-medium hover:bg-rust-deep disabled:opacity-50 transition-colors">
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
