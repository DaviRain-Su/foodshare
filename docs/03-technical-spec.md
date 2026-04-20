# FoodShare — 技术规格

## 1. 常量定义

```typescript
// 系统常量
const CONSTANTS = {
  // 用户
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 20,
  BIO_MAX_LENGTH: 200,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,       // bcrypt 限制
  EMAIL_MAX_LENGTH: 254,
  AVATAR_MAX_SIZE: 512 * 1024,   // 512KB

  // 发布
  POST_CONTENT_MAX_LENGTH: 1000,
  POST_IMAGES_MIN: 1,
  POST_IMAGES_MAX: 9,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024,         // 5MB 原始上传限制
  IMAGE_COMPRESSED_TARGET: 200 * 1024,     // 200KB 前端压缩目标
  IMAGE_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  TAG_MAX_LENGTH: 20,
  TAGS_MAX_COUNT: 5,
  LOCATION_MAX_LENGTH: 100,
  RESTAURANT_NAME_MAX_LENGTH: 50,

  // 评论
  COMMENT_MAX_LENGTH: 500,

  // 分页
  FEED_PAGE_SIZE: 20,
  COMMENTS_PAGE_SIZE: 20,

  // 认证
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: 10,

  // R2
  R2_BUCKET_NAME: 'foodshare-images',
  R2_PUBLIC_URL: 'https://img.foodshare.example',  // 自定义域名
}
```

## 2. 数据库 Schema (D1 / SQLite)

```sql
-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE users (
  id            TEXT PRIMARY KEY,     -- UUID v4
  email         TEXT NOT NULL UNIQUE,  -- 小写存储
  password_hash TEXT NOT NULL,         -- bcrypt hash
  nickname      TEXT NOT NULL,         -- 2-20 字符
  avatar_url    TEXT DEFAULT NULL,     -- R2 key, nullable
  bio           TEXT DEFAULT '',       -- 最多 200 字符
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 发布表
-- ============================================
CREATE TABLE posts (
  id              TEXT PRIMARY KEY,      -- UUID v4
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL DEFAULT '',  -- 最多 1000 字符
  location        TEXT DEFAULT NULL,      -- 可选，最多 100 字符
  restaurant_name TEXT DEFAULT NULL,      -- 可选，最多 50 字符
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 发布图片表
-- ============================================
CREATE TABLE post_images (
  id         TEXT PRIMARY KEY,       -- UUID v4
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_key  TEXT NOT NULL,           -- R2 object key
  sort_order INTEGER NOT NULL DEFAULT 0,  -- 0-8
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);

-- ============================================
-- 标签表
-- ============================================
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,             -- 最多 20 字符
  PRIMARY KEY (post_id, tag)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag);

-- ============================================
-- 评论表
-- ============================================
CREATE TABLE comments (
  id         TEXT PRIMARY KEY,        -- UUID v4
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,            -- 1-500 字符
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_post_id ON comments(post_id, created_at);

-- ============================================
-- 点赞表
-- ============================================
CREATE TABLE likes (
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================
-- 关注表
-- ============================================
CREATE TABLE follows (
  follower_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)  -- 不能关注自己
);
```

## 3. API 接口定义

### 3.1 认证接口

#### POST /api/auth/register

注册新用户。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "at_least_8_chars",
  "nickname": "小明"
}
```

**前置条件**: 无需登录

**验证规则**:
- email: 合法邮箱格式，最长 254 字符，转小写存储
- password: 8-72 字符
- nickname: 2-20 字符
- email 不能重复

**成功响应** `201`:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "小明",
    "avatar_url": null,
    "bio": ""
  }
}
```
+ Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | INVALID_INPUT | 参数格式不合法 |
| 409 | EMAIL_EXISTS | 邮箱已注册 |

---

#### POST /api/auth/login

