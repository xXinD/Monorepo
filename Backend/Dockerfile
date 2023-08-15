# 构建 Node.js 项目
FROM node:18.16.1 as build-node

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install -g pm2
RUN npm install -g npm@latest
RUN npm install -g typescript

RUN npm install

COPY . .

RUN ls -al
RUN npm run build

# 第三阶段：创建最终的运行阶段
FROM node:18.16.1-alpine

# 安装一些必要的依赖
RUN apk add --no-cache curl make gcc g++ python3 linux-headers ffmpeg

RUN npm install -g pm2

# 从第二阶段拷贝 Node.js 项目
COPY --from=build-node /usr/src/app/dist /app/dist
COPY --from=build-node /usr/src/app/node_modules /app/node_modules

# 暴露端口
EXPOSE 4000 1935 8000

# 创建启动脚本
RUN echo -e "#!/bin/sh\npm2-runtime start /app/dist/app.js --name backend" > start.sh
RUN chmod +x start.sh

# 启动 Node.js 项目
CMD ["./start.sh"]
