# DocPal v4 - Module Dashboard

## Core Platforms (Foundation)

| Module | Status | Required By |
|--------|--------|-------------|
| [[CORE-001 - Auth]] | stable | All add-ons |
| [[CORE-002 - DMS]] | stable | 8 add-ons |
| [[CORE-003 - Workflow]] | needs-revamp | 5 add-ons |
| [[CORE-004 - Dynamic Database]] | in-dev | 6 add-ons + Case Mgmt |

## Business Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-001 - Calendar & Timesheet]] | stable | Dynamic DB | business |
| [[ADD-002 - E-signature]] | stable | Auth + DMS + Workflow | business |
| [[ADD-004 - External Portal]] | stable | Auth + DMS | business |
| [[ADD-005 - Importer Service]] | planned | DMS + Dynamic DB | business |
| [[ADD-006 - Templates]] | stable | DMS | business |
| [[ADD-008 - Watermark]] | stable | DMS | business |
| [[ADD-012 - Desktop App]] | stable | Auth + DMS | business |

## Premium Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-003 - AI Analysis]] | deprecated | - | premium |
| [[ADD-007 - Advanced Viewer]] | stable | DMS | premium |

## Enterprise Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-009 - Retention]] | stable | DMS + Workflow | enterprise |
| [[ADD-010 - Payment]] | planned | Auth + Workflow | enterprise |
| [[ADD-011 - 3rd Party Integration]] | planned | All cores | enterprise |

## Included Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-013 - Notification System]] | stable | All cores | included |
| [[ADD-014 - Audit Log]] | stable | All cores | included |

## Deprecated / Legacy Modules

| Module | Status | Replacement | Notes |
|--------|--------|-------------|-------|
| ~~MasterTable~~ | deprecated | [[CORE-004 - Dynamic Database]] | Will be removed after migration |
| ~~CMMN / Case Management~~ | deprecated | [[CORE-004 - Dynamic Database]] | Will be removed after migration |
| ~~Keycloak SSO~~ | removed | JWT-based auth | No longer supported |
| ~~AI Analysis~~ | deprecated | New AI concept pending | Needs rethink |

## Blocked Add-ons (Waiting on Cores)

| Add-on | Blocked By | ETA |
|--------|------------|-----|
| E-signature | Workflow revamp | After workflow engine update |
| Retention | - | ✅ Complete |
| Payment | Workflow revamp | After workflow engine update |
| Calendar | - | ✅ Complete |
| AI Analysis | - | ❌ Deprecated |
| Importer | Dynamic DB | After feature/mdTable merge |
| Templates | - | ✅ Complete |

## Active Development

| Branch | Feature | Status |
|--------|---------|--------|
| `feature/mdTable` | New Dynamic Database | In Progress |
| `dev` | Integration | Active |
| `master` | Production | Stable |

## Modules Needing Revamp

| Module | Current Issue | Plan |
|--------|---------------|------|
| [[CORE-003 - Workflow]] | Engine needs update | Revamp workflow engine |
