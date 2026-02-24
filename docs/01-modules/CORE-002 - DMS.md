---
type: core
depend-on: "*(none - this is a foundation)*"
status: stable
required-by: "Most add-ons"
---

# CORE-002: DMS (Document Management System)

## Marketing Description
Complete document lifecycle: upload, browse, preview, convert, share, and storage management.

## Technical Scope
- File upload (drag-drop, bulk)
- Browse & navigation
- Document preview
- Format conversion
- Storage management
- Basic sharing

## Completion Checklist
- [ ] Upload flow stable
- [ ] Preview engine working
- [ ] Conversion pipeline
- [ ] Storage abstraction

## Features and File Paths

### Feature: Document Browse (Folder Tree, File Listing, Breadcrumbs)
- **Description**: Core browsing functionality including folder tree navigation, file listing with multiple view modes, and breadcrumb navigation
- **Files**:
  - `packages/base/components/browse/breadcrumb.vue` - Breadcrumb navigation component for folder path display
  - `packages/base/components/browse/miniTable.vue` - Compact file listing table view
  - `packages/base/components/browse/table/table.vue` - Main file listing table with sorting, filtering, selection
  - `packages/base/components/browse/table/page.vue` - Table pagination and page layout
  - `packages/base/components/browse/table/search.vue` - In-table search functionality
  - `packages/base/components/browse/ItemIcon.vue` - File/folder icon display component
  - `packages/base/components/tree/index.vue` - Folder tree navigation component
  - `packages/base/components/treeTableForm/index.vue` - Combined tree and table form layout
  - `packages/base/components/contextmenu/index.vue` - Right-click context menu for file operations
  - `packages/base/components/contextmenu/item.vue` - Context menu item component
  - `packages/base/components/contextmenu/list.vue` - Context menu list container
  - `packages/base/components/dragSelect/index.vue` - Drag-to-select multiple files functionality
  - `pages/client-browse/components/global/browse/page.vue` - Main browse page layout
  - `pages/client-browse/components/global/browse/detail.vue` - Browse detail panel
  - `pages/client-browse/utils/browseMenuHelper.ts` - Browse menu utilities
  - `pages/client-browse/utils/dropFileHelper.ts` - File drop handling utilities
  - `packages/base/composables/useBrowse.ts` - Browse functionality composable
  - `packages/base/composables/useBrowseDrop.ts` - Drag-drop browse operations
  - `packages/base/composables/useBrowseDragMove.ts` - Drag-move files between folders
  - `packages/base/composables/useBrowseBreadcrumbDrop.ts` - Drop files onto breadcrumbs
  - `packages/base/composables/useDnD.ts` - General drag and drop utilities

### Feature: File Upload (Drag-drop, Bulk Upload)
- **Description**: File upload functionality including drag-drop, bulk uploads, upload progress tracking, and metadata collection
- **Files**:
  - `packages/base/components/browse/Actions/upload.vue` - Main upload action component with drag-drop
  - `packages/base/components/browse/Actions/uploadDoc.vue` - Document upload specific handling
  - `packages/base/components/browse/Actions/uploadRequest.vue` - Upload request management
  - `packages/base/components/browse/Actions/replace/upload.vue` - File replacement upload
  - `packages/base/components/browse/Actions/replace/index.vue` - Replace action entry
  - `packages/base/components/browse/Actions/replace/dialog.vue` - Replace confirmation dialog
  - `packages/base/components/uploadStructure/index.vue` - Upload structure/folder upload
  - `packages/base/components/uploadStructure/button.vue` - Upload button component
  - `packages/base/components/uploadStructure/metaForm.vue` - Metadata form during upload
  - `packages/base/components/uploadStructure/preview.vue` - Upload preview component
  - `packages/base/components/form/upload.vue` - Form-integrated upload component
  - `pages/client-browse/components/global/uploadRequest/page.vue` - Upload request page
  - `pages/client-browse/components/global/uploadRequest/detail.vue` - Upload request detail
  - `pages/client-ai-upload/components/global/AiUpload/index.vue` - AI-assisted upload page
  - `pages/client-ai-upload/components/global/AiUpload/detail.vue` - AI upload detail view
  - `pages/client-ai-upload/components/aiPreview.vue` - AI upload preview
  - `pages/client-ai-upload/components/aiUploadPreviewDialog.vue` - AI upload preview dialog
  - `pages/public-upload/pages/public/upload.vue` - Public upload page
  - `pages/public-upload/components/uploadForm.vue` - Public upload form
  - `pages/public-upload/components/fileInputBlob.vue` - File input handling
  - `pages/client-folder-cabinet/components/folderCabinet/create/uploadFileDialog.vue` - Folder cabinet upload
  - `pages/client-folder-cabinet/components/folderCabinet/create/uploadStatusDialog.vue` - Upload status display
  - `pages/client-folder-cabinet/components/folderCabinet/create/uploadTree.vue` - Upload folder tree
  - `packages/base/composables/uploadAI.ts` - AI upload composable

