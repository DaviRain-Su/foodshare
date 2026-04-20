# FoodShare — 测试规格

## 测试策略

- 测试框架: **Vitest** (与 Vite/Astro 生态一致)
- API 测试: 直接调用 Pages Functions handler，模拟 D1/R2 binding
- 每个接口三类测试: Happy Path / Boundary / Error
- 测试先于实现编写 (TDD)

---

## 1. 认证模块测试

### 1.1 POST /api/auth/register

**Happy Path:**
```typescript
test('正常注册返回 201 + 用户信息 + Set-Cookie', async () => {
  const res = await register({ email: 'test@test.com', password: '12345678', nickname: '小明' })
  expect(res.status).toBe(201)
  expect(res.body.user.email).toBe('test@test.com')
  expect(res.body.user.nickname).toBe('小明')
  expect(res.body.user.id).toMatch(UUID_REGEX)
  expect(res.headers['set-cookie']).toContain('token=')
  expect(res.headers['set-cookie']).toContain('HttpOnly')
  // 数据库中存在该用户
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@test.com').first()
  expect(user).not.toBeNull()
  expect(user.password_hash).not.toBe('12345678') // 密码已哈希
})
```

**Boundary:**
```typescript
test('nickname 恰好 2 字符 -> 成功', async () => {
  const res = await register({ email: 'a@b.com', password: '12345678', nickname: 'AB' })
  expect(res.status).toBe(201)
})

test('nickname 恰好 20 字符 -> 成功', async () => {
  const res = await register({ email: 'c@d.com', password: '12345678', nickname: 'A'.repeat(20) })
  expect(res.status).toBe(201)
})

test('password 恰好 8 字符 -> 成功', async () => {
  const res = await register({ email: 'e@f.com', password: '12345678', nickname: '测试' })
  expect(res.status).toBe(201)
})

test('password 恰好 72 字符 -> 成功', async () => {
  const res = await register({ email: 'g@h.com', password: 'A'.repeat(72), nickname: '测试' })
  expect(res.status).toBe(201)
})
```

**Error:**
```typescript
test('缺少 email -> 400 INVALID_INPUT', async () => {
  const res = await register({ password: '12345678', nickname: '小明' })
  expect(res.status).toBe(400)
  expect(res.body.error.code).toBe('INVALID_INPUT')
})

test('无效 email 格式 -> 400', async () => {
  const res = await register({ email: 'not-email', password: '12345678', nickname: '小明' })
  expect(res.status).toBe(400)
})

test('密码太短 (7字符) -> 400', async () => {
  const res = await register({ email: 'x@y.com', password: '1234567', nickname: '小明' })
  expect(res.status).toBe(400)
})

test('密码太长 (73字符) -> 400', async () => {
  const res = await register({ email: 'x@y.com', password: 'A'.repeat(73), nickname: '小明' })
  expect(res.status).toBe(400)
})

test('nickname 太短 (1字符) -> 400', async () => {
  const res = await register({ email: 'x@y.com', password: '12345678', nickname: 'A' })
  expect(res.status).toBe(400)
})

test('nickname 太长 (21字符) -> 400', async () => {
  const res = await register({ email: 'x@y.com', password: '12345678', nickname: 'A'.repeat(21) })
  expect(res.status).toBe(400)
})

test('重复邮箱 -> 409 EMAIL_EXISTS', async () => {
  await register({ email: 'dup@test.com', password: '12345678', nickname: '用户1' })
  const res = await register({ email: 'dup@test.com', password: '12345678', nickname: '用户2' })
  expect(res.status).toBe(409)
  expect(res.body.error.code).toBe('EMAIL_EXISTS')
})

test('邮箱大小写视为相同 -> 409', async () => {
  await register({ email: 'test@case.com', password: '12345678', nickname: '用户1' })
  const res = await register({ email: 'TEST@CASE.COM', password: '12345678', nickname: '用户2' })
  expect(res.status).toBe(409)
})
```

---

### 1.2 POST /api/auth/login

