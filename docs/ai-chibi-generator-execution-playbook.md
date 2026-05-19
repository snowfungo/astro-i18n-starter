# AI Chibi Generator 迁移执行手册

本文档是 `/Users/snow/notes/code/projects/astro-i18n-starter/docs/ai-chibi-generator-migration-plan.md` 的执行版。前一份文档负责选型和取舍，这一份文档只做一件事：把迁移工作拆到可以直接开工、逐项验收、逐阶段回滚。

适用目标：

- 将 `/Users/snow/notes/code/projects/ai-chibi-generator` 的完整产品能力迁移到 `/Users/snow/notes/code/projects/astro-i18n-starter`
- 最终承载为 Astro
- 迁移后不丢失 chibi 的授权、Stripe、credits、quota、生成、Dashboard、Admin、i18n、SEO、博客能力

## 1. 执行原则

### 1.1 总原则

- 业务规则以 `ai-chibi-generator` 为唯一真源。
- 技术实现以 Astro 为最终落地，不反向被模板技术栈绑架。
- 每个阶段都必须“可运行、可验证、可回退”。
- 先迁闭环能力，再迁页面外观。
- 先迁服务端与数据层，再迁前端组件。

### 1.2 禁止事项

- 不在迁移过程中顺手改商业模式。
- 不把 credits 模型改成纯订阅制。
- 不把 cookie 登录态改成前端 token-only。
- 不一次性同时切换数据库、对象存储、支付 provider、前端框架。
- 不先做 landing page 再补后端闭环。

### 1.3 完成标准

只有满足以下条件，才算迁移完成：

- `astro-i18n-starter` 能独立承载所有核心流量
- `ai-chibi-generator` 不再承担核心接口职责
- 登录、支付、生成、历史、下载、Dashboard、Admin、博客、多语言在 Astro 内闭环
- 数据迁移完成或有明确兼容方案
- 关键测试通过，且存在回滚方案

## 2. 工作流结构

本次迁移按 4 条并行工作流推进，但要受阶段依赖约束。

工作流 A：平台基础设施

- 运行时
- 配置
- 数据库
- 认证

工作流 B：商业闭环

- 支付
- credits
- quota
- webhook

工作流 C：核心产品能力

- 生成接口
- 上传
- archive
- history / stats

工作流 D：内容与体验

- 页面迁移
- Dashboard / Admin
- i18n
- SEO
- 博客

## 3. 里程碑总览

### M0 基线冻结

目标：确认范围、接口、数据、配置，不再争议“要迁什么”。

### M1 Astro 全栈骨架可运行

目标：Astro 项目能承载 DB、Auth、API route。

### M2 认证与数据层闭环

目标：用户可登录，数据库可持久化，权限可判断。

### M3 支付与 credits 闭环

目标：买 credits、记账、发 credits、查 credits、webhook 幂等。

### M4 Chibi 生成闭环

目标：文生图、图生图、quota、扣减、退款、历史、统计全部可用。

### M5 产品界面闭环

目标：公开页、Dashboard、Admin、i18n、SEO、博客完整可用。

### M6 数据迁移与切换

目标：真实替换旧服务。

## 4. 详细阶段执行

## 阶段 0：基线冻结

### 目标

把“迁移目标”固化成可执行清单，避免中途反复变更。

### 输入

- `/Users/snow/notes/code/projects/ai-chibi-generator`
- `/Users/snow/notes/code/projects/astro-i18n-starter/docs/ai-chibi-generator-migration-plan.md`

### 任务清单

`T0-1` 枚举源项目页面

- 列出公开页、私有页、管理页、错误页、博客页
- 标记哪些必须 1:1 保留，哪些允许重构

`T0-2` 枚举源项目 API

- 列出 `/api/auth/*`
- 列出 `/api/images/*`
- 列出 `/api/payments/*`
- 列出 `/api/account/*`
- 列出 `/api/blog/*`
- 列出 `/api/health`

`T0-3` 枚举源项目数据表与字段

- `users`
- `subscriptions`
- `refresh_tokens`
- `image_generations`
- `anonymous_image_usage`
- `user_credits`
- `credit_transactions`
- `payment_logs`
- `processed_webhooks`
- `audit_logs`

`T0-4` 枚举环境变量与密钥依赖

- Google OAuth
- Stripe
- AI content service
- 站点 URL
- cookie / secret key

`T0-5` 冻结响应契约

- `POST /api/images/generate`
- `GET /api/images/history`
- `GET /api/images/stats`
- `GET /api/auth/me`
- `POST /api/payments/create-checkout`
- `POST /api/payments/webhook`

### 产出物

- 页面清单
- API 契约清单
- 数据表清单
- 环境变量清单

