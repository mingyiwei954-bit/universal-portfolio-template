# 隔离的点赞计数服务

`server.py` 使用 Python 标准库同时提供静态主页和点赞 API。

## 本地启动

在仓库根目录执行：

```bash
python3 .server/server.py
```

默认配置：

- 监听地址：`127.0.0.1:8769`
- 网站根目录：当前仓库
- 数据库：`.server/data/likes.sqlite3`

可使用命令行参数：

```bash
python3 .server/server.py \
  --host 127.0.0.1 \
  --port 9000 \
  --root . \
  --database .server/data/likes.sqlite3
```

也可使用 `HOST`、`PORT`、`SITE_ROOT` 和 `LIKES_DB` 环境变量。

## 隔离机制

1. 每个数据库第一次启动时会生成唯一 `instance_id`。
2. 前端在同步前先读取当前 `instance_id`。
3. 每个 POST 必须携带匹配的 `instance_id`，否则后端返回 `409`。
4. 浏览器队列按“网站来源 + API 路径 + 实例 ID”分开保存。
5. 每个批次有唯一 UUID，重试不会重复增加。

数据库目录被 Git 忽略，因此克隆仓库后会建立一个全新、从 `0` 开始的独立实例。

## 备份

停止服务后备份这个文件即可：

```text
.server/data/likes.sqlite3
```

不要在两套正在运行的站点之间共用该文件。
