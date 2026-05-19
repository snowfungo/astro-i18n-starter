# Astro × ShipAny 二次确认与执行文档

本文档用于确认下一阶段的技术路线，并作为后续实际迁移的执行基准。

目标不是再做一轮泛泛而谈的对比，而是明确回答这几个问题：

1. 当前 `/Users/snow/notes/code/projects/astro-i18n-starter` 的短板是什么。
2. `shipany-template-one` 的主题系统值不值得迁。
3. `shipany-template-two` 的服务能力哪些该迁，哪些不该迁。
4. 最终采用什么组合方案，后续可以按什么顺序直接施工。

## 1. 结论先行

最终建议采用下面这条路线：

- **UI / 样式 / 页面组件体系**：以 Astro 原生组件体系为主，主题 token 参考 `shipany-template-one`，但不直接把 React UI 组件库整体搬进来。
- **服务层 / 支付 / credits / 多数据库兼容层**：以 `shipany-template-two` 为主要参考源，做 Astro 化重构。
- **图片生成与图片接口**：保留当前 chibi 业务规则，但把 provider 抽象、订单/credits/持久化边界按 `shipany-template-two` 的服务组织方式重建。
- **数据库兼容策略**：可以引入 `shipany-template-two` 的多数据库兼容思想，但**第一阶段只落 PostgreSQL + 为后续 SQLite/D1/MySQL 留接口**，不要一口气全上。

这条路线的核心原则是：

- **表现层保持 Astro 纯净**。
- **服务能力大量借鉴 ShipAny Two，但按 Astro 项目边界重新实现**。
- **不把 Next.js/React 运行时和平台化冗余结构一起带进来**。

## 2. 当前项目现状评估

### 2.1 已经具备的基础

当前 `astro-i18n-starter` 已经具备：

- Cloudflare Worker 运行链路可用。
- 自定义域名访问可用。
- 基础 i18n 路由与页面结构可用。
- PostgreSQL 连接在 Worker 运行时已经打通。
- 认证、支付、credits、quota、generation 这些目录已经存在服务端骨架。

也就是说，这个项目已经不是从零开始，而是已经有一个“能跑但不够稳、不够整齐、不够可扩展”的底座。

### 2.2 当前两个核心短板

你提的两个问题判断是准确的。

#### A. 组件与主题样式系统不完善

目前问题不在于“没有页面”，而在于：

- 缺少统一 design token 层。
- 颜色、圆角、阴影、字体、间距没有形成稳定语义系统。
- 页面组件更像若干业务片段，而不是一套可复用 UI primitives。
- 后续继续加 Dashboard / Admin / Billing / Generator 细分界面时，样式会越来越散。

#### B. 图片接口、图片生成、积分控制系统不完善

目前问题不在“完全没有实现”，而在于：

- 生成服务仍偏单体逻辑，provider 抽象不够清晰。
- credits / payment / order / subscription 之间的边界不够清楚。
- 数据库访问层还是项目定制式写法，后续换 provider 或扩数据库方言成本高。
- 图片生成、支付回调、credits 发放、幂等控制，这些业务闭环离“可长期维护”还有距离。

所以，下一阶段最值得做的是：

- 表现层建立主题系统 + 组件系统。
- 服务层建立 provider 抽象 + 数据兼容层 + 清晰的 credits/payment/generation 中台结构。

## 3. 对 `shipany-template-one` 主题系统的评估

参考文件：

- `/Users/snow/notes/code/projects/shipany-template-one/src/app/theme.css`

### 3.1 这套主题系统为什么值得借

这份 `theme.css` 的优点很明确：

- 它不是零散样式，而是完整 token 体系。
- 它已经把 `background / foreground / card / primary / accent / border / ring / chart / sidebar` 等语义颜色分层好了。
- 它把 `font-* / radius-* / shadow-*` 也纳入了 token，后续做后台和营销页可以共用。
- 它已经考虑了 `.dark` 分支，虽然你当前不一定要上 dark mode，但这个结构是对的。
- 它通过 `@theme inline` 把 token 暴露给 Tailwind 语义类，适合作为 UI 系统底座。

