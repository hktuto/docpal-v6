# Konva Gantt Chart Development Plan

## Overview
Replace the DOM-based mdGantt with a full Konva canvas renderer. Both the left task table and the right timeline are rendered on a single Konva stage using the patterns proven in `demo/canvas-renderer`.

---

## Architecture

```
packages/dp-mdTable/components/mdGantt/
├── index.vue                    # Vue shell: Konva stage container, settings, popovers
├── composables/
│   ├── useGanttStage.ts         # Konva stage init, resize, layer management
│   ├── useGanttViewport.ts      # Virtual scroll + visible range calculation
│   ├── useGanttData.ts          # Data fetching, caching, no-date handling
│   ├── useGanttConfig.ts        # View config: columns, date view, bar label field
│   └── useGanttDrag.ts          # Drag handles for rescheduling
├── layers/
│   ├── taskTableLayer.ts        # Left panel: headers + rows
│   ├── timelineLayer.ts         # Right panel: grid + date headers
│   └── taskBarLayer.ts          # Time bars + drag handles
├── setting/
│   └── dialog.vue               # Gantt config (already exists, will extend)
└── types.ts                     # Gantt-specific types
```

**Reused from `demo/canvas-renderer`:**
- Virtual scroll math → `useGanttViewport.ts`
- LRU data cache → `useGanttData.ts`
- Text measurement / ellipsis → `utils/textMeasure.ts`
- Memory monitoring (optional) → `utils/memoryCalculator.ts`

---

## Feature List & Acceptance Criteria

### Phase 1 — Foundation
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 1.1 | Konva Stage Setup | Stage fills container; responsive to resize; 60fps idle | |
| 1.2 | Split Pane Layout | Left table width adjustable (drag splitter); min 150px / max 50% | |
| 1.3 | Virtual Scroll Engine | Only visible rows rendered; overscan 3 rows; scroll 10k+ rows at 60fps | |
| 1.4 | Synced Scrolling | Vertical scroll on either panel scrolls both; horizontal scroll only on timeline | |
| 1.5 | Data Integration | Reuse `useTableData` from dp-mdTable; fetch via existing API | |

### Phase 2 — Left Task Table
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 2.1 | Column Rendering | Render all visible columns with configurable width | |
| 2.2 | Column Headers | Fixed header row; click to sort; drag to reorder | |
| 2.3 | Text Ellipsis | Truncate with "…" when text exceeds column width | |
| 2.4 | Row Hover / Select | Highlight row on hover; selection state persisted | |
| 2.5 | Column Show/Hide | Settings dialog controls which columns render; persist in view config | |
| 2.6 | Column Resize | Drag column border to resize; persist widths in view config | |

### Phase 3 — Timeline Grid
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 3.1 | Day View | One column per day; header shows "Mon 12" format; weekend shading | |
| 3.2 | Week View | One column per week; header shows "W1", "W2" or date range | |
| 3.3 | Quarter View | One column per month; Q1/Q2/Q3/Q4 group headers | |
| 3.4 | View Switching | Toolbar toggle between Day/Week/Quarter; persist in view config | |
| 3.5 | Grid Lines | Vertical lines per column; horizontal per row; subtle color | |
| 3.6 | Current Date Line | Vertical highlight line at today's date; updates daily | |
| 3.7 | Today Button | Click snaps scroll to make today's date visible | |

### Phase 4 — Time Bars & Interactions
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 4.1 | Bar Rendering | Render bar for each record with start/end dates; color from view config | |
| 4.2 | No-Date Records | Records without dates render as a grey "unscheduled" bar at left margin | |
| 4.3 | Bar Label Field | Settings dialog picks which field displays inside the bar; fallback to ID | |
| 4.4 | Bar Hover | Tooltip on hover showing task name + dates | |
| 4.5 | Click to Open | Click bar opens MdFormPopover for editing | |
| 4.6 | Drag Left Handle | Drag bar left edge → updates start date; live preview + snap to day | |
| 4.7 | Drag Right Handle | Drag bar right edge → updates end date; live preview + snap to day | |
| 4.8 | Drag Whole Bar | Drag bar body → moves both start and end dates together | |
| 4.9 | Cursor Feedback | Resize cursors (ew-resize) on handles; grab on bar body | |

### Phase 5 — Settings & Data
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 5.1 | Date Field Config | Setting dialog: pick startField + endField (existing) | ✅ |
| 5.2 | No-Date Field Handling | Dialog auto-detects missing date fields; offer add/remove (existing) | ✅ |
| 5.3 | Bar Label Setting | New setting: dropdown of available columns for bar text | |
| 5.4 | Column Visibility Setting | New setting: checklist of columns for left table | |
| 5.5 | Default Column Widths | New columns get default 120px; persisted per view | |
| 5.6 | Date View Default | Persist last used Day/Week/Quarter in view config | |

### Phase 6 — Polish
| # | Feature | AC | Status |
|---|---------|-----|--------|
| 6.1 | Lazy Loading | Load data in chunks (200 rows); fetch next chunk before reaching bottom | |
| 6.2 | Empty State | Render "No tasks" illustration when table has 0 rows | |
| 6.3 | Loading State | Skeleton/shimmer while first chunk loads | |
| 6.4 | Keyboard Nav | Arrow keys move selection; Enter opens detail | |
| 6.5 | Performance Budget | Initial render < 100ms; scroll consistently 60fps; memory < 50MB | |

---

## Development Order Recommendation

1. **Week 1:** Phase 1 (Foundation) — Get Konva stage running with virtual scroll
2. **Week 2:** Phase 2 (Task Table) + Phase 3 (Timeline Grid) — Both panels rendering
3. **Week 3:** Phase 4 (Bars & Drag) — The core Gantt interactions
4. **Week 4:** Phase 5 (Settings) + Phase 6 (Polish) — Integration and optimization

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Konva text rendering is slower than DOM | Cache text measurements; only re-render changed cells |
| Form popovers from canvas clicks | Use absolute-positioned HTML overlays triggered by Konva click events |
| Scrollbar styling | Draw custom scrollbar on canvas layer; or overlay thin HTML scrollbar div |
| Mobile touch drag conflicts | Implement touch-specific drag threshold (10px) before triggering bar drag |

---

## Reuse Inventory

| From `demo/canvas-renderer` | Used In |
|-----------------------------|---------|
| `composables/useVirtualScroll.ts` | `useGanttViewport.ts` |
| `composables/useLazyData.ts` | `useGanttData.ts` |
| `utils/memoryCalculator.ts` | Performance debug panel (optional) |
| Layer clipping patterns | All 3 layer files |
| Fixed header math | `taskTableLayer.ts` header row |

---

## View Config Schema Update

```ts
interface GanttViewStyle {
  startField: string
  endField: string
  barLabelField?: string
  dateView: 'day' | 'week' | 'quarter'
  visibleColumns: string[]        // field_names to show in left table
  columnWidths: Record<string, number>
}
```

---

*Drafted: 2026-04-24*
*Next step: Review plan → approve → begin Phase 1*
