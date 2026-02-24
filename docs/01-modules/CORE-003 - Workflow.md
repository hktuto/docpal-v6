---
type: core
module-id: CORE-003
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

## Features

| Feature | ID | Description | Status |
|---------|-----|-------------|--------|
| [[CORE-003_WORKFLOW-001_BPMN Designer\|BPMN Designer]] | WORKFLOW-001 | Visual BPMN 2.0 workflow designer using AntV X6 | Active |
| [[CORE-003_WORKFLOW-002_Workflow Engine\|Workflow Engine]] | WORKFLOW-002 | Core workflow execution engine | Active |
| [[CORE-003_WORKFLOW-003_Task Management\|Task Management]] | WORKFLOW-003 | User task interfaces and management | Active |
| [[CORE-003_WORKFLOW-004_Form Renderer\|Form Renderer]] | WORKFLOW-004 | Dynamic form rendering for workflow tasks | Active |
| [[CORE-003_WORKFLOW-005_Process History\|Process History]] | WORKFLOW-005 | Process tracking and audit logs | Active |
| [[CORE-003_WORKFLOW-006_Workflow Rules\|Workflow Rules]] | WORKFLOW-006 | Validation and business rules | Active |
| [[CORE-003_WORKFLOW-007_CMMN Case Management\|CMMN Case Management]] | WORKFLOW-007 | Case Management (CMMN) | Deprecated |

## File Locations
- **Workflow Package**: `packages/workflow/`
- **BPMN Components**: `packages/bpmn/` (65+ Vue components)
- **CMMN Components**: `packages/dp-cmmn-x6/` (85+ files, deprecated)
- **Admin Pages**: `pages/admin-workflow/`, `pages/admin-workflow-editor/`
- **Client Pages**: `pages/client-workflow/`

## Status Notes
- ⚠️ **NEEDS REVAMP** - Current implementation functional but needs engine update
- Visual designer is complete (BPMN)
- Workflow execution works but needs modernization
- Case Management (CMMN) is deprecated

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
