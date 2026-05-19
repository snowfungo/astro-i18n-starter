# AI Chibi Generator 综合对比与迁移方案

本文档用于解决两个问题：

1. 横向分析以下项目的功能特点、优缺点、适用边界。
2. 基于这些项目的长处，给出一套把 `/Users/snow/notes/code/projects/ai-chibi-generator` 完整能力迁移到 `/Users/snow/notes/code/projects/astro-i18n-starter` 的综合方案。

本次迁移的硬约束很明确：

- 最终承载项目必须是 Astro。
- `ai-chibi-generator` 的产品能力不能缩水。
- 必须保留完整业务闭环，而不是只迁 landing page。
- 必须覆盖：授权、Stripe、credits/quota、生成接口、Dashboard、Admin、i18n、SEO、博客、数据层。

换句话说，本次不是“挑一个模板替换掉另一个模板”，而是“把多个成熟项目里最值得借的能力拆出来，组合成一套适合 Astro 的最终架构”。

## 1. 结论先行

先给结论，避免后面信息太多导致判断发散。

### 1.1 最终建议

最终不建议直接把任意一个候选项目整体搬到 Astro，而是建议采用下面的组合策略：

- 以 `ai-chibi-generator` 作为业务真源。
- 以 `astro-i18n-starter` 作为最终承载壳与路由/i18n/SEO 基础。
- 从 `mkfast-template-demo` 借认证、Stripe 基础形态、Drizzle + SQLite/D1 迁移思路、R2 思路。
- 从 `vibe-any-tanstack` 借 credits/order/subscription/payment webhook 抽象层、支付适配器分层、上传接口思路。
- 从 `nexty.dev` 借 Better Auth 高完成度配置、Webhook 事件拆分方式、成熟的账务/风控边界意识。
- 从 `shipany-template-two` 借多支付 provider 抽象、配置驱动支付产品映射、数据库多后端兼容思路。
- `shipany-template-one` 只作为较弱参考，主要借其“快速成型的页面组织和 credits API 直观度”，不建议作为核心技术来源。

### 1.2 最优取舍

如果只看这次迁移的目标，五个候选项目里最值得借鉴的顺序是：

1. `vibe-any-tanstack`
2. `mkfast-template-demo`
3. `nexty.dev`
4. `shipany-template-two`
5. `shipany-template-one`

但这不是“项目整体质量排名”，而是“对本次 chibi -> Astro 完整迁移的适配度排名”。

### 1.3 为什么不是直接选一个项目照抄

原因很直接：

- `mkfast-template-demo` 的认证和 Stripe 很干净，但没有 credits 闭环，不够支撑 chibi 业务。
- `vibe-any-tanstack` 的 credits 和支付抽象非常接近目标，但它是 TanStack Start，不是 Astro。
- `nexty.dev` 很成熟，但是 Next.js + Postgres 取向，迁到 Astro 时耦合成本高。
- `shipany-template-two` 能力面很大，但动态配置、多 provider、多数据库兼容一起上，系统复杂度偏高。
- `shipany-template-one` 更像快速发站模板，适合起步，不适合作为这次“保留完整产品能力”的主骨架。

所以最合理的路线不是“整包迁移”，而是“模块择优”。

## 2. 本次迁移的真实目标

先明确目标，后面的比较才有判断标准。

`ai-chibi-generator` 当前是一个完整产品，而不是一组页面。它至少包含：

- 公开产品页：`/`、`/photo-to-chibi`、`/chibi-avatar-maker`、`/chibi-couple-generator`
- 内容页：`/pricing`、`/features`、`/about`、`/blog/*`
- 用户态页面：`/dashboard`
- 管理态页面：`/admin`
- 认证：Google OAuth、cookie session、refresh token、mock login/dev bypass
- 额度：匿名日额度、登录 credits、扣减、退款、充值
- 支付：Stripe checkout、portal、subscription/usage 查询、webhook
- 生成：文生图、图生图、provider 调用、fallback、archive proxy
- 数据：用户、订阅、credits、生成历史、audit、webhook 幂等
- i18n：5 语言文案
- SEO：sitemap、robots、canonical、meta、博客 SEO

