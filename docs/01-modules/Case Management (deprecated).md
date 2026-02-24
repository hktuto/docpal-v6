---
type: deprecated
status: deprecated
replacement: "[[CORE-004 - Dynamic Database]]"
---

# Case Management / CMMN (DEPRECATED)

## Status
**DEPRECATED** - Merged into [[CORE-004 - Dynamic Database]]

## Legacy Code Locations
- ~~Package: `packages/dp-cmmn-x6`~~ **DEPRECATED**
- ~~Pages: `pages/admin-case-management`, `pages/client-case-manage`~~ **DEPRECATED**
- ~~Pages: `pages/super-workflow-form`~~ **DEPRECATED**

## Migration
Case Management functionality is now handled by Dynamic Database tables with:
- Case as a table type
- Timeline views
- Related document linking
- No-code workflow integration

## CMMN vs Dynamic DB Mapping

| CMMN Concept | Dynamic DB Equivalent |
|--------------|----------------------|
| Case Definition | Table Schema with case type |
| Case Instance | Row with case data |
| Case Timeline | View with date column |
| Related Documents | Relation column to documents |
| Tasks | Rows in task table with relations |

## Removal Timeline
- **Now**: CMMN marked as deprecated
- **Pending**: New Dynamic DB with case support
- **After Migration**: CMMN packages and pages removed

## Archived
- Original module code: `git tag archive/case-management`
- CMMN package: `git tag archive/cmmn-x6`
- Migration guide: See Dynamic Database documentation

## References
- Replacement: [[CORE-004 - Dynamic Database]]
- Branch: `feature/mdTable`
