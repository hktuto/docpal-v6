---
type: proposal
status: draft
date: 2026-03-02
author: AI Assistant
---

# Documentation Architecture Proposal

## Summary of Current Issues

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| **Task folder growth** | Flat structure with no organization | Hard to find tasks, no context |
| **No sprint tracking** | Missing time-based organization | Management can't see progress/plans |
| **Frontend-focused** | No domain separation | Backend/Infra/Test docs scattered |
| **Marketing blind spot** | No release/changelog tracking | Can't find what's delivered/latest |

---

## Proposed Solution: "Docs for Every Stakeholder"

### Core Principles
1. **Keep Obsidian + Markdown** - Local-first, AI-friendly ✓
2. **Add time dimension** - Sprints and releases for management
3. **Add domain dimension** - Clear ownership for each team
4. **Single source of truth** - Features link to everything

---

## New Folder Structure

```
docs/
├── 00-meta/                    # Dashboards & indexes
│   ├── Dashboard.md            # Module overview (existing)
│   ├── Sprint Dashboard.md     # NEW: Current + upcoming sprints
│   ├── Release Notes.md        # NEW: Marketing changelog
│   └── Team Dashboard.md       # NEW: Per-team task views
│
├── 00-templates/
│   ├── Feature.md              # (enhanced)
│   ├── Task.md                 # (enhanced with domain)
│   ├── Sprint.md               # NEW
│   └── Release.md              # NEW
│
├── 01-modules/                 # (existing - product modules)
│   ├── CORE-001 - Auth.md
│   ├── ADD-002 - E-signature.md
│   └── ...
│
├── 02-features/                # (existing - flat, searchable)
│   ├── FEAT-001.1 - Authentication.md
│   └── ...
│
├── 03-tasks/                   # ORGANIZED by domain + sprint
│   ├── _backlog/               # Unassigned tasks
│   ├── _archive/               # Completed sprints
│   └── SPRINT-YYMMDD/          # Current sprint
│       ├── infra/
│       ├── backend/
│       ├── frontend/
│       └── test/
│
├── 04-journal/                 # (existing - daily notes)
│
├── 05-sprints/                 # NEW: Sprint definitions
│   ├── SPRINT-250303.md        # Sprint planning & retro
│   ├── SPRINT-250317.md
│   └── ...
│
├── 06-releases/                # NEW: Marketing-facing
│   ├── v4.2.0.md
│   ├── v4.3.0.md
│   └── ...
│
└── 07-domains/                 # NEW: Team knowledge bases
    ├── infra/
    ├── backend/
    ├── frontend/
    └── test/
```

---

## How Each Stakeholder Uses It

| Role | Primary View | How They Find Things |
|------|-------------|---------------------|
| **Management** | `Sprint Dashboard.md` | See all sprints, progress %, blockers |
| **Developer** | `03-tasks/SPROUT-XX/domain/` | Find tasks by sprint + domain |
| **Marketing** | `06-releases/` + `Release Notes.md` | What's new, feature docs |
| **AI (me)** | Metadata + links | Quick context without reading everything |

---

## Key Files Explained

### 1. `05-sprints/SPROUT-250303.md` (Sprint Definition)

```markdown
---
type: sprint
start: 2025-03-03
end: 2025-03-14
status: active | completed | planned
goals:
  - Complete FEAT-002.5 Version Control
  - Start FEAT-003.2 Workflow Engine
---

# Sprint 25.05 (Mar 3 - Mar 14)

## Goals
1. [ ] Complete [[FEAT-002.5 - Version Control]]
2. [ ] Start [[FEAT-003.2 - Workflow Engine]]

## Tasks by Domain

| Task | Domain | Owner | Status | Estimate |
|------|--------|-------|--------|----------|
| [[TASK-002.5.1]] | backend | @john | done | 4h |
| [[TASK-002.5.2]] | frontend | @jane | in-progress | 6h |

## Retrospective (fill after sprint)
- What went well:
- Blockers:
- Next sprint improvements:
```

---

