
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY app.js ./

RUN mkdir -p /app/data

ENV ORDER_DB_PATH=/app/data/orders.db

EXPOSE 5002

CMD ["node", "app.js"]
