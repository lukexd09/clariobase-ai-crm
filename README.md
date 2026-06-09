# ClarioBase AI CRM

Self-hosted, file-based AI-assisted CRM for ClarioBase lead management, sales workflow, mini-audits, outreach preparation and future UGC pipeline support.

## Core idea

This is not intended to be a generic CRM. It is a lightweight operational CRM designed around:

- a lead harvester,
- a dedicated CRM PostgreSQL database,
- sales pipeline management,
- scoring and prioritization,
- mini-audits,
- manual ChatGPT-assisted analysis through structured file exchange.

## Selected technical direction

```text
Application: Next.js App Router
Language: TypeScript
Database: separate PostgreSQL database for CRM
ORM / migrations: Prisma
Validation: Zod
UI foundation: Tailwind CSS + shadcn/ui
Package manager: pnpm
AI integration v1: file-based exchange only, no AI API calls
```

## Local setup for the Next.js skeleton

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your local CRM database.
3. Generate Prisma Client with `pnpm prisma:generate`.
4. Start the app with `pnpm dev`.

## Available scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm test`
- `pnpm prisma:generate`
- `pnpm prisma:validate`

## Health check

Open `/health` after starting the app to verify the skeleton is running.
