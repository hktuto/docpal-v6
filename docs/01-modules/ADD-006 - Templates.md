---
type: add-on
depend-on:
  - "[[CORE-002 - DMS]]"
status: stable
price-tier: business
---

# ADD-006: Templates

## Marketing Description
Document and email templates with data-driven generation.

## Technical Scope
Template storage in DMS, document generation with data binding.

## Implementation

### Document Templates
- **Template Package**: `packages/doc-template/`
- **Document Editor**: `libraries/docpal-document-editor/`
- **Pagination Extension**: `libraries/tiptap-extension-pagination/`
- **Admin Pages**: `pages/admin-document-template/`

### Email Templates  
- **Editor Package**: `packages/dp-editorjs/`
- **Admin Pages**: `pages/admin-email-template/`

### Key Components
- Document template creation and management
- Tiptap-based document editor with pagination
- Email template editor (EditorJS)
- Template-based document generation
- Dynamic data binding

## Status Notes
- ✅ **IMPLEMENTED** - Both document and email templates complete
- Document templates use Tiptap with custom pagination
- Email templates use EditorJS

## Completion Checklist
- [x] Template engine
- [x] Document generation
- [x] Email templates
- [x] Document editor with pagination
- [x] Template management UI

## Features and File Paths

### Feature: Document Templates (packages/doc-template)
- **Description**: Core document template package providing Tiptap-based document editing with variable support, pagination, and template management.
- **Files**:
  - `packages/doc-template/components/docTemplate/editor.vue` - Main document editor component with Tiptap integration
  - `packages/doc-template/components/docTemplate/viewer.vue` - Document viewer for rendering templates
  - `packages/doc-template/components/docTemplate/header/index.vue` - Editor header component
  - `packages/doc-template/components/docTemplate/footer/index.vue` - Editor footer component
  - `packages/doc-template/components/docTemplate/content/toolbar/index.vue` - Main toolbar container
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/index.vue` - Variable insertion toolbar
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/VariablePicker.vue` - Variable picker dialog
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/text.vue` - Text variable button
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/image.vue` - Image variable button
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/link.vue` - Link variable button
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/list.vue` - List variable button
  - `packages/doc-template/components/docTemplate/content/toolbar/variable/table.vue` - Table variable button
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/SettingsControls.vue` - Settings toolbar controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/FontControls.vue` - Font formatting controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/LinkMediaControls.vue` - Link and media controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/ListControls.vue` - List formatting controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/TitleControls.vue` - Title/heading controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/TextAlignment.vue` - Text alignment controls
  - `packages/doc-template/components/docTemplate/content/toolbar/setting/TableIndentControls.vue` - Table indentation controls
  - `packages/doc-template/components/docTemplate/content/setting/page.vue` - Page settings panel
  - `packages/doc-template/components/docTemplate/content/setting/import.vue` - Document import functionality
  - `packages/doc-template/components/docTemplate/content/setting/export.vue` - Document export functionality
  - `packages/doc-template/components/docTemplate/content/setting/undo.vue` - Undo/redo controls
  - `packages/doc-template/components/docTemplate/content/setting/bubbleMenu.vue` - Bubble menu for text selection
  - `packages/doc-template/components/docTemplate/content/setting/tableBubbleMenu.vue` - Bubble menu for table editing
  - `packages/doc-template/components/docTemplate/content/setting/tableStyleDialog.vue` - Table style configuration dialog
  - `packages/doc-template/components/docTemplate/content/setting/variable/manager.vue` - Variable management panel
  - `packages/doc-template/components/docTemplate/content/setting/variable/variableForm.vue` - Variable creation/edit form
  - `packages/doc-template/components/docTemplate/content/setting/variable/VariableValueText.vue` - Text variable value input
  - `packages/doc-template/components/docTemplate/content/setting/variable/VariableValueImage.vue` - Image variable value input
  - `packages/doc-template/components/docTemplate/content/setting/variable/VariableValueLink.vue` - Link variable value input
  - `packages/doc-template/components/docTemplate/content/setting/variable/VariableValueList.vue` - List variable value input
  - `packages/doc-template/components/docTemplate/content/setting/variable/VariableValueTable.vue` - Table variable value input
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/form.vue` - Signature variable form
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/templateEditor.vue` - Signature template editor
  - `packages/doc-template/components/docTemplate/content/setting/variable/signature/type.ts` - Signature variable types
  - `packages/doc-template/components/docTemplate/variables/renderer.vue` - Variable rendering component
  - `packages/doc-template/components/docTemplate/variables/editVariablesDialog.vue` - Dialog for editing variables
  - `packages/doc-template/components/docTemplate/newDocument/dialog.vue` - New document creation dialog
  - `packages/doc-template/components/docTemplate/newDocument/form.vue` - New document form
  - `packages/doc-template/composables/useVariableStore.ts` - Pinia store for variable management
  - `packages/doc-template/types/variable.ts` - Variable type definitions
  - `packages/doc-template/utils/docTemplateHelper.ts` - Document template utility functions
  - `packages/doc-template/nuxt.config.ts` - Package Nuxt configuration

