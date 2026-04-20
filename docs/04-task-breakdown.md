# FoodShare — 任务拆解

## 总览

按依赖关系和功能模块拆分为 6 个 Sprint，每个任务 ≤ 4h。

---

## Sprint 1: 项目基础搭建 (估时 ~4h)

### Task 1.1: 初始化 Astro 项目 (~1h)
- `npm create astro@latest` 初始化项目
- 集成 React: `@astrojs/react`
- 集成 Tailwind CSS: `@astrojs/tailwind`
- 集成 Cloudflare 适配器: `@astrojs/cloudflare`
- 配置 `astro.config.mjs` (output: hybrid, adapter: cloudflare)
- 验收: `npm run dev` 能跑通，页面正常显示

### Task 1.2: Cloudflare 资源创建 (~1h)
- 创建 D1 数据库: `wrangler d1 create foodshare`
- 创建 R2 桶: `wrangler r2 bucket create foodshare-images`
- 配置 `wrangler.toml` (D1 binding, R2 binding, 环境变量)
- 设置 JWT_SECRET 环境变量
- 验收: `wrangler d1 execute` 能执行 SQL

### Task 1.3: 数据库 Schema 初始化 (~1h)
- 编写 `db/schema.sql` (按技术规格中的完整 Schema)
- 执行: `wrangler d1 execute foodshare --file=db/schema.sql`
- 验收: 表创建成功，索引存在

### Task 1.4: 公共工具函数 (~1h)
- 统一错误响应函数: `jsonError(status, code, message)`
- 统一成功响应函数: `jsonOk(data, status?)`
- JWT 工具: `signJwt(userId)`, `verifyJwt(token)`
- 认证中间件: `getAuthUser(request, env)` -> userId | null
- 常量文件: `src/lib/constants.ts`
- 验收: 单元测试通过

---

## Sprint 2: 用户认证 (估时 ~6h)

### Task 2.1: 注册 API (~2h)
- `functions/api/auth/register.ts`
- 参数验证 (email, password, nickname)
- bcrypt 哈希密码
- 写入 D1 users 表
- 签发 JWT，设置 HttpOnly Cookie
- 验收: curl 测试注册成功、重复邮箱报错

### Task 2.2: 登录 / 登出 API (~1.5h)
- `functions/api/auth/login.ts`
- `functions/api/auth/logout.ts`
- 验证邮箱密码，返回用户信息 + Cookie
- 验收: curl 测试登录成功、错误密码报错、登出清除 Cookie

### Task 2.3: GET /api/auth/me (~0.5h)
- `functions/api/auth/me.ts`
- 读取 Cookie 中的 JWT，返回当前用户
- 验收: 带 Cookie 请求返回用户，不带 Cookie 返回 401

### Task 2.4: 注册/登录前端页面 (~2h)
- 登录页 `src/pages/login.astro`
- 注册页 `src/pages/register.astro`
- React 表单组件 (验证、提交、错误提示)
- 登录成功后跳转首页
- 验收: 完整注册→登录→进入首页流程

---

## Sprint 3: 发布功能 (估时 ~8h)

### Task 3.1: 图片上传 API (~2h)
- `functions/api/upload.ts`
- 接收 multipart/form-data
- 验证文件类型和大小
- 写入 R2，返回 image_key 和 URL
- 验收: curl 上传图片成功，R2 中可查看

### Task 3.2: 创建发布 API (~2h)
- `functions/api/posts/index.ts` (POST)
- 接收 image_keys + content + tags + location + restaurant_name
- D1 事务写入 posts + post_images + post_tags
- 验收: 创建发布成功，数据库记录正确

### Task 3.3: Feed 列表 API (~2h)
- `functions/api/posts/index.ts` (GET)
- cursor-based 分页
- JOIN users，计算 like_count / comment_count
- 支持 tag / user_id 筛选
- 如果已登录，计算 is_liked
- 验收: 分页正确，筛选正确，计数正确

### Task 3.4: 发布详情 / 删除 API (~1h)
- `functions/api/posts/[id].ts` (GET / DELETE)
- 删除时清理 R2 图片
- 验收: 获取详情正确，删除后 D1 和 R2 均清理

### Task 3.5: 发布前端页面 (~1h)
- 发布页 `src/pages/post/new.astro`
- React 表单: 图片选择 + 压缩 + 预览，文字输入，标签选择
- 提交流程: 逐张上传图片 → 提交 post
- 验收: 能发布带图片的动态