用户登录。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** `200`:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "小明",
    "avatar_url": "posts/xxx.webp",
    "bio": "爱吃的人"
  }
}
```
+ Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | INVALID_INPUT | 参数缺失或格式不对 |
| 401 | INVALID_CREDENTIALS | 邮箱或密码错误 |

---

#### POST /api/auth/logout

退出登录。

**前置条件**: 需要登录

**成功响应** `200`: `{}`
+ Set-Cookie: token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0

---

#### GET /api/auth/me

获取当前登录用户信息。

**前置条件**: 需要登录

**成功响应** `200`:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "小明",
    "avatar_url": "avatars/xxx.webp",
    "bio": "爱吃的人",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 401 | UNAUTHORIZED | 未登录或 token 过期 |

---

### 3.2 发布接口

#### POST /api/posts

创建食物动态。

**前置条件**: 需要登录

**请求体** (multipart/form-data):
```
content: string          // 文字描述，最长 1000
images: File[]           // 1-9 张图片
tags: string             // JSON 数组字符串，如 '["家常菜","烘焙"]'
location?: string        // 可选，最长 100
restaurant_name?: string // 可选，最长 50
```

**处理流程**:
1. 验证参数
2. 逐张上传图片到 R2，key 格式: `posts/{post_id}/{index}.{ext}`
3. 开启 D1 事务，写入 posts + post_images + post_tags
4. 返回完整的 post 对象

**成功响应** `201`:
```json
{
  "post": {
    "id": "uuid",
    "user": { "id": "uuid", "nickname": "小明", "avatar_url": "..." },
    "content": "今天做了红烧肉",
    "images": [
      { "url": "https://img.foodshare.example/posts/xxx/0.webp" }
    ],
    "tags": ["家常菜"],
    "location": "上海",
    "restaurant_name": null,
    "like_count": 0,
    "comment_count": 0,
    "is_liked": false,
    "created_at": "2026-01-01T12:00:00Z"
  }
}
```

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | INVALID_INPUT | 参数不合法（无图片、图片太多、内容太长等） |
| 401 | UNAUTHORIZED | 未登录 |
| 413 | IMAGE_TOO_LARGE | 单张图片超过 5MB |

---

#### GET /api/posts

获取 Feed 列表。

**查询参数**:
```
cursor?: string   // 上一页最后一条的 created_at，用于分页
tag?: string      // 按标签筛选
user_id?: string  // 按用户筛选（个人主页）
limit?: number    // 默认 20，最大 50
```

**成功响应** `200`:
```json
{
  "posts": [
    {
      "id": "uuid",
      "user": { "id": "uuid", "nickname": "小明", "avatar_url": "..." },
      "content": "...",
      "images": [{ "url": "..." }],
      "tags": ["家常菜"],
      "location": "上海",
      "restaurant_name": null,
      "like_count": 5,
      "comment_count": 3,
      "is_liked": true,
      "created_at": "2026-01-01T12:00:00Z"
    }
  ],
  "next_cursor": "2026-01-01T11:00:00Z",
  "has_more": true
}
```

**分页逻辑**:
```sql
SELECT p.*, u.nickname, u.avatar_url
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.created_at < ?cursor  -- 如果有 cursor
ORDER BY p.created_at DESC
LIMIT ?limit + 1  -- 多取一条判断 has_more
```

---

#### GET /api/posts/:id

获取单条动态详情。

**成功响应** `200`: 同 Feed 中单条 post 格式

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 404 | POST_NOT_FOUND | 动态不存在 |

---

#### DELETE /api/posts/:id

删除动态（仅作者可操作）。

**前置条件**: 需要登录，且是作者本人

**处理流程**:
1. 验证权限
2. 查出关联的 image_key 列表
3. 删除 R2 中对应的图片
4. 删除 D1 中的 post（CASCADE 自动删除 images/tags/comments/likes）

**成功响应** `200`: `{}`

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 401 | UNAUTHORIZED | 未登录 |
| 403 | FORBIDDEN | 不是作者 |
| 404 | POST_NOT_FOUND | 动态不存在 |

---

### 3.3 评论接口

#### POST /api/posts/:id/comments

添加评论。

**前置条件**: 需要登录

**请求体**:
```json
{ "content": "看起来好好吃！" }
```

**验证规则**: content 1-500 字符

**成功响应** `201`:
```json
{
  "comment": {
    "id": "uuid",
    "user": { "id": "uuid", "nickname": "小红", "avatar_url": "..." },
    "content": "看起来好好吃！",
    "created_at": "2026-01-01T12:30:00Z"
  }
}
```

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | INVALID_INPUT | 内容为空或太长 |
| 401 | UNAUTHORIZED | 未登录 |
| 404 | POST_NOT_FOUND | 动态不存在 |

---

#### GET /api/posts/:id/comments

获取评论列表。

**查询参数**: `cursor`, `limit`（同 Feed 分页逻辑）

**成功响应** `200`:
```json
{
  "comments": [...],
  "next_cursor": "...",
  "has_more": true
}
```

---

#### DELETE /api/comments/:id

删除评论（仅评论作者或动态作者可操作）。

**成功响应** `200`: `{}`

**错误码**: 401, 403, 404

---

### 3.4 点赞接口

#### POST /api/posts/:id/like

点赞。如果已点赞则忽略（幂等）。

**前置条件**: 需要登录

**成功响应** `200`:
```json
{ "liked": true, "like_count": 6 }
```

---

#### DELETE /api/posts/:id/like

取消点赞。如果未点赞则忽略（幂等）。

**成功响应** `200`:
```json
{ "liked": false, "like_count": 5 }
```

---

### 3.5 用户接口

#### GET /api/users/:id

获取用户公开资料。

**成功响应** `200`:
```json
{
  "user": {
    "id": "uuid",
    "nickname": "小明",
    "avatar_url": "...",
    "bio": "爱吃的人",
    "post_count": 42,
    "follower_count": 15,
    "following_count": 8,
    "is_following": false,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

#### PUT /api/users/me

更新个人资料。

**前置条件**: 需要登录

**请求体** (multipart/form-data):
```
nickname?: string   // 2-20 字符
bio?: string        // 最多 200 字符
avatar?: File       // 最大 512KB, image/jpeg|png|webp
```

**处理流程**: 如有 avatar，上传到 R2，key: `avatars/{user_id}.{ext}`

**成功响应** `200`: 返回更新后的 user 对象

---

### 3.6 关注接口

#### POST /api/users/:id/follow

关注用户。已关注则忽略（幂等）。

**前置条件**: 需要登录，不能关注自己

**成功响应** `200`:
```json
{ "following": true }
```

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | CANNOT_FOLLOW_SELF | 不能关注自己 |
| 404 | USER_NOT_FOUND | 用户不存在 |

---

#### DELETE /api/users/:id/follow

取消关注。未关注则忽略（幂等）。

**成功响应** `200`:
```json
{ "following": false }
```

---

#### GET /api/users/:id/followers

获取粉丝列表。

**查询参数**: `cursor`, `limit`

**成功响应** `200`:
```json
{
  "users": [
    { "id": "uuid", "nickname": "小红", "avatar_url": "...", "is_following": true }
  ],
  "next_cursor": "...",
  "has_more": false
}
```

---

#### GET /api/users/:id/following

获取关注列表。格式同 followers。

---

### 3.7 图片上传接口

#### POST /api/upload

上传单张图片到 R2。

**前置条件**: 需要登录

**请求体** (multipart/form-data):
```
image: File          // 必填
type: 'post' | 'avatar'  // 必填
```

**验证规则**:
- 文件类型: image/jpeg, image/png, image/webp
- 文件大小: post 最大 5MB, avatar 最大 512KB

**处理流程**:
1. 验证文件类型和大小
2. 生成 R2 key: `{type}/{uuid}.{ext}`
3. 上传到 R2
4. 返回 key 和完整 URL

**成功响应** `201`:
```json
{
  "image_key": "posts/abc-123.webp",
  "url": "https://img.foodshare.example/posts/abc-123.webp"
}
```

**错误码**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | INVALID_FILE_TYPE | 文件类型不支持 |
| 413 | FILE_TOO_LARGE | 文件超过大小限制 |

---

### 3.8 标签接口

#### GET /api/tags

获取热门标签列表（按使用次数排序）。

**成功响应** `200`:
```json
{
  "tags": [
    { "name": "家常菜", "count": 25 },
    { "name": "烘焙", "count": 18 }
  ]
}
```

**SQL**:
```sql
SELECT tag AS name, COUNT(*) AS count
FROM post_tags
GROUP BY tag
ORDER BY count DESC
LIMIT 20
```

## 4. 认证机制详细设计

### 4.1 JWT 结构

```json
{
  "sub": "user_id (UUID)",
  "iat": 1700000000,
  "exp": 1700604800
}
```

- 签名算法: HS256
- 密钥: 存储在 Workers 环境变量 `JWT_SECRET` 中
- 载荷中只存 user_id，其他信息查数据库

### 4.2 认证中间件

每个需要认证的请求:
1. 从 Cookie 中读取 `token`
2. 验证 JWT 签名和过期时间
3. 从 JWT 中提取 `user_id`
4. 将 `user_id` 附加到请求上下文

不需要认证的接口:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/posts (公开 Feed)
- GET /api/posts/:id (公开详情)
- GET /api/users/:id (公开资料)
- GET /api/tags (公开标签)

### 4.3 密码处理

```
注册: password -> bcrypt.hash(password, 10) -> 存入 D1
登录: password -> bcrypt.compare(password, stored_hash) -> true/false
```

## 5. R2 图片存储设计

### 5.1 对象 Key 命名规范

```
avatars/{user_id}.{ext}           // 头像，覆盖更新
posts/{uuid}.{ext}                // 发布图片，UUID 唯一
```

### 5.2 前端压缩策略

使用 `browser-image-compression` 库:
```typescript
const options = {
  maxSizeMB: 0.2,          // 压缩到 200KB
  maxWidthOrHeight: 1920,  // 最大边 1920px
  useWebWorker: true,
  fileType: 'image/webp',  // 统一转 webp
}
```

### 5.3 R2 公开访问

- R2 桶设置为公开
- 绑定自定义域名 `img.foodshare.example`
- 图片 URL 格式: `https://img.foodshare.example/{key}`

## 6. 前端页面路由

```
/                    -> Feed 首页（时间线）
/login               -> 登录页
/register            -> 注册页
/post/new            -> 发布新动态
/post/:id            -> 动态详情页（含评论）
/user/:id            -> 用户个人主页
/settings            -> 个人设置页（编辑资料）
/tag/:tag            -> 按标签浏览
```

## 7. 边界条件和特殊情况

1. **图片上传中断**: 已上传到 R2 但 D1 写入失败 -> 图片成为孤儿文件，可后续清理
2. **并发点赞**: INSERT OR IGNORE 实现幂等，不会报错也不会重复
3. **并发关注**: 同上，INSERT OR IGNORE
4. **删除用户的内容**: CASCADE 删除，但 R2 图片需要单独清理
5. **cursor 对应的记录被删除**: 仍然有效，只是跳过已删除的记录
6. **空 Feed**: 返回空数组和 has_more: false
7. **超长 emoji**: 内容长度按字符计算，不按字节
8. **同时发布多张图片，部分上传失败**: 前端逐张上传，全部成功后才提交 post
9. **JWT 过期时用户正在编辑**: 提交时返回 401，前端跳转登录页并保存草稿到 localStorage
10. **R2 存储接近 10GB 上限**: 监控存储使用量，提前提醒
11. **邮箱大小写**: 注册和登录时统一转小写
12. **密码超过 72 字符**: bcrypt 截断，前端限制 72 字符
13. **恶意大文件上传**: Worker 端检查 Content-Length，超限直接拒绝

## 8. Cloudflare Workers 环境变量

```toml
# wrangler.toml
[vars]
JWT_SECRET = ""           # 在 dashboard 中设置，不提交到代码
R2_PUBLIC_URL = "https://img.foodshare.example"

[[d1_databases]]
binding = "DB"
database_name = "foodshare"
database_id = ""          # 创建后填入

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "foodshare-images"
```

## 9. 错误响应统一格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述"
  }
}
```

## 10. 验收标准

- [x] 所有数据字段的类型、大小、约束已精确定义
- [x] 所有 API 的参数、返回值、错误码已定义
- [x] 认证流程完整，安全机制明确
- [x] 边界条件已列出至少 10 个
- [x] 常量集中定义
- [x] R2 存储策略明确
- [ ] 用户确认