### 验收标准

- 后续所有开发都能对照这份清单判断是否漏迁

### 回退策略

- 本阶段无代码破坏，回退成本为零

## 阶段 1：Astro 全栈骨架落地

### 目标

让 `astro-i18n-starter` 从内容型 starter 变成可以承载完整 SaaS 的服务端应用。

### 依赖

- 阶段 0 完成

### 任务清单

`T1-1` 确认运行时方案

- 第一阶段建议从 `@astrojs/cloudflare` 切到 `@astrojs/node`
- 明确 dev / build / preview / deploy 运行方式

`T1-2` 建立服务端目录

- `src/lib/server/auth`
- `src/lib/server/billing`
- `src/lib/server/credits`
- `src/lib/server/db`
- `src/lib/server/generation`
- `src/lib/server/quota`
- `src/lib/server/storage`
- `src/lib/server/seo`
- `src/lib/server/config`

`T1-3` 建立统一配置层

- 公共配置
- 私密配置
- 运行环境校验
- 开发/生产差异处理

`T1-4` 建立基础 API route 结构

- `src/pages/api/health.ts`
- `src/pages/api/auth/*`
- `src/pages/api/images/*`
- `src/pages/api/payments/*`
- `src/pages/api/account/*`

`T1-5` 建立统一错误处理与日志规范

- 统一 JSON 错误结构
- 服务端日志入口
- request id / trace id 预留

### 推荐参考来源

- 主参考：`mkfast-template-demo`
- 补强：`nexty.dev`

### 交付物

- Astro 可运行的 server 架构骨架
- 健康检查接口
- 配置读取层

### 验收标准

- 本地 `pnpm dev` 可跑起
- `GET /api/health` 返回正常
- 服务端目录与 API route 结构稳定

### 回退策略

- 保留原 starter 页面不删
- 如果 Node adapter 切换风险过高，可暂时保留单独分支验证

## 阶段 2：数据库与迁移体系

### 目标

把源项目业务数据承载能力迁到 Astro。

### 依赖

- 阶段 1 完成

### 任务清单

`T2-1` 设计 Drizzle schema

- auth 相关表
- app 相关表
- webhook 幂等表
- image generation 表
- credits / transactions 表

`T2-2` 编写 migration

- 初始化 migration
- 索引和唯一约束
- 幂等约束

`T2-3` 建立 DB 访问层

- `client.ts`
- `schema.ts`
- `repositories/*`
- `transaction` helper

`T2-4` 建立 repository 层

- user repository
- subscription repository
- payment repository
- credit repository
- image generation repository
- webhook repository

`T2-5` 建立 seed / local bootstrap

- 本地开发用户
- 本地计划配置
- 可选测试数据

### 推荐参考来源

- 主参考：`mkfast-template-demo`
- 设计补充：`shipany-template-two`

### 交付物

- 完整 schema
- migration 脚本
- repository 层

### 验收标准

- 可以本地一键建库
- 核心表和索引齐全
- 可以插入/查询测试用户和生成记录

### 回退策略

- migration 逐条可追溯
- 阶段性变更不覆盖原始 chibi 数据库

## 阶段 3：认证与权限闭环

### 目标

恢复登录、用户识别、权限判断。

### 依赖

- 阶段 2 完成

### 任务清单

`T3-1` 接入 Better Auth

- session cookie
- social provider
- auth handler route

`T3-2` 接入 Google OAuth

- 发起登录
- callback
- 用户落库

`T3-3` 实现会话相关接口

- `GET /api/auth/me`
- `POST /api/auth/logout`
- 如保留则实现 `refresh`

`T3-4` 实现权限判断

- require auth
- require admin
- dev/test 用户判断

`T3-5` 补齐开发环境辅助能力

- mock login
- test bypass
- admin/test seed 用户

### 推荐参考来源

- 主参考：`mkfast-template-demo`
- 边界补强：`nexty.dev`

### 交付物

- Google 登录闭环
- 当前用户接口
- admin 判定
- 开发环境 mock 登录

### 验收标准

- 登录后刷新页面仍保持登录态
- `me` 能返回用户信息
- admin 用户能通过权限校验
- 非 admin 被正确拒绝

### 回退策略

- 若 Better Auth 迁入成本过高，可临时保留 chibi 原有 cookie/JWT 兼容层，但不建议长期保留

## 阶段 4：支付、订单、credits、webhook

### 目标

恢复商业闭环。

### 依赖

- 阶段 3 完成

### 任务清单

`T4-1` 设计 payment adapter 接口

- `createCheckout`
- `createPortal`
- `handleWebhook`
- `getSubscriptionState`

