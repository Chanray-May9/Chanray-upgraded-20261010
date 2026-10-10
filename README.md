# Chanray · 是锐锐呀

React 19、TanStack Start、TypeScript 与 Tailwind CSS 4 构建的个人网站，保留粉色机甲视觉、作品、相册、成长记录与 3D 角色展示。

## 开发与验证

使用 Node.js 22+ 与 npm。`package-lock.json` 是 npm/CI 的依赖版本依据；历史 `bun.lock` 保留，仅作为历史参考，避免混用安装器。

```sh
npm ci
npm run dev
npm run check
npm run build
npm run test:build
```

GitHub Pages 的部署目录为 `dist/client`，默认 URL 前缀 `/Chanray/`。更换仓库名或部署根路径时，应同步修改 `vite.config.ts` 中 `base`。所有八个 React 页面都预渲染；CI 会检查每个页面与模型资源。

## 后端边界

GitHub Pages **不运行** `functions/api`。这些接口需要另行部署到 Cloudflare Pages 并绑定 `BOARD` KV，以及设置 `ZHIPU_API_KEY` 服务端密钥。`public/cute` 是独立的旧版静态页面，未迁移其交互或重新配置接口地址。不要在前端提交 API 密钥。

当前 KV 实现是历史兼容方案，不保证并发写入的原子性；聊天室、评分、论坛等高并发功能应迁移至 Durable Objects 或 D1，并在上线前配置平台速率限制。此次没有声称解决 KV 丢失更新问题，也没有自动迁移线上数据。

技术升级与参考资料见 [升级说明](docs/UPGRADE.md)，备份与安全回退见 [回退说明](docs/ROLLBACK.md)。

## 后端管理

管理入口：GitHub Pages 为 `/Chanray/admin`，Cloudflare 根站为 `/admin`。提供四类数据读取、单条删除、当前分类 JSON 备份下载和退出管理。管理令牌只在页面内存保存，不写入 localStorage，也不出现在 URL。

部署到 Cloudflare Pages 时：

1. 安装命令使用 `npm ci`，构建命令使用 `npm run build`，输出目录 `dist/client`。
2. 设置构建变量 `SITE_BASE_PATH=/`；绑定 KV 命名空间 `BOARD`。
3. 设置服务端秘密 `ADMIN_TOKEN`（至少 32 字符，建议通过 `openssl rand -hex 32` 本地生成）和所需的 `ZHIPU_API_KEY`。令牌不要写入任何 `VITE_*` 变量。
4. Cloudflare Pages 将根目录 `functions` 编译为接口；通过同源 `/api/admin` 访问。GitHub Pages 上的管理页只有静态界面，无法自行运行接口。

可以通过构建变量 `VITE_ADMIN_API_URL` 指向已有的同源可信代理。管理和 AI 接口未开放跨域 CORS，直接指向跨域后端不会工作。公开文案读取接口允许跨域读取已发布文案。部署后先验证未认证请求返回 401，再用令牌读取测试数据；删除前点击导出备份。接口没有自动恢复导出的数据，恢复应由管理员在 KV 控制台验证后操作。KV 并发写入限制仍然存在，管理操作建议在低流量维护期间执行。

新增 `/afterdark` 调情专区：浅色粉白视觉、非露骨暧昧文案与可切换调情对白，不含用户私人身份信息。

## AI 互动与后台配置

调情专区新增真实 AI 对话（非露骨浪漫/调情）。公开请求只发送最近 9 条对话，清空或刷新页面即丢弃本地对话；消息会提交给智谱服务，不承诺第三方不保留日志。

管理页下方的「AI 提示词与 Key 管理」可读取/保存角色提示词、智谱模型名称、互动开关、替换或删除后台 Key。后台 Key 保存需要服务端秘密 `ADMIN_ENCRYPTION_KEY`，格式为 64 位十六进制，使用 `openssl rand -hex 32` 生成。该秘密与 `ADMIN_TOKEN` 应分别生成，不能进入前端。Key 使用 AES-256-GCM 加密后保存在 KV 的 `private:ai-config:v1`，读取接口不回显明文或密文。环境变量 `ZHIPU_API_KEY` 可作默认值，删除后台 Key 后会回退到该值。