因此这次迁移必须覆盖三层：

1. 产品层
2. 平台层
3. 运维与数据层

只迁页面，算失败。只迁 API，不迁 SEO/i18n，也算失败。

## 3. 评估标准

对候选项目的比较，统一使用以下维度：

- 认证能力
- 支付能力
- credits / usage / quota 能力
- 数据层与迁移能力
- 文件上传 / 存储能力
- i18n / SEO / 博客能力
- Admin / Dashboard 能力
- AI / 生成任务抽象
- 对 Astro 迁移的可借鉴性
- 复杂度与耦合风险

## 4. 候选项目对比

### 4.1 `mkfast-template-demo`

项目定位：TanStack Start + Cloudflare Workers 的 SaaS boilerplate。

核心特点：

- Better Auth 集成完整
- Stripe 支付链路清晰
- D1/SQLite + Drizzle 迁移清晰
- R2 存储能力明确
- 博客、邮件、后台、设置页齐全
- 代码边界比较干净，文档也完整

明显优点：

- 认证模块结构很适合拿来参考
- `docs/auth.md`、`docs/payment.md` 说明清楚，迁移时可以直接提炼设计
- `src/auth/auth.ts` 的 Better Auth 配置简洁明确，Google 登录、邮箱验证、cookie 管理都比较规范
- `src/api/payment.ts` 的 checkout / portal / current plan / completion check 拆分合理
- `src/routes/api/webhooks/stripe.ts` 的入口足够清晰，方便改写成 Astro API route
- `src/db/index.ts` 基于 libsql/file sqlite 的方式，很适合 Astro 第一阶段本地/单机迁移
- `src/storage/provider/r2.ts` 提供了比较直接的对象存储参考

明显缺点：

- 没有完整 credits 体系，只支持 plan/payment，不支持 chibi 这种“按次消耗信用点”产品
- 没有匿名额度模型
- 没有图片生成链路
- 以 Cloudflare Worker 约束为前提，某些运行时设计不适合 Astro Node SSR 第一阶段

适合借的部分：

- Better Auth 接入方式
- Stripe checkout / portal / webhook 基础组织方式
- Drizzle migration 组织方式
- R2/文件存储 provider 思路
- 用户设置页、Billing 页的信息架构

不适合直接照搬的部分：

- “无 credits 的订阅型支付模型”
- 全量 Cloudflare Worker 运行时假设

综合评价：

- 它非常适合作为 Astro 最终后端骨架的参考底盘之一。
- 但它不能单独解决 chibi 的“credits + 生成 + quota”问题。

### 4.2 `vibe-any-tanstack`

项目定位：TanStack Start 的 AI SaaS boilerplate，强调 auth + payments + credits + AI。

核心特点：

- Better Auth
- credits 系统完整
- 支付适配器抽象明显
- admin、chat、file upload、credit package 能力齐全
- 支持多 provider 支付和 AI 相关扩展

明显优点：

- 对本次迁移最有价值的是它的 payment/credits 分层
- `src/integrations/payment/adapters/*` 和 `services/webhook.ts` 已经在做“provider 统一抽象 + 事件标准化”
- `src/services/credits.service.ts` 有完整的 credit 增减、每日奖励、FIFO 消耗、过期策略思路
- `src/routes/api/payment/credit-checkout.ts` 与 chibi 的“买 credits 包”非常接近
- `src/routes/api/payment/webhook/$provider.ts` + `services/webhook.ts` 的组合很适合拿来抽象 Astro 里的 webhook 处理层
- `src/routes/api/file/upload.ts` 的 multipart 上传与存储流程可直接借鉴
- `src/shared/lib/auth/auth-server.ts` 已经把 Better Auth + email verification + social login 做到了较轻量可移植的程度

