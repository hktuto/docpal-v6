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
| Document Templates | Tiptap-based document editing with variable support | [[FEAT-102.1 - Document Templates|FEAT-102.1]] |
| Document Editor | Document editor libraries with pagination extension | [[FEAT-102.2 - Document Editor|FEAT-102.2]] |
| Email Templates | EditorJS-based email templates with layout management | [[FEAT-102.3 - Email Templates|FEAT-102.3]] |

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