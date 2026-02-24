---
type: core
depend-on: "*(none - this is a foundation)*"
status: needs-revamp
required-by:
  - "[[ADD-002 - E-signature]]"
  - "[[ADD-009 - Retention]]"
  - "[[ADD-010 - Payment]]"
---

# CORE-003: Workflow (Process Automation)

## Marketing Description
Automated approval flows, state transitions, triggers, and business process routing.

## Technical Scope
- Workflow designer
- Approval flows
- State machines
- Triggers & actions
- Routing rules

## Current Implementation

### File Locations
- **Workflow Package**: `packages/workflow/`
- **BPMN Components**: `packages/bpmn/` (65+ Vue components)
- **CMMN Components**: `packages/dp-cmmn-x6/` (85+ files)
- **Admin Pages**:
  - `pages/admin-workflow/`
  - `pages/admin-workflow-editor/`
- **Client Pages**:
  - `pages/client-workflow/`

### Current Components
- BPMN visual designer
- Workflow form renderer
- Workflow viewer
- Process history
- Task management

## Status Notes
- ⚠️ **NEEDS REVAMP** - Current implementation functional but needs engine update
- Visual designer is complete (BPMN)
- Workflow execution works but needs modernization
- Case Management (CMMN) will be deprecated

## Revamp Plan
- Modernize workflow engine
- Improve performance
- Better integration with Dynamic Database
- Simplify workflow definitions

## Completion Checklist
- [x] Workflow engine (current - needs revamp)
- [x] Visual designer
- [x] Trigger system
- [x] Integration hooks
- [ ] Engine revamp

---

## Features and File Paths

### Feature: BPMN Designer
- **Description**: Visual BPMN 2.0 workflow designer using AntV X6 for creating and editing business process flows. Supports drag-and-drop nodes, connections, form binding, and workflow rules.
- **Files**:
  - `packages/bpmn/components/bpmn/editor.vue` - Main BPMN editor with canvas, node creation, and editing capabilities
  - `packages/bpmn/components/bpmn/viewer.vue` - Read-only BPMN diagram viewer for process visualization
  - `packages/bpmn/components/bpmn/node.vue` - Node rendering component for BPMN elements
  - `packages/bpmn/components/bpmn/edge.vue` - Edge/connection rendering between nodes
  - `packages/bpmn/components/bpmn/sidebar/index.vue` - Right sidebar for node configuration
  - `packages/bpmn/components/bpmn/info.vue` - Process information panel
  - `packages/bpmn/components/bpmn/history.vue` - Process history and audit log viewer
  - `packages/bpmn/components/bpmn/replayViewer.vue` - Process replay/animation viewer
  - `packages/bpmn/components/bpmn/folderCabinet.vue` - Folder cabinet integration for document workflows
  - `packages/bpmn/components/bpmn/permission.vue` - Workflow permission settings
  - `packages/bpmn/components/bpmn/XmlEditor.vue` - Raw XML editor for BPMN
  - `packages/bpmn/composables/useBpmn.ts` - Core BPMN composable for graph management
  - `packages/bpmn/utils/bpmnElement.ts` - BPMN element definitions and node registration
  - `packages/bpmn/utils/bpmnElementHelper.ts` - Helper functions for BPMN element styling
  - `packages/bpmn/utils/bpmnConverter.ts` - Converts between BPMN XML and X6 JSON formats
  - `packages/bpmn/utils/bpmnExporter.ts` - Export functionality for BPMN diagrams
  - `packages/bpmn/utils/bpmnType.ts` - TypeScript types and interfaces for BPMN