明显缺点：

- 项目复杂度偏高，包含 chat、AI、多支付、多功能模块，直接照搬会带入大量无关能力
- i18n 依赖 Intlayer，和 Astro 当前 i18n 结构差异较大
- 使用 TanStack Start 的 server route / middleware 方式，不可直接原样迁入 Astro
- credits 模型是偏通用 AI SaaS，不完全等于 chibi 当前业务规则，仍需以 chibi 规则校正

适合借的部分：

- credits 服务设计
- payment adapter 抽象
- webhook 标准事件处理层
- one-time credit package 购买流程
- 文件上传 API 组织方式
- auth 可配置化边界

不适合直接照搬的部分：

- Intlayer i18n 体系
- chat、AI 通用模块的大量无关部分
- 全量 TanStack 路由/中间件结构

综合评价：

- 它是这次迁移最重要的“业务平台参考源”。
- 尤其适合借 credits、orders、subscriptions、payment adapters 这一整套中层服务设计。

### 4.3 `nexty.dev`

项目定位：Next.js 16 + Supabase / Better Auth + Stripe + AI + Admin 的成熟 SaaS 模板。

核心特点：

- Auth 完整度很高
- Stripe webhook 处理成熟
- Postgres / Drizzle 迁移较完整
- AI demo、R2/S3、tracking、风控、rate limit 边界意识更强
- i18n、内容、后台比较完整

明显优点：

- `lib/auth/index.ts` 的 Better Auth 配置成熟度很高，包含 magic link、OTP、social、captcha、anonymous、admin、rate limit 等完整边界
- `app/api/stripe/webhook/route.ts` 的事件拆分清晰，适合借来做 Astro 版 Stripe webhook handler 分发
- `app/api/payment/checkout-session/route.ts` 的 provider 分流、session 构建和错误处理比较成熟
- 数据层迁移历史完整，说明这个项目已经承载过持续演化
- 对“生产真实业务”中的异常、风控、营销 tracking 等边界考虑比其它模板更成熟

明显缺点：

- 技术栈是 Next.js App Router，迁到 Astro 时无法直接平移
- 默认更偏 Postgres/Neon/Serverless 场景，而本次 Astro 第一阶段更适合 SQLite 过渡
- 支付模型更偏通用 SaaS 订阅与扩展，不是专门围绕 chibi 场景打造
- AI demo 本身明确写了很多 TODO，不能直接视为成品生成链路

适合借的部分：

- Better Auth 完整配置思想
- Stripe webhook 事件拆分方式
- 更成熟的异常处理与 rate limit 思路
- 生产级 session、email、tracking 的边界设计

不适合直接照搬的部分：

- Next.js App Router 路由组织
- 过重的完整 SaaS/增长/营销配套
- AI demo 的半成品生成链路

综合评价：

- 这是最适合借“生产级规范和安全边界”的项目。
- 适合作为设计质量标杆，不适合作为 Astro 里的直接实现模板。

### 4.4 `shipany-template-two`

项目定位：支持多支付 provider、多数据库、多扩展能力的 AI SaaS 平台模板。

核心特点：

- Better Auth
- 多支付 provider：Stripe、PayPal、Creem 等
- 多数据库兼容：SQLite/Turso/D1/Postgres/MySQL
- AI 生成、聊天、存储、配置、扩展体系齐全
- 配置驱动程度高

明显优点：

- `src/core/db/index.ts` 做了多数据库兼容层，对数据库提供商切换的抽象非常强
- `src/app/api/payment/checkout/route.ts` 的“配置驱动产品映射 + provider 选择”很适合多支付扩展场景
- `src/app/api/payment/notify/[provider]/route.ts` 的 webhook 入口已经在处理 provider 标准化事件
- `src/core/auth/config.ts` 的 Better Auth 组织比 template-one 更成熟，包含 social provider、verification、DB hook、初始 credits/role 授予等
- 主题、block、扩展体系完整，说明其组件抽象有较强复用能力

