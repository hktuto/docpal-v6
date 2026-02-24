# AGENTS.md - DocPal v4 Agent Guide

## Project Overview
DocPal v4 is a document management platform with 4 core foundations and modular add-ons.

## Documentation Structure

All project documentation lives in `/docs/`:

```
docs/
├── 00-meta/           # Dashboard, overview
├── 00-templates/      # Feature and task templates
├── 01-modules/        # All modules (cores + add-ons + deprecated)
├── 02-features/       # Individual feature specs
├── 03-tasks/          # Development tasks
└── 04-journal/        # Daily development logs
```

## Module Organization

**4 Core Platforms** (Foundation):
- CORE-001: Auth
- CORE-002: DMS
- CORE-003: Workflow
- CORE-004: Dynamic Database

**Add-ons** (Depend on cores):
- ADD-001 to ADD-014

**Deprecated**:
- Case Management (deprecated) - merged to Dynamic DB
- MS PlugIn (deprecated) - replaced by Desktop App

## Module Metadata Format

Every module file includes:
```yaml
- type: core | add-on
- depend-on: CORE-xxx, CORE-yyy (for add-ons)
- status: stable | in-dev | planned
- price-tier: business | premium | enterprise | included
```

## Before Working on This Project

1. Read `docs/00-meta/Dashboard.md` for current status
2. Check module dependencies before proposing changes
3. Update module status when completing work
4. Use `[[Wiki Links]]` to connect related documents

## Naming Conventions

- Cores: `CORE-XXX - Name.md`
- Add-ons: `ADD-XXX - Name.md`
- Features: `FEAT-XXX.X - Name.md`
- Tasks: `TASK-XXX.X.X - Name.md`
- Deprecated: `Name (deprecated).md`

## Git Workflow

- Branch: `dev` (active development)
- Main: `master` (stable releases)
- Always work on `dev` branch
