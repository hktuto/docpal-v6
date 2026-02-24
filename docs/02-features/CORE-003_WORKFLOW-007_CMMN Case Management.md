---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-007
depends-on: []
status: deprecated
---

# WORKFLOW-007: CMMN Case Management (DEPRECATED)

## ⚠️ Deprecation Notice

**This feature is planned for deprecation.** 

Case Management Model and Notation (CMMN) implementation for dynamic case handling will be removed in a future release. New implementations should use BPMN-based workflows instead.

## Overview

Case Management Model and Notation (CMMN) implementation for dynamic case handling. CMMN provides a different approach to handling unstructured, event-driven work compared to BPMN's structured process flows.

## Description

CMMN is designed for cases where the exact path cannot be predetermined and evolves based on events, user decisions, and incoming information. Unlike BPMN, which follows a predefined sequence, CMMN allows for ad-hoc activities and dynamic case progression.

## Package Location
- **CMMN Package**: `packages/dp-cmmn-x6/` (85+ files)

## Components

### Core CMMN Components
| Component | Path | Description |
|-----------|------|-------------|
| CMMN Editor | `packages/dp-cmmn-x6/components/cmmn/editor.vue` | CMMN case editor |
| CMMN Viewer | `packages/dp-cmmn-x6/components/cmmn/viewer.vue` | CMMN case viewer |
| Toolbar | `packages/dp-cmmn-x6/components/cmmn/toolbar/index.vue` | CMMN editor toolbar |
| Toolbar Tools | `packages/dp-cmmn-x6/components/cmmn/toolbar/tool.vue` | Individual toolbar tools |
| Side Panel | `packages/dp-cmmn-x6/components/cmmn/sidePanel/index.vue` | Side panel for case configuration |
| Case Panel | `packages/dp-cmmn-x6/components/cmmn/sidePanel/Case.vue` | Case configuration panel |
| Human Task | `packages/dp-cmmn-x6/components/cmmn/sidePanel/HumanTask.vue` | Human task configuration |
| Case Task | `packages/dp-cmmn-x6/components/cmmn/sidePanel/CaseTask.vue` | Case task configuration |
| Process Task | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ProcessTask.vue` | Process task configuration |
| Stage | `packages/dp-cmmn-x6/components/cmmn/sidePanel/Stage.vue` | Stage configuration |
| Milestone | `packages/dp-cmmn-x6/components/cmmn/sidePanel/Milestone.vue` | Milestone configuration |
| Entry Criterion | `packages/dp-cmmn-x6/components/cmmn/sidePanel/EntryCriterion.vue` | Entry criterion configuration |
| Exit Criterion | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ExitCriterion.vue` | Exit criterion configuration |
| User Event | `packages/dp-cmmn-x6/components/cmmn/sidePanel/UserEventListener.vue` | User event listener |
| Draggable Panel | `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/index.vue` | Draggable elements panel |
| Draggable Dialog | `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/dialog.vue` | Draggable item dialog |
| Workflow Dialog | `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/WorkflowDialog.vue` | Workflow selection dialog |

### Side Panel UI Components
| Component | Path | Description |
|-----------|------|-------------|
| Assignee UI | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/assignee.vue` | Assignee UI component |
| Available Condition | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/availableCondition.vue` | Available condition UI |
| Panel Header | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/header.vue` | Panel header |
| Start Task Indicator | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/isStartTask.vue` | Start task indicator |
| Starting Task Flag | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/isStartingTask.vue` | Starting task flag |
| Item Control | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/itemControl.vue` | Item control UI |
| Label Editor | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/label.vue` | Label editor |
| Workflow Binding | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/workflow.vue` | Workflow binding UI |
| Workflow I/O | `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/workflowInOut.vue` | Workflow input/output mapping |

### Context Menu Components
| Component | Path | Description |
|-----------|------|-------------|
| Context Menu | `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/index.vue` | Node context menu |
| Connection Menu | `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/connection.vue` | Connection context menu |
| Remove Menu | `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/remove.vue` | Remove node menu |

### CMMN Utilities
| File | Path | Description |
|------|------|-------------|
| useCmmnGraph | `packages/dp-cmmn-x6/composables/useCmmnGraph.ts` | CMMN graph management composable |
| useStatsTableFilter | `packages/dp-cmmn-x6/composables/useStatsTableFilter.ts` | Statistics table filter composable |
| cmmnParser | `packages/dp-cmmn-x6/utils/cmmnParser.ts` | CMMN XML parser |
| cmmnConfig | `packages/dp-cmmn-x6/utils/cmmnConfig.ts` | CMMN configuration |
| cmmnLogic | `packages/dp-cmmn-x6/utils/cmmnLogic.ts` | CMMN business logic |
| cmmnSaveHelper | `packages/dp-cmmn-x6/utils/cmmnSaveHelper.ts` | CMMN save helper |
| cmmnX6Elements | `packages/dp-cmmn-x6/utils/cmmnX6Elements.ts` | X6 element definitions for CMMN |
| cmmnX6ElementHelper | `packages/dp-cmmn-x6/utils/cmmnX6ElementHelper.ts` | Element helper functions |
| caseProvider | `packages/dp-cmmn-x6/utils/caseProvider.ts` | Case data provider |
| dashboardHelper | `packages/dp-cmmn-x6/utils/dashboardHelper.ts` | Dashboard helper functions |
| dashboardTableHelper | `packages/dp-cmmn-x6/utils/dashboardTableHelper.ts` | Dashboard table helpers |
| dashboardCaseStatistics | `packages/dp-cmmn-x6/utils/dashboardCaseStatistics.ts` | Case statistics utilities |

