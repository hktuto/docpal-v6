---
type: feature
module: "[[ADD-006 - Templates]]"
feature-id: TEMPLATE-003
---

# TEMPLATE-003: Email Templates

## Description
EditorJS-based email template package with variable support, custom blocks, and layout management. Includes admin UI for managing email templates and email layouts, plus message templates for SMS/push notifications.

## File Locations

### Email Template Package (packages/dp-editorjs)
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

### Admin Email Template Management (pages/admin-email-template)
- `pages/admin-email-template/components/global/emailTemplate/page.vue` - Email template list page
- `pages/admin-email-template/components/global/emailTemplate/detail.vue` - Email template detail/edit page
- `pages/admin-email-template/components/global/layoutTemplate/page.vue` - Email layout template management page
- `pages/admin-email-template/utils/routerHelper.ts` - Router utilities for email templates
- `pages/admin-email-template/nuxt.config.ts` - Page module Nuxt configuration
- `pages/admin-email-template/app.config.ts` - App configuration
- `pages/admin-email-template/__test__/emailTemplate.nuxt.spec.ts` - Email template tests
- `pages/admin-email-template/__test__/layoutTemplate.nuxt.spec.ts` - Layout template tests

### Admin Message Template Management (pages/admin-message-template)
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

## Key Capabilities
- EditorJS-based email template editing
- Variable support with custom blocks (link, options, table)
- Email layout management
- Email test sending
- Message templates for SMS/push notifications
- Template preview functionality