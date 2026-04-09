# GifMeme

GifMeme 是一个基于 **Next.js 15**、**OpenNext for Cloudflare** 和 **Cloudflare Workers** 构建的全栈 GIF 浏览网站。

它包含以下能力：

- 通过 **Klipy API** 浏览 GIF / Sticker
- **Google OAuth 2.0** 登录
- 基于 **Cloudflare D1** 的收藏功能
- 基于 **Cloudflare KV** 的响应缓存
- 基于 **Cloudflare Analytics Engine** 的访问统计
- 部署到生产域名 **gifmeme.org**

---

## 技术栈

- Next.js 15
- React 19
- `@opennextjs/cloudflare`
- Wrangler 4
- Drizzle ORM + Cloudflare D1
- Cloudflare KV
- Cloudflare Analytics Engine
- Vitest + Playwright

---

## 仓库结构

```text
src/
  app/                 # App Router 页面和 API 路由
  components/          # UI 组件
  lib/
    auth/              # Google OAuth + JWT Session 逻辑
    db/                # D1 + Drizzle schema
    klipy/             # Klipy provider、广告解析、缓存
    analytics/         # 统计采集和查询逻辑
drizzle/               # SQL migrations
tests/                 # Playwright E2E 测试
scripts/deploy.sh      # 生产部署脚本
wrangler.toml          # Cloudflare Workers 配置
```

---

## 前置依赖

开始之前，请确保本地具备：

- **Node.js 20+**
- **npm**
- **Wrangler 4+**
- 一个 **Cloudflare 账号**
- 一个 **Google OAuth 应用**
- 一个 **Klipy API Key**

推荐额外准备：

- `bc`（`scripts/deploy.sh` 用于输出 bundle 大小）
- Playwright 浏览器二进制：

```bash
npx playwright install
```

---

## 必需的 Cloudflare 资源

当前项目依赖以下 Cloudflare 资源：

- **D1 数据库**：`gifmeme-db`
- **KV Namespace**（绑定名）：`cache`
- **Analytics Engine Dataset**（绑定名）：`gifmeme-analytics`
- **Workers 路由**：`gifmeme.org/*`

这些绑定声明在 `wrangler.toml` 中。

> 注意：当前 `wrangler.toml` 中 D1 和 KV 仍是占位 ID，正式预览或生产部署前必须替换成真实资源 ID。

---

## 必需环境变量 / Secrets

### 应用 / 登录认证

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_URL`

### 内容 / API

- `KLIPY_API_KEY`

### 统计后台

- `CF_ACCOUNT_ID`
- `CF_ANALYTICS_TOKEN`

---

## 本地配置指引

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Cloudflare 资源

如果还没有相关资源，可以先创建：

```bash
npx wrangler d1 create gifmeme-db
npx wrangler kv namespace create cache
```

然后把生成的真实 `database_id` 和 KV `id` 填回 `wrangler.toml`。

### 3. 应用本地或远程 migration

至少先确认仓库中的 migration 文件：

```bash
ls drizzle/
```

当前仓库包含：

- `drizzle/0000_perfect_photon.sql`

生产部署脚本中远程应用 migration 的方式为：

```bash
wrangler d1 execute gifmeme-db --file=drizzle/0000_perfect_photon.sql --remote
```

### 4. 设置本地环境变量 / secrets

为了保证本地预览和应用逻辑正常工作，请准备以下变量：

```bash
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export JWT_SECRET="..."
export KLIPY_API_KEY="..."
export ADMIN_EMAILS="admin@example.com"
export NEXT_PUBLIC_APP_URL="http://localhost:8787"
export NEXT_PUBLIC_BASE_URL="http://localhost:8787"
export CF_ACCOUNT_ID="..."
export CF_ANALYTICS_TOKEN="..."
```

对于 Cloudflare 托管运行环境，生产 secrets 通过 Wrangler 设置：

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put KLIPY_API_KEY
npx wrangler secret put ADMIN_EMAILS
```

---

## 本地开发

### 快速 UI 开发

```bash
npm run dev
```

该命令会启动 Next.js 本地开发环境。

### 完整联调 / 集成测试

当你需要以下能力时，请使用 Workers 风格的本地运行方式：