### CMMN Dashboard Components
| Component | Path | Description |
|-----------|------|-------------|
| Task Page | `packages/dp-cmmn-x6/components/dashboard/taskPage.vue` | Case task page |
| Workflow Page | `packages/dp-cmmn-x6/components/dashboard/workflowPage.vue` | Workflow within case page |
| Process View | `packages/dp-cmmn-x6/components/dashboard/process.vue` | Case process view |
| Process Settings | `packages/dp-cmmn-x6/components/dashboard/processSetting.vue` | Process settings |
| Activity Feed | `packages/dp-cmmn-x6/components/dashboard/activity.vue` | Case activity feed |
| Basic Info | `packages/dp-cmmn-x6/components/dashboard/basicInfo.vue` | Case basic information |
| Basic Info Settings | `packages/dp-cmmn-x6/components/dashboard/basicInfoSetting.vue` | Basic info settings |
| Document Root | `packages/dp-cmmn-x6/components/dashboard/documentRoot.vue` | Document root view |
| Document Root Settings | `packages/dp-cmmn-x6/components/dashboard/documentRootSetting.vue` | Document root settings |
| Stage View | `packages/dp-cmmn-x6/components/dashboard/stage/index.vue` | Case stage view |
| Stage Settings | `packages/dp-cmmn-x6/components/dashboard/stage/setting.vue` | Stage settings |
| Related Cases | `packages/dp-cmmn-x6/components/dashboard/relatedCase/index.vue` | Related cases view |
| Related Cases Table | `packages/dp-cmmn-x6/components/dashboard/relatedCase/table.vue` | Related cases table |
| Related Case Info | `packages/dp-cmmn-x6/components/dashboard/relatedCaseInfo/index.vue` | Related case info |
| Related Case Settings | `packages/dp-cmmn-x6/components/dashboard/relatedCaseInfo/setting.vue` | Related case settings |
| Related Master | `packages/dp-cmmn-x6/components/dashboard/relatedMaster/index.vue` | Related master data |
| Related Master Table | `packages/dp-cmmn-x6/components/dashboard/relatedMaster/table.vue` | Related master table |
| Related Master Cards | `packages/dp-cmmn-x6/components/dashboard/relatedMaster/cards.vue` | Related master cards view |
| Master Table Info | `packages/dp-cmmn-x6/components/dashboard/masterTableInfo/index.vue` | Master table information |
| Master Table Settings | `packages/dp-cmmn-x6/components/dashboard/masterTableInfo/setting.vue` | Master table settings |
| Audit Log | `packages/dp-cmmn-x6/components/dashboard/auditLog/index.vue` | Case audit log |
| Audit Log Settings | `packages/dp-cmmn-x6/components/dashboard/auditLog/setting.vue` | Audit log settings |
| Actions | `packages/dp-cmmn-x6/components/dashboard/action/index.vue` | Case actions |
| Action List | `packages/dp-cmmn-x6/components/dashboard/action/list.vue` | Action list |
| Human Task Dialog | `packages/dp-cmmn-x6/components/dashboard/action/humanTaskDialog.vue` | Human task action dialog |

### Case Statistics Components
| Component | Path | Description |
|-----------|------|-------------|
| Field Lifecycle | `packages/dp-cmmn-x6/components/caseStatistics/fieldLifecycle/index.vue` | Field lifecycle statistics |
| Field Lifecycle Dialog | `packages/dp-cmmn-x6/components/caseStatistics/fieldLifecycle/dialog.vue` | Field lifecycle dialog |
| Field Number | `packages/dp-cmmn-x6/components/caseStatistics/fieldNum/index.vue` | Field number statistics |
| Field Total | `packages/dp-cmmn-x6/components/caseStatistics/fieldTotal/index.vue` | Field total statistics |
| Limited Field Number | `packages/dp-cmmn-x6/components/caseStatistics/limitFieldNum/index.vue` | Limited field number stats |
| Group Field Number | `packages/dp-cmmn-x6/components/caseStatistics/limitGroupFieldNum/index.vue` | Group field number stats |
| Monthly Average | `packages/dp-cmmn-x6/components/caseStatistics/monthlyAverage/index.vue` | Monthly average statistics |
| Statistics Table | `packages/dp-cmmn-x6/components/caseStatistics/table/index.vue` | Statistics table |
| Statistics Dialog | `packages/dp-cmmn-x6/components/caseStatistics/table/dialog.vue` | Statistics table dialog |
| Settings Merge Code | `packages/dp-cmmn-x6/components/caseStatistics/settingMergeCode.ts` | Settings merge code |
| Settings Merge Helper | `packages/dp-cmmn-x6/components/caseStatistics/settingMergeHelper.ts` | Settings merge helper |

## Key Features (Historical)

### CMMN Concepts
- **Cases**: Dynamic, event-driven work
- **Stages**: Phases within a case
- **Tasks**: Human and process tasks
- **Events**: User events and listeners
- **Milestones**: Achievement markers
- **Entry/Exit Criteria**: Conditions for activation

### Dashboard Features
- **Case Overview**: Complete case information
- **Related Cases**: Link related cases
- **Master Data**: Integration with master tables
- **Document Management**: Case document handling
- **Activity Tracking**: Case activity feed
- **Statistics**: Case performance metrics

## Migration Path

Organizations using CMMN should plan migration to BPMN-based workflows:

1. **Assess Current Usage**: Identify all active CMMN cases
2. **Design BPMN Replacements**: Model equivalent BPMN processes
3. **Data Migration**: Plan data migration strategy
4. **User Training**: Train users on new BPMN processes
5. **Phased Rollout**: Migrate cases gradually

## Related Features
- [[CORE-003_WORKFLOW-001_BPMN Designer]] - Recommended replacement
- [[CORE-003_WORKFLOW-002_Workflow Engine]] - Process execution
