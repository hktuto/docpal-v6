# CORE-004: Dynamic Database

## Metadata
- **type**: core
- **depend-on**: *(none - this is a foundation)*
- **status**: in-development
- **required-by**: Calendar, AI Analysis, Importer, Templates, Case Management

## Marketing Description
Structured data tables with flexible schemas, views, relations, and query capabilities.

## Current Status

**🚧 NEW IMPLEMENTATION IN PROGRESS**
- Active branch: `feature/mdTable`
- ETA: TBD
- Replaces: MasterTable + CMMN (Case Management)

## Legacy Systems (Being Deprecated)

### ~~dp-masterTable~~ **DEPRECATED**
- Status: Legacy - will be removed
- Replacement: New Dynamic Database
- Migration: Manual data migration planned

### ~~dp-cmmn-x6 (Case Management)~~ **DEPRECATED**  
- Status: Legacy - will be removed
- Replacement: New Dynamic Database with case table types
- Migration: Cases will become dynamic tables

## Technical Scope (New Implementation)

### Core Features
- Table/View creation with flexible schemas
- Column types: text, number, date, relation, formula, file...
- Row data storage with CRUD operations
- Query builder with filters
- Relations between tables (1:1, 1:N, N:M)
- Real-time sync (Electric SQL based)

### Architecture
- Client-side SQLite for offline capability
- Server-side PostgreSQL as source of truth
- Electric SQL for sync layer
- Reactive queries

## Completion Checklist
- [ ] Table/View system
- [ ] Column type system
- [ ] Row storage
- [ ] Query engine
- [ ] Relation handling
- [ ] Migration from MasterTable
- [ ] Migration from CMMN

## Migration Path

### From MasterTable
| MasterTable Concept | Dynamic DB Equivalent |
|---------------------|----------------------|
| Master Table | Dynamic Table |
| Column Definition | Column Schema |
| Records | Rows |
| Categories | Table Groups |

### From CMMN (Case Management)
| CMMN Concept | Dynamic DB Equivalent |
|--------------|----------------------|
| Case Definition | Table Schema with case type |
| Case Instance | Row with case data |
| Timeline | View with date column |
| Documents | Relation column |

## References
- POC Repo: `multi-vendor-db` (Electric SQL proof of concept)
- Branch: `feature/mdTable`