### Feature: BPMN Context Editors (Node Configuration)
- **Description**: Context panels for configuring different BPMN node types including tasks, events, gateways, and service integrations.
- **Files**:
  - `packages/bpmn/components/global/bpmn/context/startEvent.vue` - Start event configuration
  - `packages/bpmn/components/global/bpmn/context/endEvent.vue` - End event configuration
  - `packages/bpmn/components/global/bpmn/context/userTask.vue` - User task configuration with assignees
  - `packages/bpmn/components/global/bpmn/context/exclusiveGateway.vue` - Decision gateway configuration
  - `packages/bpmn/components/global/bpmn/context/boundaryEvent.vue` - Boundary timer event configuration
  - `packages/bpmn/components/global/bpmn/context/condition.vue` - Flow condition configuration
  - `packages/bpmn/components/global/bpmn/context/document.vue` - Document-related task configuration
  - `packages/bpmn/components/global/bpmn/context/email.vue` - Email notification configuration
  - `packages/bpmn/components/global/bpmn/context/whatsApp.vue` - WhatsApp notification configuration
  - `packages/bpmn/components/global/bpmn/context/script/index.vue` - Script task configuration
  - `packages/bpmn/components/global/bpmn/context/http/request.vue` - HTTP service task configuration
  - `packages/bpmn/components/global/bpmn/context/http/variables.vue` - HTTP variable mapping
  - `packages/bpmn/components/global/bpmn/context/customeService.vue` - Custom service task configuration
  - `packages/bpmn/components/global/bpmn/context/calendar/index.vue` - Calendar event configuration
  - `packages/bpmn/components/global/bpmn/context/calendar/reminder.vue` - Calendar reminder settings
  - `packages/bpmn/components/global/bpmn/context/case/index.vue` - Case management integration
  - `packages/bpmn/components/global/bpmn/context/signature.vue` - E-signature task configuration
  - `packages/bpmn/components/global/bpmn/context/permission/index.vue` - Permission configuration for workflows
  - `packages/bpmn/components/global/bpmn/context/masterTable/index.vue` - Master table data operations
  - `packages/bpmn/components/global/bpmn/context/generateId/index.vue` - ID generation configuration
  - `packages/bpmn/components/global/bpmn/context/folderCabinet/index.vue` - Folder cabinet operations
  - `packages/bpmn/components/global/bpmn/context/message/index.vue` - Message task configuration
  - `packages/bpmn/components/global/bpmn/context/updateData/index.vue` - Data update operations
  - `packages/bpmn/components/global/bpmn/context/PDF/reader.vue` - PDF reader integration
  - `packages/bpmn/components/global/bpmn/context/PDF/writer.vue` - PDF writer integration
  - `packages/bpmn/components/global/bpmn/context/auditLog/index.vue` - Audit log configuration

### Feature: BPMN Sidebar Editors
- **Description**: Detailed editing panels for BPMN node properties including assignees, forms, conditions, and signatures.
- **Files**:
  - `packages/bpmn/components/bpmn/sidebar/edit/assignee.vue` - Task assignee selection
  - `packages/bpmn/components/bpmn/sidebar/edit/candidateGroup.vue` - Candidate group configuration
  - `packages/bpmn/components/bpmn/sidebar/edit/candidateRoles.vue` - Role-based candidate configuration
  - `packages/bpmn/components/bpmn/sidebar/edit/form.vue` - Form binding and field configuration
  - `packages/bpmn/components/bpmn/sidebar/edit/label.vue` - Node label editing
  - `packages/bpmn/components/bpmn/sidebar/edit/signature.vue` - Signature settings
  - `packages/bpmn/components/bpmn/sidebar/edit/startCandidate.vue` - Start event candidate configuration
  - `packages/bpmn/components/bpmn/sidebar/condition/element.vue` - Condition element editor
  - `packages/bpmn/components/bpmn/sidebar/condition/group.vue` - Condition group management
  - `packages/bpmn/components/bpmn/sidebar/previewDocument.vue` - Document preview in sidebar
  - `packages/bpmn/components/bpmn/sidebar/starterAdditionLogic.vue` - Additional starter logic
  - `packages/bpmn/components/bpmn/sidebar/booleanButton.vue` - Boolean button configuration

### Feature: BPMN Rules & Validation
- **Description**: Workflow validation rules system for form fields and process validation.
- **Files**:
  - `packages/bpmn/composables/useBpmnRule.ts` - BPMN rules management composable
  - `packages/bpmn/components/bpmnRule/formDialog.vue` - Rule form dialog
  - `packages/bpmn/components/bpmnRule/manageDialog.vue` - Rule management dialog
  - `packages/bpmn/components/global/bpmn/context/info/rule.vue` - Rule information display