### 3.2 这套主题系统不该怎么用

不建议直接把它原封不动抄到 Astro 项目里，原因有三点：

- 它有明显的 ShipAny 品牌取向，不一定适合你当前 chibi 产品气质。
- 它默认是围绕 shadcn / React 组件体系命名的，Astro 这边需要更轻一点的落地方式。
- 它只是 token 层，不等于“整个组件系统就解决了”。

### 3.3 正确使用方式

建议：

- **保留结构，不照搬视觉答案**。
- 参考它的 token 分层方式，在 Astro 项目里重建一份适合 chibi 产品的 `theme.css` 或 `tokens.css`。
- 第一阶段只保留亮色主题为主，但 token 命名要直接兼容后续 dark theme。

应保留的结构：

- 语义颜色层：`--background`、`--foreground`、`--card`、`--primary`、`--accent`、`--muted`、`--border`、`--ring`
- 组件域颜色：`--sidebar-*`、`--chart-*`
- 基础设计 token：`--font-*`、`--radius`、`--shadow-*`

应重做的内容：

- 具体色值
- 字体选择
- 阴影风格
- chibi 产品的品牌强调色

## 4. 对 Astro UI 组件方案的建议

### 4.1 不建议直接迁 React UI 组件

`shipany-template-one` 和 `shipany-template-two` 都有完整 React UI 组件目录，例如：

- `/Users/snow/notes/code/projects/shipany-template-one/src/components/ui/*`
- `/Users/snow/notes/code/projects/shipany-template-two/src/shared/components/ui/*`

这些组件的问题不是“质量不好”，而是：

- 它们绑定了 React。
- 很多组件依赖 Radix React primitives。
- 迁到 Astro 后，如果为了复用这些组件再引 React islands，会让 UI 层变杂。
- 你后面会失去“Astro 页面为主、交互局部上岛”的清晰边界。

### 4.2 推荐的 UI 策略

推荐采用“**Astro primitives + 必要时小型 Svelte/React island**”的方式。

具体做法：

- 基础展示类组件统一写成 Astro：
  - `Button.astro`
  - `Card.astro`
  - `Badge.astro`
  - `Input.astro`
  - `Textarea.astro`
  - `Select.astro`
  - `Section.astro`
  - `PageHeader.astro`
  - `StatCard.astro`
  - `EmptyState.astro`
- 真正需要客户端交互的部分再单独做 island：
  - theme toggle
  - modal / drawer
  - generator form progressive enhancement
  - dashboard 内局部数据刷新

### 4.3 第一批建议抽的 Astro 组件

建议优先抽这一批，因为它们会同时服务营销页、Dashboard、Admin：

1. `Button.astro`
2. `Card.astro`
3. `Field.astro`
4. `Input.astro`
5. `Textarea.astro`
6. `Select.astro`
7. `Badge.astro`
8. `Alert.astro`
9. `StatCard.astro`
10. `Shell.astro`
11. `SectionHeading.astro`
12. `EmptyState.astro`

这批组件抽完，页面就不会再继续堆“页面私有样式”。

## 5. 对 `shipany-template-two` 服务层的评估

参考重点文件：

- `/Users/snow/notes/code/projects/shipany-template-two/src/core/db/index.ts`
- `/Users/snow/notes/code/projects/shipany-template-two/src/core/db/postgres.ts`
- `/Users/snow/notes/code/projects/shipany-template-two/src/core/auth/config.ts`
- `/Users/snow/notes/code/projects/shipany-template-two/src/app/api/payment/checkout/route.ts`
- `/Users/snow/notes/code/projects/shipany-template-two/src/app/api/payment/notify/[provider]/route.ts`
- `/Users/snow/notes/code/projects/shipany-template-two/src/shared/services/payment.ts`