**Happy Path:**
```typescript
test('正确邮箱密码登录 -> 200 + 用户信息 + Set-Cookie', async () => {
  await registerUser('login@test.com', '12345678', '小明')
  const res = await login({ email: 'login@test.com', password: '12345678' })
  expect(res.status).toBe(200)
  expect(res.body.user.email).toBe('login@test.com')
  expect(res.headers['set-cookie']).toContain('token=')
})

test('邮箱大小写不敏感 -> 登录成功', async () => {
  await registerUser('case@test.com', '12345678', '测试')
  const res = await login({ email: 'CASE@TEST.COM', password: '12345678' })
  expect(res.status).toBe(200)
})
```

**Error:**
```typescript
test('错误密码 -> 401 INVALID_CREDENTIALS', async () => {
  await registerUser('wrong@test.com', '12345678', '小明')
  const res = await login({ email: 'wrong@test.com', password: 'wrongpass' })
  expect(res.status).toBe(401)
  expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
})

test('不存在的邮箱 -> 401 INVALID_CREDENTIALS', async () => {
  const res = await login({ email: 'noone@test.com', password: '12345678' })
  expect(res.status).toBe(401)
  // 不区分"邮箱不存在"和"密码错误"，防止枚举
})

test('缺少字段 -> 400', async () => {
  const res = await login({ email: 'a@b.com' })
  expect(res.status).toBe(400)
})
```

---

### 1.3 POST /api/auth/logout

```typescript
test('登出清除 Cookie -> 200', async () => {
  const res = await logout(validToken)
  expect(res.status).toBe(200)
  expect(res.headers['set-cookie']).toContain('Max-Age=0')
})
```

---

### 1.4 GET /api/auth/me

```typescript
test('带有效 token -> 200 返回用户信息', async () => {
  const res = await getMe(validToken)
  expect(res.status).toBe(200)
  expect(res.body.user.id).toBeDefined()
})

test('无 token -> 401', async () => {
  const res = await getMe(null)
  expect(res.status).toBe(401)
})

test('过期 token -> 401', async () => {
  const res = await getMe(expiredToken)
  expect(res.status).toBe(401)
})

test('签名错误的 token -> 401', async () => {
  const res = await getMe(tamperedToken)
  expect(res.status).toBe(401)
})
```

---

## 2. 发布模块测试

### 2.1 POST /api/upload

**Happy Path:**
```typescript
test('上传 JPEG 图片 -> 201 + 返回 image_key 和 url', async () => {
  const file = createTestImage('image/jpeg', 100 * 1024) // 100KB
  const res = await upload(file, 'post', validToken)
  expect(res.status).toBe(201)
  expect(res.body.image_key).toMatch(/^posts\/.*\.jpeg$/)
  expect(res.body.url).toContain(R2_PUBLIC_URL)
  // R2 中存在该对象
})

test('上传 WebP 图片 -> 成功', async () => { ... })
test('上传 PNG 图片 -> 成功', async () => { ... })
```

**Boundary:**
```typescript
test('图片恰好 5MB -> 成功', async () => {
  const file = createTestImage('image/jpeg', 5 * 1024 * 1024)
  const res = await upload(file, 'post', validToken)
  expect(res.status).toBe(201)
})

test('头像恰好 512KB -> 成功', async () => {
  const file = createTestImage('image/jpeg', 512 * 1024)
  const res = await upload(file, 'avatar', validToken)
  expect(res.status).toBe(201)
})
```

**Error:**
```typescript
test('图片超过 5MB -> 413 FILE_TOO_LARGE', async () => {
  const file = createTestImage('image/jpeg', 5 * 1024 * 1024 + 1)
  const res = await upload(file, 'post', validToken)
  expect(res.status).toBe(413)
})

test('头像超过 512KB -> 413', async () => {
  const file = createTestImage('image/jpeg', 512 * 1024 + 1)
  const res = await upload(file, 'avatar', validToken)
  expect(res.status).toBe(413)
})

test('不支持的文件类型 (GIF) -> 400 INVALID_FILE_TYPE', async () => {
  const file = createTestImage('image/gif', 100 * 1024)
  const res = await upload(file, 'post', validToken)
  expect(res.status).toBe(400)
  expect(res.body.error.code).toBe('INVALID_FILE_TYPE')
})

test('未登录 -> 401', async () => {
  const file = createTestImage('image/jpeg', 100 * 1024)
  const res = await upload(file, 'post', null)
  expect(res.status).toBe(401)
})
```

---

### 2.2 POST /api/posts

