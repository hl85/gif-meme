---
name: deploy
description: Cloudflare 生产部署规范。检测到部署、上线、发布意图时自动加载。执行任何部署操作前必须先读取本 skill。
mcp:
  cloudflare:
    type: url
    url: https://bindings.mcp.cloudflare.com/mcp
---

# Cloudflare 部署规范

适用于当前项目：**Next.js 15 + @opennextjs/cloudflare + Wrangler + Cloudflare Workers**。

当前项目**不使用 Supabase**。任何部署、上线、发布流程都必须基于本仓库的真实选型执行：
- 运行时：Cloudflare Workers
- 构建产物：`.open-next/worker.js`
- 数据层：Cloudflare D1（`main-db`）
- 缓存层：Cloudflare KV（`cache`）
- 统计：Cloudflare Analytics Engine（`gifmeme-analytics`）
- 生产路由：`gifmeme.org/*`

## 基本原则

- Production 部署必须经过人工确认，不得自动执行。
- 工作区存在未提交变更时，禁止部署。
- 所有部署都必须可追溯到具体 commit SHA。
- 部署前必须完成构建、类型检查、测试和基础 smoke check。
- 禁止把与当前项目无关的基础设施假设带入部署流程，尤其是 **Supabase**。

## 当前项目的真实部署入口

优先使用仓库内脚本：

```bash
./scripts/deploy.sh
```

该脚本当前会执行：
1. `npx tsc --noEmit`
2. `npx vitest run`
3. `npx opennextjs-cloudflare build`
4. 检查 `.open-next/worker.js` bundle 大小
5. 设置 Workers secrets
6. `wrangler deploy`
7. 执行 D1 migrations
8. 对 `https://gifmeme.org` 做 smoke test

如需手动部署，命令必须与当前项目一致，不得改用其他平台命令。

## 部署前检查（Pre-flight）

以下条件必须全部满足，否则终止：

- `git status` 为 clean
- `npx tsc --noEmit` 通过
- `npx vitest run` 通过
- `npx opennextjs-cloudflare build` 通过
- 已登录 Cloudflare 账户（Wrangler 可用）
- `wrangler.toml` 中以下绑定与当前环境一致：
  - D1: `main-db`
  - KV: `cache`
  - Analytics Engine: `gifmeme-analytics`
- `wrangler.toml` 中占位符资源 ID 已替换为真实值，尤其是：
  - `database_id = "placeholder-will-be-replaced-on-deploy"`
  - `id = "placeholder-will-be-replaced-on-deploy"`

## 必须确认的 Secrets / Env

当前项目要求以下 secrets：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `KLIPY_API_KEY`
- `ADMIN_EMAILS`

如部署依赖以下环境变量，也必须确认存在且值正确：

- `CF_ACCOUNT_ID`
- `CF_ANALYTICS_TOKEN`
- `NEXT_PUBLIC_APP_URL`

## 资源与路由核对

部署前必须核对以下内容：

- Worker 名称：`gif-meme`
- 主入口：`.open-next/worker.js`
- 生产路由：`gifmeme.org/*`
- D1 数据库名称：`gifmeme-db`
- Analytics Engine binding：`gifmeme-analytics`

如果任一绑定名、数据库名、route、zone 与仓库配置不一致，先修正配置，再部署。

## 推荐部署流程

### Production

1. 确认用户明确要求部署到生产
2. 运行 pre-flight 检查
3. 运行：

```bash
./scripts/deploy.sh
```

4. 检查输出中的：
   - TypeScript 通过
   - Vitest 通过
   - Build 通过
   - Bundle size 合理
   - `https://gifmeme.org` 返回 200
   - `/api/gifs/trending` 返回可用状态码
   - `/admin` 返回受保护状态（401/403/404 之一，视实现而定）

### 手动部署（仅在脚本不适用时）

```bash
npx tsc --noEmit
npx vitest run
npx opennextjs-cloudflare build
wrangler deploy
for migration in drizzle/*.sql; do
  wrangler d1 execute gifmeme-db --file="$migration" --remote
done
```

## 回滚规范

满足以下任意条件时，优先准备回滚：

- 首页不可访问
- `/api/gifs/trending` 异常
- OAuth 登录回调失败
- D1 migration 执行后出现明显功能故障
- 生产错误率显著上升

回滚必须基于 Cloudflare Workers 版本能力执行，且必须记录回滚前后的版本信息。

## 部署后验证

至少执行以下验证：

```bash
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/api/gifs/trending
curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/admin
```

并人工确认：
- 首页正常加载
- 搜索/分类/详情页未出现明显 5xx
- 登录入口可用
- 管理后台仍受权限控制

## 部署记录

每次 Production 部署后必须记录：

- 时间
- 分支
- Commit SHA
- Worker 名称
- 目标域名 / route
- 执行人
- 是否执行 migration
- smoke test 结果

## 禁止行为

- 禁止在工作区不 clean 时部署
- 禁止构建/测试失败后继续部署
- 禁止引入 Supabase 相关检查、命令或回滚判断
- 禁止把 `service_role`、`anon key`、`supabase functions deploy` 等无关命令写入当前项目部署流程
- 禁止跳过 secrets / bindings / route 核对
- 禁止在未获用户明确许可时执行生产部署
