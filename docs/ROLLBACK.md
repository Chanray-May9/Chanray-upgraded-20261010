# 备份与回退

升级前提交：`d9df3033c17da6298d5008bc13984916ae3daba4`。

本地标签：`backup/pre-upgrade-20261010`。升级分支：`upgrade/engineering-20261010`。原始 `main` 未修改。

工作区备份文件：

- `/workspace/backups/Chanray-pre-upgrade-20261010.bundle`：Git 历史与引用备份。
- `/workspace/backups/Chanray-pre-upgrade-20261010.tar.gz`：原始提交源码快照。

备份仅包含仓库内容，不包含远端 KV 数据、部署配置、账户密钥或工作区依赖。上线前若要更改数据存储，需要另外导出数据；本次没有改动线上存储。

## 非破坏性查看旧版

```sh
git worktree add ../Chanray-before-upgrade backup/pre-upgrade-20261010
```

## 从备份恢复到新目录

```sh
git clone /workspace/backups/Chanray-pre-upgrade-20261010.bundle ../Chanray-restored
git -C ../Chanray-restored switch -c restore-original d9df3033c17da6298d5008bc13984916ae3daba4
```

## 上线后回退

保留升级提交 SHA。将该提交通过普通 PR 合并后，可以对升级提交执行 `git revert <升级提交SHA>`，提交回退 PR，经过构建验证再合并；若采用合并提交，则对合并提交使用 `git revert -m 1 <合并提交SHA>`。回退避免 `reset --hard` 或强制推送，并会触发 Pages 重建。

本轮未部署，也未替换线上页面，因此目前无需线上回退。

## 本轮全站文案升级备份

开始全站文案管理前的版本为 `0b5ee82`，标签 `backup/pre-cms-20261010`。备份位于 `/workspace/backups/Chanray-before-cms-20261010.bundle`。

后台文案的回退不需要回退代码：使用「历史版本与恢复」，或导入已下载的文案 JSON，再发布。每次恢复前会备份当前文案。源码 bundle 不包含线上 KV 版本；线上文案备份保存在 KV，需要单独保留/导出。


## 评论与浅色后台升级前

标签 `backup/pre-comments-20261010` 指向 `a1da197`，完整 Git 备份为 `/workspace/backups/Chanray-before-comments-20261010.bundle`。回退该轮代码不会自动删除或还原 KV 评论；后台回收站可恢复评论至待审核。评论历史备份存于 `private:comments:history:`，评论设置备份存于 `private:comments:settings-backup:`；代码备份不包含这些线上数据，操作前单独导出。

文案调整前标签 `backup/pre-copy-20261010` 指向 `834579d`。本次只修改默认文案和聊天开场白，未写入线上 KV；已发布的后台替换文案仍优先于源码默认值。
