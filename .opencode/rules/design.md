# Design Baseline

> 本文件是当前仓库的长期视觉基线。它回答的是：**这个项目应当长什么样**。

设计任务的执行流程由 `@design` skill 负责；本文件不再承担流程说明。

## 一句话风格

**clean SaaS 基底 + 轻微 terminal 气质 + 高信息密度**

关键词：

- functional
- data-dense
- terminal-inspired
- flat surfaces
- crisp borders
- low-noise hierarchy

## 核心约束

- 视觉服务于信息，不做装饰性设计
- 技术感要克制，不做赛博朋克堆砌
- 优先复用现有 token、组件模式和页面层级
- dark mode 必须完整，不是补丁
- 不为了“高级感”牺牲扫描效率和可读性

## 颜色与层级

### 基础 Token（Light）

| Token | Value |
|---|---|
| `--bg-base` | `#f9f9f8` |
| `--bg-surface` | `#ffffff` |
| `--border-default` | `#e5e5e5` |
| `--text-primary` | `#1a1a1a` |
| `--text-muted` | `#888888` |
| `--text-faint` | `#aaaaaa` |
| `--accent` | `#22c55e` |
| `--color-heading` | `#3ddc84` |

### Dark Mode 对应值

| Token | Dark |
|---|---|
| `--bg-base` | `#0f0f0f` |
| `--bg-surface` | `#1a1a1a` |
| `--border-default` | `#2a2a2a` |
| `--text-primary` | `#e5e5e5` |
| `--text-muted` | `#666666` |

### 状态色（统一复用）

| Level | Text | Background |
|---|---|---|
| Best | `#16a34a` | `#dcfce7` |
| Good | `#22c55e` | `#f0fdf4` |
| Fair | `#ca8a04` | `#fef9c3` |
| Caution | `#ea580c` | `#fff7ed` |
| Warning | `#dc2626` | `#fef2f2` |
| Blocked | `#991b1b` | `#fdf2f2` |

规则：状态色统一复用，不要每个功能自造红黄绿。

## 排版

只允许两套字体：

- `--font-sans`：主界面文本
- `--font-mono`：导航、数字、技术标签、数据列

推荐：

- Hero heading：Sans / 700 / 2.5–3rem
- Hero subheading：Sans / 400 / 1rem
- Nav links：Mono / 400 / 0.875rem
- Section label：Sans / 700 / 0.75rem
- Item title：Sans / 600 / 0.9375rem
- Numeric values：Mono / 400 / 0.8125rem

强制规则：

- 数字列使用 `font-variant-numeric: tabular-nums`
- 数字与统计值优先右对齐
- 不使用 serif

## 布局与间距

- 最大内容宽度：`1100px`
- 横向 padding：移动端 `24px`，桌面端 `48px`
- 默认单列居中布局
- 无必要不引入 sidebar

间距 token：

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

规则：优先使用 token，不随手写离散值。

## 组件模式

### Navigation

- 左：品牌 / 站点标识
- 中右：主要导航
- 最右：utility actions（theme toggle / user menu）
- 次级导航可使用 `[bracket]` monospace 风格
- 用边框分层，不用重阴影

### Hero / Page Header

- 大标题 + 一行解释性副标题
- 可选 context strip 显示关键指标或环境信息

### Filter / Sort Toolbar

- 左：搜索、筛选
- 右：排序、视图切换
- 输入框和下拉框默认 outlined 风格

### Data Row / Card

- 信息密度高，但必须可扫读
- 左：主标题 + tag
- 右：元数据 / 数值 / 状态
- 用 border 建层级，不靠阴影

### Badge

- 分类标签：outline badge
- 状态标签：soft filled badge
- badge 用于压缩信息，不用于视觉装饰

## 交互

- hover / color transition：`150ms ease`
- 避免布局动画
- 不做页面切场动画
- 内存内过滤/排序不要显示 loading

## 明确禁止

- 不发明新视觉体系
- 不引入重阴影、大渐变、玻璃拟态、插画堆砌
- 不新增第三套字体
- 不只做 light mode
- 不让装饰元素抢过数据与状态层级

## 验收清单

- [ ] 是否复用了现有 token / spacing / radius / typography？
- [ ] 是否与相邻页面和现有组件模式一致？
- [ ] 是否支持 dark mode？
- [ ] 数字、状态、标签是否一眼可扫？
- [ ] 是否避免了无关视觉噪音？

## 参考 Token

```css
:root {
  --bg-base: #f9f9f8;
  --bg-surface: #ffffff;
  --border-default: #e5e5e5;

  --text-primary: #1a1a1a;
  --text-muted: #888888;
  --text-faint: #aaaaaa;

  --accent: #22c55e;
  --color-heading: #3ddc84;

  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'Fira Code', monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-pill: 9999px;
  --transition-fast: 150ms ease;
}
```