### Feature: Document Preview (PDF, Office, Images, Text)
- **Description**: Document preview capabilities for various file formats including PDF, Office documents, images, and text files
- **Files**:
  - `packages/base/components/browse/preview.vue` - Main preview component
  - `packages/base/components/browse/info/Preview.vue` - Info panel preview
  - `packages/base/components/browse/Actions/popPreview.vue` - Popup preview dialog
  - `packages/base/components/reader/index.vue` - Document reader main component
  - `packages/base/components/reader/pdf.vue` - PDF document reader
  - `packages/base/components/reader/docx.vue` - Word document reader
  - `packages/base/components/reader/excel.vue` - Excel spreadsheet reader
  - `packages/base/components/reader/ppt.vue` - PowerPoint presentation reader
  - `packages/base/components/reader/csv.vue` - CSV file reader
  - `packages/base/components/reader/text.vue` - Plain text reader
  - `packages/base/components/reader/tiff.vue` - TIFF image reader
  - `packages/base/components/reader/dialog.vue` - Reader dialog wrapper
  - `packages/base/components/reader/imgMouse.vue` - Image mouse interaction
  - `packages/base/components/viewer/pdf.vue` - PDF viewer component
  - `packages/base/components/viewer/picture.vue` - Picture/image viewer
  - `packages/base/components/global/pdfViewer.vue` - Global PDF viewer
  - `packages/base/components/global/ImageViewer.vue` - Global image viewer
  - `packages/base/components/global/TiffViewer.vue` - Global TIFF viewer
  - `packages/base/components/global/VideoPlayer.vue` - Video player component
  - `packages/base/components/global/collaboraViewer.vue` - Collabora Office Online viewer
  - `packages/base/components/global/googleDrive.vue` - Google Drive preview
  - `packages/base/components/global/htmlViewer.vue` - HTML content viewer
  - `packages/base/components/global/otherPlayer.vue` - Other file type player
  - `packages/base/components/global/unSupport.vue` - Unsupported file type display
  - `libraries/pdf-js/` - Complete PDF.js library for PDF rendering
  - `libraries/pdfSign/` - PDF signature functionality

### Feature: Document Actions (Share, Delete, Rename, Move)
- **Description**: Document manipulation actions including sharing, deletion, renaming, moving, copying, and other file operations
- **Files**:
  - `packages/base/components/browse/Actions/share.vue` - Share action component
  - `packages/base/components/browse/Actions/delete.vue` - Delete action
  - `packages/base/components/browse/Actions/deleteSelected.vue` - Bulk delete
  - `packages/base/components/browse/Actions/EmptyDelete.vue` - Empty trash/folder delete
  - `packages/base/components/browse/Actions/rename.vue` - Rename action
  - `packages/base/components/browse/Actions/edit.vue` - Edit action
  - `packages/base/components/browse/Actions/editName.vue` - Edit name component
  - `packages/base/components/browse/Actions/collection.vue` - Add to collection
  - `packages/base/components/browse/Actions/copyPath.vue` - Copy file path
  - `packages/base/components/browse/Actions/paste.vue` - Paste action
  - `packages/base/components/browse/Actions/new.vue` - New document/folder
  - `packages/base/components/browse/Actions/newFolder.vue` - New folder creation
  - `packages/base/components/browse/Actions/newFile/dialog.vue` - New file dialog
  - `packages/base/components/browse/Actions/download.vue` - Download action
  - `packages/base/components/browse/Actions/downloadConversion.vue` - Download with format conversion
  - `packages/base/components/browse/Actions/office.vue` - Office document actions
  - `packages/base/components/browse/Actions/hold.vue` - Document hold/checkout
  - `packages/base/components/browse/Actions/hold/addDialog.vue` - Hold add dialog
  - `packages/base/components/browse/Actions/subscribe.vue` - Subscribe to document
  - `packages/base/components/browse/Actions/changeDocType/index.vue` - Change document type
  - `packages/base/components/browse/Actions/changeDocType/dialog.vue` - Change doc type dialog
  - `packages/base/components/browse/Actions/info.vue` - Document info action
  - `packages/base/components/browse/Actions/button.vue` - Generic action button
  - `packages/base/components/browse/Actions/WatermarkBtn.vue` - Watermark action button
  - `packages/base/components/browse/share/publicButton.vue` - Public share button
  - `packages/base/components/browse/share/tableSet.vue` - Share table settings
  - `pages/client-browse/components/global/browse/share.vue` - Browse share dialog
  - `pages/client-share/components/global/share/page.vue` - Share management page
  - `pages/client-share/components/share/dialog.vue` - Share creation dialog
  - `pages/client-share/components/global/internalShare/mePage.vue` - My shares page
  - `pages/client-share/components/global/internalShare/otherPage.vue` - Shares from others
  - `pages/public-share/pages/public/share.vue` - Public share access page
  - `packages/base/composables/useShare.ts` - Share functionality composable
  - `packages/base/components/tab/pastePathDialog.vue` - Paste path selection dialog

