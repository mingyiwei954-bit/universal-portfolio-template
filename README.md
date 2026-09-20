# Universal Portfolio Template

一套可直接替换占位内容并部署的个人主页模板，包含中英文界面、暗色模式、作品与证书展示、点击爱心动画和独立的点赞计数后端。

## 运行方式

点赞功能需要使用仓库自带的服务器，请不要仅使用 `python3 -m http.server`。

```bash
git clone https://github.com/mingyiwei954-bit/universal-portfolio-template.git
cd universal-portfolio-template
python3 .server/server.py
```

打开 <http://127.0.0.1:8769/>。除 Python 3 标准库外不需要安装任何依赖。

也可以使用 Docker：

```bash
docker compose up -d --build
```

更换宿主机端口：

```bash
PORT=9000 docker compose up -d --build
```

## 点赞数据如何隔离

每一份克隆都会在自己的 `.server/data/likes.sqlite3` 中保存数据：

- 数据库在第一次启动时自动创建，初始点赞数为 `0`。
- `.server/data/` 已被 Git 忽略，不会上传使用者的运行数据。
- 数据库会生成唯一的后端实例 ID。浏览器会先和当前后端握手，只上传属于该实例的待同步点击。
- 即使同一个浏览器先后打开两套部署，旧站的待同步数据也不会进入新站。
- POST 请求使用 UUID 幂等去重，断网重试不会重复计数。

不要让两套部署共用同一个 `likes.sqlite3`。在不同目录中克隆和启动，它们默认就是隔离的。

## 替换占位内容

发布前搜索以下字样，逐项替换成自己的资料：

```text
这里是
your-
example.com
00000000000
```

主要内容在 `index.html` 中，占位图片在 `assets/img/placeholders/` 中。

## 服务器部署

最简单的方式是让程序同时提供页面和 API：

```bash
HOST=127.0.0.1 PORT=8769 python3 .server/server.py
```

Nginx 反向代理示例：

```nginx
server {
    listen 80;
    server_name portfolio.example.com;

    location / {
        proxy_pass http://127.0.0.1:8769;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

每套站点应使用独立的项目目录、端口和数据库路径。生产环境请定期备份 `.server/data/likes.sqlite3`。

## API

- `GET /api/health`：健康检查和后端实例 ID。
- `GET /api/likes`：获取当前实例的点赞总数。
- `POST /api/likes`：提交带实例 ID 的幂等点赞批次。

后端实现和更多说明见 [`.server/README.md`](.server/README.md)。
