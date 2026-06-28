# spec.md — Implement `my_build` Repository Template

## 0. Mission

Build a reusable Git repository template named `my_build-template`.

The template is a project knowledge system for software/product development. It should help a human developer and AI agents such as Claude Code or Codex:

- start from one stable entrypoint;
- find the right context quickly;
- preserve durable product knowledge;
- remember completed features, bugs, debug playbooks, architecture decisions, and lessons learned;
- reduce token/context waste by routing agents to the minimum necessary files;
- prevent knowledge drift with lightweight validation scripts;
- make it easy to copy this template into any future project.

This must be a clean, generic template. Do not hard-code any previous project domain such as IELTS, Anki, Hermes, OneHammer, or absolute local paths.

---

## 1. Core principle

`my_build` is not a random notes folder.

It is a "project memory kernel":

> Store only durable, reusable, verified knowledge that helps future implementation, debugging, review, onboarding, or decision-making.

The template must make it easy to answer:

- What is this product trying to do?
- What features exist?
- What has already been implemented?
- What bugs have happened before?
- How do I debug common failures quickly?
- Which files should an AI agent read first?
- Which decisions were made and why?
- What context is active, archived, deprecated, or unsafe to rely on?
- What needs to be updated after a feature/fix/refactor?

---

## 2. Non-goals

Do not build a heavy documentation system.

Do not implement:

- a web UI;
- a database;
- vector search;
- AI API integration;
- automatic code understanding;
- dependency on Claude/Codex;
- product-specific content;
- large media storage;
- complicated CI/CD.

This repository should remain a simple, inspectable, Git-friendly template.

---

## 3. Target output

Create a repository with this top-level structure:

```txt
my_build-template/
  README.md
  AGENTS.md
  .gitignore
  .pre-commit-config.yaml
  Makefile

  my_build/
    INDEX.md
    manifest.yml

    product/
      vision.md
      roadmap.md
      user-flows.md
      glossary.md

    architecture/
      overview.md
      data-flow.md
      service-map.md
      database.md
      integrations.md

    features/
      _template.md
      example-feature.md

    bugs/
      _template.md
      example-bug.md

    debug/
      quick-debug.md
      logs.md
      database.md
      services.md
      local-env.md

    decisions/
      _template.md
      ADR-0001-example-decision.md

    notes/
      reusable-patterns.md
      gotchas.md
      lessons-learned.md

    specs/
      api-contracts.md
      event-contracts.md
      db-schema.md

    handoffs/
      agent-context.md
      human-context.md
      release-handoff.md

    scripts/
      update_index.py
      validate_structure.py
      validate_links.py
      validate_manifest.py
      record_change.py
      run_all_checks.py

    validation/
      reports/
        .gitkeep

    archive/
      README.md
```

---

## 4. Root files

### 4.1 `README.md`

Create a clear README explaining:

- what this template is;
- when to use it;
- how to copy it into a project;
- how to start reading from `my_build/INDEX.md`;
- how to record a feature, bug, note, or decision;
- how to run validators.

Required commands:

```bash
make check
make update-index
python3 my_build/scripts/record_change.py --type feature --title "Add user login"
python3 my_build/scripts/record_change.py --type bug --title "Payment retry creates duplicate invoice"
python3 my_build/scripts/record_change.py --type decision --title "Use PostgreSQL for billing data"
```

The README must strongly state:

> Do not dump raw notes here. Only store durable project knowledge.

### 4.2 `AGENTS.md`

Create an agent instruction file for Claude/Codex.

It must contain:

```md
# Agent Rules

Before working on this repository, read:

1. `my_build/INDEX.md`
2. then only the files routed by `my_build/INDEX.md` for the current task.

Do not scan the entire repository by default.

After any durable change, update the relevant `my_build` file:

- new feature -> `my_build/features/`
- bug fix -> `my_build/bugs/`
- architecture decision -> `my_build/decisions/`
- debug lesson -> `my_build/debug/` or `my_build/notes/gotchas.md`
- API/event/db contract change -> `my_build/specs/`

Run:

```bash
make check
```

Do not commit scratch files, raw logs, temporary dumps, or large media into `my_build`.
```