### 2. `03-tasks/SPROUT-250303/frontend/TASK-002.5.2.md`

```markdown
---
type: task
feature: FEAT-002.5
sprint: SPROUT-250303
domain: frontend
status: in-progress
assignee: @jane
estimate: 6h
---

# TASK-002.5.2: Version Control UI

## Description
Build version history panel for document viewer.

## Acceptance Criteria
- [x] Version list component
- [ ] Restore version action
- [ ] Compare versions modal

## Related
- Feature: [[FEAT-002.5 - Version Control]]
- Backend API: [[TASK-002.5.1]]
```

---

### 3. `00-meta/Sprint Dashboard.md` (Management View)

```markdown
# Sprint Dashboard

## Current Sprint: [[SPROUT-250303]]
**Status:** 🔴 At Risk (2 tasks behind)
**Progress:** 12/18 tasks (67%)

| Domain | Done | In Progress | Blocked | Owner |
|--------|------|-------------|---------|-------|
| Infra | 2/2 | 0 | 0 | @ops |
| Backend | 3/5 | 2 | 0 | @john |
| Frontend | 4/6 | 1 | 1 | @jane |
| Test | 3/5 | 1 | 0 | @qa |

## Upcoming Sprints
| Sprint | Dates | Goals | Status |
|--------|-------|-------|--------|
| [[SPROUT-250317]] | Mar 17-28 | Workflow Engine | Planned |

## Recent Completions
| Feature | Released In | Marketing Doc |
|---------|-------------|---------------|
| [[FEAT-002.5 - Version Control]] | [[v4.2.0]] | [User Guide](#) |
```

---

### 4. `06-releases/v4.2.0.md` (Marketing View)

```markdown
---
type: release
version: 4.2.0
date: 2025-03-01
status: published
---

# DocPal v4.2.0 Release Notes

## 🚀 New Features
- **Version Control** - Restore previous document versions
- **Enhanced PDF Viewer** - New annotation tools

## 📚 Documentation
| Feature | User Guide | Admin Guide | API Docs |
|---------|-----------|-------------|----------|
| Version Control | [Link](#) | [Link](#) | [[FEAT-002.5]] |

## 📋 Technical Details
- [[SPROUT-250217]] - Sprint that delivered this
- Related PRs: ...
```

---

## Enhanced Templates

### Feature Template (with domain tags)

```markdown
---
type: feature
module: "[[CORE-002 - DMS]]"
status: stable
feature-id: FEAT-002.5
domains: [frontend, backend]      # NEW: who owns this
sprints: [SPROUT-250217]          # NEW: when it was built
released-in: v4.2.0               # NEW: marketing link
---
```

---

## Benefits of This Structure

| Problem | Solution |
|---------|----------|
| Tasks hard to find | Organized by sprint + domain |
| No sprint visibility | `05-sprints/` + `Sprint Dashboard.md` |
| Frontend-focused only | `domain` metadata + `07-domains/` folders |
| Marketing out of loop | `06-releases/` with links to features |
| AI reads too much | Metadata filtering + links |

---

## Migration Path

1. **Keep all existing files** - No disruption
2. **Add `05-sprints/`** - Start with current sprint
3. **Move tasks to `03-tasks/SPROUT-XX/domain/`** - As you work on them
4. **Add `domain` metadata to features** - Gradually
5. **Create `06-releases/`** - When you ship

---

## Open Questions

1. **Sprint naming**: `SPROUT-YYMMDD` or `SPRINT-25.05` or something else?
2. **Domains**: Is `[infra, backend, frontend, test]` the right split? Or do you need `mobile`, `devops`, `security`?
3. **Task granularity**: Do you want tasks linked to GitHub issues/PRs?
4. **Automation**: Should we create a simple script to generate sprint views from metadata?

---

## Next Steps

- [ ] Review and approve proposal
- [ ] Decide on sprint naming convention
- [ ] Create new folder structure
- [ ] Update templates
- [ ] Migrate first sprint
- [ ] Train team on new workflow
