FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# above is builder part

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

# Copy migrations for running in production
COPY --from=builder /app/src/migrations ./src/migrations

EXPOSE 5500

CMD ["node", "dist/server.js"]