`T4-2` 第一阶段实现 Stripe adapter

- checkout session
- billing portal
- webhook signature 校验

`T4-3` 建立 order / payment / subscription service

- 创建订单
- 标记支付成功
- 记录 payment log
- 更新 subscription

`T4-4` 建立 credits service

- 查询余额
- 增加 credits
- 扣减 credits
- provider 失败回补
- 记 transaction

`T4-5` webhook 幂等处理

- 事件去重
- 重复回放保护
- 部分成功/部分失败处理

`T4-6` 暴露支付接口

- `POST /api/payments/create-checkout`
- `POST /api/payments/create-portal`
- `GET /api/payments/subscription`
- `GET /api/payments/usage`
- `POST /api/payments/webhook`

### 推荐参考来源

- 主参考：`vibe-any-tanstack`
- Stripe 实现参考：`mkfast-template-demo`
- webhook 事件拆分：`nexty.dev`

### 交付物

- Stripe checkout / portal / webhook
- credits service
- order/payment/subscription 中层

### 验收标准

- 下单成功能生成 checkout session
- webhook 回来能成功记账
- credits 成功发放
- 重复 webhook 不会重复加 credits

### 回退策略

- 先在 staging / Stripe test mode 验证
- 所有 credit 发放必须可审计、可人工修复

## 阶段 5：匿名额度与核心生成接口

### 目标

恢复 chibi 最核心的产品能力。

### 依赖

- 阶段 4 完成

### 任务清单

`T5-1` 迁移 style 与 prompt 构造逻辑

- `classic`
- `kawaii`
- `avatar`
- `emoji`

`T5-2` 建立 quota service

- IP 解析
- IP hash
- 当日已用次数
- 第四次拒绝

`T5-3` 建立 generation service

- 输入校验
- text/image source type
- provider 调用
- latency 记录
- archive path 记录

`T5-4` 建立 refund / rollback 逻辑

- provider error 时匿名额度返还
- 登录 credits 回补

`T5-5` 实现图片生成 API

- `POST /api/images/generate`
- `GET /api/images/history`
- `GET /api/images/stats`
- `GET /api/images/archive/*`

`T5-6` 接入文件上传能力

- multipart/form-data
- 文件大小限制
- mime type 校验

### 推荐参考来源

- 业务真源：`ai-chibi-generator`
- 上传参考：`vibe-any-tanstack`
- 存储抽象：`mkfast-template-demo`

### 交付物

- 文生图接口
- 图生图接口
- quota 服务
- history/stats/archive

### 验收标准

- 文生图成功
- 图生图成功
- 匿名第 4 次被拦截
- credits 不足被拦截
- provider 失败时能正确回补

### 回退策略

- 初期允许 provider 继续指向旧服务
- 如果存储迁移未完成，先保留 archive proxy 兼容层

## 阶段 6：Dashboard 与 Admin

### 目标

恢复用户态与管理态能力。

### 依赖

- 阶段 5 完成

### 任务清单

`T6-1` 迁移 Dashboard 信息结构

- 用户信息
- 当前 credits
- 最近生成记录
- 支付入口

`T6-2` 迁移 Admin 基础能力

- 用户查看
- credits 调试
- 配置查看
- 支付/订单查看

`T6-3` 建立页面级鉴权

- Dashboard only auth
- Admin only admin

### 推荐参考来源

- 信息架构：`mkfast-template-demo`
- 数据能力：`vibe-any-tanstack`
- 页面直觉：`shipany-template-one`

### 交付物

- Dashboard 页面
- Admin 页面
- 权限保护

### 验收标准

- 登录用户可看到自己的历史和 credits
- admin 可看到管理数据
- 普通用户无法访问 admin

### 回退策略

- Admin 可以先只做最小集，不强求一期全部重建

## 阶段 7：公开页面、i18n、SEO、博客

### 目标

恢复面向搜索与转化的前台内容层。

### 依赖

- 阶段 6 完成

### 任务清单

`T7-1` 迁移公开页

- 首页
- photo-to-chibi
- chibi-avatar-maker
- chibi-couple-generator
- pricing
- features
- about

`T7-2` 重写前端交互组件

- GeneratorForm
- ResultPanel
- HistoryGrid
- AuthWidget
- PaymentCTA

`T7-3` 扩展 i18n

- `en`
- `zh`
- `ja`
- `es`
- `fr`

`T7-4` 扩展路由本地化

- `src/i18n/routes.ts`
- 语言切换逻辑

`T7-5` 重建 SEO 配置层

- title
- description
- keywords
- canonical
- OG
- robots
- sitemap

`T7-6` 迁移博客

- content collections
- 列表页
- 详情页
- slug / 语言切换

