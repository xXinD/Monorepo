# Node Dockerfile

# 使用 Node.js 容器
FROM node:16

# 设置工作目录
WORKDIR /usr/src/app

# 将 package*.json 复制到工作目录
COPY package*.json ./

RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install

# 复制所有源代码到工作目录
COPY . .

# 构建和启动 Node.js 项目
RUN npm run start-backend-prod

# 暴露端口
EXPOSE 4000
