
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
RUN apt-get update && apt-get install -y ffmpeg

# 复制所有源代码到工作目录
COPY . .

RUN ls -al

# 构建 Node.js 项目
RUN npm run build

# 暴露端口
EXPOSE 4000

# 启动 Node.js 项目
CMD ["pm2-runtime", "start", "dist/app.js", "--name", "backend"]