明显缺点：

- 系统非常大，动态配置、主题、支付、多数据库全部一起上，迁移到 Astro 时极易过拟合
- 对本次 chibi 迁移来说，很多能力是冗余复杂度
- 路由、服务、model 层较多，理解成本高
- 多支付 provider 是加分项，但本次刚需仍然只是 Stripe 完整闭环

适合借的部分：

- 多 provider 支付抽象思想
- 多数据库兼容层设计思路
- Better Auth 动态配置能力
- 配置驱动价格产品映射方式

不适合直接照搬的部分：

- 整体的高度平台化结构
- 为兼容多 provider / 多数据库引入的大量复杂抽象

综合评价：

- 它很强，但对这次迁移来说“强过头了”。
- 适合借局部思想，不适合当第一阶段主骨架。

### 4.5 `shipany-template-one`

项目定位：更偏快速起盘的 Next.js AI SaaS 模板。

核心特点：

- Next Auth
- Stripe/Creem 基础支付
- credits 查询接口
- landing/docs/console/dashboard 结构直观

明显优点：

- 路由和目录结构相对直观
- `src/app/api/checkout/route.ts` 把一笔订单从 pricing -> order -> provider checkout 串起来，易于理解
- `src/app/api/get-user-credits/route.ts` 这种简单接口对快速理解 credits UI 接入有帮助

明显缺点：

- 认证是 NextAuth，不是 Better Auth；对本次 Astro 迁移参考价值低于其它候选项目
- 支付和 credits 模型完成度不如 `vibe-any-tanstack` 和 `shipany-template-two`
- 技术栈较旧，类型与依赖版本相对混杂
- 更像 starter，不像高完成度平台

适合借的部分：

- 页面组织直觉
- 最小化 checkout/order 流程理解
- 一些 dashboard/console 的布局思路

不适合直接照搬的部分：

- 认证体系
- 账务与 credits 核心实现

综合评价：

- 可以参考，但不应成为核心迁移来源。

## 5. 横向对比结论

### 5.1 按能力维度排名

认证能力：

1. `nexty.dev`
2. `mkfast-template-demo`
3. `shipany-template-two`
4. `vibe-any-tanstack`
5. `shipany-template-one`

支付与 webhook 抽象：

1. `vibe-any-tanstack`
2. `shipany-template-two`
3. `nexty.dev`
4. `mkfast-template-demo`
5. `shipany-template-one`

credits / 消耗模型：

1. `vibe-any-tanstack`
2. `shipany-template-two`
3. `shipany-template-one`
4. `nexty.dev`
5. `mkfast-template-demo`

数据库与兼容层：

1. `shipany-template-two`
2. `nexty.dev`
3. `vibe-any-tanstack`
4. `mkfast-template-demo`
5. `shipany-template-one`

对 Astro 第一阶段迁移的适配度：

1. `mkfast-template-demo`
2. `vibe-any-tanstack`
3. `nexty.dev`
4. `shipany-template-two`
5. `shipany-template-one`

### 5.2 综合判断

如果目标是“在 Astro 中保留完整 chibi 产品能力”，最合理的组合是：

- 平台骨架参考 `mkfast-template-demo`
- 账务与 credits 参考 `vibe-any-tanstack`
- 认证质量标杆参考 `nexty.dev`
- 可扩展支付/数据库思路参考 `shipany-template-two`
- 页面和快速落地参考 `shipany-template-one`

## 6. 最终建议的模块来源图

下面直接给出建议，不绕弯。

### 6.1 以哪个项目做主参考

主参考项目分成两类：

- 业务真源：`ai-chibi-generator`
- 平台参考：`mkfast-template-demo` + `vibe-any-tanstack`

