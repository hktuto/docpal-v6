---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-002
depends-on: []
---

# WORKFLOW-002: Workflow Engine

## Overview
Core workflow engine integration, process execution, and workflow helper utilities that power the business process automation capabilities.

## Description
The Workflow Engine is the runtime component responsible for executing BPMN workflows, managing process instances, handling task assignments, and orchestrating the flow of work through the system. It integrates with the BPMN designer definitions and provides the execution layer for all workflow-related operations.

## Components

### Core Engine Components
| Component | Path | Description |
|-----------|------|-------------|
| useWorkflow | `packages/workflow/composables/useWorkflow.ts` | Main workflow composable, manages form render slots and custom handlers |
| workflowHelper | `packages/workflow/utils/workflowHelper.ts` | Helper functions for BPMN parsing, button generation, and signature handling |
| Form Render | `packages/workflow/components/workflow/Detail/formRender.vue` | Workflow form renderer component |

### Workflow Package Structure
- **Base Package**: `packages/workflow/`
- **Composables**: `packages/workflow/composables/`
- **Components**: `packages/workflow/components/`
- **Utils**: `packages/workflow/utils/`

## Key Features

### Process Execution
- BPMN process instance creation and management
- Token-based process flow execution
- State machine management for process instances
- Parallel and sequential flow handling
- Sub-process and call activity support

### Task Management
- User task creation and assignment
- Task claiming and completion
- Candidate users and groups resolution
- Task delegation and escalation
- Due date and priority management

### Integration Points
- Form rendering integration
- Service task execution (HTTP, scripts)
- Event handling (timer, message, signal)
- External system integration hooks
- Document management integration
- E-signature integration

### Runtime Services
- Process deployment and versioning
- Process instance querying
- Historic data management
- Job and timer execution
- Async job execution

### Helper Functions
| Function | Purpose |
|----------|---------|
| BPMN Parsing | Parse BPMN XML into executable format |
| Button Generation | Generate action buttons based on workflow state |
| Signature Handling | Manage e-signature requirements |
| Variable Management | Process variable get/set operations |
| Condition Evaluation | Evaluate gateway conditions |

## Technical Details

### Current Implementation Status
- ⚠️ **NEEDS REVAMP** - Current implementation functional but needs engine update
- Workflow execution works but needs modernization
- Planned improvements for better performance
- Better integration with Dynamic Database planned

### Dependencies
- BPMN 2.0 standard compliance
- AntV X6 for visualization layer
- Form renderer integration
- Database persistence layer

## Related Features
- [[FEAT-003.1 - BPMN Designer]] - Visual workflow design
- [[FEAT-003.3 - Task Management]] - User task interfaces
- [[FEAT-003.4 - Form Renderer]] - Form rendering
- [[FEAT-003.5 - Process History]] - Historic data
