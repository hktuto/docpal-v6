---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-005
depends-on: []
---

# WORKFLOW-005: Process History

## Overview
Process history tracking, audit logs, and replay capabilities for workflow instances. Provides visibility into process execution and compliance auditing.

## Description
Process History captures and stores the complete execution trail of workflow instances, including task completions, variable changes, decision points, and user actions. It enables process replay for debugging and provides audit trails for compliance requirements.

## Components

### History & Replay Components
| Component | Path | Description |
|-----------|------|-------------|
| History Viewer | `packages/bpmn/components/bpmn/history.vue` | Process history viewer |
| Replay Viewer | `packages/bpmn/components/bpmn/replayViewer.vue` | Process replay visualization |
| Audit Log Config | `packages/bpmn/components/global/bpmn/context/auditLog/index.vue` | Audit log configuration |

### Task Activity
| Component | Path | Description |
|-----------|------|-------------|
| Activity Feed | `pages/client-workflow/components/workflow/Detail/activity.vue` | Activity feed for tasks |

### Audit Log Components
| Component | Path | Description |
|-----------|------|-------------|
| Audit Log Config | `packages/bpmn/components/global/bpmn/context/auditLog/index.vue` | Audit log configuration in BPMN |

## Key Features

### History Tracking
- **Instance History**: Complete lifecycle of process instances
- **Task History**: All task assignments, claims, and completions
- **Variable History**: Changes to process variables over time
- **Decision History**: Gateway decisions and condition evaluations
- **User Actions**: Who did what and when
- **Timestamp Tracking**: Precise timing of all events

### Audit Capabilities
- **Compliance Logging**: Tamper-evident audit trails
- **Data Changes**: Track what data changed and by whom
- **Access Logging**: Who viewed or accessed processes
- **Export**: Export audit logs for external analysis
- **Retention**: Configurable retention policies

### Process Replay
- **Visual Replay**: Step-through visualization of process execution
- **Animation**: Animated replay of token flow
- **Debugging**: Identify where processes went wrong
- **Simulation**: Test alternative paths

### Integration Points
- **Document History**: Link to document audit trails
- **User Activity**: Correlate with user activity logs
- **System Events**: Integration with system event logs
- **External Systems**: Track external service calls

## Data Captured

### Process Instance Data
- Instance ID and definition key
- Start and end timestamps
- Duration
- Start user
- Business key
- State (active, completed, suspended)

### Activity Data
- Activity ID and type
- Start and end times
- Assignee and candidates
- Form data submitted
- Comments and attachments

### Variable Data
- Variable name and type
- Previous and new values
- Change timestamp
- User who made the change

## File Locations
- **BPMN Components**: `packages/bpmn/components/bpmn/`
- **Context Config**: `packages/bpmn/components/global/bpmn/context/`
- **Task Components**: `pages/client-workflow/components/workflow/`

## Related Features
- [[CORE-003_WORKFLOW-001_BPMN Designer]] - History viewer integration
- [[CORE-003_WORKFLOW-002_Workflow Engine]] - History data generation
- [[CORE-003_WORKFLOW-003_Task Management]] - Task activity display