解释：

- 业务规则必须以 `ai-chibi-generator` 为准，不能被模板反向改造。
- `mkfast-template-demo` 适合做认证、Stripe、DB migration、对象存储的结构参考。
- `vibe-any-tanstack` 适合做 credits、orders、subscriptions、payment/webhook 中层的参考。

### 6.2 具体模块推荐来源

认证模块：

- 主参考：`mkfast-template-demo`
- 质量补强参考：`nexty.dev`
- 最终原则：保留 chibi 当前 cookie session / refresh token / mock login 语义

支付模块：

- 主参考：`vibe-any-tanstack`
- Stripe 实现参考：`mkfast-template-demo` + `nexty.dev`
- 多 provider 抽象只保留接口，不在第一阶段上线

credits 模块：

- 主参考：`vibe-any-tanstack`
- 业务规则以 `ai-chibi-generator` 为准
- 不采用 `mkfast-template-demo` 的无 credits 模型

数据库与 migration：

- 主参考：`mkfast-template-demo`
- 兼容思路参考：`shipany-template-two`
- 第一阶段坚持 SQLite + Drizzle，不做多数据库复杂化

对象存储与上传：

- 主参考：`mkfast-template-demo` + `vibe-any-tanstack`
- 如果第一阶段继续走旧 archive 代理，则只先引入抽象，不强上 R2

i18n / SEO / 博客：

- 主参考：`astro-i18n-starter`
- 业务内容以 `ai-chibi-generator` 文案与 SEO 配置为准
- 不引入 Intlayer、next-intl、Fumadocs 这一类框架级替换

Admin / Dashboard：

- 结构参考：`mkfast-template-demo`、`shipany-template-one`
- 数据能力参考：`vibe-any-tanstack`

AI/生成接口：

- 业务实现完全以 `ai-chibi-generator` 为准
- 候选项目只参考上传、异步任务、credits 结算方式

## 7. 最终目标架构

本次迁移后的目标项目，建议在 `astro-i18n-starter` 内形成如下结构。

```text
src/
  components/
    account/
    chibi/
    layout/
    payment/
    admin/
  content/
  layouts/
  locales/
  pages/
    api/
      auth/
      images/
      payments/
      account/
      admin/
      blog/
      health.ts
    [...index].astro
    [...blog].astro
  lib/
    server/
      auth/
      billing/
      credits/
      db/
      generation/
      i18n/
      quota/
      seo/
      storage/
      config/
      audit/
      blog/
db/
  migrations/
docs/
```

### 7.1 分层原则

页面层：

- Astro pages / Astro components / 局部 Svelte islands

接口层：

- `src/pages/api/*`

领域服务层：

- `src/lib/server/*`

数据层：

- Drizzle schema + migrations + repositories

### 7.2 关键原则

- UI 归 Astro
- 鉴权、支付、credits、quota、生成归 server lib
- 业务规则集中，不散落在 page route 中
- 页面不直接写 SQL
- API route 不直接承载复杂业务逻辑

## 8. 必须保留的 chibi 业务规则

这里单独强调一次，防止迁移中被模板逻辑带偏。

必须保留：

- 文生图与图生图双模式
- 4 种 style：`classic`、`kawaii`、`avatar`、`emoji`
- 匿名用户 IP 日额度限制
- 登录用户 credit 扣减与不足拦截
- provider 失败后的额度返还/退款策略
- Google OAuth
- Stripe checkout / portal / webhook
- Dashboard 里的用户信息、credits、历史记录
- Admin 调试能力
- `history`、`stats`、`archive proxy`
- 5 语言内容与产品 SEO

不能被模板覆盖掉的点：

- 不把产品从 credit 模式改成纯订阅模式
- 不把登录态改成只靠前端 token
- 不把生成接口改成 demo-only
- 不把博客/SEO/i18n 当作可选功能

