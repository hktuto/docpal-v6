---
type: feature
module: "[[ADD-002 - E-signature]]"
feature-id: ESIGN-003
---

# ESIGN-003: Signature Workflow

## Description
BPMN workflow integration for signature tasks, allowing signature steps to be configured in workflow diagrams with document template binding. Includes runtime processing for signature tasks, handling signature data conversion between workflow variables and template variables.

## File Locations

### BPMN Workflow Integration
- `packages/bpmn/components/bpmn/sidebar/edit/signature.vue` - BPMN sidebar component for configuring signature tasks, links document generate steps to signature variables
- `packages/bpmn/components/global/bpmn/context/signature.vue` - Context menu component for signature user tasks with assignee/candidate group settings
- `packages/bpmn/utils/bpmnElement.ts` - BPMN element definitions including signature user task type (attr_docpal:formType: 'signature'), toolbar configuration, and context menu routing
- `packages/bpmn/public/bpmn/icons/signature.svg` - Signature icon asset
- `packages/bpmn/assets/bpmn/signature.svg` - Signature icon asset

### Workflow Runtime Processing
- `packages/workflow/utils/workflowHelper.ts` - Workflow helper functions including `getBpmnAdditionalElement()` which processes signature settings, maps workflow variables to template variables, and prepares signature data for document generation

### Document Template Integration
- `packages/doc-template/types/variable.ts` - Variable type definitions including 'signature' as a VariableType
- `packages/doc-template/components/docTemplate/content/setting/variable/signature/type.ts` - SignatureSetting type for template variables (personal/company/both types, prefix/suffix text)
- `packages/doc-template/components/docTemplate/content/setting/variable/signature/form.vue` - Signature variable form component that loads company options
- `packages/doc-template/components/docTemplate/content/setting/variable/signature/templateEditor.vue` - Template editor for configuring signature settings including company chop selection and variable insertion
- `packages/doc-template/components/docTemplate/content/setting/variable/variableForm.vue` - Variable form that includes signature type selection and value editing
- `packages/doc-template/components/docTemplate/variables/renderer.vue` - Variable renderer that displays signature variables in the template preview

## Key Capabilities
- Signature user tasks in BPMN workflows
- Document template binding for signature variables
- Assignee and candidate group configuration
- Personal and company signature types
- Company chop selection
- Workflow variable to template variable mapping
- Signature data preparation for document generation