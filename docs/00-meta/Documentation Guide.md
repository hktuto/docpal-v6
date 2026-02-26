# Documentation Guide

## Folder Structure

```
docs/
├── 00-meta/           # Dashboard, overview, this guide
├── 00-templates/      # Feature and task templates
├── 01-modules/        # All modules (cores + add-ons + deprecated)
├── 02-features/       # Individual feature specs (FEAT-XXX.X)
├── 03-tasks/          # Development tasks (TASK-XXX.X.X)
├── 04-journal/        # Daily development logs (YYYY-MM-DD)
└── system-architecture/ # Architecture docs (if any)
```

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Core | `CORE-XXX - Name.md` | `CORE-001 - Auth.md` |
| Add-on | `ADD-XXX - Name.md` | `ADD-001 - Calendar & Timesheet.md` |
| Feature | `FEAT-XXX.X - Name.md` | `FEAT-001.1 - Authentication.md` |
| Task | `TASK-XXX.X.X - Name.md` | `TASK-001.1.1 - Progress bar component.md` |
| Deprecated | `Name (deprecated).md` | `Case Management (deprecated).md` |
| Journal | `YYYY-MM-DD - Description.md` | `2026-02-24 - Auth refactor notes.md` |

### Feature Numbering Scheme

| Range | Module |
|-------|--------|
| FEAT-001.x | CORE-001 - Auth |
| FEAT-002.x | CORE-002 - DMS |
| FEAT-003.x | CORE-003 - Workflow |
| FEAT-004.x | CORE-004 - Dynamic Database |
| FEAT-101.x | ADD-002 - E-signature |
| FEAT-102.x | ADD-006 - Templates |
| FEAT-103.x | ADD-008 - Watermark |
| FEAT-104.x | ADD-009 - Retention |
| FEAT-105.x | ADD-013 - Notification System |
| FEAT-106.x | ADD-014 - Audit Log |

## Module Metadata Format

Every module file should include:

```markdown
## Metadata
- **type**: core | add-on
- **depend-on**: CORE-xxx, CORE-yyy (for add-ons only)
- **status**: stable | in-dev | planned
- **price-tier**: business | premium | enterprise | included
```

## Module Organization

### 4 Core Platforms (Foundation)
| Module | Description |
|--------|-------------|
| [[CORE-001 - Auth]] | Identity, SSO, RBAC/ABAC |
| [[CORE-002 - DMS]] | Document upload, browse, preview, storage |
| [[CORE-003 - Workflow]] | Approval flows, state machines |
| [[CORE-004 - Dynamic Database]] | Tables, views, columns, queries |

### 14 Add-ons (Composed from cores)
See [[Dashboard]] for full list with dependencies.

### Deprecated
| Module | Migration |
|--------|-----------|
| [[Case Management (deprecated)]] | Merged to Dynamic DB |
| [[MS PlugIn (deprecated)]] | Replaced by Desktop App |

## Linking Best Practices

- Use `[[Wiki Links]]` for internal references
- Link to modules when mentioning them
- Link to features from tasks
- Keep a "Related" section at bottom of each doc

## When to Create New Docs

| Need | Location | Template |
|------|----------|----------|
| New feature spec | `02-features/` | Use `00-templates/Feature.md` |
| New dev task | `03-tasks/` | Use `00-templates/Task.md` |
| Daily notes | `04-journal/` | None (freeform) |
| New module | `01-modules/` | Copy existing module format |

**DO NOT create docs outside these folders.**
