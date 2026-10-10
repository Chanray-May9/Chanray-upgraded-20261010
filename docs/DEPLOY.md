# 新站点部署

公开源码仓库：`https://github.com/Chanray-May9/Chanray-upgraded-20261010`，默认分支 `main`。旧仓库和旧 Cloudflare 站点保持原样。

## 完整网站

访问 `https://chanray-upgraded-20261010.pages.dev/`，调情专区 `/afterdark/`，后台 `/admin/`。Cloudflare Pages 运行静态页面和根目录 `functions/api`，使用新建的独立 `BOARD` KV。原站点的数据没有复制到新 KV。

`ADMIN_TOKEN` 和 `ADMIN_ENCRYPTION_KEY` 通过 Pages secrets 保存，源码和前端没有密钥。后台令牌用于管理页登录，加密密钥用于后台保存 AI Key；两者应单独保管。AI 仍需要管理员在后台配置智谱 Key 和模型，或设置服务端秘密 `ZHIPU_API_KEY`。在没有 Key 时，AI 对话不会接通；本轮没有调用付费 AI。

## 更新完整网站

在已授权的本机运行：

```sh
npm ci
npm run check
npm run deploy:cloudflare
```

部署脚本以根路径构建，并将页面和 Functions 一起上传。这个 Pages 项目使用直接上传，推送 GitHub 不会自动更新 Cloudflare；每次修改后还需要运行部署命令。`wrangler.jsonc` 中记录的是新站点的 KV 标识，不是密钥。不要把它改为旧站点 KV。

上线后检查 `/api/content`、`/api/comments?page=home` 和后台未认证请求（应返回 401）。新评论默认先审核，后台回复和发布文案需要后台令牌。生产流量增加前需在 Cloudflare 配置限流；KV 不提供原子并发事务。

## GitHub Pages 静态副本

`https://chanray-may9.github.io/Chanray-upgraded-20261010/` 由 `main` 推送触发 Actions 更新。`npm run build` 默认使用这个地址的路径前缀。GitHub Pages 不运行 Functions，完整交互请使用上面的 Cloudflare 地址。

## 回退

每轮修改前在仓库外执行 `git bundle create ../Chanray-before-change-YYYYMMDD-HHMM.bundle --all`，并先保存未提交修改。代码回退可以部署保留的提交；KV 数据和后台 AI Key 不包含在 bundle 中，数据更改前需单独导出。不要替换或删除 `ADMIN_ENCRYPTION_KEY`，否则已保存的 Key 无法解密。
