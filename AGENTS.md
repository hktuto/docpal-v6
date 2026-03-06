# AGENTS.md - DocPal v4 Agent Guide

## Critical Rules (MUST FOLLOW)

### 1. Documentation Rule
**ALL documentation MUST go in the Obsidian vault (`docpal-documentation/docpal-document/`).**

- ✅ Use existing docs structure in `docpal-documentation/docpal-document/`
- ✅ Update module/feature/task files via CLI or directly in vault
- ❌ NEVER create new markdown files outside `docpal-documentation/`
- ❌ NEVER create README files, notes, or docs in code folders

**Documentation CLI:**
```bash
cd docpal-documentation/skills/docpal-docs/bin
node docpal.js module create name="Module Name"
node docpal.js feature create name="Feature Name" module=MOD-XXX
node docpal.js task create feature=FEAT-XXX name="Task Name" step=10
node docpal.js task edit id=TK-XXXX status=in-progress assignee="[[Name]]"
```

**If you need to document something that doesn't fit the Obsidian structure → ASK first.**

### 2. Obsidian Writing Guidelines
When writing in `docpal-documentation/docpal-document/`:

- Use `[[Wiki Links]]` to connect related documents
- Follow existing metadata format in module files
- Module files are in `01-modules/`
- Feature folders are in `02-features/{FEAT-XXX - Name}/{FEAT-XXX}.md`
- Task files are in `02-features/{FEAT-XXX - Name}/04-tasks/TK-XXXX - Name.md`
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

1. Read `docpal-documentation/docpal-document/00-meta/Dashboard.md` for current status
2. Read `.agent/documentation-guide.md` for structure & naming rules
3. Check module dependencies before proposing changes
4. Update module status when completing work

## Git Workflow

### Branch Structure
| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, stable releases |
| `dev` | Integration branch, active development |
| `feature/*` | Individual feature development |
| `project/*` | Project-specific branches (e.g., project/HKHS) |

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
- Keep docs updated via CLI or directly in `docpal-documentation/`

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
