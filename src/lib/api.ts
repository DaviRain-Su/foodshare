const API_BASE = '/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  // Auth
  register: (email: string, password: string, nickname: string) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getMe: () => request('/auth/me'),

  // Posts
  createPost: (data: {
    content: string;
    image_keys: string[];
    tags?: string[];
    location?: string;
    restaurant_name?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    request('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getPosts: (params?: { cursor?: string; tag?: string; user_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.user_id) query.set('user_id', params.user_id);
    if (params?.limit) query.set('limit', String(params.limit));
    return request(`/posts?${query}`);
  },

  getPost: (id: string) => request(`/posts/${id}`),

  deletePost: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),

  // Upload
  uploadImage: (file: File, type: 'post' | 'avatar') => {
    const form = new FormData();
    form.append('image', file);
    form.append('type', type);
    return request('/upload', { method: 'POST', body: form });
  },

  // Likes
  likePost: (postId: string) => request(`/posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId: string) => request(`/posts/${postId}/like`, { method: 'DELETE' }),

  // Comments
  getComments: (postId: string, cursor?: string) => {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/posts/${postId}/comments${query}`);
  },
  createComment: (postId: string, content: string) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
  deleteComment: (commentId: string) =>
    request(`/comments/${commentId}`, { method: 'DELETE' }),

  // Users
  getUser: (id: string) => request(`/users/${id}`),
  updateProfile: (formData: FormData) =>
    request('/users/me', { method: 'PUT', body: formData }),

  // Follow
  followUser: (id: string) => request(`/users/${id}/follow`, { method: 'POST' }),
  unfollowUser: (id: string) => request(`/users/${id}/follow`, { method: 'DELETE' }),
  getFollowers: (id: string, cursor?: string) => {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/users/${id}/followers${query}`);
  },
  getFollowing: (id: string, cursor?: string) => {
    const query = cursor ? `?cursor=${cursor}` : '';
    return request(`/users/${id}/following${query}`);
  },

  // Tags
  getTags: () => request('/tags'),
};
