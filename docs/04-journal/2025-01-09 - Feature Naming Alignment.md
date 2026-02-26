# 2025-01-09 - Feature Naming Alignment

## Summary
Aligned all feature filenames to the documented `FEAT-XXX.X - Name.md` convention.

## Changes Made

### Renamed Features (44 files)
- **CORE-001 Auth features** → `FEAT-001.1` through `FEAT-001.5`
- **CORE-002 DMS features** → `FEAT-002.1` through `FEAT-002.9`
- **CORE-003 Workflow features** → `FEAT-003.1` through `FEAT-003.7`
- **ADD-002 E-signature features** → `FEAT-101.1` through `FEAT-101.3`
- **ADD-006 Templates features** → `FEAT-102.1` through `FEAT-102.3`
- **Other add-ons** → `FEAT-103.1` through `FEAT-106.1`

### Deleted Duplicates
- `AUTH-002 - RBAC & Permissions.md` (duplicate of CORE-001_AUTH-002)
- `AUTH-003 - Password Policy.md` (duplicate of CORE-001_AUTH-003)
- `AUTH-004 - External Portal.md` (duplicate of CORE-001_AUTH-005)

### Link Updates
- Updated wiki links in all 10 module files to reference new feature names
- Updated internal feature cross-references

## Git Commit
```
57ab6b92 docs: align feature naming convention to FEAT-XXX.X format
```

## Notes
Naming convention is now consistent with the Documentation Guide:
- **Modules:** `CORE-XXX - Name.md`, `ADD-XXX - Name.md`
- **Features:** `FEAT-XXX.X - Name.md`