### 5.1 它最有价值的不是“代码现成”，而是“层次划分正确”

ShipAny Two 真正值得借的不是 UI，而是下面这套服务端分层意识：

- `core/db`：数据库兼容层
- `core/auth`：认证配置层
- `shared/models`：数据访问模型层
- `shared/services`：业务服务层
- `app/api/*`：薄路由层

这个结构非常适合迁到 Astro，只要把 `app/api` 换成 `src/pages/api`，并把 Next.js / React 依赖剥掉。

### 5.2 多数据库兼容层值不值得迁

值得迁**设计**，不值得第一阶段全量迁**实现**。

`src/core/db/index.ts` 的优点：

- 把 provider 选择独立出来了。
- 为 MySQL / SQLite 方言差异做了兼容处理。
- 为事务、锁、`returning()` 等差异做了统一接口兜底。

这说明它不是简单的“换连接串”，而是认真处理了数据库方言不一致问题。

但如果你现在一口气把：

- PostgreSQL
- MySQL
- SQLite
- Turso
- D1

全都完整迁进 Astro，会立刻把当前项目复杂度抬高一倍以上。

### 5.3 正确落地方式

建议拆两层来做：

#### 第一层：现在就做

- 在 Astro 里建立统一 `db provider` 边界。
- 先只正式支持 PostgreSQL。
- 把 SQLite / D1 / MySQL 作为接口占位，而不是完整生产实现。
- 所有业务代码只依赖统一的 `db()` / repository / service 接口。

#### 第二层：后面再扩

- 当你确实需要本地 SQLite、Cloudflare D1、MySQL 兼容时，再逐个落实现。
- 每引入一种数据库，都必须配专门 smoke test。

这才是“最大复用 + 最低风险”的做法。

### 5.4 认证层值不值得迁

值得借结构，不建议直接大迁。

`shipany-template-two/src/core/auth/config.ts` 的优点：

- Better Auth 配置成熟
- social provider / verification / db hook / 初始 credits / 角色发放边界清楚

但你当前 Astro 项目已经有自己的一套认证与 session 闭环，不适合现在重做整套 Auth。

建议：

- 保留当前认证闭环。
- 借它的 `config + hooks + post-signup grant` 思路，整理你现有 auth 层。
- 把“新用户赠送 credits / 默认角色授予 / email verification”这些后置逻辑收口到统一 hook。

### 5.5 支付与 webhook 层值不值得迁

非常值得迁，而且是优先级最高的服务改造来源之一。

`checkout/route.ts` 值得借的点：

- 配置驱动产品映射
- 支付 provider 选择在服务层，而不是写死在路由里
- order 在 checkout 前先落库
- currency / amount 用服务端配置重新计算，避免信任前端

`notify/[provider]/route.ts` 值得借的点：

- webhook 路由非常薄
- provider 先标准化 event
- 业务处理交给 `handleCheckoutSuccess / handleSubscriptionRenewal / handleSubscriptionCanceled`
- 幂等性是第一优先级

这套结构非常适合 Astro 当前 `/api/payments/*` 重构。

### 5.6 图片生成与 credits 层能不能借

能借的是“服务组织方式”，不是直接抄业务逻辑。

因为你的 chibi 业务有自己特定的规则：

- 匿名 quota
- 登录 credits
- 文生图 / 图生图成本不同
- provider 失败时是否 refund
- archive / download / history / stats 的链路

这些规则应该继续以当前 chibi 业务为准。

但建议把实现改造成下列结构：

- `services/payment/*`
- `services/credits/*`
- `services/subscription/*`
- `services/generation/*`
- `services/storage/*`
- `services/orders/*`

路由只做：

- 参数校验
- session 获取
- 调 service
- 返回 response

## 6. 最终推荐架构

### 6.1 表现层

- 仍然使用 Astro 页面 + Astro 组件为主。
- 少量强交互组件允许岛化。
- 设计 token 参考 `shipany-template-one/theme.css` 的结构重建。
- 不引入完整 React UI 套件作为主框架。

