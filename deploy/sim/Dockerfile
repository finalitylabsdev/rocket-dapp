FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY scripts ./scripts

CMD ["node", "scripts/synthetic-traffic.mjs"]
