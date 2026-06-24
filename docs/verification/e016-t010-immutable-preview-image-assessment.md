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

This assessment records the trust boundary, licensing basis, and commercial-use posture for
`#117 - E016.T010 - Build once and deploy immutable preview image`.

## Approved implementation result

- PR-controlled CI remains read-only and performs only validation plus trusted context artifact emission.
- A trusted post-CI workflow from `main` builds and publishes exactly one private GHCR image.
- The deploy job receives only the exact immutable `image@sha256:<64hex>` reference.
- The Windows preview runner does not rebuild the application image.
- The image-build job runs the container smoke test against the exact built artifact.
- Preview safety validation, migrations, readiness, and PR reporting remain in the thin ClarioBase adapter.

## Component assessment

### `docker/login-action`

- Component: Docker registry login action.
- Exact version or commit SHA: `9780b0c442fbb1117ed29e0efdff1e18412f7567` (`v3.3.0`).
- SPDX identifier or exact terms: GitHub Action repository code under the upstream repository license; use is governed by GitHub Actions terms and the action repository license.
- Authoritative source: [docker/login-action repository](https://github.com/docker/login-action), [Docker docs for GitHub Actions](https://docs.docker.com/build/ci/github-actions/).
- Commercial-use decision: approved for commercial internal CI use.
- Attribution/notice obligation: preserve upstream license notices if redistributing workflow snippets or documentation.
- Patent terms: no special patent grant beyond the repository license and upstream terms were identified in the authoritative sources reviewed.
- Redistribution implications: do not redistribute the action bundle as a product artifact; consume it as a GitHub Action only.
- Hosted-service implications: requires GitHub Actions runner execution and registry access.
- Transitive dependency result: approved as a workflow dependency for private image publishing.
- Approval result and constraints: approved only when pinned to the immutable commit SHA above.

### `docker/setup-buildx-action`

- Component: Docker Buildx setup action.
- Exact version or commit SHA: `b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2` (`v3.10.0`).
- SPDX identifier or exact terms: upstream repository license and GitHub Actions terms.
- Authoritative source: [docker/setup-buildx-action repository](https://github.com/docker/setup-buildx-action), [Docker docs for Buildx in GitHub Actions](https://docs.docker.com/build/ci/github-actions/setup-buildx/).
- Commercial-use decision: approved.
- Attribution/notice obligation: retain upstream notices in downstream copies.
- Patent terms: no separate patent terms were identified in the authoritative sources reviewed.
- Redistribution implications: workflow-only use, not a redistributable runtime asset.
- Hosted-service implications: needs GitHub Actions and a Docker-capable runner.
- Transitive dependency result: approved for the trusted image-build job.
- Approval result and constraints: approved only when pinned to the immutable commit SHA above.

### `docker/metadata-action`

- Component: Docker metadata/tag generation action.
- Exact version or commit SHA: `902fa8ec7d6ecbf8d84d538b9b233a880e428804` (`v5.7.0`).
- SPDX identifier or exact terms: upstream repository license and GitHub Actions terms.
- Authoritative source: [docker/metadata-action repository](https://github.com/docker/metadata-action), [Docker docs for tags and labels](https://docs.docker.com/build/ci/github-actions/manage-tags-labels/).
- Commercial-use decision: approved.
- Attribution/notice obligation: retain upstream notices if workflow logic is copied elsewhere.
- Patent terms: no separate patent terms were identified in the authoritative sources reviewed.
- Redistribution implications: workflow-only utility.
- Hosted-service implications: GitHub Actions execution.
- Transitive dependency result: approved.
- Approval result and constraints: approved only when pinned to the immutable commit SHA above.

### `docker/build-push-action`

- Component: Docker build and publish action.
- Exact version or commit SHA: `471d1dc4e07e5cdedd4c2171150001c434f0b7a4` (`v6.15.0`).
- SPDX identifier or exact terms: upstream repository license and GitHub Actions terms.
- Authoritative source: [docker/build-push-action repository](https://github.com/docker/build-push-action), [Docker docs for GitHub Actions](https://docs.docker.com/build/ci/github-actions/).
- Commercial-use decision: approved.
- Attribution/notice obligation: retain upstream notices in redistributed documentation.
- Patent terms: no additional patent term was identified in the authoritative sources reviewed.
- Redistribution implications: workflow-only use, not an end-user distributable component.
- Hosted-service implications: requires GitHub Actions and Docker Buildx/BuildKit.
- Transitive dependency result: approved for private image publication.
- Approval result and constraints: approved only when pinned to the immutable commit SHA above.

### BuildKit

- Component: BuildKit / Buildx build backend.
- Exact version or commit SHA: provided by the pinned Docker Buildx action and the runner Docker installation; no standalone BuildKit package is redistributed by the repo.
- SPDX identifier or exact terms: governed by Docker's published build tooling terms and the upstream BuildKit license in the BuildKit project.
- Authoritative source: [Docker BuildKit docs](https://docs.docker.com/build/buildkit/), upstream BuildKit repository documentation.
- Commercial-use decision: approved for internal build use.
- Attribution/notice obligation: retain upstream notices if redistributing build instructions.
- Patent terms: no special patent grant was identified in the authoritative sources reviewed.
- Redistribution implications: build-time service only.
- Hosted-service implications: depends on Docker-capable runner infrastructure.
- Transitive dependency result: approved as a build backend.
- Approval result and constraints: approved for CI/build use only.

### GitHub Container Registry

- Component: private GHCR package hosting.
- Exact version or commit SHA: hosted service, no versioned code artifact.
- SPDX identifier or exact terms: governed by the GitHub Terms of Service and GitHub Packages documentation.
- Authoritative source: [GitHub Packages docs](https://docs.github.com/packages), [GitHub Terms](https://docs.github.com/site-policy/github-terms/github-terms-of-service).
- Commercial-use decision: approved for private internal preview images.
- Attribution/notice obligation: keep upstream package notices in the image and repository where required.
- Patent terms: governed by GitHub service terms; no separate patent grant was identified in the review.
- Redistribution implications: private-only distribution inside the GitHub org/repository boundary.
- Hosted-service implications: image availability depends on GitHub-hosted package retention and access control.
- Transitive dependency result: approved as the storage target for immutable preview artifacts.
- Approval result and constraints: approved only for private/internal use; not a public redistribution channel.

### Docker Desktop / Docker engine on the Windows self-hosted runner

- Component: Docker runtime on the Windows preview runner.
- Exact version or commit SHA: runner-managed installation, not pinned in repo code.
- SPDX identifier or exact terms: Docker Desktop / Docker Engine commercial and subscription terms apply to the installed product; usage is bound by Docker's published terms.
- Authoritative source: [Docker Desktop license / terms](https://www.docker.com/legal/docker-subscription-service-agreement/), [Docker Engine documentation](https://docs.docker.com/engine/).
- Commercial-use decision: approved for the current preview host deployment model.
- Attribution/notice obligation: none beyond the installed product terms and any redistributed docs.
- Patent terms: governed by the Docker product terms and upstream licensing.
- Redistribution implications: the repo does not redistribute Docker Desktop or Docker Engine.
- Hosted-service implications: the preview workflow depends on the self-hosted runner keeping Docker available.
- Transitive dependency result: approved as operational infrastructure, not as a repo artifact.
- Approval result and constraints: approved only as an external service dependency; not vendored.

### Node base image

- Component: `node:24-bookworm-slim`.
- Exact version or commit SHA: pinned by Docker image digest in the Dockerfile base stage (`sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc` in the current local build evidence).
- SPDX identifier or exact terms: upstream Node.js / Debian image licensing and Docker Hub image terms.
- Authoritative source: [Docker Official Images for Node](https://hub.docker.com/_/node), [Node.js licenses](https://github.com/nodejs/node/blob/main/LICENSE), Debian licensing notices.
- Commercial-use decision: approved.
- Attribution/notice obligation: preserve upstream notices in image redistribution and documentation where required.
- Patent terms: governed by the Node.js project and Docker image terms; no special additional patent issue was identified.
- Redistribution implications: the image is used as a base layer, not redistributed as a standalone product by this repo.
- Hosted-service implications: fetched from Docker Hub at build time.
- Transitive dependency result: approved as the runtime base.
- Approval result and constraints: approved as an upstream base image for internal commercial use.

### PostgreSQL image

- Component: `postgres:16`.
- Exact version or commit SHA: pinned by Docker image tag `postgres:16`; the workflow and compose contracts consume the published upstream image.
- SPDX identifier or exact terms: upstream PostgreSQL image licensing and Docker Hub image terms.
- Authoritative source: [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres), [PostgreSQL license](https://www.postgresql.org/about/licence/).
- Commercial-use decision: approved.
- Attribution/notice obligation: preserve upstream notices when redistributing build/run instructions.
- Patent terms: PostgreSQL's permissive license applies; no patent restriction was identified in the authoritative source review.
- Redistribution implications: the image is used as an external service dependency, not redistributed by the repo.
- Hosted-service implications: fetched from Docker Hub at runtime/build time.
- Transitive dependency result: approved for the preview database service.
- Approval result and constraints: approved for private preview infrastructure use.

## Trusted workflow boundaries

- PR CI does not receive `packages: write`.
- The trusted image-build job owns `packages: write`.
- The Windows deploy job uses `packages: read` only.
- The Windows deploy job consumes the immutable digest handed off by the trusted build job.
- The PR-controlled workflow never publishes the preview image.

## Commercial-use conclusion

Approved for internal commercial preview operations, subject to the upstream license and hosted-service constraints above.

## Remaining constraints

- The published image must remain private in GHCR.
- The deploy job must only consume the exact immutable digest from the trusted build job output or artifact.
- No rebuild on the Windows runner.
- No mutable tag discovery during deploy.
- No claim of public redistribution rights for Docker-hosted services or GitHub-hosted services.

