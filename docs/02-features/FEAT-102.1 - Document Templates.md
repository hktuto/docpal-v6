---
type: feature
module: "[[ADD-006 - Templates]]"
feature-id: TEMPLATE-001
---

# TEMPLATE-001: Document Templates

## Description
Core document template package providing Tiptap-based document editing with variable support, pagination, and template management. Includes admin UI for managing document templates, including creation, editing, and template replacement workflows.

## File Locations

### Core Document Template Package (packages/doc-template)
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

### Admin Document Template Management (pages/admin-document-template)
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

## Key Capabilities
- Tiptap-based document editing
- Variable support (text, image, link, list, table, signature)
- Document pagination
- Import and export functionality
- Template management UI
- Template replacement workflows
- Page settings and formatting controls