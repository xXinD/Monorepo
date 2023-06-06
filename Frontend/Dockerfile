# React Dockerfile

# 构建 React 应用
FROM node:16 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g cnpm
RUN npm cache clean --force
RUN cnpm cache clean --force

RUN cnpm install -g webpack
# 安装项目依赖
RUN cnpm install

COPY . .

RUN cnpm run build:prod

# 使用 Nginx 容器
FROM nginx:stable-alpine

# 删除默认的Nginx配置和默认欢迎页面
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# 将React应用复制到nginx容器
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80
