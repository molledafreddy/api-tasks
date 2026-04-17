# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install deps (cached layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]
