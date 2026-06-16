# E009.T006 light-screen proof

## Scope

This note records the exact base SHA, baseline state, and the required early proof for the
highest-risk remaining light CRM migration route.

Task:

- `E009.T006 - Migrate remaining active CRM screens to the light design system`

Parent epic:

- `E009 - Complete the light CRM UI and accessibility closeout`

## Exact base

- `base_sha: ee9dd92387a303171529eb6a1c4c0710431b889e`
- `base_branch: origin/main`

## Required baseline on exact base

Executed from a clean worktree created from `origin/main`.

### Commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm prisma:validate
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

### Results on base SHA

- `corepack pnpm install --frozen-lockfile` -> `PASS`
- `corepack pnpm prisma:validate` -> `PASS`
- `corepack pnpm lint` -> `PASS`
- `corepack pnpm test` -> `FAIL`
  - baseline failure on `origin/main`: tests and helper builds fail before a generated Prisma client is available in a clean checkout for all test paths
  - representative error: `Cannot find module '@/generated/prisma/client'`
- `corepack pnpm build` -> `FAIL`
  - baseline failure on `origin/main`: dynamic import pages require `DATABASE_URL` during page-data collection
  - representative error: `Failed to collect page data for /imports/[id]`

These failures were observed before any T006 UI implementation and must not be misreported as
regressions introduced by this task.

## Highest-risk assumption

The high-density `/leads/[id]` operator workspace can move to the light CRM system without:

- hiding or weakening important actions;
- reducing information density or scanability;
- losing visible keyboard focus;
- lowering practical contrast;
- changing existing business behavior or route anchors.

## Early proof target

Representative dense area:

- the `/leads/[id]` operator workspace, with special emphasis on:
  - `#lead-controls`
  - `#activity`
  - the workflow artifact panels for mini-audit, outreach, and offer drafts

## Proof method

### Source-level regression proof

Added targeted source proof:

- `tests/lead-detail-light-proof.test.ts`

The proof checks that the light migration preserves:

- the main operator route structure;
- workflow anchors and quick links;
- lead update, activity, mini-audit, outreach, and offer actions;
- dense two-column form layouts;
- light status affordances;
- explicit `focus-visible` hooks on interactive elements;
- accessible primary CTA contrast on the migrated light surfaces.

### Targeted checks

Executed on the proof implementation:

```text
corepack pnpm exec tsx --test tests/lead-detail-light-proof.test.ts
corepack pnpm exec eslint src/app/leads/[id]/page.tsx src/components/lead-update-form.tsx src/components/activity-form.tsx src/components/mini-audit-draft-form.tsx src/components/outreach-draft-form.tsx src/components/offer-draft-form.tsx tests/lead-detail-light-proof.test.ts
```

Results:

- proof test -> `PASS`
- targeted eslint -> `PASS`

### Independent accessibility review follow-up

An independent UI/accessibility review initially flagged a contrast regression on primary CTA
buttons that had moved to `bg-sky-600 text-white` with a lighter hover state. The migration was
corrected to use a darker accessible primary CTA pair:

- base primary CTA -> `bg-sky-700 text-white`
- hover primary CTA -> `hover:bg-sky-800`

The targeted proof tests were expanded to assert that the migrated operator and review surfaces use
that accessible CTA pair and do not regress back to the earlier lighter variant.

### Live UI verification

Used a disposable local runtime with seeded fake CRM data:

```text
docker compose --env-file .env.compose.local up -d crm-postgres
docker compose --env-file .env.compose.local run --rm crm-app sh -lc "node ./node_modules/prisma/build/index.js migrate deploy && node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts"
docker compose --env-file .env.compose.local up -d crm-app
```

Reviewed the seeded lead detail route:

- `/leads/cmqge6ndk000023qokropy0w6`

Observed on the live route:

- business and system shell navigation remained intact;
- the local operator sidebar remained present and readable;
- lead detail status, score, business context, artifact panels, controls, and activity timeline all rendered with the light CRM surface system;
- quick links to `#lead-controls`, `#activity`, and artifact anchors remained present;
- update and activity forms remained visible and dense enough for operator use;
- workflow draft sections remained present with unchanged actions and fields.

## Proof verdict

- `result: PASS`

The proof passed, so the broader T006 migration can continue across the remaining legacy screens.

## Final implementation verification

Executed on the final T006 implementation after the remaining screen slice and the CTA contrast
follow-up were complete.

### Commands

```text
corepack pnpm exec tsx --test tests/lead-detail-light-proof.test.ts tests/light-remaining-list-detail-screens.test.ts
corepack pnpm exec eslint src/app/leads/[id]/page.tsx src/components/lead-update-form.tsx src/components/activity-form.tsx src/components/mini-audit-draft-form.tsx src/components/outreach-draft-form.tsx src/components/offer-draft-form.tsx src/app/imports/page.tsx src/app/imports/[id]/page.tsx src/app/duplicates/page.tsx src/app/duplicates/[id]/page.tsx src/app/health/page.tsx tests/lead-detail-light-proof.test.ts tests/light-remaining-list-detail-screens.test.ts
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

### Results

- targeted proof tests -> `PASS`
- targeted eslint -> `PASS`
- full lint -> `PASS`
- full test suite -> `PASS`
- local production build -> `PASS`

### Live QA routes reviewed

- `/leads/cmqge6ndk000023qokropy0w6`
- `/imports`
- `/imports/qa-import-batch-e009`
- `/duplicates`
- `/duplicates/qa-duplicate-e009`
- `/health`

Observed on the live routes:

- lead detail kept the dense operator workspace, anchored quick links, and all existing server
  actions;
- imports list and import detail preserved batch/result data density, row semantics, and lead
  routing;
- duplicates list and detail preserved review actions, lead links, and reason metadata;
- health remained minimal, readable, and contract-safe in the light shell.

### Independent review outcome

- independent UI/accessibility review -> `PASS`
- residual risk: proof remains primarily source-level, so future token/class changes should still
  receive one manual visual spot-check on the operator route.
