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

## Features

| Feature | Description | ID |
|---------|-------------|-----|
| Document Templates | Tiptap-based document editing with variable support | [[ADD-006_TEMPLATE-001_Document Templates\|TEMPLATE-001]] |
| Document Editor | Document editor libraries with pagination extension | [[ADD-006_TEMPLATE-002_Document Editor\|TEMPLATE-002]] |
| Email Templates | EditorJS-based email templates with layout management | [[ADD-006_TEMPLATE-003_Email Templates\|TEMPLATE-003]] |

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