# E021.T001 Playwright Proof

Baseline SHA: `aac25270072e6b280f1c732723fed36e1a77f5b1`
Authoritative review head: recorded in PR #170 and exact-head CI metadata.

## Changed Files

- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `playwright.config.ts`
- `scripts/e2e-guard.ts`
- `scripts/dev-e2e-server.ts`
- `scripts/run-e2e.ts`
- `tests/e2e-guard.test.ts`
- `tests/e2e/smoke.spec.ts`

## Selected Versions

- `@playwright/test`: `1.61.1`
- Chromium downloaded by Playwright: `149.0.7827.55` (`playwright chromium v1228`)
- Playwright browser cache on Windows: `C:\Users\User\AppData\Local\ms-playwright`

## Official Refs

- Playwright repo: [`microsoft/playwright`](https://github.com/microsoft/playwright)
- Playwright Test package: [`@playwright/test`](https://www.npmjs.com/package/@playwright/test)
- Playwright MCP repo: [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp)
- Playwright MCP package: [`@playwright/mcp`](https://www.npmjs.com/package/@playwright/mcp)
- Playwright MCP candidate version: `0.0.77`
- Playwright MCP release tag: `v0.0.77`
- Playwright MCP upstream commit SHA: `36ec986b8b1fc6b4d11f2b6971147755e1b0bc84`

## Licensing

- Playwright Test: Apache-2.0
- Playwright MCP: Apache-2.0
- Transitive browser/runtime notes:
  - Playwright bundles browser binaries separately from the npm package.
  - Chromium binaries are installed into the local Playwright cache and are not committed.
  - Optional `fsevents` appears in the lockfile but is macOS-only.

## Advisory Status

- Microsoft Playwright GitHub security advisories page currently shows no published advisories.
- No blocking advisory was found during this proof for the chosen package pair.
- Playwright MCP advisory status was checked through the official repository and release metadata; no blocking advisory was identified for the selected candidate.

## Runtime Architecture

- Local-only Next.js dev server on `127.0.0.1:3011`
- Playwright config uses `webServer` and non-reused server startup
- App target is not production or preview
- Guard fails closed on non-localhost targets and protected ports

## Production Rejection Proof

Command:

```text
$env:PLAYWRIGHT_BASE_URL='http://Serwer:3000'; pnpm test:e2e:smoke
```

Result:

- exit code: `1`
- failure occurred before browser navigation
- safe fragment:
  - `Playwright target must use localhost or 127.0.0.1, got http://Serwer:3000`

Also rejected:

```text
$env:PLAYWRIGHT_BASE_URL='http://Serwer:3001'; pnpm test:e2e:smoke
```

## Test Inventory

- `pnpm test:e2e:smoke`
- `pnpm test:e2e:area`
- `pnpm test:e2e:full`
- `pnpm exec tsx --test tests/e2e-guard.test.ts`

### Mapping

- smoke:
  - `@smoke home page exposes the operator dashboard heading`
- area:
  - `@area:dashboard dashboard priorities remain visible as an explicit area proof`
- full:
  - both committed browser tests
- documented Windows invocation for area:
  - `pnpm test:e2e:area -- dashboard`

## Failure Artifact Inspection

Controlled temporary failure produced:

- screenshot: `test-results/temp-failure-temporary-failure-for-artifact-proof/test-failed-1.png`
- video: `test-results/temp-failure-temporary-failure-for-artifact-proof/video.webm`
- trace: `test-results/temp-failure-temporary-failure-for-artifact-proof/trace.zip`
- context: `test-results/temp-failure-temporary-failure-for-artifact-proof/error-context.md`

Inspection result:

- no credentials were visible in the captured text context
- no cookies, tokens, or session identifiers were observed in the inspected artifact text
- no private CRM records or real personal data were exposed in the inspected artifact text

Temporary failure spec was removed after inspection.

## Repeatability And Cleanup

- Smoke was rerun multiple times from a clean state and passed each time.
- The browser harness was exercised with a fixed localhost target and did not touch production or preview.
- The temporary failure bundle was generated, inspected, and the failing spec was deleted.

## Measurements

- `pnpm install --frozen-lockfile`: passed
- `pnpm prisma:validate`: passed
- `pnpm prisma:generate`: passed
- `pnpm lint`: passed
- `pnpm test:fast`: passed
- `pnpm build`: passed
- `pnpm test:e2e:smoke`: passed
- `pnpm test:e2e:area`: passed
- `pnpm test:e2e:full`: passed
- `pnpm exec playwright test --grep '@smoke'` with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`: rejected before browser launch from `playwright.config.ts`
- `pnpm exec playwright test --grep '@smoke'` with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3011`: passed
- Observed warm-cache execution time:
  - smoke: about 12 to 13 seconds per run
  - area: about 11 seconds
  - full: about 11 to 13 seconds
- `trace: retain-on-failure` now preserves trace on first-run failure with retries at zero
- Controlled cold-cache browser installation timing was not captured during this spike.
- Precise disk impact was not measured.
- teardown/cleanup: temporary failing spec removed; generated artifacts ignored by `.gitignore`
- Synthetic artifact proof used `data:text/html,<h1>E2E artifact proof</h1>` and did not use real CRM data.

## Windows And Recovery Notes

- Browser cache path on Windows: `C:\Users\User\AppData\Local\ms-playwright`
- `.gitignore` covers `playwright-report/` and `test-results/`
- Wrapper fails closed before browser launch for forbidden targets
- No persistent application containers or databases were reused
- Recovery strategy is reinstallable from lockfile and cached browser binaries
- Cleanup was verified by rerunning the browser suite from a clean state after the temporary failure was removed.
- Artifact inspection covered screenshot, video, trace and error context for the synthetic proof page.

## MCP / Test-Agent

- Official Playwright MCP/test-agent package was identified from primary sources.
- Exact selected candidate: `@playwright/mcp` `0.0.77`
- Exact release tag: `v0.0.77`
- Exact upstream commit SHA: `36ec986b8b1fc6b4d11f2b6971147755e1b0bc84`
- License: Apache-2.0
- Advisory status: no blocking advisory identified from the official release/repository evidence reviewed for this spike
- No safe in-app MCP/test-agent tool was available in this environment for a bounded agentic run.
- Blocker: no official MCP/test-agent execution surface was available here, so this proof remains deterministic browser-only.
- MCP was not installed.
- Recommendation: `REVISE`

## Remaining Work

- T002: expand the Playwright foundation if broader coverage is approved
- T006: integrate any future agentic or preview orchestration beyond this proof slice

## Recommendation

`REVISE`
