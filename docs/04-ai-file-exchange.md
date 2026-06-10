# AI File Exchange

## Goal

ClarioBase uses a local, file-based ChatGPT workflow without external AI API calls in v1.

The implemented workflow is:

```text
CRM export -> user/ChatGPT review -> prepared import file -> validation -> manual import -> duplicate review
```

## Implemented path

The current repository workflow uses:

```text
data/ai-exchange/
```

Folders:

```text
data/ai-exchange/
- inbox/       # Prepared files waiting for validation
- processing/  # Optional manual staging area
- outbox/      # Exported CRM files for review or ChatGPT preparation
- archive/     # Archived exchange files
- error/       # Invalid or rejected files
```

## Current commands

- Export local CRM context with `corepack pnpm ai:export-leads`
- Validate a prepared file with `corepack pnpm ai:validate-import-file ./data/ai-exchange/inbox/prepared-leads.json`
- Import an approved file with `corepack pnpm leads:import ./data/ai-exchange/inbox/prepared-leads.json`

## Contract boundaries

The current validator checks:

- JSON parse
- top-level array
- row schema validation
- row-level errors

## Current safety rules

- No external AI API calls are made by the app.
- No automatic ChatGPT invocation exists.
- No file watcher or background sync is included.
- No harvester DB data is exported or mutated.
- No real lead data should be committed to the repository.
- The export file is local-only and ignored by git.

## Historical notes

The old `ai_exchange/` folder naming from earlier planning docs is deprecated. Use `data/ai-exchange/` for the implemented workflow.

Future work can extend this into a richer AI preview/approval experience, but that is not part of the current import/export sanity check.
