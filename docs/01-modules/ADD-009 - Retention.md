---
type: add-on
depend-on:
  - "[[CORE-002 - DMS]]"
  - "[[CORE-003 - Workflow]]"
status: stable
price-tier: enterprise
---

# ADD-009: Retention

## Marketing Description
Legal hold, auto-expiry policies, and compliance retention rules.

## Technical Scope
DMS for document lifecycle, Workflow for policy automation.

## Implementation

### File Locations
- **Admin File Policies**: `pages/admin-file-policies/`
- **Client File Policies**: `pages/client-file-policies/`

### Key Components
- Retention policy configuration
- File policy management
- Legal hold functionality
- Auto-expiry rules
- Compliance reporting

## Status Notes
- ✅ **IMPLEMENTED** - Retention policies complete
- File policies managed through dedicated pages
- Integration with DMS document lifecycle

## Completion Checklist
- [x] Retention policies
- [x] Legal hold workflow
- [x] Auto-expiry engine
- [x] File policy management UI