- D1 / KV / Analytics Engine 绑定
- 通过 Worker 跑通 API 路由
- 更接近生产的页面到 API 集成行为

当前项目中有部分服务端页面直接请求 `http://localhost:8787`，因此 **完整联调建议使用监听 `8787` 端口的本地运行方式**。

典型流程：

```bash
npx opennextjs-cloudflare build
npx wrangler dev --port 8787
```

然后访问：

```text
http://localhost:8787
```

> 注意：如果缺少 Klipy API、D1 或认证相关 secrets，一些页面会优雅降级为 empty state 或受保护页面回退，而不是展示完整功能。

---

## 本地测试指引

### 类型检查

```bash
npx tsc --noEmit
```

### 单元 / 集成测试

```bash
npm test
```

等价命令：

```bash
npx vitest run
```

### E2E 测试

```bash
npm run test:e2e
```

该命令会运行 Playwright 测试。

### 推荐本地验证顺序

```bash
npx tsc --noEmit
npx vitest run
npx opennextjs-cloudflare build
```

如果还需要验证浏览器真实流程：

```bash
npx wrangler dev --port 8787
npx playwright test
```

---

## 预上线检查清单

在 preview 或 production 发布前，请确认：

- `git status` 为 clean
- `wrangler.toml` 中 D1 / KV 的 ID 已替换为真实值，而不是 placeholder
- 所有必需 secrets 已配置
- `npx tsc --noEmit` 通过
- `npx vitest run` 通过
- `npx opennextjs-cloudflare build` 通过
- 如适用，`npx playwright test` 通过
- `.open-next/worker.js` 成功生成
- 生产路由配置正确：

```toml
routes = [
  { pattern = "gifmeme.org/*", zone_name = "gifmeme.org" }
]
```

---

## 预上线 / 预发布验证

正式对外发布前，建议做一次完整验证：

### 功能检查

- 首页可访问
- 搜索功能可用
- 分类页可访问
- GIF 详情页可访问
- Google OAuth 跳转正常
- Favorites 页面需要登录
- Admin 页面保持受保护状态
- Dark mode 正常
- Mobile 布局可接受

### 基础设施检查

- D1 migration 已执行
- KV 缓存正常
- Analytics 后台可以查询数据
- `NEXT_PUBLIC_APP_URL` 和 `NEXT_PUBLIC_BASE_URL` 指向正确环境

### Smoke 检查命令

```bash
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/api/gifs/trending
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/admin
```

---

## 上线发布指引

### 推荐方式

优先使用仓库内置部署脚本：

```bash
./scripts/deploy.sh
```

该脚本会依次执行：

1. Type check
2. Vitest 测试
3. OpenNext Cloudflare build
4. Worker bundle 大小输出
5. Wrangler secret 设置提示
6. `wrangler deploy`
7. 远程 D1 migration
8. 基础生产 smoke test

### 手动发布流程

如果你需要手动发布，可使用：

```bash
npx tsc --noEmit
npx vitest run
npx opennextjs-cloudflare build
npx wrangler deploy
for migration in drizzle/*.sql; do
  npx wrangler d1 execute gifmeme-db --file="$migration" --remote
done
```

### 发布后验证

```bash
curl -s https://gifmeme.org
curl -s https://gifmeme.org/api/gifs/trending
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/admin
```

同时建议人工确认：

- 首页内容是否正常渲染
- 登录入口是否可用
- Favorites 流程是否仍能正确跳转
- Admin 访问控制是否仍然有效

---

## 本地运行注意事项

- 若干服务端页面会请求 `http://localhost:8787`
- 因此 `npm run dev` 更适合快速开发，**完整联调更推荐 Workers-compatible 的本地运行方式**
- 如果缺少 `KLIPY_API_KEY`，内容可能退化为空状态或 mock 友好行为，而不是展示真实 API 数据
- 如果缺少 D1 绑定，auth / favorites / admin 流程不会表现得像生产环境

---

## 常用命令

```bash
# 安装依赖
npm install

# Next.js 本地开发
npm run dev

# 构建 Worker bundle
npm run build:worker

# 预览 Worker 输出
npm run preview

# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 生产部署脚本
./scripts/deploy.sh
```
