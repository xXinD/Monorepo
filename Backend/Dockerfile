# 使用 Node.js 容器
FROM node:18 as build-stage

# 设置工作目录
WORKDIR /usr/src/app

# 将 package*.json 复制到工作目录
COPY package.json ./

RUN npm install -g pm2

RUN npm install -g npm@latest

RUN npm install -g typescript

# 安装项目依赖
RUN npm install

# 安装 ffmpeg
RUN apt-get update && apt-get install -y ffmpeg build-essential libpcre3 libpcre3-dev libssl-dev wget unzip

# 下载Nginx和nginx-rtmp-module源代码
RUN wget http://nginx.org/download/nginx-1.24.0.tar.gz && \
    wget https://github.com/arut/nginx-rtmp-module/archive/master.zip

# 解压源代码
RUN tar -zxvf nginx-1.24.0.tar.gz && \
    unzip master.zip

# 进入Nginx目录并配置，注意这里我们添加了nginx-rtmp-module
WORKDIR nginx-1.24.0
RUN ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module-master && \
    make && \
    make install

# 切回原工作目录
WORKDIR /usr/src/app

# 复制所有源代码到工作目录
COPY . .

RUN ls -al

# 构建 Node.js 项目
RUN npm run build

# 复制新的Nginx配置到容器中
COPY nginx.conf /usr/local/nginx/conf/nginx.conf

# 暴露端口
EXPOSE 4000
EXPOSE 80
EXPOSE 1935

# 启动 Nginx 以及 Node.js 项目
CMD /usr/local/nginx/sbin/nginx && pm2-runtime start dist/app.js --name backend
