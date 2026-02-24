# ADD-006: Templates

## Metadata
type:: add-on
depend-on:: [[CORE-002 - DMS]]
status:: stable
price-tier:: business

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