### 4.3 `.gitignore`

Include at least:

```gitignore
.DS_Store
__pycache__/
*.pyc
.env
.venv/
venv/

my_build/tmp_*
my_build/**/*.tmp
my_build/**/*.bak
my_build/validation/reports/*
!my_build/validation/reports/.gitkeep
```

### 4.4 `Makefile`

Add these commands:

```makefile
.PHONY: check update-index validate-structure validate-links validate-manifest

check:
	python3 my_build/scripts/run_all_checks.py

update-index:
	python3 my_build/scripts/update_index.py

validate-structure:
	python3 my_build/scripts/validate_structure.py

validate-links:
	python3 my_build/scripts/validate_links.py

validate-manifest:
	python3 my_build/scripts/validate_manifest.py
```

### 4.5 `.pre-commit-config.yaml`

Create a basic config using local hooks:

```yaml
repos:
  - repo: local
    hooks:
      - id: my-build-check
        name: my_build validation
        entry: python3 my_build/scripts/run_all_checks.py
        language: system
        pass_filenames: false
```

---

## 5. `my_build/INDEX.md`

`INDEX.md` is the single entrypoint and router.

It must be short, stable, and readable. Target length: under 180 lines.

Required sections:

```md
# my_build INDEX

## Purpose

## Start here

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
<!-- ACTIVE_FILES_END -->

## Update rules

## What not to store
```

The `ACTIVE_FILES` block must be automatically generated by `scripts/update_index.py`.

---

## 6. `manifest.yml`

Create a generic manifest like this:

```yaml
project:
  name: my_build-template
  description: Reusable project memory kernel template
  version: 0.1.0

entrypoints:
  human: my_build/INDEX.md
  agent: my_build/INDEX.md

knowledge_policy:
  durable_only: true
  avoid_raw_logs: true
  avoid_scratch_files: true
  archive_deprecated_context: true

active_files:
  product:
    - my_build/product/vision.md
    - my_build/product/roadmap.md
    - my_build/product/user-flows.md
  architecture:
    - my_build/architecture/overview.md
    - my_build/architecture/service-map.md
    - my_build/architecture/data-flow.md
  debug:
    - my_build/debug/quick-debug.md
    - my_build/debug/logs.md
    - my_build/debug/database.md
  handoffs:
    - my_build/handoffs/agent-context.md
    - my_build/handoffs/human-context.md

task_routes:
  feature:
    - my_build/product/vision.md
    - my_build/architecture/overview.md
    - my_build/features/
    - my_build/specs/
  bug:
    - my_build/debug/quick-debug.md
    - my_build/bugs/
    - my_build/notes/gotchas.md
  decision:
    - my_build/architecture/overview.md
    - my_build/decisions/
  debug:
    - my_build/debug/
    - my_build/notes/gotchas.md

validation:
  max_index_lines: 180
  require_active_files_exist: true
  forbid_tmp_files: true
  forbid_broken_markdown_links: true
```

The scripts must parse this file.

Use only Python standard library if possible. If YAML parsing is needed, either:

1. implement a small simple parser for this known structure, or
2. use `PyYAML` and document that dependency.

Preferred: use `PyYAML` if installed, otherwise fail with a clear message telling the user to run:

```bash
pip install pyyaml
```

---

## 7. Content file requirements

### 7.1 `product/vision.md`

Must include:

```md
# Product Vision

## One-line summary

## Target users

## Problems solved

## Non-goals

## Success metrics

## Current priorities
```

### 7.2 `product/roadmap.md`

Must include:

```md
# Roadmap

## Now

## Next

## Later

## Done

## Dropped / not doing
```

### 7.3 `product/user-flows.md`

Must include:

```md
# User Flows

## Primary flows

## Edge flows

## Admin/operator flows

## Unknowns
```

### 7.4 `product/glossary.md`

Must include:

```md
# Glossary

| Term | Meaning | Notes |
| ---- | ------- | ----- |
```

### 7.5 `architecture/overview.md`

Must include:

```md
# Architecture Overview

## System summary

## Main components

## Data flow

## External dependencies

## Runtime environments

## Known risks
```

### 7.6 `architecture/service-map.md`

