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
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }
    setLocating(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Reverse geocode with Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh`,
        { headers: { 'User-Agent': 'FoodShare/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address;
        const parts = [addr?.road, addr?.suburb || addr?.neighbourhood, addr?.city || addr?.town || addr?.county].filter(Boolean);
        setLocation(parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('At least 1 image is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Upload images one by one
      const imageKeys: string[] = [];
      for (const file of files) {
        const res = await api.uploadImage(file, 'post');
        if (!res.ok) throw new Error(res.data.error?.message || 'Upload failed');
        imageKeys.push(res.data.image_key);
      }

      // Create post
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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">New Post</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Images */}
      <div>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
          {files.length < CONSTANTS.POST_IMAGES_MAX && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400"
            >
              +
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <p className="text-xs text-gray-400 mt-1">{files.length}/{CONSTANTS.POST_IMAGES_MAX} images</p>
      </div>

      {/* Content */}
      <textarea
        placeholder="What are you eating?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={CONSTANTS.POST_CONTENT_MAX_LENGTH}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />

      {/* Tags */}
      <div>
        <div className="flex flex-wrap gap-1 mb-1">
          {tags.map((t) => (
            <span key={t} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              #{t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500">
                x
              </button>
            </span>
          ))}
        </div>
        {tags.length < CONSTANTS.TAGS_MAX_COUNT && (
          <div className="flex gap-1">
            <input
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              maxLength={CONSTANTS.TAG_MAX_LENGTH}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button type="button" onClick={addTag} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Add</button>
          </div>
        )}
      </div>

      {/* Location & Restaurant */}
      <div>
        <div className="flex gap-1">
          <input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={CONSTANTS.LOCATION_MAX_LENGTH}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={getLocation}
            disabled={locating}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 shrink-0"
          >
            {locating ? '...' : '📍'}
          </button>
        </div>
        {coords && (
          <p className="text-xs text-green-600 mt-1">✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
        )}
      </div>
      <input
        placeholder="Restaurant name (optional)"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        maxLength={CONSTANTS.RESTAURANT_NAME_MAX_LENGTH}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
