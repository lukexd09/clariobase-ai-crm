---
title: E016.T010 immutable preview image assessment
document_id: DOC-E016-T010-IMMUTABLE-PREVIEW-IMAGE-ASSESSMENT
document_type: implementation-assessment
status: draft
scope: clariobase-ai-crm
owner: project
last_updated: 2026-06-24
related_epic: E016
related_tasks:
  - E016.T010
tags:
  - preview
  - docker
  - github-actions
  - ghcr
  - licensing
---

# E016.T010 immutable preview image assessment

This assessment records the reuse, version, license, and service-term basis for implementing
`#117 - E016.T010 - Build once and deploy immutable preview image`.

## Scope decision

Approved implementation direction:

- build the application image once in CI after exact-head validation;
- publish the image to private GitHub Container Registry;
- deploy the exact OCI image digest on the Windows preview runner;
- avoid rebuilding the application on the preview runner;
- keep a thin ClarioBase adapter for preview safety validation, migrations, readiness, and PR reporting;
- replace the flaky direct `next start` process cleanup test with a container-level smoke test of the immutable deployment artifact.

## Reuse assessment

Primary reuse sources already present in the repository:

- `Dockerfile`
- `compose.yaml`
- `compose.preview.yaml`
- `scripts/deploy-preview.ts`
- `scripts/preview-runtime-support.ts`
- `scripts/verify-docker-image.ts`
- `tests/docker-image.test.ts`
- `tests/health-endpoint.test.ts`
- `tests/preview-runtime.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-preview.yml`
- `.github/workflows/auto-deploy-preview.yml`

This task reuses the existing runtime contract and preview slot boundaries instead of introducing a new runtime model.
The preview runner stays an operator-only deployment surface.

## Exact version and ref assessment

Repository-pinned application/tooling versions:

- `next`: `^15.3.3`
- `react`: `^19.0.0`
- `react-dom`: `^19.0.0`
- `prisma`: `^7.8.0`
- `@prisma/client`: `^7.8.0`
- `tsx`: `^4.20.6`
- `pnpm`: `9.15.0`
- Node runtime in Dockerfile: `node:24-bookworm-slim`

Repository-pinned GitHub Action refs already used by the project:

- `actions/checkout@v5`
- `actions/setup-node@v5`
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`
- `actions/github-script@v8`

Planned official Docker action refs for the immutable preview image flow:

- `docker/login-action`
- `docker/metadata-action`
- `docker/build-push-action`

The implementation should pin these to the current major release tags approved by GitHub and Docker official guidance,
and then record the exact refs in the workflows once selected.

Planned image and service references:

- private GHCR image namespace under `ghcr.io`
- immutable OCI digest form `image@sha256:<digest>`
- exact deployed digest captured from the CI build output
- no preview-runner rebuild of the application image

## Authoritative license and terms sources

Official sources to use for the implementation:

- GitHub Actions Marketplace and documentation for action usage and pinning guidance
- GitHub Container Registry documentation and GitHub Terms for package hosting behavior
- Docker documentation for the official action set and image publishing flow
- Docker Hub / Docker documentation for the `docker/*` action repositories and licensing notices
- repository `package.json` and lockfile for dependency version provenance

These sources are authoritative for the implementation notes and PR handoff.

## Commercial-use decision

Decision: approved for internal commercial preview use.

Rationale:

- the preview image is a private operational artifact;
- the preview deploy target is a private GHCR image and not a public redistribution product;
- the implementation keeps the existing ClarioBase stack and does not introduce a third-party redistribution channel.

## Attribution, redistribution, and service-term constraints

- preserve upstream copyright and license notices for dependencies already carried by the project;
- do not redistribute private preview images outside the authorized GitHub org/repository boundary;
- do not assume GHCR or GitHub Actions retain artifacts indefinitely;
- do not depend on an undocumented retention guarantee for the OCI image digest;
- the deploy workflow must fail closed if the required digest is unavailable or if the expected image reference cannot be resolved;
- the preview runner must use the published digest only and must not rebuild the app image from source;
- the preview runner may continue to run migrations, readiness checks, and PR-status reporting as a thin safety adapter.

## Verification intent

The final implementation must prove:

- CI builds and publishes once from the validated head;
- preview deployment uses the exact immutable image digest;
- the preview runner no longer performs an application rebuild;
- the runtime smoke test covers the immutable deployment artifact rather than a direct `next start` cleanup path.