Must include:

```md
# Service Map

| Service/module | Responsibility | Depends on | Notes |
| -------------- | -------------- | ---------- | ----- |
```

### 7.7 `architecture/data-flow.md`

Must include:

```md
# Data Flow

## Write paths

## Read paths

## Async/event paths

## Failure paths
```

### 7.8 `features/_template.md`

Must include:

```md
# Feature: <name>

## Status
Draft / In progress / Done / Deprecated

## Business goal

## User value

## Current behavior

## Desired behavior

## Implementation map
- Files:
- Classes/functions:
- APIs:
- Events:
- DB tables/collections:

## Edge cases

## Tests

## Debug notes

## Related bugs

## Related decisions

## Last updated
YYYY-MM-DD
```

### 7.9 `bugs/_template.md`

Must include:

```md
# Bug: <name>

## Date

## Status
Open / Fixed / Monitoring / Archived

## Symptom

## Impact

## Root cause

## Fast debug steps

## Reproduction

## Fix

## Regression tests

## Related feature

## Related decision

## Lessons learned
```

### 7.10 `decisions/_template.md`

Must include:

```md
# ADR-0000: <decision title>

## Status
Proposed / Accepted / Superseded / Deprecated

## Context

## Decision

## Why

## Alternatives considered

## Consequences

## Rollback plan

## Related files

## Date
```

### 7.11 `debug/quick-debug.md`

Must include:

```md
# Quick Debug

## First 5 checks

1. Check recent changes.
2. Check logs.
3. Check service health.
4. Check database state.
5. Check external dependencies.

## Common failure patterns

## Commands

## Escalation notes
```

### 7.12 `notes/gotchas.md`

Must include:

```md
# Gotchas

## Product gotchas

## Code gotchas

## Environment gotchas

## Debug gotchas

## AI-agent gotchas
```

### 7.13 `handoffs/agent-context.md`

Must be optimized for AI agents.

Include:

```md
# Agent Context

## Repository purpose

## Current active areas

## Read order

## Do not read by default

## Common tasks

## Update obligations

## Safety rules
```

---

## 8. Scripts

All scripts must be under `my_build/scripts/`.

Use Python 3.

Scripts must:

- run from repository root;
- print clear PASS/FAIL messages;
- exit non-zero on failure;
- not require internet;
- avoid destructive writes unless explicitly intended;
- work on Linux/macOS.

### 8.1 `update_index.py`

Purpose:

- read `my_build/manifest.yml`;
- generate the `ACTIVE_FILES` block in `my_build/INDEX.md`;
- preserve all other INDEX content.

Behavior:

- find markers:

```md
<!-- ACTIVE_FILES_START -->
<!-- ACTIVE_FILES_END -->
```

- replace content between markers with a generated list:

```md
<!-- ACTIVE_FILES_START -->
### product
- `my_build/product/vision.md`
- `my_build/product/roadmap.md`

### architecture
- `my_build/architecture/overview.md`
<!-- ACTIVE_FILES_END -->
```

- fail if markers are missing;
- fail if manifest is missing;
- print `update_index: OK`.

### 8.2 `validate_structure.py`

Validate:

- required directories exist;
- required files exist;
- no `tmp_*` files inside `my_build`;
- no empty core files;
- `INDEX.md` exists;
- `manifest.yml` exists.

Print:

```txt
validate_structure: PASS
```

or list every failure.

### 8.3 `validate_manifest.py`

Validate:

- `manifest.yml` can be parsed;
- all `active_files` paths exist;
- all `task_routes` paths exist, or directories exist if route ends with `/`;
- entrypoint files exist;
- `validation.max_index_lines` is an integer.

### 8.4 `validate_links.py`

Validate local markdown links.

Rules:

- scan all `.md` files under `my_build`;
- check local link targets such as `../path.md` or `path.md`;
- ignore external links starting with `http://`, `https://`, `mailto:`;
- ignore anchors for now or implement basic anchor support if easy;
- print broken links with source file and target.

### 8.5 `record_change.py`

A helper script to create new files from templates.

CLI:

