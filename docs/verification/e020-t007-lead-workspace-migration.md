# E020.T007 Lead Workspace Migration Verification

- Scope: `/leads/[id]` and its directly used lead-detail presentation components.
- Approved UI boundary: shared ClarioBase tokens with `--cb-*` variables.
- Local proof target: the route and the directly used form/panel components no longer rely on route-local slate/sky styling or old `--clariobase-*` tokens.

## Local Checks

- `corepack pnpm exec tsx --test tests/lead-detail-light-proof.test.ts` passed.
- `git diff --check` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm test:fast` failed for unrelated shared UI dependency resolution in existing tests.
- `corepack pnpm build` failed for unrelated shared UI dependency resolution in existing components.
- `corepack pnpm test:full` was attempted and failed for the same unrelated dependency issues.

## Unrelated Local Failures

- `@radix-ui/react-dialog` missing from the existing shared sheet boundary.
- `lucide-react` missing from the existing app shell boundary.

## Notes

- The lead workspace keeps the dense operator layout, anchors, forms, activity timeline, artifact panels, and technical metadata disclosure.
- This migration does not alter lead status semantics, recommendation logic, persistence, or route structure.