### Feature: Workflow Engine
- **Description**: Core workflow engine integration, process execution, and workflow helper utilities.
- **Files**:
  - `packages/workflow/composables/useWorkflow.ts` - Main workflow composable, manages form render slots and custom handlers
  - `packages/workflow/utils/workflowHelper.ts` - Helper functions for BPMN parsing, button generation, and signature handling
  - `packages/workflow/components/workflow/Detail/formRender.vue` - Workflow form renderer component

### Feature: Form Renderer for Workflow
- **Description**: Specialized form rendering for workflow tasks with support for custom widgets and data binding.
- **Files**:
  - `packages/base/components/form/Renderer.vue` - Base form renderer used by workflow
  - `packages/base/components/form/designer.vue` - Form designer for creating workflow forms
  - `packages/base/components/form/variablesRenderer.vue` - Variable rendering in forms
  - `packages/base/components/form/logicalSelector.vue` - Logical condition selector
  - `packages/base/components/form/regexButton.vue` - Regex validation button
  - `packages/base/components/form/upload.vue` - File upload component

### Feature: Workflow Form Widgets
- **Description**: Custom form widgets for workflow forms including calendar, browse, upload, and case info.
- **Files**:
  - `packages/workflow/components/global/formWidget/calendar.vue` - Calendar widget for date selection
  - `packages/workflow/components/global/formWidget/browse.vue` - Folder cabinet browser widget
  - `packages/workflow/components/global/formWidget/caseInfo.vue` - Case information display widget
  - `packages/workflow/components/global/formWidget/updateDocument.vue` - Document update widget
  - `packages/workflow/components/global/formWidget/uploadFromDocpal/index.vue` - Upload from DocPal widget
  - `packages/workflow/components/global/formWidget/uploadFromDocpal/browse.vue` - Browse for upload selection
  - `packages/workflow/components/global/formWidget/uploadFromDocpal/search.vue` - Search for upload documents

### Feature: Task Management
- **Description**: User task management interfaces for viewing, claiming, and completing workflow tasks.
- **Files**:
  - `pages/client-workflow/components/global/workflow/page.vue` - Main workflow task page with tabs
  - `pages/client-workflow/components/global/workflow/detail.vue` - Task detail view
  - `pages/client-workflow/components/workflow/myTask.vue` - My tasks list
  - `pages/client-workflow/components/workflow/allTask.vue` - All tasks list
  - `pages/client-workflow/components/workflow/activeTask.vue` - Active tasks view
  - `pages/client-workflow/components/workflow/completeTask.vue` - Completed tasks view
  - `pages/client-workflow/components/workflow/adhocTask.vue` - Ad-hoc tasks view
  - `pages/client-workflow/components/workflow/activeTask.vue` - Active task management
  - `pages/client-workflow/components/workflow/Detail/Info.vue` - Task information panel
  - `pages/client-workflow/components/workflow/Detail/Reader.vue` - Document reader in task view
  - `pages/client-workflow/components/workflow/Detail/activity.vue` - Task activity feed
  - `pages/client-workflow/components/workflow/Detail/completeInfo.vue` - Task completion information
  - `pages/client-workflow/components/workflow/Detail/discussionChannel.vue` - Task discussion/chat
  - `pages/client-workflow/components/workflow/Detail/graph.vue` - Task process graph
  - `pages/client-workflow/components/workflow/popover/personal.vue` - Personal task filter popover
  - `pages/client-workflow/components/workflow/popover/template.vue` - Task template popover
  - `pages/client-workflow/components/workflow/popover/bulkImport.vue` - Bulk task import
  - `pages/client-workflow/components/workflow/popover/download.vue` - Task list download
  - `pages/client-workflow/components/workflow/signatureDialog.vue` - Signature dialog for tasks
  - `pages/client-workflow/components/workflow/startFullPageDead.vue` - Full-page workflow starter

### Feature: Admin Task Management
- **Description**: Administrative interfaces for managing workflow tasks, reallocation, and retries.
- **Files**:
  - `pages/admin-workflow/components/global/workflowManage/page.vue` - Admin workflow task management page
  - `pages/admin-workflow/components/global/workflowRetry/page.vue` - Workflow retry management
  - `pages/admin-workflow/components/workflow/reallocateDialog.vue` - Task reallocation dialog

