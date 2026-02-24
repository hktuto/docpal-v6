---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-007
depends-on:
  - "[[CORE-002_DMS-001_Document Browse]]"
  - "[[CORE-002_DMS-006_Metadata Properties]]"
status: stable
---

# DMS-007: Search

## Overview
Advanced document search functionality including full-text search, faceted filters, saved searches, smart folders, and search result management.

## User Flows

### Flow 1: Quick Search
1. User types in global search bar
2. Real-time suggestions appear
3. Results show in dropdown (files, folders, users)
4. Enter opens full search results
5. Recent searches shown when empty

### Flow 2: Advanced Search
1. User clicks "Advanced Search"
2. Filter panel expands with options
3. User selects criteria:
   - Full-text keywords
   - Date ranges
   - Document type
   - Metadata fields
   - Author/owner
4. Results update as filters applied

### Flow 3: Save Search
1. User configures search filters
2. Clicks "Save Search" button
3. Names the saved search
4. Optional: Set as smart folder
5. Saved search appears in sidebar

### Flow 4: Smart Folder
1. User accesses saved smart folder
2. Folder displays dynamic results
3. Count badge shows item count
4. Results auto-refresh on open
5. Can be shared like regular folder

### Flow 5: Search Result Actions
1. User views search results
2. Can sort by relevance, date, name
3. Multi-select works like browse
4. Actions available: preview, share, download
5. Can export result list to CSV

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search` | Basic search query |
| POST | `/api/v1/search/advanced` | Advanced search with filters |
| GET | `/api/v1/search/suggestions` | Autocomplete suggestions |
| POST | `/api/v1/search/saved` | Save search configuration |
| GET | `/api/v1/search/saved` | List saved searches |
| GET | `/api/v1/search/saved/{id}` | Execute saved search |
| PUT | `/api/v1/search/saved/{id}` | Update saved search |
| DELETE | `/api/v1/search/saved/{id}` | Delete saved search |
| GET | `/api/v1/smart-folders` | List smart folders |
| POST | `/api/v1/smart-folders` | Create smart folder |

## File Structure

```
packages/dp-search/components/searchGroup/
├── index.vue               # Search group main component
├── table.vue               # Search results table
└── bar/
    ├── index.vue           # Search bar component
    ├── aggregation.vue     # Search aggregation display
    ├── recentSearch/
    │   └── index.vue       # Recent searches
    └── record/
        ├── index.vue       # Saved search records
        ├── detail.vue      # Saved search detail
        ├── addDialog.vue   # Add saved search dialog
        └── saveLog.vue     # Search save log

packages/dp-search/components/searchGroup/barFilter/
├── index.vue               # Search filter bar
├── form.vue                # Filter form
├── condition.vue           # Filter condition builder
└── metaform.vue            # Metadata filter form

packages/dp-search/composables/
└── useSearchOptions.ts     # Search options composable

packages/dp-search/utils/
├── searchFormHelper.ts     # Search form utilities
├── formOptions.ts          # Form option utilities
└── searchProviderHelper.ts # Search provider utilities

packages/dp-search/typing/
└── search.d.ts             # Search TypeScript definitions

pages/client-search/components/global/
├── search/page.vue         # Client search page
├── smartFolder/page.vue    # Smart folder page
└── smartFolder/detail.vue  # Smart folder detail

pages/client-search/components/smartFolder/
└── BreadCrumb.vue          # Smart folder breadcrumb

pages/admin-document-type/components/
├── global/adminSmartFolder/page.vue  # Admin smart folder
└── smartFolder/infoDialog.vue        # Smart folder info
```

## UI Screenshots

> [!ui] **Global Search Bar**
> Placeholder: Search bar with dropdown showing recent searches and suggestions

> [!ui] **Advanced Search Panel**
> Placeholder: Expanded search panel with multiple filter criteria and operators

> [!ui] **Search Results Grid**
> Placeholder: Results view showing documents with highlighting and facets sidebar

> [!ui] **Saved Searches List**
> Placeholder: Sidebar showing user's saved searches with icons and counts

> [!ui] **Smart Folder View**
> Placeholder: Folder view showing dynamic search results with refresh indicator

## Technical Notes

### Search Architecture
```
User Query → Query Parser → Search Engine → Result Formatter → UI
                ↓
           Elasticsearch / Solr
                ↓
          Index: documents, metadata, content
```

### Indexed Fields
| Field | Type | Boost |
|-------|------|-------|
| filename | text | 3.0 |
| content | text | 1.0 |
| metadata.* | text | 1.5 |
| path | keyword | 2.0 |
| tags | keyword | 2.5 |

### Query Syntax
| Syntax | Description | Example |
|--------|-------------|---------|
| keyword | Basic match | contract |
| "phrase" | Exact phrase | "annual report" |
| field:value | Field filter | author:john |
| -term | Exclude | -draft |
| * wildcard | Prefix/suffix | doc* |
| AND/OR | Boolean | report AND 2024 |

### Filter Types
- **Date Range**: Created, modified, custom date fields
- **Document Type**: Single or multiple selection
- **Metadata**: Per-field operators (equals, contains, range)
- **Folder Scope**: Current, recursive, specific paths
- **Permissions**: Owned by me, shared with me

### Faceted Search
```json
{
  "facets": {
    "documentType": [
      {"value": "contract", "count": 156},
      {"value": "invoice", "count": 89}
    ],
    "createdDate": [
      {"range": "last-week", "count": 23}
    ]
  }
}
```

### Smart Folder Behavior
- Query executed on each access
- Results cached for 5 minutes
- Count badge updates periodically
- Can be pinned to sidebar
- Shareable with access controls

### Performance
- Search timeout: 30 seconds
- Max results: 1000 (paginated)
- Suggestion debounce: 200ms
- Index refresh: Near real-time

### Related Features
- [[CORE-002_DMS-001_Document Browse]] - Search results use browse table
- [[CORE-002_DMS-006_Metadata Properties]] - Metadata fields searchable
- [[CORE-002_DMS-003_Document Preview]] - Preview from search results