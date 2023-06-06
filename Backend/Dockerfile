# Node Dockerfile

# 使用 Node.js 容器
FROM node:16

# 设置工作目录
WORKDIR /usr/src/app

# 将 package*.json 复制到工作目录
COPY package*.json ./

RUN npm install -g cnpm

RUN npm cache clean --force
RUN cnpm cache clean --force

RUN cnpm install -g typescript

# 安装项目依赖
RUN cnpm install

# 复制所有源代码到工作目录
COPY . .

# 构建 Node.js 项目
RUN cnpm run build

# 暴露端口
EXPOSE 4000

# 启动 Node.js 项目
CMD ["node", "dist/app.js"]
