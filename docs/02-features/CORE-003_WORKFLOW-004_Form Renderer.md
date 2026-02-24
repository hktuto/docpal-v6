---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-004
depends-on: []
---

# WORKFLOW-004: Form Renderer

## Overview
Specialized form rendering for workflow tasks with support for custom widgets and data binding. Includes both the base form system and workflow-specific form components.

## Description
The Form Renderer provides dynamic form capabilities for workflow tasks, allowing forms to be designed in the BPMN designer and rendered at runtime when users interact with tasks. It supports custom widgets, variable binding, validation, and integration with the document management system.

## Components

### Base Form Components
| Component | Path | Description |
|-----------|------|-------------|
| Form Renderer | `packages/base/components/form/Renderer.vue` | Base form renderer used by workflow |
| Form Designer | `packages/base/components/form/designer.vue` | Form designer for creating workflow forms |
| Variables Renderer | `packages/base/components/form/variablesRenderer.vue` | Variable rendering in forms |
| Logical Selector | `packages/base/components/form/logicalSelector.vue` | Logical condition selector |
| Regex Button | `packages/base/components/form/regexButton.vue` | Regex validation button |
| Upload | `packages/base/components/form/upload.vue` | File upload component |

### Workflow Form Renderer
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Form Render | `packages/workflow/components/workflow/Detail/formRender.vue` | Workflow form renderer component |

### Workflow Form Widgets
| Component | Path | Description |
|-----------|------|-------------|
| Calendar Widget | `packages/workflow/components/global/formWidget/calendar.vue` | Calendar widget for date selection |
| Browse Widget | `packages/workflow/components/global/formWidget/browse.vue` | Folder cabinet browser widget |
| Case Info Widget | `packages/workflow/components/global/formWidget/caseInfo.vue` | Case information display widget |
| Update Document | `packages/workflow/components/global/formWidget/updateDocument.vue` | Document update widget |
| Upload From DocPal | `packages/workflow/components/global/formWidget/uploadFromDocpal/index.vue` | Upload from DocPal widget |
| Upload Browse | `packages/workflow/components/global/formWidget/uploadFromDocpal/browse.vue` | Browse for upload selection |
| Upload Search | `packages/workflow/components/global/formWidget/uploadFromDocpal/search.vue` | Search for upload documents |

### Form Creator Fields
| Component | Path | Description |
|-----------|------|-------------|
| Creator Main | `packages/dp-form/src/creator/index.ts` | Form creator main |
| Field Index | `packages/dp-form/src/creator/fields/index.ts` | Field index |
| Input Field | `packages/dp-form/src/creator/fields/input.ts` | Input field definition |
| Boolean Field | `packages/dp-form/src/creator/fields/boolean.ts` | Boolean field definition |
| Date Field | `packages/dp-form/src/creator/fields/date.ts` | Date field definition |
| File Field | `packages/dp-form/src/creator/fields/file.ts` | File field definition |
| User Field | `packages/dp-form/src/creator/fields/user.ts` | User field definition |
| Creator Options | `packages/dp-form/src/creator/options.ts` | Creator options |
| Creator Utils | `packages/dp-form/src/creator/utils.ts` | Creator utilities |

### Easy Form Integration
| Component | Path | Description |
|-----------|------|-------------|
| Email Dialog | `packages/dp-easy-form/components/easyFormEmail/dialog.vue` | Email form dialog |
| Readonly Email | `packages/dp-easy-form/components/easyFormEmail/dialogReadonly.vue` | Read-only email dialog |
| Email Log | `packages/dp-easy-form/components/easyFormEmail/log.vue` | Email log viewer |
| Variable Insert | `packages/dp-easy-form/components/insertVariables/index.vue` | Variable insertion component |

### Super Admin Form Management
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Form Page | `pages/super-workflow-form/components/global/workflowForm/page.vue` | Super admin workflow form page |
| Workflow Form Detail | `pages/super-workflow-form/components/global/workflowForm/detail.vue` | Workflow form detail |
| Workflow Form Card | `pages/super-workflow-form/components/workflowForm/card.vue` | Workflow form card view |
| Router Helper | `pages/super-workflow-form/utils/superWorkflowRouterHelper.ts` | Router helper for super workflow |

### Data Type Components
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Data Type | `packages/dp-datatype/components/dataType/workflow.vue` | Workflow data type component |

### Calendar Integration
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Viewer | `packages/calendar/components/global/calendar/workflowViewer.vue` | Calendar workflow viewer |
| Dialog Form | `packages/calendar/components/global/calendar/dialogForm.vue` | Calendar dialog form |

## Key Features

### Form Rendering
- **Dynamic Forms**: Render forms based on JSON schema
- **Variable Binding**: Bind form fields to workflow variables
- **Conditional Fields**: Show/hide fields based on conditions
- **Validation**: Client and server-side validation
- **Multi-step Forms**: Support for wizard-style forms

### Custom Widgets
- **Calendar**: Date and time selection
- **Document Browser**: Browse folder cabinet
- **Upload**: File upload from local or DocPal
- **User Selection**: User and group pickers
- **Case Info**: Display case information
- **Update Document**: Modify document metadata

### Form Designer
- **Visual Designer**: Drag-and-drop form builder
- **Field Types**: Input, boolean, date, file, user, etc.
- **Layout Options**: Grid and flex layouts
- **Styling**: Custom CSS and theming
- **Preview Mode**: Test forms before deployment

### Integration Features
- **Workflow Variables**: Automatic variable mapping
- **Document Integration**: Link forms to documents
- **Email Forms**: Form-based email composition
- **Signature Fields**: Digital signature capture
- **Master Table**: Integration with master data

## File Locations
- **Base Components**: `packages/base/components/form/`
- **Workflow Widgets**: `packages/workflow/components/global/formWidget/`
- **Form Creator**: `packages/dp-form/src/creator/`
- **Easy Form**: `packages/dp-easy-form/`
- **Super Admin**: `pages/super-workflow-form/`

## Related Features
- [[CORE-003_WORKFLOW-001_BPMN Designer]] - Form binding in designer
- [[CORE-003_WORKFLOW-002_Workflow Engine]] - Form data processing
- [[CORE-003_WORKFLOW-003_Task Management]] - Task form display
