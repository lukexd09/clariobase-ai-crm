# Work Item Coding Standard

This document defines the coding convention for epics, tasks and related work items in ClarioBase AI CRM.

## Goal

Make project work easy to read, reference and discuss across GitHub, ChatGPT, Codex prompts and PR reviews.

## Required format

## Epics

Epics must use the following format:

```text
E001 - Epic name
E002 - Epic name
E003 - Epic name
```

Rules:

- Epic IDs are sequential.
- Epic IDs are never reused.
- Epic IDs use three digits.
- Epic titles should be short but meaningful.
- The prefix must remain stable even if the epic name changes.

## Tasks under epics

Tasks must use the following format:

```text
E001.T001 - Task name
E001.T002 - Task name
E001.T003 - Task name
```

Rules:

- Task IDs are scoped to the epic.
- Task numbering resets inside each epic.
- Task IDs use three digits.
- Task titles should describe one concrete piece of work.
- A task must not cover broad multi-feature implementation.

## Examples

Good epic names:

```text
E001 - Define and implement CRM foundation
E002 - Implement file-based AI exchange
E003 - Build ClarioBase sales workflow
```

Good task names:

```text
E001.T001 - Initialize Next.js technical skeleton
E001.T002 - Add initial Prisma lead model
E001.T003 - Add read-only lead list page
E002.T001 - Validate AI response files against schema
E002.T002 - Add AI import preview screen
```

Bad task names:

```text
Build CRM
Improve app
Add AI
Fix stuff
Make UI better
```

## Relationship between epics and tasks

Each task should clearly reference its parent epic in the issue body:

```markdown
Parent epic: E001 - Define and implement CRM foundation
```

If GitHub issue linking is available, include the parent issue link as well.

## Branch naming

Preferred branch names:

```text
feature/e001-t001-nextjs-skeleton
feature/e001-t002-prisma-lead-model
feature/e002-t001-ai-response-validation
```

Rules:

- Use lowercase branch names.
- Include epic and task code.
- Keep the branch name short.

## PR naming

Preferred PR title format:

```text
E001.T001 - Initialize Next.js technical skeleton
```

The PR title should usually match the task title.

## Commit messages

Commit messages should include the work item code when practical:

```text
E001.T001: initialize Next.js skeleton
E001.T002: add initial Prisma lead model
```

## Codex prompt naming

Every Codex prompt should start with the work item code and title:

```text
Work item: E001.T001 - Initialize Next.js technical skeleton
```

This helps prevent Codex from drifting into unrelated work.

## Documentation references

Whenever documentation describes planned work, use the same work item code if the work item already exists.

Example:

```text
First implementation task: E001.T001 - Initialize Next.js technical skeleton
```

## Current epic map

```text
E001 - Define and implement CRM foundation
E002 - Implement file-based AI exchange
E003 - Build ClarioBase sales workflow
E004 - Connect CRM with harvester data
E005 - Prepare future UGC outreach pipeline
E006 - Establish delivery process and Ways of Working
E008 - Stabilize CRM documentation and quality after UI redesign
E009 - Redesign CRM visual direction for lightweight business and UGC use
E010 - Add localization and language preference foundation
E011 - Add local network access and user account foundation
E012 - Add workspace type foundation for agency and UGC workflows
E013 - Add controlled gatherer operations from CRM
E014 - Add containerized local production runtime foundation
E015 - Add private workspace document storage foundation
```

## Current first task

```text
E001.T001 - Initialize Next.js technical skeleton
```

## Important rule

Do not create implementation tasks without assigning them to an epic code. If a task does not fit any existing epic, create or refine the epic first.