### Feature: Workflow Editor Admin
- **Description**: Administrative interface for creating and managing workflow definitions.
- **Files**:
  - `pages/admin-workflow-editor/components/global/workflowEditor/List.vue` - Workflow list page
  - `pages/admin-workflow-editor/components/global/workflowEditor/viewer.vue` - Workflow viewer
  - `pages/admin-workflow-editor/components/global/workflowEditor/detailDead.vue` - Workflow detail (legacy)
  - `pages/admin-workflow-editor/components/global/workflowEditor/version.vue` - Workflow version management
  - `pages/admin-workflow-editor/components/workflowEditor/newDialog.vue` - Create new workflow dialog
  - `pages/admin-workflow-editor/components/workflowEditor/importDialog.vue` - Import workflow dialog
  - `pages/admin-workflow-editor/components/workflowEditor/saveAsDialog.vue` - Save as dialog
  - `pages/admin-workflow-editor/components/workflowEditor/workflowList/table.vue` - Workflow list table
  - `packages/bpmn/pages/public/formDesigner.vue` - Public form designer page
  - `pages/admin-workflow-editor/utils/workflowEditorMenu.ts` - Editor menu configuration
  - `pages/admin-workflow-editor/utils/workflowEditorProvider.ts` - Editor provider utilities
  - `pages/admin-workflow-editor/utils/workflowEditorhelpers.ts` - Editor helper functions
  - `pages/admin-workflow-editor/plugins/workflowEditorPlugins.ts` - Editor plugins

### Feature: Process History
- **Description**: Process history tracking, audit logs, and replay capabilities.
- **Files**:
  - `packages/bpmn/components/bpmn/history.vue` - Process history viewer
  - `packages/bpmn/components/bpmn/replayViewer.vue` - Process replay visualization
  - `packages/bpmn/components/global/bpmn/context/auditLog/index.vue` - Audit log configuration
  - `pages/client-workflow/components/workflow/Detail/activity.vue` - Activity feed for tasks

