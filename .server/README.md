# 点赞计数服务

在仓库根目录运行：

```bash
python3 .server/server.py --root . --port 8769
```

服务使用 SQLite 保存互动点击总数，数据库位于 `.server/data/likes.sqlite3`，该目录已被 Git 忽略。前端每 60 秒同步一次；公共部署时建议为 `/api/likes` 增加请求限流。