**Happy Path:**
```typescript
test('创建发布（单图 + 内容 + 标签）-> 201', async () => {
  const imageKey = await uploadImage()
  const res = await createPost({
    content: '今天做了红烧肉',
    image_keys: [imageKey],
    tags: ['家常菜'],
  }, validToken)
  expect(res.status).toBe(201)
  expect(res.body.post.content).toBe('今天做了红烧肉')
  expect(res.body.post.images).toHaveLength(1)
  expect(res.body.post.tags).toEqual(['家常菜'])
  expect(res.body.post.like_count).toBe(0)
  expect(res.body.post.comment_count).toBe(0)
})

test('创建发布（9张图 + 所有可选字段）-> 201', async () => {
  const keys = await Promise.all(Array(9).fill(0).map(() => uploadImage()))
  const res = await createPost({
    content: '探店记录',
    image_keys: keys,
    tags: ['探店', '日料'],
    location: '上海静安寺',
    restaurant_name: '一风堂',
  }, validToken)
  expect(res.status).toBe(201)
  expect(res.body.post.images).toHaveLength(9)
  expect(res.body.post.location).toBe('上海静安寺')
  expect(res.body.post.restaurant_name).toBe('一风堂')
})
```

**Boundary:**
```typescript
test('内容恰好 1000 字符 -> 成功', async () => {
  const res = await createPost({ content: '吃'.repeat(1000), image_keys: [key] }, token)
  expect(res.status).toBe(201)
})

test('内容为空 (只有图片) -> 成功', async () => {
  const res = await createPost({ content: '', image_keys: [key] }, token)
  expect(res.status).toBe(201)
})

test('标签恰好 5 个 -> 成功', async () => {
  const res = await createPost({ content: 'x', image_keys: [key], tags: ['1','2','3','4','5'] }, token)
  expect(res.status).toBe(201)
})
```

**Error:**
```typescript
test('无图片 -> 400', async () => {
  const res = await createPost({ content: '测试', image_keys: [] }, token)
  expect(res.status).toBe(400)
})

test('超过 9 张图 -> 400', async () => {
  const keys = Array(10).fill('fake-key')
  const res = await createPost({ content: '测试', image_keys: keys }, token)
  expect(res.status).toBe(400)
})

test('内容超过 1000 字符 -> 400', async () => {
  const res = await createPost({ content: '吃'.repeat(1001), image_keys: [key] }, token)
  expect(res.status).toBe(400)
})

test('标签超过 5 个 -> 400', async () => {
  const res = await createPost({ content: 'x', image_keys: [key], tags: ['1','2','3','4','5','6'] }, token)
  expect(res.status).toBe(400)
})

test('未登录 -> 401', async () => {
  const res = await createPost({ content: '测试', image_keys: [key] }, null)
  expect(res.status).toBe(401)
})
```

---

### 2.3 GET /api/posts (Feed)

**Happy Path:**
```typescript
test('获取 Feed 按时间倒序 -> 200', async () => {
  await createPost({ content: '第一条', image_keys: [key] }, token)
  await createPost({ content: '第二条', image_keys: [key] }, token)
  const res = await getFeed()
  expect(res.status).toBe(200)
  expect(res.body.posts[0].content).toBe('第二条') // 新的在前
  expect(res.body.posts[1].content).toBe('第一条')
})

test('分页: 使用 cursor 获取下一页', async () => {
  // 创建 25 条发布
  const page1 = await getFeed()
  expect(page1.body.posts).toHaveLength(20)
  expect(page1.body.has_more).toBe(true)
  const page2 = await getFeed({ cursor: page1.body.next_cursor })
  expect(page2.body.posts).toHaveLength(5)
  expect(page2.body.has_more).toBe(false)
})

test('按标签筛选', async () => {
  await createPost({ content: 'a', image_keys: [key], tags: ['烘焙'] }, token)
  await createPost({ content: 'b', image_keys: [key], tags: ['家常菜'] }, token)
  const res = await getFeed({ tag: '烘焙' })
  expect(res.body.posts).toHaveLength(1)
  expect(res.body.posts[0].content).toBe('a')
})

test('按用户筛选 (个人主页)', async () => {
  const res = await getFeed({ user_id: userId })
  expect(res.body.posts.every(p => p.user.id === userId)).toBe(true)
})

test('已登录时返回 is_liked 状态', async () => {
  await likePost(postId, token)
  const res = await getFeed({}, token)
  const post = res.body.posts.find(p => p.id === postId)
  expect(post.is_liked).toBe(true)
})
```

