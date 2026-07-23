FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY db.js server.js ./
COPY server/ ./server/
COPY database/ ./database/
COPY scripts/ ./scripts/
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server.js"]
