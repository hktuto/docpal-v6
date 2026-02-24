---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-006
depends-on: []
---

# WORKFLOW-006: Workflow Rules

## Overview
Workflow validation rules system for form fields and process validation. Ensures data integrity and enforces business rules within workflows.

## Description
Workflow Rules provides a flexible system for defining and enforcing validation rules on workflow forms and process data. Rules can be configured in the BPMN designer and are evaluated at runtime to ensure data quality and compliance with business requirements.

## Components

### Rules Management
| Component | Path | Description |
|-----------|------|-------------|
| useBpmnRule | `packages/bpmn/composables/useBpmnRule.ts` | BPMN rules management composable |
| Rule Form Dialog | `packages/bpmn/components/bpmnRule/formDialog.vue` | Rule form dialog |
| Rule Manage Dialog | `packages/bpmn/components/bpmnRule/manageDialog.vue` | Rule management dialog |
| Rule Info | `packages/bpmn/components/global/bpmn/context/info/rule.vue` | Rule information display |

## Key Features

### Rule Types
- **Field Validation**: Required fields, format validation, range checks
- **Cross-Field Rules**: Compare values across multiple fields
- **Conditional Rules**: Rules that apply based on conditions
- **Custom Rules**: JavaScript-based custom validation
- **Regex Patterns**: Regular expression validation
- **Business Rules**: Complex business logic validation

### Rule Configuration
- **Visual Editor**: Configure rules without coding
- **Rule Library**: Reusable rule definitions
- **Rule Groups**: Organize rules by category
- **Rule Priority**: Control evaluation order
- **Error Messages**: Customizable validation messages

### Validation Execution
- **Client-Side**: Real-time validation as users type
- **Server-Side**: Server validation before task completion
- **Async Validation**: Validate against external systems
- **Batch Validation**: Validate multiple fields at once

### Integration Points
- **Form Renderer**: Integration with form validation
- **BPMN Designer**: Rule configuration in designer
- **Task Management**: Enforce rules on task completion
- **API Validation**: Rules exposed via API

## Rule Definition Format

### Basic Rule Structure
```javascript
{
  id: "rule-id",
  name: "Rule Name",
  type: "required|regex|range|custom",
  field: "fieldName",
  condition: "expression",
  errorMessage: "Validation error message",
  enabled: true
}
```

### Supported Operators
- Equal / Not Equal
- Greater Than / Less Than
- Contains / Not Contains
- Matches Regex
- In List / Not In List
- Is Empty / Is Not Empty

## File Locations
- **Composables**: `packages/bpmn/composables/useBpmnRule.ts`
- **Components**: `packages/bpmn/components/bpmnRule/`
- **Context**: `packages/bpmn/components/global/bpmn/context/info/`

## Related Features
- [[CORE-003_WORKFLOW-001_BPMN Designer]] - Rule configuration
- [[CORE-003_WORKFLOW-004_Form Renderer]] - Form validation
- [[CORE-003_WORKFLOW-002_Workflow Engine]] - Rule evaluation
