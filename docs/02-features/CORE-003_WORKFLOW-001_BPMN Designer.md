---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-001
depends-on: []
---

# WORKFLOW-001: BPMN Designer

## Overview
Visual BPMN 2.0 workflow designer using AntV X6 for creating and editing business process flows. Supports drag-and-drop nodes, connections, form binding, and workflow rules.

## Description
The BPMN Designer provides a comprehensive visual interface for designing business processes using the BPMN 2.0 standard. It enables users to create complex workflows through an intuitive drag-and-drop interface, configure node properties, define flow conditions, and bind forms to workflow tasks.

## Components

### Core Editor Components
| Component | Path | Description |
|-----------|------|-------------|
| BPMN Editor | `packages/bpmn/components/bpmn/editor.vue` | Main BPMN editor with canvas, node creation, and editing capabilities |
| BPMN Viewer | `packages/bpmn/components/bpmn/viewer.vue` | Read-only BPMN diagram viewer for process visualization |
| Node Component | `packages/bpmn/components/bpmn/node.vue` | Node rendering component for BPMN elements |
| Edge Component | `packages/bpmn/components/bpmn/edge.vue` | Edge/connection rendering between nodes |
| Sidebar | `packages/bpmn/components/bpmn/sidebar/index.vue` | Right sidebar for node configuration |
| Info Panel | `packages/bpmn/components/bpmn/info.vue` | Process information panel |
| History Viewer | `packages/bpmn/components/bpmn/history.vue` | Process history and audit log viewer |
| Replay Viewer | `packages/bpmn/components/bpmn/replayViewer.vue` | Process replay/animation viewer |
| Folder Cabinet | `packages/bpmn/components/bpmn/folderCabinet.vue` | Folder cabinet integration for document workflows |
| Permission Panel | `packages/bpmn/components/bpmn/permission.vue` | Workflow permission settings |
| XML Editor | `packages/bpmn/components/bpmn/XmlEditor.vue` | Raw XML editor for BPMN |

### Context Editors (Node Configuration)
| Component | Path | Description |
|-----------|------|-------------|
| Start Event | `packages/bpmn/components/global/bpmn/context/startEvent.vue` | Start event configuration |
| End Event | `packages/bpmn/components/global/bpmn/context/endEvent.vue` | End event configuration |
| User Task | `packages/bpmn/components/global/bpmn/context/userTask.vue` | User task configuration with assignees |
| Exclusive Gateway | `packages/bpmn/components/global/bpmn/context/exclusiveGateway.vue` | Decision gateway configuration |
| Boundary Event | `packages/bpmn/components/global/bpmn/context/boundaryEvent.vue` | Boundary timer event configuration |
| Condition | `packages/bpmn/components/global/bpmn/context/condition.vue` | Flow condition configuration |
| Document Task | `packages/bpmn/components/global/bpmn/context/document.vue` | Document-related task configuration |
| Email Task | `packages/bpmn/components/global/bpmn/context/email.vue` | Email notification configuration |
| WhatsApp Task | `packages/bpmn/components/global/bpmn/context/whatsApp.vue` | WhatsApp notification configuration |
| Script Task | `packages/bpmn/components/global/bpmn/context/script/index.vue` | Script task configuration |
| HTTP Request | `packages/bpmn/components/global/bpmn/context/http/request.vue` | HTTP service task configuration |
| HTTP Variables | `packages/bpmn/components/global/bpmn/context/http/variables.vue` | HTTP variable mapping |
| Custom Service | `packages/bpmn/components/global/bpmn/context/customeService.vue` | Custom service task configuration |
| Calendar | `packages/bpmn/components/global/bpmn/context/calendar/index.vue` | Calendar event configuration |
| Calendar Reminder | `packages/bpmn/components/global/bpmn/context/calendar/reminder.vue` | Calendar reminder settings |
| Case Management | `packages/bpmn/components/global/bpmn/context/case/index.vue` | Case management integration |
| E-Signature | `packages/bpmn/components/global/bpmn/context/signature.vue` | E-signature task configuration |
| Permissions | `packages/bpmn/components/global/bpmn/context/permission/index.vue` | Permission configuration for workflows |
| Master Table | `packages/bpmn/components/global/bpmn/context/masterTable/index.vue` | Master table data operations |
| ID Generation | `packages/bpmn/components/global/bpmn/context/generateId/index.vue` | ID generation configuration |
| Folder Cabinet | `packages/bpmn/components/global/bpmn/context/folderCabinet/index.vue` | Folder cabinet operations |
| Message Task | `packages/bpmn/components/global/bpmn/context/message/index.vue` | Message task configuration |
| Update Data | `packages/bpmn/components/global/bpmn/context/updateData/index.vue` | Data update operations |
| PDF Reader | `packages/bpmn/components/global/bpmn/context/PDF/reader.vue` | PDF reader integration |
| PDF Writer | `packages/bpmn/components/global/bpmn/context/PDF/writer.vue` | PDF writer integration |
| Audit Log | `packages/bpmn/components/global/bpmn/context/auditLog/index.vue` | Audit log configuration |

