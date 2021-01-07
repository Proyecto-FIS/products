FROM node:15-alpine

WORKDIR /coffaine-products/backend
COPY package.json .
COPY package-lock.json .
RUN npm install

WORKDIR /coffaine-products/backend
COPY env env
COPY source source

EXPOSE 3000

CMD npm run start:prod