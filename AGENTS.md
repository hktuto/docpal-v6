# AGENTS.md - DocPal v4 Agent Guide

## Critical Rules (MUST FOLLOW)

### 1. Documentation Rule
**ALL documentation MUST go in the Obsidian vault (`/docs/`).**

- ✅ Use existing docs structure
- ✅ Update module/feature/task files in `/docs/`
- ❌ NEVER create new markdown files outside `/docs/`
- ❌ NEVER create README files, notes, or docs in code folders

**If you need to document something that doesn't fit the Obsidian structure → ASK first.**

### 2. Obsidian Writing Guidelines
When writing in `/docs/`:

- Use `[[Wiki Links]]` to connect related documents
- Follow existing metadata format in module files
- Use templates from `00-templates/` for new features/tasks
- Keep daily notes in `04-journal/` with date prefix: `YYYY-MM-DD - Description.md`

### 3. Failure Stop Rule
**If the same feature/bug fix fails 2 times → STOP and ASK.**

- First failure: Try alternate approach
- Second failure: Stop, document what you tried in `04-journal/`, ask for help
- Do not attempt a third time without discussion

### 4. Module Dependency Rule
Before working on add-ons, check their `depend-on` metadata.

If core dependency is not stable → focus on core first or ask.

## Quick Start

1. Read `docs/00-meta/Dashboard.md` for current status
2. Read `docs/00-meta/Documentation Guide.md` for structure & naming rules
3. Check module dependencies before proposing changes
4. Update module status when completing work

## Git Workflow

- Branch: `dev` (active development)
- Main: `master` (stable releases)
- Always work on `dev` branch
