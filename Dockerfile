FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

ARG BUILD_DATABASE_URL="postgresql://clariobase_crm_user:change-me@127.0.0.1:5432/clariobase_crm?schema=public"
ENV DATABASE_URL="$BUILD_DATABASE_URL"

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY .env.example ./
COPY next.config.ts prisma.config.ts tsconfig.json next-env.d.ts ./
COPY eslint.config.mjs postcss.config.mjs tailwind.config.ts components.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm build

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3000

COPY --chown=node:node package.json pnpm-lock.yaml ./
COPY --chown=node:node next.config.ts prisma.config.ts ./
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src/generated ./src/generated

USER node

EXPOSE 3000

CMD ["pnpm", "start"]
