# DocPal v4 - Module Dashboard

## Core Platforms (Foundation)

| Module | Status | Required By |
|--------|--------|-------------|
| [[CORE-001 - Auth]] | stable | All add-ons |
| [[CORE-002 - DMS]] | in-dev | 8 add-ons |
| [[CORE-003 - Workflow]] | planned | 5 add-ons |
| [[CORE-004 - Dynamic Database]] | planned | 6 add-ons |

## Business Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-001 - Calendar & Timesheet]] | planned | Dynamic DB | business |
| [[ADD-002 - E-signature]] | planned | Auth + DMS + Workflow | business |
| [[ADD-004 - External Portal]] | planned | Auth + DMS | business |
| [[ADD-005 - Importer Service]] | planned | DMS + Dynamic DB | business |
| [[ADD-006 - Templates]] | planned | DMS + Dynamic DB | business |
| [[ADD-008 - Watermark]] | planned | DMS | business |
| [[ADD-012 - Desktop App]] | planned | Auth + DMS | business |

## Premium Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-003 - AI Analysis]] | planned | DMS + Dynamic DB | premium |
| [[ADD-007 - Advanced Viewer]] | planned | DMS | premium |

## Enterprise Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-009 - Retention]] | planned | DMS + Workflow | enterprise |
| [[ADD-010 - Payment]] | planned | Auth + Workflow | enterprise |
| [[ADD-011 - 3rd Party Integration]] | planned | All cores | enterprise |

## Included Add-ons

| Module | Status | Depends On | Price Tier |
|--------|--------|------------|------------|
| [[ADD-013 - Notification System]] | planned | All cores | included |
| [[ADD-014 - Audit Log]] | planned | All cores | included |

## Blocked Add-ons (Waiting on Cores)

| Add-on | Blocked By |
|--------|------------|
| E-signature | Workflow |
| Retention | Workflow |
| Payment | Workflow |
| Calendar | Dynamic DB |
| AI Analysis | Dynamic DB |
| 3rd Party | All cores |
