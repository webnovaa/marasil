# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget su-exec \
  && addgroup -S wa && adduser -S wa -G wa

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3100
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3100
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/health/ready || exit 1
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/index.js"]
