# ADD-002: E-signature

## Metadata
type:: add-on
depend-on:: [[CORE-001 - Auth]], [[CORE-002 - DMS]], [[CORE-003 - Workflow]]
status:: stable
price-tier:: business

## Marketing Description
Digital signature integration with identity verification and approval workflows.

## Technical Scope
Requires all 3 cores: Auth for identity, DMS for documents, Workflow for approval routing.

## Implementation

### File Locations
- **PDF Sign Library**: `libraries/pdfSign/`
- **Workflow Integration**: Works with [[CORE-003 - Workflow]] for signature workflows
- **Document Integration**: Uses [[CORE-002 - DMS]] for document access

### Key Components
- PDF signing functionality
- Signature workflow integration
- Document signature overlay
- Signature verification

## Status Notes
- ✅ **IMPLEMENTED** - E-signature functionality is complete
- ⚠️ Depends on Workflow engine (which needs revamp)
- Currently works with existing workflow system

## Completion Checklist
- [x] Signature capture
- [x] Identity verification
- [x] Approval workflow integration
- [x] Audit trail

## Features and File Paths

### Feature: PDF Sign Library
- **Description**: Core library for PDF signature design and application. Provides both frontend designer UI and backend PDF processing capabilities.
- **Files**:
  - `libraries/pdfSign/src/types/signatureSetting.ts` - Core SignatureSetting interface defining signature metadata (page, x/y coordinates, dimensions, image data, signer info)
  - `libraries/pdfSign/src/types/index.ts` - Type exports for the library
  - `libraries/pdfSign/src/frontend/PdfSignDesigner.vue` - Main PDF signature designer UI with virtual scrolling, drag-and-drop signature placement, and multi-page support
  - `libraries/pdfSign/src/frontend/SignatureOverlay.vue` - Signature overlay component for positioning signatures on PDF pages with drag functionality
  - `libraries/pdfSign/src/frontend/index.ts` - Frontend entry point with exports for PDF loading and signature data export
  - `libraries/pdfSign/src/backend/index.ts` - Backend entry point for applying signatures to PDF (PDF buffer processing)
  - `libraries/pdfSign/src/App.vue` - Application wrapper component
  - `libraries/pdfSign/README.md` - Library documentation

### Feature: Signature Capture Component
- **Description**: Canvas-based signature capture component for user signature input with touch/mouse support.
- **Files**:
  - `packages/base/components/signature/canvas.vue` - Interactive signature canvas with pointer event handling, export to PNG, clear/submit functionality

### Feature: Document Template Signature Variables
- **Description**: Signature variable type integration in document templates, supporting personal and company signatures with template text replacement.
- **Files**:
  - `packages/doc-template/types/variable.ts` - Variable type definitions including 'signature' as a VariableType
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/type.ts` - SignatureSetting type for template variables (personal/company/both types, prefix/suffix text)
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/form.vue` - Signature variable form component that loads company options
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/templateEditor.vue` - Template editor for configuring signature settings including company chop selection and variable insertion
  - `packages/doc-template/components/docTemplate/content/setting/variable/variableForm.vue` - Variable form that includes signature type selection and value editing
  - `packages/doc-template/components/docTemplate/variables/renderer.vue` - Variable renderer that displays signature variables in the template preview

### Feature: Workflow BPMN Signature Integration
- **Description**: BPMN workflow integration for signature tasks, allowing signature steps to be configured in workflow diagrams with document template binding.
- **Files**:
  - `packages/bpmn/components/bpmn/sidebar/edit/signature.vue` - BPMN sidebar component for configuring signature tasks, links document generate steps to signature variables
  - `packages/bpmn/components/global/bpmn/context/signature.vue` - Context menu component for signature user tasks with assignee/candidate group settings
  - `packages/bpmn/utils/bpmnElement.ts` - BPMN element definitions including signature user task type (attr_docpal:formType: 'signature'), toolbar configuration, and context menu routing
  - `packages/bpmn/public/bpmn/icons/signature.svg` - Signature icon asset
  - `packages/bpmn/assets/bpmn/signature.svg` - Signature icon asset

### Feature: Workflow Signature Processing
- **Description**: Workflow runtime processing for signature tasks, handles signature data conversion between workflow variables and template variables.
- **Files**:
  - `packages/workflow/utils/workflowHelper.ts` - Workflow helper functions including `getBpmnAdditionalElement()` which processes signature settings, maps workflow variables to template variables, and prepares signature data for document generation