### Feature: Version Control
- **Description**: Document version management including version history, comparison, and restoration
- **Files**:
  - `packages/base/components/browse/info/VersionPopover.vue` - Version history popover
  - `pages/client-browse/components/global/browse/versionComparison.vue` - Version comparison view
  - `pages/client-browse/components/version/header.vue` - Version view header

### Feature: Metadata/Properties
- **Description**: Document metadata management including custom fields, document types, and properties editing
- **Files**:
  - `packages/base/components/browse/info/index.vue` - Document info panel main
  - `packages/base/components/browse/info/DocInfo.vue` - Document information display
  - `packages/base/components/browse/info/Meta/index.vue` - Metadata display/edit
  - `packages/base/components/browse/info/Meta/editField.vue` - Metadata field editor
  - `packages/base/components/browse/info/Meta/documentType.vue` - Document type selector
  - `packages/base/components/browse/info/picture.vue` - Picture metadata
  - `packages/base/components/meta/metadata.ts` - Metadata utilities
  - `packages/base/components/meta/pathForm.vue` - Path-based metadata form
  - `packages/base/components/meta/renderForm.vue` - Metadata form renderer
  - `packages/base/components/meta/renderForm2.vue` - Alternative metadata form renderer
  - `packages/base/composables/metaFormHelper.ts` - Metadata form helper utilities
  - `pages/admin-document-type/` - Document type administration (complete module)
  - `pages/admin-document-type/composables/useDocumentTypeOptioins.ts` - Document type options

### Feature: Comments
- **Description**: Document commenting and annotation system
- **Files**:
  - `packages/base/components/browse/info/Comments/index.vue` - Comments panel in info section
  - `packages/base/components/comment/card.vue` - Comment display card
  - `packages/base/components/comment/inputBox.vue` - Comment input component
  - `packages/base/components/comment/viewBox.vue` - Comment view component
  - `packages/base/components/comment/mention.vue` - @mention functionality in comments

### Feature: Watermark Integration
- **Description**: Document watermarking for security and branding
- **Files**:
  - `packages/base/components/browse/Actions/watermark.vue` - Watermark action
  - `packages/base/components/browse/Actions/WatermarkBtn.vue` - Watermark button
  - `pages/client-browse/components/global/browse/watermark.vue` - Browse watermark dialog
  - `packages/dp-watermark/components/Watermark/Edit.vue` - Watermark editor
  - `packages/dp-watermark/components/Watermark/detail.vue` - Watermark detail view
  - `packages/dp-watermark/components/Watermark/list.vue` - Watermark list
  - `packages/dp-watermark/components/Watermark/create.vue` - Create watermark
  - `packages/dp-watermark/components/Watermark/editImage.vue` - Image watermark editor
  - `packages/dp-watermark/components/Watermark/editText.vue` - Text watermark editor
  - `packages/dp-watermark/components/Watermark/empty.vue` - Empty watermark state
  - `packages/dp-watermark/components/Watermark/anchor.vue` - Watermark anchor/position
  - `packages/dp-watermark/components/Watermark/preset/index.vue` - Preset watermarks
  - `packages/dp-watermark/components/Watermark/ui/properties.vue` - Watermark properties UI
  - `packages/dp-watermark/composables/Watermark.ts` - Watermark composable