```bash
python3 my_build/scripts/record_change.py --type feature --title "Add user login"
python3 my_build/scripts/record_change.py --type bug --title "Payment retry creates duplicate invoice"
python3 my_build/scripts/record_change.py --type decision --title "Use MongoDB transaction"
python3 my_build/scripts/record_change.py --type note --title "Kafka retry gotcha"
```

Behavior:

- slugify the title;
- create dated files for bugs and notes;
- create normal slug files for features;
- create ADR number for decisions;
- never overwrite existing files;
- print created path.

Expected paths:

```txt
my_build/features/add-user-login.md
my_build/bugs/2026-06-22-payment-retry-creates-duplicate-invoice.md
my_build/decisions/ADR-0002-use-mongodb-transaction.md
my_build/notes/2026-06-22-kafka-retry-gotcha.md
```

Use current local date from system date.

### 8.6 `run_all_checks.py`

Run:

1. `validate_structure.py`
2. `validate_manifest.py`
3. `validate_links.py`

Then print:

```txt
run_all_checks: PASS
```

If any check fails, print which one failed and exit non-zero.

---

## 9. Example files

Create example files with obviously generic placeholder content.

Examples must teach usage without looking like real production facts.

Required examples:

- `features/example-feature.md`
- `bugs/example-bug.md`
- `decisions/ADR-0001-example-decision.md`

Add a short note at the top of each example:

```md
> Example only. Replace or delete in real projects.
```

---

## 10. Validation and acceptance criteria

The implementation is done only when all conditions pass:

### Structure

- All required files and directories exist.
- `my_build/INDEX.md` is the only required entrypoint inside `my_build`.
- `my_build/manifest.yml` exists and is valid.
- `my_build/validation/reports/.gitkeep` exists.
- No `tmp_*` files exist under `my_build`.

### Scripts

These commands pass:

```bash
python3 my_build/scripts/update_index.py
python3 my_build/scripts/validate_structure.py
python3 my_build/scripts/validate_manifest.py
python3 my_build/scripts/validate_links.py
python3 my_build/scripts/run_all_checks.py
make check
make update-index
```

### Record change

These commands create files successfully and never overwrite existing files:

```bash
python3 my_build/scripts/record_change.py --type feature --title "Add user login"
python3 my_build/scripts/record_change.py --type bug --title "Payment retry creates duplicate invoice"
python3 my_build/scripts/record_change.py --type decision --title "Use MongoDB transaction"
python3 my_build/scripts/record_change.py --type note --title "Kafka retry gotcha"
```

### Index generation

After running:

```bash
python3 my_build/scripts/update_index.py
```

`my_build/INDEX.md` contains an updated active files block generated from `manifest.yml`.

### Git hygiene

- `.gitignore` ignores temporary files and validation reports.
- `.pre-commit-config.yaml` exists.
- No large binary/media files are committed.
- No product-specific domain facts are included.

---

## 11. Implementation order

Implement in this exact order:

1. Create directory structure.
2. Create root files: `README.md`, `AGENTS.md`, `.gitignore`, `Makefile`, `.pre-commit-config.yaml`.
3. Create `my_build/INDEX.md`.
4. Create `my_build/manifest.yml`.
5. Create all content templates and generic example files.
6. Implement `validate_structure.py`.
7. Implement `validate_manifest.py`.
8. Implement `update_index.py`.
9. Implement `validate_links.py`.
10. Implement `record_change.py`.
11. Implement `run_all_checks.py`.
12. Run all checks.
13. Fix every failure.
14. Run `make check`.
15. Produce a final implementation summary.

---

## 12. Final response required from implementation agent

After implementation, report:

```md
## Implemented

## Files created

## Commands run

## Validation result

## How to use

## Notes / limitations
```

Be specific. Mention exact paths and commands. Do not claim success unless validation commands actually passed.

---

## 13. Quality bar

The template should feel boring, predictable, and useful.

Prefer:

- simple markdown;
- small Python scripts;
- explicit validation;
- no magic;
- no hidden dependencies;
- no product-specific assumptions.

Avoid:

- over-engineered abstractions;
- huge docs;
- raw logs;
- generated reports committed by default;
- stale example content;
- absolute machine paths;
- references to previous private projects.
