## 运行方法

1. 新建 `docker-compose.yml` 文件，内容如下：

    ```yaml
    version: '3.8'
    services:
      backend:
        image: xindongg/backend:latest
        restart: unless-stopped
        ports:
          - "4000:4000"
        volumes:
          - /Volumes:/Volumes
      frontend:
        image: xindongg/frontend:latest
        restart: unless-stopped
        ports:
          - "8080:80"
      allinone:
        image: youshandefeiyang/allinone
        restart: unless-stopped
        privileged: true
        ports:
          - "35455:35455"
    ```

2. 在含有 `docker-compose.yml` 文件的目录中打开一个终端，然后运行以下命令：

    ```bash
    docker-compose up -d
    ```

   这个命令会在后台启动所有定义在 `docker-compose.yml` 文件中的服务。

3. 如果你不在 `docker-compose.yml` 文件所在的目录中，你可以指定文件的完整路径来运行 Docker Compose 文件：

    ```bash
    docker-compose -f /path/to/your/docker-compose.yml up -d
    ```

   替换 `/path/to/your/docker-compose.yml` 为你的 `docker-compose.yml` 文件的实际路径。
