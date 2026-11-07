FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY app.js ./

EXPOSE 5001

CMD ["node", "app.js"]