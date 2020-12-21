FROM node:15-alpine

WORKDIR /coffaine-products/backend
COPY backend/package.json .
COPY backend/package-lock.json .
RUN npm install

WORKDIR /coffaine-products/backend
COPY backend/env env
COPY backend/source source

EXPOSE 3000

CMD npm run start:prod