### Feature: Document Editor Libraries (libraries/docpal-document-editor)
- **Description**: Document editor library (directory exists but currently empty - functionality integrated into doc-template package).
- **Files**:
  - `libraries/docpal-document-editor/` - Directory placeholder for future document editor library extraction

### Feature: Tiptap Pagination Extension (libraries/tiptap-extension-pagination)
- **Description**: Custom Tiptap extension for handling document pagination (directory exists but currently empty - functionality integrated into doc-template).
- **Files**:
  - `libraries/tiptap-extension-pagination/` - Directory placeholder for future pagination extension extraction

### Feature: Email Templates (packages/dp-editorjs)
- **Description**: EditorJS-based email template package with variable support, custom blocks, and layout management.
- **Files**:
  - `packages/dp-editorjs/components/editorjs/index.vue` - Main EditorJS email editor component
  - `packages/dp-editorjs/components/editorjs/infoForm.vue` - Email template info form
  - `packages/dp-editorjs/components/editorjs/testDialog.vue` - Email test send dialog
  - `packages/dp-editorjs/components/emailLayout/dialog.vue` - Email layout selection dialog
  - `packages/dp-editorjs/components/emailLayout/dialog.vform.json` - Layout dialog form configuration
  - `packages/dp-editorjs/composables/useEditorjs/index.ts` - Main EditorJS composable with custom tools
  - `packages/dp-editorjs/composables/useEditorjs/VariableLink/index.ts` - Variable link tool for EditorJS
  - `packages/dp-editorjs/composables/useEditorjs/VariableLink/index.scss` - Variable link styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableOptions/index.ts` - Variable options tool
  - `packages/dp-editorjs/composables/useEditorjs/VariableOptions/index.scss` - Variable options styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/index.js` - Variable table entry point
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/plugin.js` - Variable table plugin
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/table.js` - Variable table block implementation
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/toolbox.js` - Variable table toolbox configuration
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/styles/index.scss` - Table base styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/styles/popover.scss` - Table popover styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/styles/settings.scss` - Table settings styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/styles/table.scss` - Table component styles
  - `packages/dp-editorjs/composables/useEditorjs/VariableTable/styles/toolboxes.scss` - Table toolbox styles
  - `packages/dp-editorjs/composables/useEditorjs/utils/dom.js` - DOM manipulation utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/icon.js` - Icon utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/popover.js` - Popover utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/selection.js` - Text selection utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/throttled.js` - Throttling utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/utils.js` - General utilities
  - `packages/dp-editorjs/composables/useEditorjs/utils/table/dom.js` - Table-specific DOM utilities
  - `packages/dp-editorjs/nuxt.config.ts` - Package Nuxt configuration
  - `packages/dp-editorjs/app.config.ts` - App configuration
  - `packages/dp-editorjs/app.vue` - Playground app component