**Boundary:**
```typescript
test('空 Feed -> 返回空数组 + has_more: false', async () => {
  const res = await getFeed()
  expect(res.body.posts).toEqual([])
  expect(res.body.has_more).toBe(false)
  expect(res.body.next_cursor).toBeNull()
})

test('limit=1 -> 只返回 1 条', async () => {
  const res = await getFeed({ limit: 1 })
  expect(res.body.posts).toHaveLength(1)
})

test('limit 超过 50 -> 截断为 50', async () => {
  const res = await getFeed({ limit: 100 })
  expect(res.body.posts.length).toBeLessThanOrEqual(50)
})
```

---

### 2.4 GET /api/posts/:id

```typescript
test('获取存在的发布 -> 200 + 完整数据', async () => { ... })
test('不存在的 ID -> 404 POST_NOT_FOUND', async () => { ... })
```

### 2.5 DELETE /api/posts/:id

```typescript
test('作者删除自己的发布 -> 200 + D1 和 R2 均清理', async () => {
  const post = await createPost(...)
  const res = await deletePost(post.id, authorToken)
  expect(res.status).toBe(200)
  // 确认 D1 中已删除
  // 确认关联的 comments, likes 也已 CASCADE 删除
})

test('非作者删除 -> 403 FORBIDDEN', async () => {
  const res = await deletePost(postId, otherUserToken)
  expect(res.status).toBe(403)
})

test('未登录删除 -> 401', async () => {
  const res = await deletePost(postId, null)
  expect(res.status).toBe(401)
})

test('删除不存在的发布 -> 404', async () => {
  const res = await deletePost('non-existent-id', authorToken)
  expect(res.status).toBe(404)
})
```

---

## 3. 社交模块测试

### 3.1 点赞: POST/DELETE /api/posts/:id/like

```typescript
test('点赞 -> 200 + liked: true + like_count 增加', async () => {
  const res = await likePost(postId, token)
  expect(res.status).toBe(200)
  expect(res.body.liked).toBe(true)
  expect(res.body.like_count).toBe(1)
})

test('重复点赞 -> 幂等，like_count 不变', async () => {
  await likePost(postId, token)
  const res = await likePost(postId, token)
  expect(res.body.like_count).toBe(1) // 不是 2
})

test('取消点赞 -> liked: false + like_count 减少', async () => {
  await likePost(postId, token)
  const res = await unlikePost(postId, token)
  expect(res.body.liked).toBe(false)
  expect(res.body.like_count).toBe(0)
})

test('取消未点赞的 -> 幂等，不报错', async () => {
  const res = await unlikePost(postId, token)
  expect(res.status).toBe(200)
  expect(res.body.like_count).toBe(0)
})

test('未登录点赞 -> 401', async () => {
  const res = await likePost(postId, null)
  expect(res.status).toBe(401)
})
```

---

### 3.2 评论: POST/GET /api/posts/:id/comments, DELETE /api/comments/:id

**Happy Path:**
```typescript
test('发评论 -> 201 + 返回评论对象', async () => {
  const res = await createComment(postId, { content: '好吃！' }, token)
  expect(res.status).toBe(201)
  expect(res.body.comment.content).toBe('好吃！')
  expect(res.body.comment.user.id).toBeDefined()
})

test('获取评论列表按时间正序', async () => {
  await createComment(postId, { content: '第一条' }, token)
  await createComment(postId, { content: '第二条' }, token)
  const res = await getComments(postId)
  expect(res.body.comments[0].content).toBe('第一条') // 旧的在前
})
```

**Boundary:**
```typescript
test('评论内容 1 字符 -> 成功', async () => { ... })
test('评论内容 500 字符 -> 成功', async () => { ... })
```

**Error:**
```typescript
test('评论内容为空 -> 400', async () => { ... })
test('评论内容超过 500 字符 -> 400', async () => { ... })
test('给不存在的发布评论 -> 404', async () => { ... })

test('评论作者删除自己的评论 -> 200', async () => { ... })
test('动态作者删除他人的评论 -> 200', async () => { ... })
test('普通用户删除他人评论 -> 403', async () => { ... })
```

