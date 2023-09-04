## 项目简介

本项目是一个24小时无人推流直播系统，包含以下三个子项目：

1.  前端管理平台：使用 React 和 Acro Design 构建。
1.  后端 Node 服务：使用 Node.js、Koa2 和 FFmpeg 构建。

## 🚀部署方式

### 前端管理平台

推荐使用 Docker 进行部署，使用以下 Docker 镜像：`xindongg/frontend:latest`。

```bash
docker run -d -p 8080:80 xindongg/frontend:latest
```

此命令将启动容器并将容器内的端口 80 映射到主机的端口 8080。

### 后端 Node 服务

推荐使用 Docker 进行部署，使用以下 Docker 镜像：`xindongg/backend:latest`。

```bash
docker run -d -p 4000:4000 35455:35455 1935:1935 xindongg/backend:latest
```

此命令将启动容器并将容器内的端口 4000 映射到主机的端口 4000。

此服务将监听主机的端口 4000，如端口4000被占用，会自行累加，具体监听端口可查看控制台输出

## docker-compose.yml 示例

你也可以使用 `docker-compose.yml` 文件来同时部署前端管理平台、后端 Node 服务和转发推流服务。

```yaml 
version: '3.8'
services:
  frontend:
    image: xindongg/frontend:latest
    restart: unless-stopped
    ports:
      - "8080:80"
  backend:
    image: xindongg/backend:latest
    restart: unless-stopped
    ports:
      - "4000:4000"
      - "35455:35455"
      - "1935:1935"
```

将以上内容保存为 `docker-compose.yml` 文件，并在项目根目录执行以下命令启动容器。

```bash
docker-compose up -d
```

这将会同时启动前端管理平台、后端 Node 服务和转发推流服务。

✨ 祝您部署愉快！✨