### 6.2 服务层

- 以 `shipany-template-two` 为参考，重建 `core/db`、`services/payment`、`services/credits`、`services/orders`、`services/subscription`。
- 把当前偏直接式的数据库访问整理为 model/repository/service 分层。
- 让 `/api/payments/*`、`/api/images/*` 变成薄路由。

### 6.3 数据层

- 第一阶段正式支持 PostgreSQL。
- 设计上预留 `sqlite / d1 / mysql` provider 接口。
- 不在第一阶段强行实现所有数据库后端。

### 6.4 主题与组件层

- 用一套 Astro token system 统一营销页、用户台、后台。
- 第一阶段先做亮色主主题。
- 第二阶段再补暗色主题与更细粒度组件。

## 7. 明确不建议做的事

以下几件事不要做，否则项目会迅速失控。

### 7.1 不要把 ShipAny Two 整个项目整体 Astro 化

原因：

- 平台化过重
- Next.js 运行时残留多
- 你真正需要的只是其中的服务层结构，不是它整套产品壳

### 7.2 不要把 React UI 组件整包搬进 Astro

原因：

- 运行时复杂度上升
- 风格会混
- 后面维护会变成 Astro + React 双主栈

### 7.3 不要一开始就多数据库全开

原因：

- 会把测试矩阵瞬间炸开
- 当前真正需要的是“未来可扩”，不是“今天全部上线”

### 7.4 不要直接拷 ShipAny 商业模板代码后公开发布

这是必须单独提醒的风险。

`shipany-template-two/README.md` 已明确写了：

- `Please do not publicly release ShipAny's Code.`

你当前项目 remote 是公开 GitHub 仓库，所以这里必须注意：

- **可以参考其架构与实现思路**。
- **可以抽象迁移设计模式**。
- **但不应把其受限源码整段直接复制到公开项目里**。

因此后续执行必须采用：

- 结构借鉴
- 语义重写
- 接口重建

而不是源码级整块复制。

## 8. 执行方案

下面给出一份可以直接照着做的分阶段方案。

## 阶段 A：主题系统与 Astro UI 基础层

### 目标

建立一套稳定 token 和基础组件，不再让后续页面继续散写样式。

### 任务

1. 新建 `src/styles/theme.css` 或等价文件。
2. 参考 `shipany-template-one/src/app/theme.css` 建立语义 token。
3. 按 chibi 产品重做色板、字体、圆角、阴影。
4. 在 `src/styles/global.css` 里统一引入 token。
5. 新建第一批 Astro primitives：
   - `Button.astro`
   - `Card.astro`
   - `Input.astro`
   - `Textarea.astro`
   - `Select.astro`
   - `Badge.astro`
   - `Alert.astro`
   - `StatCard.astro`
6. 把现有 `Header`、`Footer`、`GeneratorPanel` 的公共样式抽回 primitives。

### 验收

- 首页、中文页、pricing 页、dashboard 页视觉语义统一。
- 页面里不再出现重复的局部按钮/card/input 样式块。

## 阶段 B：数据库兼容层重构

### 目标

把当前直连式 DB 代码改造成 provider-aware 架构，但第一阶段只稳定 PostgreSQL。

### 任务

1. 新建 `src/lib/server/db/providers/`：
   - `postgres.ts`
   - `sqlite.ts`
   - `d1.ts`
   - `mysql.ts`
   - `index.ts`
2. 参考 `shipany-template-two/src/core/db/index.ts` 的 provider 分发模式。
3. 把当前 `client.ts` 中与 PostgreSQL 绑定过深的逻辑拆出去。
4. 统一导出：
   - `db()`
   - `closeDb()`
   - 可选 dialect capability helpers
5. 保证当前 PostgreSQL 逻辑完全回归通过。

### 验收

- 当前站点功能不回退。
- 本地 worker preview 与生产部署都能跑。
- 后续业务层不再直接依赖单一方言实现。