保护并单独备份 `ADMIN_ENCRYPTION_KEY`；更换它之前需要重新保存 Key，否则旧密文无法解密。KV 配置传播可能延迟，后台「已保存」不保证全球立即更新。管理员仍需在平台配置公开 AI 接口速率限制/预算；本轮未实现分布式限流、内容审核服务或多用户权限。AI 非露骨范围通过服务端系统提示词表达，未经过真实模型红队或效果验证。

默认同源 `/api/chat`；`VITE_CHAT_API_URL` 可配置可信同源代理路径。GitHub Pages 上不能直接运行 AI 接口，Cloudflare Pages 部署后才能连通。配置页不提供任意上游 URL 编辑，避免把服务端 Key 发送到不可信地址。

## 全站文字管理

进入管理后台，读取「全站文字管理」。目录覆盖新旧页面、导航、页脚、按钮、提示、图片说明和页面标题/描述；可以搜索原文和新文案、按页面筛选。未收录的文字可在「添加未收录的文字」中复制原文并填入替换文字，无需改代码。相同原文默认一起替换，空白替换可以隐藏文字。文字替换不改动按钮行为、链接目标、样式类或接口路径。用户聊天消息和已保存的用户投稿不作为网站文案替换；投稿继续在内容管理分类中管理。

编辑产生草稿。预览会在独立窗口显示一小时内有效的草稿提示，不会发布、不传递管理令牌；编辑页的 sessionStorage 只保存预览文案，没有密钥。发布时先备份旧文案，再写入新版本；历史恢复前也备份当前文案。支持 JSON 导出/导入和恢复源码默认值。历史采用独立 KV 键保存，支持分页浏览。发布带当前版本检查，可以发现已可见的旧版本编辑，但受 KV 最终一致性影响，并不提供多管理员并发事务保证。

`/api/content` 仅输出已发布文案与版本信息，永不返回管理令牌、AI 提示词或 Key。新页面在浏览器完成加载后读取，每分钟和重新显示标签页时检查更新；静态预渲染文件保留源码默认文案。搜索引擎是否执行此读取取决于其 JavaScript 支持，修改文案并不直接重写部署文件。

Cloudflare 同源部署使用默认 `/api/content`。GitHub Pages 可将构建变量 `VITE_CONTENT_API_URL` 指向 Cloudflare 公开文案接口，该接口允许无凭据跨域 GET；后台仍需在 Cloudflare 同源站点操作。旧版页面若与接口不同源，在页面加载 `site-content-standalone.js` 前设置 `window.CHANRAY_CONTENT_API_URL` 为公开接口 URL。

AI 默认角色名为「锐锐」，对话称呼为「主人」。这两个原文可以在全站文案编辑器替换；默认 AI 提示词通过 `{{character}}` / `{{address}}` 使用同一名称配置。系统范围仍为非露骨聊天/调情。

## 浏览器验证

安装了 Chromium 的机器可运行 `npm run test:browser`（先执行生产构建）。通过 `CHROMIUM_PATH` 指定其他安装位置。测试使用独立本地服务、内存 KV 与临时随机令牌，验证后台编辑、草稿预览、发布、公开读取、新旧页面和恢复；不会写入线上 KV，不会调用付费 AI。默认截图保存到忽略目录 `artifacts/cms`，可用 `CMS_SCREENSHOT_DIR` 指定位置。测试覆盖 390/768/1440 像素、八个 React 页面及六个旧版 HTML 页面，共 42 种页面与视口组合，并检查横向溢出和浏览器错误。

新增默认文案后运行 `npm run content:catalog` 更新预置目录；运行时未收录的原文仍可由后台手动添加。