---

## Sprint 4: Feed 和详情页 (估时 ~6h)

### Task 4.1: Feed 首页 (~3h)
- `src/pages/index.astro` + Feed React 组件
- 动态卡片: 图片轮播 + 用户信息 + 内容 + 标签
- 无限滚动加载 (Intersection Observer)
- 空状态 / 加载状态
- 验收: Feed 正常展示，滚动加载更多

### Task 4.2: 动态详情页 (~2h)
- `src/pages/post/[id].astro`
- 完整图片展示 + 内容 + 标签
- 评论列表 (分页加载)
- 评论输入框
- 点赞按钮
- 验收: 详情页完整展示

### Task 4.3: 标签浏览页 (~1h)
- `src/pages/tag/[tag].astro`
- GET /api/tags 接口
- 复用 Feed 组件，传入 tag 参数
- 验收: 按标签筛选正确

---

## Sprint 5: 社交功能 (估时 ~8h)

### Task 5.1: 点赞 API (~1h)
- `functions/api/posts/[id]/like.ts` (POST / DELETE)
- INSERT OR IGNORE / DELETE 实现幂等
- 返回最新 like_count
- 验收: 点赞、取消、重复点赞均正确

### Task 5.2: 评论 API (~1.5h)
- `functions/api/posts/[id]/comments.ts` (POST / GET)
- `functions/api/comments/[id].ts` (DELETE)
- cursor-based 分页
- 删除权限: 评论作者或动态作者
- 验收: 发评论、列表、删除均正确

### Task 5.3: 关注 API (~1.5h)
- `functions/api/users/[id]/follow.ts` (POST / DELETE)
- `functions/api/users/[id]/followers.ts` (GET)
- `functions/api/users/[id]/following.ts` (GET)
- 不能关注自己的检查
- 验收: 关注、取消、列表均正确

### Task 5.4: 用户资料 API (~1h)
- `functions/api/users/[id].ts` (GET)
- `functions/api/users/me.ts` (PUT)
- 包含 post_count / follower_count / following_count / is_following
- 头像上传到 R2
- 验收: 获取资料、编辑资料均正确

### Task 5.5: 用户主页 + 设置页 (~3h)
- `src/pages/user/[id].astro` 用户主页
  - 用户信息卡片 (头像、昵称、简介、统计)
  - 关注/取消按钮
  - 复用 Feed 组件，传入 user_id
- `src/pages/settings.astro` 设置页
  - 编辑昵称、简介、头像
- 验收: 用户主页和设置页完整可用

---

## Sprint 6: PWA + 收尾 (估时 ~4h)

### Task 6.1: PWA 配置 (~1.5h)
- 集成 `@vite-pwa/astro`
- 配置 manifest.json (名称、图标、主题色)
- Service Worker 缓存策略
- 验收: 手机可添加到主屏，离线可看基础页面

### Task 6.2: 全局布局和导航 (~1.5h)
- Layout 组件: 底部导航栏 (首页、发布、我的)
- 顶部标题栏
- 响应式设计 (移动端优先)
- 验收: 各页面导航正常，移动端体验好

### Task 6.3: 部署和测试 (~1h)
- Cloudflare Pages 连接 Git 仓库
- 配置构建命令和输出目录
- R2 桶设置公开访问 + 自定义域名
- 全流程测试: 注册 → 登录 → 发布 → 浏览 → 点赞 → 评论 → 关注
- 验收: 生产环境全流程走通

---

## 任务依赖关系

```
Sprint 1 (基础) → Sprint 2 (认证) → Sprint 3 (发布) → Sprint 4 (展示)
                                               → Sprint 5 (社交)
                                                              → Sprint 6 (PWA/部署)
```

Sprint 4 和 Sprint 5 可以并行开发。

## 总估时

| Sprint | 估时 |
|--------|------|
| 1. 项目基础 | ~4h |
| 2. 用户认证 | ~6h |
| 3. 发布功能 | ~8h |
| 4. Feed 和详情 | ~6h |
| 5. 社交功能 | ~8h |
| 6. PWA + 收尾 | ~4h |
| **合计** | **~36h** |

## 验收标准

- [x] 每个任务 ≤ 4h
- [x] 依赖关系明确
- [x] 每个任务有可验收的交付物
- [x] 覆盖技术规格中的所有接口和页面
- [ ] 用户确认