### Feature: Search
- **Description**: Document search functionality including full-text search, filters, and saved searches
- **Files**:
  - `packages/dp-search/components/searchGroup/index.vue` - Search group main component
  - `packages/dp-search/components/searchGroup/table.vue` - Search results table
  - `packages/dp-search/components/searchGroup/bar/index.vue` - Search bar component
  - `packages/dp-search/components/searchGroup/bar/aggregation.vue` - Search aggregation display
  - `packages/dp-search/components/searchGroup/bar/recentSearch/index.vue` - Recent searches
  - `packages/dp-search/components/searchGroup/bar/recentSearch/list.vue` - Recent search list
  - `packages/dp-search/components/searchGroup/bar/record/index.vue` - Saved search records
  - `packages/dp-search/components/searchGroup/bar/record/detail.vue` - Saved search detail
  - `packages/dp-search/components/searchGroup/bar/record/addDialog.vue` - Add saved search dialog
  - `packages/dp-search/components/searchGroup/bar/record/saveLog.vue` - Search save log
  - `packages/dp-search/components/searchGroup/barFilter/index.vue` - Search filter bar
  - `packages/dp-search/components/searchGroup/barFilter/form.vue` - Filter form
  - `packages/dp-search/components/searchGroup/barFilter/condition.vue` - Filter condition builder
  - `packages/dp-search/components/searchGroup/barFilter/metaform.vue` - Metadata filter form
  - `packages/dp-search/composables/useSearchOptions.ts` - Search options composable
  - `packages/dp-search/utils/searchFormHelper.ts` - Search form utilities
  - `packages/dp-search/utils/formOptions.ts` - Form option utilities
  - `packages/dp-search/utils/searchProviderHelper.ts` - Search provider utilities
  - `packages/dp-search/typing/search.d.ts` - Search TypeScript definitions
  - `pages/client-search/components/global/search/page.vue` - Client search page
  - `pages/client-search/components/global/smartFolder/page.vue` - Smart folder page
  - `pages/client-search/components/global/smartFolder/detail.vue` - Smart folder detail
  - `pages/client-search/components/smartFolder/BreadCrumb.vue` - Smart folder breadcrumb
  - `pages/admin-document-type/components/global/adminSmartFolder/page.vue` - Admin smart folder
  - `pages/admin-document-type/components/smartFolder/infoDialog.vue` - Smart folder info

### Additional DMS Utilities
- **Description**: Helper utilities, composables, and shared functionality
- **Files**:
  - `packages/base/composables/usePermissionOption.ts` - Permission management
  - `packages/base/composables/useQuickActions.ts` - Quick action utilities
  - `packages/base/composables/useTab.ts` - Tab management for documents
  - `packages/base/components/tab/` - Complete tab system for document views
  - `packages/base/components/path/tabButton.vue` - Path tab button
  - `packages/base/components/browse/pathSelect.vue` - Path selection component
  - `packages/base/components/browse/info/WorkflowSection.vue` - Workflow integration
  - `packages/base/components/browse/info/WorkflowHoldSection.vue` - Workflow hold section
  - `packages/base/components/browse/info/Activities/index.vue` - Document activities
  - `packages/base/components/browse/info/Acl/index.vue` - Access control list
  - `packages/base/components/browse/info/Collection/index.vue` - Collections
  - `packages/base/components/browse/info/Collection/Add.vue` - Add to collection
  - `packages/base/components/browse/info/Convert/index.vue` - Format conversion
  - `packages/base/components/browse/info/Ocr/index.vue` - OCR results
  - `packages/base/components/browse/info/Tag/index.vue` - Document tags
  - `pages/client-browse/components/collection/dialog.vue` - Collection dialog
  - `pages/client-browse/components/global/collection/page.vue` - Collection page
  - `pages/client-browse/components/global/collection/menu.vue` - Collection menu
  - `pages/client-trash/components/global/trash/page.vue` - Trash/recycle bin