### Feature: Admin Document Template Management (pages/admin-document-template)
- **Description**: Admin UI for managing document templates, including creation, editing, and template replacement workflows.
- **Files**:
  - `pages/admin-document-template/components/global/documentTemplate/page.vue` - Document template list page
  - `pages/admin-document-template/components/global/documentTemplate/detail.vue` - Document template detail/edit page
  - `pages/admin-document-template/components/documentTemplate/list/table.vue` - Document template list table
  - `pages/admin-document-template/components/template/addStep1Dialog.vue` - Step 1: Template upload dialog
  - `pages/admin-document-template/components/template/addStep2Dialog.vue` - Step 2: Template configuration dialog
  - `pages/admin-document-template/components/template/replaceDialog.vue` - Template replacement dialog
  - `pages/admin-document-template/components/template/replaceButton.vue` - Template replace action button
  - `pages/admin-document-template/components/template/initWordEditCheckingDialog.vue` - Word edit checking initialization dialog
  - `pages/admin-document-template/components/template/templateAddStep1.vform.json` - Step 1 form configuration
  - `pages/admin-document-template/utils/documentTemplateHelper.ts` - Admin document template utilities
  - `pages/admin-document-template/nuxt.config.ts` - Page module Nuxt configuration
  - `pages/admin-document-template/app.config.ts` - App configuration

### Feature: Admin Email Template Management (pages/admin-email-template)
- **Description**: Admin UI for managing email templates and email layouts.
- **Files**:
  - `pages/admin-email-template/components/global/emailTemplate/page.vue` - Email template list page
  - `pages/admin-email-template/components/global/emailTemplate/detail.vue` - Email template detail/edit page
  - `pages/admin-email-template/components/global/layoutTemplate/page.vue` - Email layout template management page
  - `pages/admin-email-template/utils/routerHelper.ts` - Router utilities for email templates
  - `pages/admin-email-template/nuxt.config.ts` - Page module Nuxt configuration
  - `pages/admin-email-template/app.config.ts` - App configuration
  - `pages/admin-email-template/__test__/emailTemplate.nuxt.spec.ts` - Email template tests
  - `pages/admin-email-template/__test__/layoutTemplate.nuxt.spec.ts` - Layout template tests

### Feature: Admin Message Template Management (pages/admin-message-template)
- **Description**: Admin UI for managing message templates (SMS/push notifications) with EditorJS integration.
- **Files**:
  - `pages/admin-message-template/components/global/messageTemplate/list.vue` - Message template list page
  - `pages/admin-message-template/components/global/messageTemplate/detail.vue` - Message template detail view
  - `pages/admin-message-template/components/global/messageTemplate/editTemplate.vue` - Message template editor
  - `pages/admin-message-template/components/messageTemplate/table.vue` - Message template table component
  - `pages/admin-message-template/components/messageTemplate/editor.vue` - Message template EditorJS wrapper
  - `pages/admin-message-template/components/messageTemplate/newDialog.vue` - New message template dialog
  - `pages/admin-message-template/components/messageTemplate/duplicateDialog.vue` - Duplicate template dialog
  - `pages/admin-message-template/components/messageTemplate/newVariableDialog.vue` - New variable dialog
  - `pages/admin-message-template/components/messageTemplate/preview/text.vue` - Message preview component
  - `pages/admin-message-template/utils/messageTemplateHelper.ts` - Message template utilities
  - `pages/admin-message-template/nuxt.config.ts` - Page module Nuxt configuration
  - `pages/admin-message-template/app.config.ts` - App configuration

### Feature: API Integration (libraries/api)
- **Description**: API client generation for template-related endpoints.
- **Files**:
  - `libraries/api/src/generate/template.ts` - Template API client generation
  - `libraries/api/src/generate/admin.ts` - Admin API client generation (includes templates)
  - `libraries/api/src/generator.ts` - Main API generator
