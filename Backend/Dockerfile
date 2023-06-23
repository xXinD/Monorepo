# 第一阶段：构建 Golang 项目
FROM golang:1.19-alpine AS build-go

WORKDIR /app

COPY ./LiveRedirect/Golang/go.mod ./
COPY ./LiveRedirect/Golang/go.sum ./
RUN go mod download

COPY ./LiveRedirect/Golang/*.go ./
COPY ./LiveRedirect/Golang/list/*.go ./list/
COPY ./LiveRedirect/Golang/liveurls/*.go ./liveurls/

RUN go build -o /allinone

# 第二阶段：构建 Node.js 项目
FROM node:18 as build-node

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install -g pm2
RUN npm install -g npm@latest
RUN npm install -g typescript

RUN npm install

RUN apt-get update && apt-get install -y ffmpeg

COPY . .

RUN ls -al
RUN npm run build

# 第三阶段：创建最终的运行阶段
FROM alpine:3.14

RUN apk add --update nodejs npm
RUN npm install -g pm2
RUN apk add ffmpeg

# 从第一阶段拷贝 Golang 项目
COPY --from=build-go /allinone /allinone

# 从第二阶段拷贝 Node.js 项目
COPY --from=build-node /usr/src/app/dist /app/dist
COPY --from=build-node /usr/src/app/node_modules /app/node_modules

# 暴露端口
EXPOSE 4000 1935 8000 35455

# 创建启动脚本
RUN echo -e "#!/bin/sh\n/allinone &\npm2-runtime start /app/dist/app.js --name backend" > start.sh
RUN chmod +x start.sh

# 启动 Node.js 项目
CMD ["./start.sh"]