### 推荐参考来源

- 最终落地：`astro-i18n-starter`
- 文案与 SEO 真源：`ai-chibi-generator`

### 交付物

- 公开产品页
- 五语言路由
- SEO 配置
- 博客页面

### 验收标准

- 页面可索引
- 语言切换正确
- blog 列表与详情正常
- sitemap / robots 正常

### 回退策略

- 若博客迁移延后，可先保留最低可用的公开页与 SEO，再单独补 blog

## 阶段 8：测试、数据迁移、灰度切换

### 目标

把新系统从“开发完成”推进到“可上线替换”。

### 依赖

- 阶段 7 完成

### 任务清单

`T8-1` 建立测试矩阵

- API 测试
- 页面测试
- 关键路径 E2E

`T8-2` 编写数据迁移脚本

- users
- subscriptions
- credits
- image generations
- payment logs
- processed_webhooks

`T8-3` 运行 staging 验证

- Google OAuth
- Stripe test mode
- 生成 provider
- Dashboard / Admin

`T8-4` 灰度切换

- 小流量切换
- 观察支付成功率
- 观察生成成功率
- 观察登录错误率

`T8-5` 正式切换与回收旧服务

- 确认数据一致
- 确认无核心回归
- 下线旧核心接口

### 交付物

- 测试报告
- 数据迁移脚本
- 上线清单
- 回滚清单

### 验收标准

- 核心路径全部通过
- staging 和灰度稳定
- 旧服务可下线

### 回退策略

- DNS / 反向代理级回退
- webhook 可短期双写或保守切换
- 数据迁移脚本保留幂等设计

## 5. 推荐任务拆分方式

为了方便真正执行，建议把工作拆成以下 Epic。

### Epic A：Runtime 与 Config

- A1 adapter 调整
- A2 server config
- A3 error/logging
- A4 health endpoint

### Epic B：DB 与 Auth

- B1 schema
- B2 migrations
- B3 Better Auth 接入
- B4 Google OAuth
- B5 mock login/dev bypass

### Epic C：Payment 与 Credits

- C1 payment adapter interface
- C2 stripe checkout / portal
- C3 order/payment/subscription service
- C4 credits service
- C5 webhook idempotency

### Epic D：Generation Core

- D1 quota service
- D2 prompt/style builder
- D3 generate API
- D4 upload validation
- D5 history/stats/archive
- D6 refund/recovery

### Epic E：App UI

- E1 public pages
- E2 dashboard
- E3 admin
- E4 auth/payment widgets
- E5 chibi generator component rewrite

### Epic F：Content 与 Launch

- F1 i18n expansion
- F2 SEO config
- F3 blog migration
- F4 data migration
- F5 staging + rollout

## 6. 每周节奏建议

如果要按真实项目推进，建议按下面节奏。

第 1 周：

- 阶段 0
- 阶段 1
- 阶段 2 前半

第 2 周：

- 阶段 2 后半
- 阶段 3
- 阶段 4 前半

第 3 周：

- 阶段 4 后半
- 阶段 5

第 4 周：

- 阶段 6
- 阶段 7 前半

第 5 周：

- 阶段 7 后半
- 阶段 8

如果资源更少，则保持顺序不变，只拉长时间，不要并行乱做。

## 7. 关键验收清单

上线前至少逐项打钩：

- `GET /api/health` 正常
- Google 登录成功
- `GET /api/auth/me` 正常
- Stripe checkout 成功
- Stripe webhook 幂等
- credits 成功发放
- credits 成功扣减
- 匿名额度第 4 次拒绝
- 文生图成功
- 图生图成功
- provider 失败回补成功
- history 正常
- stats 正常
- Dashboard 正常
- Admin 权限正常
- 五语言页面可访问
- blog 列表与详情正常
- sitemap/robots 正常

## 8. 第一批建议直接开工的任务

如果下一步就开始做，建议按这个顺序开工：

1. `A1` adapter 调整
2. `A2` server config
3. `B1` schema 设计
4. `B2` migrations
5. `B3` Better Auth 接入
6. `C1` payment adapter interface
7. `C3` order/payment/subscription service
8. `C4` credits service
9. `D1` quota service
10. `D3` generate API

原因：

- 这条路径最先打通核心业务闭环
- 一旦闭环跑通，后面的页面迁移就是可验证的 UI 工作，而不是猜接口

## 9. 与综合方案文档的关系

这份文档负责“怎么做”。

上一份文档负责“为什么这么做、从哪些项目借什么”。

后续执行时建议两份文档同时保留：

- `docs/ai-chibi-generator-migration-plan.md`：选型依据
- `docs/ai-chibi-generator-execution-playbook.md`：实施手册
