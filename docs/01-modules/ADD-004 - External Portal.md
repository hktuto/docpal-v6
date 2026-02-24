# ADD-004: External Portal

## Metadata
type:: add-on
depend-on:: [[CORE-001 - Auth]], [[CORE-002 - DMS]]
status:: stable
price-tier:: business

## Marketing Description
Guest access portal for clients and vendors to view shared documents.

## Technical Scope
Auth for guest accounts, DMS for limited document visibility.

## Implementation

### File Locations
- **Dashboard Integration**: `packages/dp-dashboard/` (guest portal UI)
- **Guest Auth**: Integrated in [[CORE-001 - Auth]]
- **Public Pages**: 
  - `pages/public-share/`
  - `pages/public-upload/`
  - `pages/public-easy-form/`

### Key Components
- Guest account authentication
- Public share page (`pages/public-share/`)
- Public upload page (`pages/public-upload/`)
- Public form page (`pages/public-easy-form/`)
- Document visibility rules in DMS

## Status Notes
- ✅ **IMPLEMENTED** - External portal functionality complete
- Guest accounts handled via Auth system
- Public pages for share/upload/forms

## Completion Checklist
- [x] Guest auth flow
- [x] Document visibility rules
- [x] Portal UI
- [x] Public share page
- [x] Public upload page
- [x] Public form page