## 9. 最终取舍方案

### 9.1 认证取舍

建议：在 Astro 中采用 Better Auth。

原因：

- `mkfast-template-demo`、`vibe-any-tanstack`、`nexty.dev`、`shipany-template-two` 都已经证明 Better Auth 比较适合现代 TS 全栈项目
- 它比继续手写 JWT + refresh token 更适合 Astro 里做长期维护
- 但要保留 chibi 当前的业务语义，例如 dev bypass、admin/test user、cookie 策略

具体取舍：

- 基础结构借 `mkfast-template-demo`
- email verification / captcha / social provider 细节参考 `nexty.dev`
- 不引入 `nexty.dev` 那套过重的 magic link / OTP / anonymous 全套能力，除非明确需要

### 9.2 支付取舍

建议：第一阶段只保留 Stripe，接口层按“可扩展 provider”方式设计。

原因：

- chibi 当前真实依赖是 Stripe，不需要在迁移时同时上线 PayPal / Creem
- 但可借 `vibe-any-tanstack` / `shipany-template-two` 的 adapter 思路，避免以后再重构

具体取舍：

- 第一阶段：只实现 `stripe` adapter
- API 保持 `/api/payments/*` 语义不变
- webhook 采用标准事件处理层
- one-time credit package 为主，不改成复杂订阅商城

### 9.3 credits 取舍

建议：credits 中层参考 `vibe-any-tanstack`，规则以 chibi 为准。

具体保留：

- credits 余额查询
- 购买 credits 包
- 使用时扣减
- 失败时回补
- credit transaction 记录

不建议照搬：

- 每日奖励
- 复杂的通用 AI credits 规则

除非用户明确要把 chibi 产品升级成更通用 AI 平台，否则这些能力不要顺手引入。

### 9.4 数据库取舍

建议：第一阶段继续 SQLite + Drizzle。

原因：

- `ai-chibi-generator` 当前就是 SQLite
- `mkfast-template-demo` 的迁移方式最接近 Astro 第一阶段需求
- 可以最快把数据迁移与开发环境跑通

可以借鉴 `shipany-template-two` 的点：

- 提前把 repository/service 边界做清楚
- 不把数据库方言假设写死在业务层

但不建议第一阶段就做：

- 多数据库兼容层
- d1/turso/mysql/postgres 全支持

### 9.5 上传与存储取舍

建议分两阶段：

- 第一阶段：兼容旧 archive proxy 或本地/对象存储抽象
- 第二阶段：正式迁到 R2/S3

具体参考：

- 上传 API 参考 `vibe-any-tanstack`
- 对象存储抽象参考 `mkfast-template-demo`

### 9.6 i18n 与 SEO 取舍

建议：坚持使用 Astro 原生现有结构扩展，不引入 Intlayer 或 next-intl。

原因：

- 最终承载是 Astro
- `astro-i18n-starter` 已经有 URL 本地化与内容路由能力
- 只需要从 `en/sl` 扩展到 `en/zh/ja/es/fr`

具体做法：

- 页面路由继续基于 `src/i18n/routes.ts`
- 文案迁移到 `src/locales/*`
- SEO 配置从 chibi 的 `config.json` 中重建为 Astro 配置模块

## 10. 迁移实施方案

### 阶段 0：重新定义基线

目标：把这次综合方案固化为真正的执行边界。

步骤：

1. 列出 chibi 当前所有页面、接口、表、配置、外部依赖。
2. 列出本文件里决定借鉴的模块来源。
3. 标记“必须保留”的接口路径与响应字段。
4. 决定 Astro 第一阶段使用 Node adapter 还是继续 Cloudflare。

建议结论：

- 第一阶段改用 Node adapter
- 第一阶段保留 SQLite
- 第一阶段只保留 Stripe 一个支付 provider

### 阶段 1：建立 Astro 全栈骨架

