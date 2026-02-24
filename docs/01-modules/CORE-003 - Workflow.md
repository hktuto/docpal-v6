# CORE-003: Workflow (Process Automation)

## Metadata
type:: core
depend-on:: *(none - this is a foundation)*
status:: needs-revamp
required-by:: E-signature, Retention, Payment

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
