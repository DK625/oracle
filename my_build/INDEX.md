# my_build INDEX

## Purpose

Single entrypoint for durable project knowledge: product intent, architecture, features, bugs, debug playbooks, decisions, specs, and handoffs.

## Start here

1. Identify the task type.
2. Use the router below.
3. Read the minimum relevant files.
4. Update the relevant knowledge file after durable changes.

## Task router

### If implementing a feature

Read:

1. `product/vision.md`
2. `architecture/overview.md`
3. matching file in `features/`
4. relevant files in `specs/`

### If fixing a bug

Read:

1. `debug/quick-debug.md`
2. matching file in `bugs/`
3. `notes/gotchas.md`
4. relevant feature/spec file

### If changing architecture

Read:

1. `architecture/overview.md`
2. `architecture/service-map.md`
3. `decisions/`
4. `specs/`

### If onboarding an AI agent

Read:

1. `handoffs/agent-context.md`
2. `product/vision.md`
3. `architecture/overview.md`

## Active files

This section is generated from `manifest.yml`.
Do not edit manually.

<!-- ACTIVE_FILES_START -->

### product

- `my_build/product/vision.md`
- `my_build/product/roadmap.md`
- `my_build/product/user-flows.md`

### architecture

- `my_build/architecture/overview.md`
- `my_build/architecture/service-map.md`
- `my_build/architecture/data-flow.md`
- `my_build/architecture/integrations.md`

### features

- `my_build/features/bridge-artifact-transfer.md`

### bugs

- `my_build/bugs/2026-06-28-chatgpt-sandbox-artifact-capture-gap.md`

### decisions

- `my_build/decisions/ADR-0002-bridge-artifact-transfer-protocol.md`

### specs

- `my_build/specs/api-contracts.md`
- `my_build/specs/event-contracts.md`

### debug

- `my_build/debug/quick-debug.md`

### notes

- `my_build/notes/gotchas.md`

### handoffs

- `my_build/handoffs/agent-context.md`
- `my_build/handoffs/human-context.md`
- `my_build/handoffs/release-handoff.md`
<!-- ACTIVE_FILES_END -->

## Update rules

- Store durable knowledge only.
- Update feature docs after behavior changes.
- Record bug root causes and fast debug steps.
- Record architecture decisions as ADRs.
- Keep specs aligned with code contracts.
- Move stale context to archive instead of leaving it active.

## What not to store

- Raw logs or chat dumps.
- Secrets, credentials, tokens, private keys.
- Build outputs, binaries, database dumps, runtime folders.
- Temporary notes that will not help future implementation or debugging.
