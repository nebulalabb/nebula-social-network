# Base stage for shared dependencies
FROM node:20-alpine AS base

# Install libc6-compat for Next.js
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Turbo stage to prune the workspace
FROM base AS pruner
RUN npm install -g turbo
COPY . .
RUN turbo prune @anime-social/web --docker

# Builder stage to install dependencies and build
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@anime-social/web

# Production runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/web/server.js"]
