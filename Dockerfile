# Base stage for common dependencies and environment setup
FROM node:22-alpine AS base
# Install libc6-compat for compatibility with native libraries on Alpine Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage: Install dependencies cleanly based on package-lock.json
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Builder stage: Build Next.js application in standalone mode
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Runner stage: Production image containing only runtime dependencies
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set up runtime permissions for Next.js cache directory
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]