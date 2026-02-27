---
type: feature
module: "[[ADD-002 - E-signature]]"
feature-id: ESIGN-001
---

# ESIGN-001: PDF Signature

## Description
Core library for PDF signature design and application. Provides both frontend designer UI and backend PDF processing capabilities.

## File Locations
- `libraries/pdfSign/src/types/signatureSetting.ts` - Core SignatureSetting interface defining signature metadata (page, x/y coordinates, dimensions, image data, signer info)
- `libraries/pdfSign/src/types/index.ts` - Type exports for the library
- `libraries/pdfSign/src/frontend/PdfSignDesigner.vue` - Main PDF signature designer UI with virtual scrolling, drag-and-drop signature placement, and multi-page support
- `libraries/pdfSign/src/frontend/SignatureOverlay.vue` - Signature overlay component for positioning signatures on PDF pages with drag functionality
- `libraries/pdfSign/src/frontend/index.ts` - Frontend entry point with exports for PDF loading and signature data export
- `libraries/pdfSign/src/backend/index.ts` - Backend entry point for applying signatures to PDF (PDF buffer processing)
- `libraries/pdfSign/src/App.vue` - Application wrapper component
- `libraries/pdfSign/README.md` - Library documentation

## Key Capabilities
- PDF signature design and positioning
- Drag-and-drop signature placement
- Multi-page PDF support
- Virtual scrolling for large documents
- Frontend designer UI
- Backend PDF processing for applying signatures