FROM node:20-bookworm-slim

WORKDIR /app

# Install tools needed to compile SQLite for Linux
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Build sqlite3 specifically for the container
RUN npm ci --build-from-source

COPY app.js ./

EXPOSE 5001

CMD ["node", "app.js"]FROM node:20-bookworm-slim

WORKDIR /app

# Install tools needed to compile SQLite for Linux
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Build sqlite3 specifically for the container
RUN npm ci --build-from-source

COPY app.js ./

EXPOSE 5001

CMD ["node", "app.js"]