### Sidebar Editors
| Component | Path | Description |
|-----------|------|-------------|
| Assignee Editor | `packages/bpmn/components/bpmn/sidebar/edit/assignee.vue` | Task assignee selection |
| Candidate Group | `packages/bpmn/components/bpmn/sidebar/edit/candidateGroup.vue` | Candidate group configuration |
| Candidate Roles | `packages/bpmn/components/bpmn/sidebar/edit/candidateRoles.vue` | Role-based candidate configuration |
| Form Editor | `packages/bpmn/components/bpmn/sidebar/edit/form.vue` | Form binding and field configuration |
| Label Editor | `packages/bpmn/components/bpmn/sidebar/edit/label.vue` | Node label editing |
| Signature Editor | `packages/bpmn/components/bpmn/sidebar/edit/signature.vue` | Signature settings |
| Start Candidate | `packages/bpmn/components/bpmn/sidebar/edit/startCandidate.vue` | Start event candidate configuration |
| Condition Element | `packages/bpmn/components/bpmn/sidebar/condition/element.vue` | Condition element editor |
| Condition Group | `packages/bpmn/components/bpmn/sidebar/condition/group.vue` | Condition group management |
| Document Preview | `packages/bpmn/components/bpmn/sidebar/previewDocument.vue` | Document preview in sidebar |
| Starter Logic | `packages/bpmn/components/bpmn/sidebar/starterAdditionLogic.vue` | Additional starter logic |
| Boolean Button | `packages/bpmn/components/bpmn/sidebar/booleanButton.vue` | Boolean button configuration |

### Utilities & Composables
| File | Path | Description |
|------|------|-------------|
| useBpmn | `packages/bpmn/composables/useBpmn.ts` | Core BPMN composable for graph management |
| useAddionalContext | `packages/bpmn/composables/useAddionalContext.ts` | Additional context composable |
| bpmnElement | `packages/bpmn/utils/bpmnElement.ts` | BPMN element definitions and node registration |
| bpmnElementHelper | `packages/bpmn/utils/bpmnElementHelper.ts` | Helper functions for BPMN element styling |
| bpmnConverter | `packages/bpmn/utils/bpmnConverter.ts` | Converts between BPMN XML and X6 JSON formats |
| bpmnExporter | `packages/bpmn/utils/bpmnExporter.ts` | Export functionality for BPMN diagrams |
| bpmnType | `packages/bpmn/utils/bpmnType.ts` | TypeScript types and interfaces for BPMN |

### Admin Editor Pages
| Component | Path | Description |
|-----------|------|-------------|
| Workflow List | `pages/admin-workflow-editor/components/global/workflowEditor/List.vue` | Workflow list page |
| Workflow Viewer | `pages/admin-workflow-editor/components/global/workflowEditor/viewer.vue` | Workflow viewer |
| Workflow Detail | `pages/admin-workflow-editor/components/global/workflowEditor/detailDead.vue` | Workflow detail (legacy) |
| Version Management | `pages/admin-workflow-editor/components/global/workflowEditor/version.vue` | Workflow version management |
| New Dialog | `pages/admin-workflow-editor/components/workflowEditor/newDialog.vue` | Create new workflow dialog |
| Import Dialog | `pages/admin-workflow-editor/components/workflowEditor/importDialog.vue` | Import workflow dialog |
| Save As Dialog | `pages/admin-workflow-editor/components/workflowEditor/saveAsDialog.vue` | Save as dialog |
| List Table | `pages/admin-workflow-editor/components/workflowEditor/workflowList/table.vue` | Workflow list table |
| Form Designer | `packages/bpmn/pages/public/formDesigner.vue` | Public form designer page |

### Editor Utilities
| File | Path | Description |
|------|------|-------------|
| Menu Config | `pages/admin-workflow-editor/utils/workflowEditorMenu.ts` | Editor menu configuration |
| Provider | `pages/admin-workflow-editor/utils/workflowEditorProvider.ts` | Editor provider utilities |
| Helpers | `pages/admin-workflow-editor/utils/workflowEditorhelpers.ts` | Editor helper functions |
| Plugins | `pages/admin-workflow-editor/plugins/workflowEditorPlugins.ts` | Editor plugins |

## Key Features
- **Visual Design**: Drag-and-drop BPMN 2.0 diagram editor
- **Node Types**: Support for tasks, events, gateways, and flows
- **Form Binding**: Associate forms with user tasks
- **Condition Logic**: Configure flow conditions and decision gateways
- **Service Integration**: HTTP calls, scripts, and custom services
- **Document Integration**: Folder cabinet and document operations
- **Notification Support**: Email and WhatsApp notifications
- **Permission Control**: Workflow-level and task-level permissions
- **E-Signature**: Digital signature task configuration
- **Version Control**: Workflow version management
- **XML Import/Export**: Raw BPMN XML support
- **Process Replay**: Visual replay of process execution

## Related Features
- [[CORE-003_WORKFLOW-002_Workflow Engine]] - Process execution
- [[CORE-003_WORKFLOW-004_Form Renderer]] - Form rendering for tasks
- [[CORE-003_WORKFLOW-006_Workflow Rules]] - Validation rules
- [[CORE-003_WORKFLOW-005_Process History]] - Process history tracking