目标：让 `astro-i18n-starter` 从 i18n starter 进化成可承载完整产品的全栈壳。

步骤：

1. 调整 adapter 为 Node SSR。
2. 新建 `src/lib/server/*` 目录。
3. 引入 Drizzle、schema、migration 脚本。
4. 引入 Better Auth 基础接入。
5. 增加健康检查、日志、统一错误返回。

这里主要借：

- `mkfast-template-demo`
- `nexty.dev`

### 阶段 2：迁移数据库与 repository 层

目标：先把承载层搭起来。

核心表：

- `users`
- `subscriptions`
- `refresh_tokens` 或 Better Auth 对应 session/account/verification 表
- `image_generations`
- `anonymous_image_usage`
- `user_credits`
- `credit_transactions`
- `payment_logs`
- `processed_webhooks`
- `audit_logs`

这里主要借：

- `mkfast-template-demo` 的 Drizzle/migration 方式
- `shipany-template-two` 的 repository/service 分层意识

### 阶段 3：迁移认证

目标：恢复完整登录态和鉴权能力。

步骤：

1. 接入 Better Auth。
2. 实现 Google OAuth。
3. 实现 session cookie。
4. 补齐 `me`、`logout`、`admin-status`。
5. 为开发环境补齐 mock login / test bypass。

这里主要借：

- `mkfast-template-demo` 的基本接入方式
- `nexty.dev` 的成熟配置与边界处理

### 阶段 4：迁移支付与 credits 中层

目标：恢复账务闭环。

步骤：

1. 建立 payment adapter 接口，但先只实现 Stripe。
2. 建立 order / payment / subscription / credits service。
3. 接入 checkout / portal / usage / subscription。
4. 接入 webhook 并做幂等。
5. 让购买 credits 包可以真实发放 credits。

这里主要借：

- `vibe-any-tanstack` 的中层结构
- `mkfast-template-demo` 的 Stripe 基础实现
- `nexty.dev` 的 webhook 拆分方式

### 阶段 5：迁移 chibi 生成链路

目标：恢复最核心的产品能力。

步骤：

1. 迁移 prompt 拼装逻辑。
2. 迁移 `/api/images/generate`。
3. 保留 text + image 双输入。
4. 迁移 quota / credits 扣减逻辑。
5. 接入 provider、fallback、archive proxy。
6. 迁移 `history` 与 `stats`。

注意：

- 这部分不从模板借业务逻辑，完全以 `ai-chibi-generator` 为准。
- 只借上传和 credits 扣减/退款的服务组织方式。

### 阶段 6：迁移页面与交互

目标：把产品层从旧前端迁到 Astro 组件体系。

步骤：

1. 迁移 layout、nav、footer、SEO shell。
2. 迁移首页和 3 个核心 chibi 页面。
3. 将旧 `app_static/js/chibi.js` 重写为 Astro + Svelte island。
4. 迁移 Dashboard。
5. 迁移 Admin。
6. 迁移 pricing / features / about / blog。

这里主要借：

- `astro-i18n-starter` 的现有页面与 i18n 路由能力
- `mkfast-template-demo` / `shipany-template-one` 的 dashboard/billing 信息架构

### 阶段 7：迁移 i18n、博客、SEO

目标：保住流量与多语言能力。

步骤：

1. 将 `en/sl` 扩展为 `en/zh/ja/es/fr`。
2. 路由映射扩展到产品页面。
3. 将 chibi 原有文案迁入 `src/locales`。
4. 将 SEO 配置从 `config.json` 重建成 Astro config module。
5. 将博客内容迁入 content collections。

这里主要借：

- `astro-i18n-starter`
- `ai-chibi-generator` 的文案与 SEO 数据

### 阶段 8：数据迁移与切换

目标：真正替换旧服务。

步骤：

1. 导出现有 SQLite 数据。
2. 编写导入脚本。
3. 校验用户、credits、payments、image generations。
4. 跑 staging。
5. 小流量切换。
6. 最终下线旧服务。

