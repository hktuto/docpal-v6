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

### Branch Structure
| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, stable releases |
| `dev` | Integration branch, active development |
| `feature/*` | Individual feature development |

### Sprint Workflow

**1. Sprint Start - Create Feature Branch**
```bash
# From dev branch
git checkout dev
git pull origin dev
git checkout -b feature/FEAT-001-name
```
- Branch naming: `feature/[feature-id]name`
- Example: `feature/FEAT-001-drag-drop-upload`

**2. During Sprint - Develop & Commit**
- Work on your feature branch
- Make regular commits
- Keep docs updated in `/docs/`

**3. Sprint End - Merge to Dev**
```bash
# When all tests pass
git checkout dev
git merge feature/FEAT-001-name
git push origin dev
```

**4. End-to-End Testing**
- Run full test suite on `dev`
- Verify integration between features
- Fix any issues before release

**5. Release - Merge to Master**
```bash
# After e2e tests pass
git checkout master
git merge dev
git push origin master
```
- Deploy from `master` branch only

### Emergency Fixes
For production hotfixes:
```bash
git checkout master
git checkout -b hotfix/description
# Fix, test, then merge to both master AND dev
```