## 阶段 C：支付 / credits / subscription 服务层重构

### 目标

把账务与积分逻辑整理成可长期维护的中层。

### 任务

1. 新建服务目录：
   - `src/lib/server/payment/`
   - `src/lib/server/orders/`
   - `src/lib/server/subscriptions/`
   - `src/lib/server/credits/`
2. 参考 `shipany-template-two/src/shared/services/payment.ts`：
   - provider manager
   - checkout success handler
   - renewal / cancel / update handler
3. 参考 `checkout/route.ts`：
   - order 先落库
   - 产品配置映射
   - 服务端重算金额
4. 参考 `notify/[provider]/route.ts`：
   - webhook 薄路由
   - provider event 标准化
   - 幂等优先
5. 保留当前 chibi 业务规则，不替换成 ShipAny 默认业务规则。

### 验收

- `create-checkout`
- `subscription`
- `usage`
- `webhook`

以上接口都经过回归测试。

## 阶段 D：图片生成与 credits 扣减链路重构

### 目标

把图片生成能力整理成 provider-aware、可退款、可审计的业务服务。

### 任务

1. 拆分 `generation/service.ts`：
   - prompt builder
   - provider adapter
   - quota gate
   - credits settlement
   - history writer
2. provider 层只对外暴露统一结果：
   - output_url
   - provider_task_id
   - archive_path
   - model
   - raw payload
3. mock provider 与真实 provider 走同一 service 接口。
4. 生成失败时 refund 规则统一收口。

### 验收

- 文生图、图生图、匿名 quota、登录 credits、失败退款全部可回归。
- 本地 smoke test 覆盖生成链路。

## 阶段 E：界面回填

### 目标

在新 token + primitives + service layer 基础上，把 Dashboard / Admin / Pricing / Generator 界面升级成统一系统。

### 任务

1. Dashboard 重构为 cards + sections + data components。
2. Admin 页面重构为 tables + actions + filters。
3. Pricing 页重构为产品配置驱动。
4. Generator 页重构为同一套表单/状态反馈系统。

### 验收

- 用户态与管理态视觉不再割裂。
- 新增页面不需要重新发明一套样式。

## 9. 推荐实施顺序

如果按投入产出比排序，建议顺序是：

1. **阶段 A：主题系统与 Astro UI 基础层**
2. **阶段 C：支付 / credits / subscription 服务层重构**
3. **阶段 D：图片生成与积分扣减链路重构**
4. **阶段 B：数据库兼容层重构**
5. **阶段 E：界面回填**

原因：

- 先把主题系统打稳，后面 UI 不会返工。
- 先把 payment/credits/service 边界清楚，生成链路才能真正稳。
- 多数据库兼容很重要，但不是当前第一痛点。

## 10. 最终确认

最终确认结论如下：

- **`shipany-template-one` 的 `theme.css` 值得迁“结构”，不值得迁“整套视觉答案”。**
- **UI 组件不要迁 React 套件，应该在 Astro 里重建 primitives。**
- **`shipany-template-two` 的服务层很值得迁，但应以“架构重写”的方式迁，不是源码整包复制。**
- **多数据库兼容层可以进入路线图，但应先做 provider-aware 架构，再逐个实现方言。**
- **这是当前最适合你这个项目的“最大复用 + 最小污染”方案。**

## 11. 下一步建议

下一步如果要我直接开始做，建议从下面两个任务里二选一：

1. 先做 **阶段 A：主题 token + Astro UI primitives**。
2. 先做 **阶段 C：payment / credits / subscription 中层重构**。

如果你的目标是尽快把“产品看起来更像完整 SaaS”，先做 A。

如果你的目标是尽快把“账务、积分、生成底层更稳”，先做 C。

从工程角度看，我更推荐先做 **A + C 的最小闭环**：

- 先建立 token 和基础组件。
- 同时把 payment/credits 边界理顺。

这样后面 Dashboard、Pricing、Generator 三条线都能同时受益。