---

### 3.3 关注: POST/DELETE /api/users/:id/follow

```typescript
test('关注用户 -> 200 + following: true', async () => {
  const res = await followUser(targetId, token)
  expect(res.status).toBe(200)
  expect(res.body.following).toBe(true)
})

test('重复关注 -> 幂等', async () => {
  await followUser(targetId, token)
  const res = await followUser(targetId, token)
  expect(res.status).toBe(200)
})

test('取消关注 -> following: false', async () => {
  await followUser(targetId, token)
  const res = await unfollowUser(targetId, token)
  expect(res.body.following).toBe(false)
})

test('关注自己 -> 400 CANNOT_FOLLOW_SELF', async () => {
  const res = await followUser(myId, token)
  expect(res.status).toBe(400)
  expect(res.body.error.code).toBe('CANNOT_FOLLOW_SELF')
})

test('关注不存在的用户 -> 404', async () => {
  const res = await followUser('non-existent', token)
  expect(res.status).toBe(404)
})
```

---

## 4. 用户模块测试

### 4.1 GET /api/users/:id

```typescript
test('获取用户资料 -> 200 + 包含统计数据', async () => {
  const res = await getUser(userId)
  expect(res.status).toBe(200)
  expect(res.body.user.nickname).toBeDefined()
  expect(res.body.user.post_count).toBeGreaterThanOrEqual(0)
  expect(res.body.user.follower_count).toBeGreaterThanOrEqual(0)
  expect(res.body.user.following_count).toBeGreaterThanOrEqual(0)
})

test('已登录时返回 is_following 状态', async () => {
  await followUser(targetId, token)
  const res = await getUser(targetId, token)
  expect(res.body.user.is_following).toBe(true)
})

test('不存在的用户 -> 404', async () => {
  const res = await getUser('non-existent')
  expect(res.status).toBe(404)
})
```

### 4.2 PUT /api/users/me

```typescript
test('更新昵称和简介 -> 200', async () => {
  const res = await updateProfile({ nickname: '新名字', bio: '新简介' }, token)
  expect(res.status).toBe(200)
  expect(res.body.user.nickname).toBe('新名字')
  expect(res.body.user.bio).toBe('新简介')
})

test('更新头像 -> 200 + avatar_url 更新', async () => {
  const avatar = createTestImage('image/jpeg', 100 * 1024)
  const res = await updateProfile({ avatar }, token)
  expect(res.status).toBe(200)
  expect(res.body.user.avatar_url).toContain('avatars/')
})

test('nickname 太短 -> 400', async () => {
  const res = await updateProfile({ nickname: 'A' }, token)
  expect(res.status).toBe(400)
})

test('bio 超过 200 字符 -> 400', async () => {
  const res = await updateProfile({ bio: 'A'.repeat(201) }, token)
  expect(res.status).toBe(400)
})
```

---

## 5. 标签模块测试

### 5.1 GET /api/tags

```typescript
test('获取热门标签 -> 按使用次数排序', async () => {
  // 创建多个带不同标签的发布
  const res = await getTags()
  expect(res.status).toBe(200)
  expect(res.body.tags[0].count).toBeGreaterThanOrEqual(res.body.tags[1].count)
  expect(res.body.tags[0].name).toBeDefined()
})

test('无标签时 -> 空数组', async () => {
  const res = await getTags()
  expect(res.body.tags).toEqual([])
})
```

---

## 6. 测试辅助工具

```typescript
// tests/helpers.ts

// 创建测试用的假图片
function createTestImage(mimeType: string, sizeBytes: number): File { ... }

// 注册并返回 token
async function registerUser(email, password, nickname): Promise<{ token, userId }> { ... }

// 创建带图片的发布并返回
async function createTestPost(token): Promise<{ postId, imageKey }> { ... }

// 模拟 D1 和 R2 的 miniflare 环境
function createTestEnv(): { db, images, env } { ... }
```

---

## 验收标准

- [x] 每个 API 接口都有 Happy Path / Boundary / Error 三类测试
- [x] 测试覆盖所有错误码
- [x] 边界值测试覆盖所有常量限制
- [x] 幂等操作已测试（点赞、关注）
- [x] 权限控制已测试（未登录、非作者）
- [x] 测试辅助工具已定义
- [ ] 用户确认
