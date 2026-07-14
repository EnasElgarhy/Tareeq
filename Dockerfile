# syntax=docker/dockerfile:1
#
# Multi-stage build for App Runner (image-based deployment via ECR).
# Produces Next.js's "standalone" output — a self-contained server bundle
# with only the node_modules it actually needs, so the final image doesn't
# carry the full pnpm store.
#
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# they're passed as build args (one value per environment/branch — see
# .github/workflows/_deploy-apprunner.yml). Every other secret
# (SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY,
# GEMINI_API_KEY, ...) is server-only and must be injected at container
# RUNTIME via the App Runner service's environment/secrets config — never
# baked into an image layer. See docs/deployment/AWS_DEPLOYMENT.md.

FROM node:22-slim AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
