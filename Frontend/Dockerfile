# React Dockerfile

# 构建 React 应用
FROM node:16 as build-stage

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g npm@latest

# 安装项目依赖
RUN npm install --force

COPY . .

RUN npm run build:prod

# 使用 Nginx 容器
FROM nginx:stable-alpine

# 删除默认的Nginx配置和默认欢迎页面
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# 复制自定义的Nginx配置文件到容器
COPY nginx/default.conf /etc/nginx/conf.d/

# 将React应用复制到nginx容器
COPY --from=build-stage /usr/src/app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80