## 11. 推荐的实际组合方案

这一节给最具体的落地建议。

### 11.1 推荐组合

认证：

- 使用 Better Auth
- 结构参考 `mkfast-template-demo`
- 安全边界参考 `nexty.dev`

支付：

- service/adapters 结构参考 `vibe-any-tanstack`
- Stripe 落地参考 `mkfast-template-demo` 和 `nexty.dev`

credits：

- service 结构参考 `vibe-any-tanstack`
- 业务规则以 chibi 为准，裁剪掉日奖励等非刚需能力

数据库：

- Drizzle + SQLite
- migration 方式参考 `mkfast-template-demo`

上传/存储：

- API 入口参考 `vibe-any-tanstack`
- provider 抽象参考 `mkfast-template-demo`

i18n/SEO/博客：

- 完全以 `astro-i18n-starter` 为最终落地载体

生成链路：

- 业务逻辑完全保留 `ai-chibi-generator`

### 11.2 不推荐组合

不推荐：

- 直接把 `nexty.dev` 或 `shipany-template-two` 当主骨架再尝试“Astro 化”
- 直接把 `mkfast-template-demo` 全部搬过来，再补 chibi
- 直接保留 `astro-i18n-starter` 现有 Cloudflare 假设不变，同时一次性引入 auth + upload + Stripe + sqlite

原因：

- 技术债和迁移难度都会迅速叠加
- 容易在运行时边界、数据库边界、对象存储边界上同时翻车

## 12. 风险与控制点

认证风险：

- Better Auth 接入后，原来的 mock login / dev bypass 容易丢
- 必须单独补一层开发模式逻辑

支付风险：

- webhook 幂等处理如果不严谨，会重复加 credits
- credits 购买成功但 order/payment 记录不一致，会出现账务问题

生成风险：

- 图片上传、多部分表单、provider 调用、archive proxy 同时迁移时最容易出错
- 必须先把接口跑通，再追求页面还原

i18n 风险：

- 如果把候选项目 i18n 框架引入 Astro，会让整个项目认知负担暴涨
- 坚持只扩展 Astro 现有 i18n 结构

复杂度风险：

- `shipany-template-two` 和 `nexty.dev` 提供了很多高级能力，但本次不应贪多
- 这次迁移最需要的是“完整闭环”，不是“最大功能面”

## 13. 最终执行建议

如果后面真的开始动手，我建议按下面顺序执行，不要变。

1. 先把 `astro-i18n-starter` 运行时改成适合全栈承载的模式。
2. 引入 Drizzle + SQLite + Better Auth。
3. 按 `vibe-any-tanstack` 的思路搭 payment/credits/order/subscription 中层。
4. 再把 `ai-chibi-generator` 的图片生成链路搬进来。
5. 再迁 Dashboard / Admin。
6. 最后迁页面、文案、博客、SEO。

这是最稳的，因为：

- 没有后端闭环，页面迁再漂亮也没用。
- 没有账务闭环，生成能力就是不可商业化的 demo。
- 没有 auth，Dashboard 和 Admin 都无法验证。

## 14. 一句话决策版

如果要一句话概括这次方案：

- 用 `astro-i18n-starter` 做最终外壳。
- 用 `ai-chibi-generator` 定义业务真相。
- 用 `mkfast-template-demo` 提供 Astro 最容易吸收的 auth/stripe/db/storage 结构参考。
- 用 `vibe-any-tanstack` 提供最关键的 credits/payment/webhook 中层设计。
- 用 `nexty.dev` 补生产级 auth/webhook 边界。
- 用 `shipany-template-two` 只补扩展性思路，不把它的复杂度整体带进来。

这样做，既能保住 chibi 的完整产品能力，又不会把 Astro 项目变成一个拼装失控的“多模板怪物”。