### Feature: CMMN (Case Management)
- **Description**: Case Management Model and Notation (CMMN) implementation for dynamic case handling. **Note: Planned for deprecation.**
- **Files**:
  - `packages/dp-cmmn-x6/components/cmmn/editor.vue` - CMMN case editor
  - `packages/dp-cmmn-x6/components/cmmn/viewer.vue` - CMMN case viewer
  - `packages/dp-cmmn-x6/components/cmmn/toolbar/index.vue` - CMMN editor toolbar
  - `packages/dp-cmmn-x6/components/cmmn/toolbar/tool.vue` - Individual toolbar tools
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/index.vue` - Side panel for case configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/Case.vue` - Case configuration panel
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/HumanTask.vue` - Human task configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/CaseTask.vue` - Case task configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ProcessTask.vue` - Process task configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/Stage.vue` - Stage configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/Milestone.vue` - Milestone configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/EntryCriterion.vue` - Entry criterion configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ExitCriterion.vue` - Exit criterion configuration
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/UserEventListener.vue` - User event listener
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/index.vue` - Draggable elements panel
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/dialog.vue` - Draggable item dialog
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/draggable/WorkflowDialog.vue` - Workflow selection dialog
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/assignee.vue` - Assignee UI component
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/availableCondition.vue` - Available condition UI
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/header.vue` - Panel header
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/isStartTask.vue` - Start task indicator
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/isStartingTask.vue` - Starting task flag
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/itemControl.vue` - Item control UI
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/label.vue` - Label editor
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/workflow.vue` - Workflow binding UI
  - `packages/dp-cmmn-x6/components/cmmn/sidePanel/ui/workflowInOut.vue` - Workflow input/output mapping
  - `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/index.vue` - Node context menu
  - `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/connection.vue` - Connection context menu
  - `packages/dp-cmmn-x6/components/cmmn/node/contextMenu/remove.vue` - Remove node menu
  - `packages/dp-cmmn-x6/composables/useCmmnGraph.ts` - CMMN graph management composable
  - `packages/dp-cmmn-x6/composables/useStatsTableFilter.ts` - Statistics table filter composable
  - `packages/dp-cmmn-x6/utils/cmmnParser.ts` - CMMN XML parser
  - `packages/dp-cmmn-x6/utils/cmmnConfig.ts` - CMMN configuration
  - `packages/dp-cmmn-x6/utils/cmmnLogic.ts` - CMMN business logic
  - `packages/dp-cmmn-x6/utils/cmmnSaveHelper.ts` - CMMN save helper
  - `packages/dp-cmmn-x6/utils/cmmnX6Elements.ts` - X6 element definitions for CMMN
  - `packages/dp-cmmn-x6/utils/cmmnX6ElementHelper.ts` - Element helper functions
  - `packages/dp-cmmn-x6/utils/caseProvider.ts` - Case data provider
  - `packages/dp-cmmn-x6/utils/dashboardHelper.ts` - Dashboard helper functions
  - `packages/dp-cmmn-x6/utils/dashboardTableHelper.ts` - Dashboard table helpers
  - `packages/dp-cmmn-x6/utils/dashboardCaseStatistics.ts` - Case statistics utilities

### Feature: CMMN Dashboard
- **Description**: Case dashboard components for viewing case statistics, tasks, and related information.
- **Files**:
  - `packages/dp-cmmn-x6/components/dashboard/taskPage.vue` - Case task page
  - `packages/dp-cmmn-x6/components/dashboard/workflowPage.vue` - Workflow within case page
  - `packages/dp-cmmn-x6/components/dashboard/process.vue` - Case process view
  - `packages/dp-cmmn-x6/components/dashboard/processSetting.vue` - Process settings
  - `packages/dp-cmmn-x6/components/dashboard/activity.vue` - Case activity feed
  - `packages/dp-cmmn-x6/components/dashboard/basicInfo.vue` - Case basic information
  - `packages/dp-cmmn-x6/components/dashboard/basicInfoSetting.vue` - Basic info settings
  - `packages/dp-cmmn-x6/components/dashboard/documentRoot.vue` - Document root view
  - `packages/dp-cmmn-x6/components/dashboard/documentRootSetting.vue` - Document root settings
  - `packages/dp-cmmn-x6/components/dashboard/stage/index.vue` - Case stage view
  - `packages/dp-cmmn-x6/components/dashboard/stage/setting.vue` - Stage settings
  - `packages/dp-cmmn-x6/components/dashboard/relatedCase/index.vue` - Related cases view
  - `packages/dp-cmmn-x6/components/dashboard/relatedCase/table.vue` - Related cases table
  - `packages/dp-cmmn-x6/components/dashboard/relatedCaseInfo/index.vue` - Related case info
  - `packages/dp-cmmn-x6/components/dashboard/relatedCaseInfo/setting.vue` - Related case settings
  - `packages/dp-cmmn-x6/components/dashboard/relatedMaster/index.vue` - Related master data
  - `packages/dp-cmmn-x6/components/dashboard/relatedMaster/table.vue` - Related master table
  - `packages/dp-cmmn-x6/components/dashboard/relatedMaster/cards.vue` - Related master cards view
  - `packages/dp-cmmn-x6/components/dashboard/masterTableInfo/index.vue` - Master table information
  - `packages/dp-cmmn-x6/components/dashboard/masterTableInfo/setting.vue` - Master table settings
  - `packages/dp-cmmn-x6/components/dashboard/auditLog/index.vue` - Case audit log
  - `packages/dp-cmmn-x6/components/dashboard/auditLog/setting.vue` - Audit log settings
  - `packages/dp-cmmn-x6/components/dashboard/action/index.vue` - Case actions
  - `packages/dp-cmmn-x6/components/dashboard/action/list.vue` - Action list
  - `packages/dp-cmmn-x6/components/dashboard/action/humanTaskDialog.vue` - Human task action dialog

### Feature: CMMN Case Statistics
- **Description**: Case statistics and reporting components.
- **Files**:
  - `packages/dp-cmmn-x6/components/caseStatistics/fieldLifecycle/index.vue` - Field lifecycle statistics
  - `packages/dp-cmmn-x6/components/caseStatistics/fieldLifecycle/dialog.vue` - Field lifecycle dialog
  - `packages/dp-cmmn-x6/components/caseStatistics/fieldNum/index.vue` - Field number statistics
  - `packages/dp-cmmn-x6/components/caseStatistics/fieldTotal/index.vue` - Field total statistics
  - `packages/dp-cmmn-x6/components/caseStatistics/limitFieldNum/index.vue` - Limited field number stats
  - `packages/dp-cmmn-x6/components/caseStatistics/limitGroupFieldNum/index.vue` - Group field number stats
  - `packages/dp-cmmn-x6/components/caseStatistics/monthlyAverage/index.vue` - Monthly average statistics
  - `packages/dp-cmmn-x6/components/caseStatistics/table/index.vue` - Statistics table
  - `packages/dp-cmmn-x6/components/caseStatistics/table/dialog.vue` - Statistics table dialog
  - `packages/dp-cmmn-x6/components/caseStatistics/settingMergeCode.ts` - Settings merge code
  - `packages/dp-cmmn-x6/components/caseStatistics/settingMergeHelper.ts` - Settings merge helper

### Feature: Dashboard Workflow Widgets
- **Description**: Workflow widgets for personal and corporate dashboards.
- **Files**:
  - `packages/dp-dashboard/components/global/personal/workflow/index.vue` - Personal workflow widget
  - `packages/dp-dashboard/components/global/personal/workflow/my.vue` - My workflow tasks
  - `packages/dp-dashboard/components/global/personal/workflow/active.vue` - Active workflows
  - `packages/dp-dashboard/components/global/personal/workflow/avalible.vue` - Available workflows
  - `packages/dp-dashboard/components/global/personal/workflow/create/index.vue` - Create workflow
  - `packages/dp-dashboard/components/global/personal/workflow/create/dialog.vue` - Create workflow dialog
  - `packages/dp-dashboard/components/global/personal/workflow/create/titleDialog.vue` - Title input dialog
  - `packages/dp-dashboard/components/global/personal/workflow/setting.vue` - Workflow widget settings
  - `packages/dp-dashboard/components/global/personal/workflow/single/index.vue` - Single workflow view
  - `packages/dp-dashboard/components/global/personal/workflow/single/Setting.vue` - Single workflow settings
  - `packages/dp-dashboard/components/global/personal/workflow/single/table.vue` - Single workflow table
  - `packages/dp-dashboard/components/global/workflow/coCount/index.vue` - Corporate workflow counts
  - `packages/dp-dashboard/components/global/workflow/coCount/activeCount.vue` - Active workflow count
  - `packages/dp-dashboard/components/global/workflow/coCount/newCount.vue` - New workflow count
  - `packages/dp-dashboard/components/global/workflow/coCount/approveRate.vue` - Approval rate widget
  - `packages/dp-dashboard/components/global/workflow/coCount/timeSpendPerTask.vue` - Time per task
  - `packages/dp-dashboard/components/global/workflow/coCount/timeSpendPerWorkflow.vue` - Time per workflow
  - `packages/dp-dashboard/components/global/workflow/coCount/dialog.vue` - Count dialog
  - `packages/dp-dashboard/components/global/workflow/group/index.vue` - Workflow group widget
  - `packages/dp-dashboard/components/global/workflow/group/detail/list.vue` - Group detail list
  - `packages/dp-dashboard/components/global/workflow/group/detail/filter.vue` - Group filter
  - `packages/dp-dashboard/components/global/workflow/group/dialog/index.vue` - Group dialog
  - `packages/dp-dashboard/components/global/workflow/group/dialog/card.vue` - Group card view
  - `packages/dp-dashboard/components/global/workflow/group/dialog/tags.vue` - Group tags
  - `packages/dp-dashboard/components/global/workflow/popover/newTask.vue` - New task popover
  - `packages/dp-dashboard/composables/useWorkflow.ts` - Dashboard workflow composable

### Feature: Document Integration in Workflows
- **Description**: Document handling within workflows including preview, upload, and folder cabinet integration.
- **Files**:
  - `packages/base/components/browse/info/WorkflowSection.vue` - Workflow section in document info
  - `packages/base/components/browse/info/WorkflowHoldSection.vue` - Workflow hold section
  - `packages/base/components/browse/Actions/hold.vue` - Hold action for workflows
  - `packages/workflow/components/global/formWidget/browse.vue` - Folder cabinet browser widget
  - `packages/workflow/components/global/formWidget/uploadFromDocpal/index.vue` - Upload from DocPal
  - `packages/bpmn/components/global/bpmn/context/folderCabinet/index.vue` - Folder cabinet in BPMN
  - `packages/bpmn/components/global/bpmn/context/folderCabinet/detail.vue` - Folder cabinet detail
  - `packages/bpmn/components/bpmn/folderCabinet.vue` - BPMN folder cabinet component
  - `packages/bpmn/components/bpmn/sidebar/previewDocument.vue` - Document preview in sidebar
  - `packages/bpmn/components/global/bpmn/button/generateDocument.vue` - Generate document button
  - `packages/bpmn/components/global/bpmn/context/document.vue` - Document context configuration
  - `pages/admin-folder-cabinet/components/FolderCabinetSetting/workflowDialog.vue` - Folder cabinet workflow dialog
  - `pages/admin-external-storage/components/workflowVariableMapping.vue` - External storage workflow mapping

### Feature: Workflow Form Administration
- **Description**: Super admin workflow form management.
- **Files**:
  - `pages/super-workflow-form/components/global/workflowForm/page.vue` - Super admin workflow form page
  - `pages/super-workflow-form/components/global/workflowForm/detail.vue` - Workflow form detail
  - `pages/super-workflow-form/components/workflowForm/card.vue` - Workflow form card view
  - `pages/super-workflow-form/utils/superWorkflowRouterHelper.ts` - Router helper for super workflow

### Feature: Easy Form Integration
- **Description**: Easy form system for workflow notifications and variable handling.
- **Files**:
  - `packages/dp-easy-form/components/easyFormEmail/dialog.vue` - Email form dialog
  - `packages/dp-easy-form/components/easyFormEmail/dialogReadonly.vue` - Read-only email dialog
  - `packages/dp-easy-form/components/easyFormEmail/log.vue` - Email log viewer
  - `packages/dp-easy-form/components/insertVariables/index.vue` - Variable insertion component

### Feature: Form Creator Fields
- **Description**: Field definitions for the form creator used in workflows.
- **Files**:
  - `packages/dp-form/src/creator/index.ts` - Form creator main
  - `packages/dp-form/src/creator/fields/index.ts` - Field index
  - `packages/dp-form/src/creator/fields/input.ts` - Input field
  - `packages/dp-form/src/creator/fields/boolean.ts` - Boolean field
  - `packages/dp-form/src/creator/fields/date.ts` - Date field
  - `packages/dp-form/src/creator/fields/file.ts` - File field
  - `packages/dp-form/src/creator/fields/user.ts` - User field
  - `packages/dp-form/src/creator/options.ts` - Creator options
  - `packages/dp-form/src/creator/utils.ts` - Creator utilities

### Feature: BPMN Additional Context
- **Description**: Additional context providers for BPMN editor.
- **Files**:
  - `packages/bpmn/composables/useAddionalContext.ts` - Additional context composable
  - `packages/bpmn/components/global/bpmn/context/info.vue` - General info context

### Feature: Workflow Data Types
- **Description**: Data type configurations for workflow integration.
- **Files**:
  - `packages/dp-datatype/components/dataType/workflow.vue` - Workflow data type component

### Feature: Calendar Workflow Integration
- **Description**: Calendar integration with workflows.
- **Files**:
  - `packages/calendar/components/global/calendar/workflowViewer.vue` - Calendar workflow viewer
  - `packages/calendar/components/global/calendar/dialogForm.vue` - Calendar dialog form

### Feature: Config Migration for Workflow
- **Description**: Workflow configuration migration tools.
- **Files**:
  - `pages/admin-config-migration/components/global/configMigration/components/workflow.vue` - Workflow migration
  - `pages/admin-config-migration/components/global/configMigration/components/case.vue` - Case migration

### Feature: External Storage Workflow
- **Description**: External storage integration with workflows.
- **Files**:
  - `pages/admin-external-storage/components/externalStorage/profiles/process.vue` - External storage process
  - `pages/admin-external-storage/components/workflowVariableMapping.vue` - Variable mapping

---

**Total Files Found:**
- BPMN Package: ~65 components
- CMMN Package: ~85 components  
- Workflow Package: ~12 components
- Admin Pages: ~25 components
- Client Pages: ~30 components
- Dashboard: ~25 components
- Form-related: ~20 components
- **Grand Total: ~260+ files**
