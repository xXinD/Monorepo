FROM node:16

WORKDIR /app


RUN npm install -g npm@latest

COPY package.json ./
RUN npm install

COPY . .
RUN ls -al

RUN npm run build

CMD ["npm", "run", "start:prod"]
