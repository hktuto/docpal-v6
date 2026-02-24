# MasterTable (DEPRECATED)

## Status
**DEPRECATED** - Will be replaced by [[CORE-004 - Dynamic Database]]

## Legacy Code Location
- Package: `packages/dp-masterTable`
- Pages: `pages/admin-masterTable`, `pages/client-master-table`

## Migration Path

MasterTable functionality is being replaced by the new Dynamic Database implementation in branch `feature/mdTable`.

| MasterTable | Dynamic DB |
|-------------|------------|
| MasterTable | Dynamic Table |
| Column Info | Column Schema |
| Records | Rows |
| Categories | Table Groups |

## Removal Timeline
- **Now**: Marked as deprecated
- **Pending**: New Dynamic DB release
- **After Migration**: MasterTable packages removed

## Archived
- Code will be tagged before removal: `git tag archive/masterTable`
