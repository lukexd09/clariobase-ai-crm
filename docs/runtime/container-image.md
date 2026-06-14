---
title: CRM container image build
document_id: DOC-E014-CONTAINER-IMAGE
document_type: build-guide
status: active
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-14
related_epic: E014
related_tasks:
  - E014.T002
related_components:
  - COMP-CRM-APP
related_documents:
  - docs/runtime/container-runtime.md
  - docs/decisions/adr-e014-container-runtime.md
  - README.md
tags:
  - docker
  - image
  - prisma
  - nextjs
---

# CRM container image build

## Purpose of the CRM container image

This document is the canonical build guide for the ClarioBase CRM application image introduced in `E014.T002`.
It covers the Docker build assets, build command, runtime command, included files, excluded files, and the current limitations of the image-only step.

The repository-local Compose topology is implemented later in `E014.T003`.

## Implemented build assets

The current image build uses:

- root `Dockerfile`
- root `.dockerignore`

The image follows the runtime contract from [docs/runtime/container-runtime.md](container-runtime.md).

## Build command

Build the local production-like CRM image from the repository root:

```bash
docker build -t clariobase-ai-crm:local .
```

The image build is expected to work from a clean checkout without relying on host-generated Prisma artifacts.

## Build behavior

The Dockerfile uses a multi-stage Node 24 build and keeps the standard application build flow:

1. install dependencies with `pnpm install --frozen-lockfile`;
2. install OpenSSL in the image so Prisma tooling works correctly in Docker;
3. copy safe build inputs, including `.env.example`;
4. inject a build-only placeholder `BUILD_DATABASE_URL` so `next build` can evaluate pages without using a real runtime secret;
5. run `pnpm build`;
6. rely on the existing `prebuild` hook so `pnpm prisma:generate` runs inside the image build;
7. copy only the runtime assets needed for `pnpm start`.

This means Prisma Client is generated during the image build even when `src/generated/` is missing from the host build context.
The build-only placeholder `BUILD_DATABASE_URL` is not a runtime secret and does not replace the real runtime `DATABASE_URL`.

## Runtime command

For a direct image smoke check, run the image with a dedicated CRM database URL:

```bash
docker run --rm --name clariobase-ai-crm \
  -p 127.0.0.1:3000:3000 \
  -e DATABASE_URL="postgresql://clariobase_crm_user:change-me@host.docker.internal:5432/clariobase_crm?schema=public" \
  clariobase-ai-crm:local
```

Notes:

- the image starts the app with `pnpm start`;
- the image exposes container port `3000`;
- host binding and the default two-service operator flow are handled later by the repository-local Compose setup in `E014.T003`;
- runtime credentials stay outside the image and must be supplied at runtime.

## Runtime assets intentionally included in the image

The runtime image intentionally includes:

- `.next/` production build output;
- `node_modules/` needed by `next start`;
- `prisma/` so migrations remain available to the image;
- `prisma.config.ts` and `next.config.ts`;
- `src/generated/` generated during the image build.

The runtime image intentionally keeps the Prisma CLI available because the approved E014 first-run migration flow uses a one-off `prisma migrate deploy` command from the CRM app image.

## Files intentionally excluded from the build context and image

The `.dockerignore` excludes local or sensitive material such as:

- `.env.local` and any real `.env` files;
- `data/ai-exchange/` runtime files;
- the deprecated `ai_exchange/` tree;
- host `src/generated/` artifacts;
- `node_modules/`, `.next/`, `tests/`, and `docs/`;
- local logs, local database files, and temp files.

`.env.example` stays in the build context because it is sanitized and supports the build-time Prisma generate step.

## Current limitations after E014.T002

Current limitations of the image-only step:

- the image does not yet create the default `crm-postgres` topology on its own;
- the image does not yet define container healthchecks;
- the image does not yet implement `/api/ready`;
- the image build guide is not the full operator runbook;
- bind mounts for `data/ai-exchange/` are implemented later by Compose.

Those behaviors are completed in `E014.T003`, `E014.T004`, and `E014.T005`.
