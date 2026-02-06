# DocPal V5 - AI Agent Guide

## Project Overview

DocPal V5 is a modern, modular enterprise document management platform built with Vue 3 and Nuxt 3. It features a monorepo architecture supporting multiple applications (client web app, desktop app, admin panel) with a rich set of reusable packages for document creation, collaboration, sharing, and workflow automation.

**Key Features:**
- Document management and organization
- User authentication and authorization (Keycloak integration)
- Multi-language support (i18n) - English, Traditional Chinese, Simplified Chinese
- Dark/Light mode support
- Advanced search capabilities
- Document sharing and collaboration
- Workflow management with BPMN/CMMN
- Administrative controls

---

## Technology Stack

- **Framework:** Vue.js 3.5.6 + Nuxt.js 3.17.7/3.19.3
- **UI Library:** Element Plus 2.11.5
- **Authentication:** Keycloak JS 26.2.0
- **Language:** TypeScript 5.x
- **Styling:** SCSS (Sass 1.85.0+)
- **Package Manager:** PNPM 10.19.0 (requires >=8.0.0)
- **Node.js:** 22+ (strict requirement)
- **Testing:** Vitest 3.1.4 + @vue/test-utils + Playwright
- **Table Component:** vxe-table ~4.16.21
- **API Client:** Axios with Swagger-generated TypeScript types
- **Build Tool:** Vite 6.4.1

---

## Project Structure

```
docpal-v6/
├── apps/                          # Deployable applications
│   ├── client/                    # Main client web application (Nuxt 3)
│   └── desktop/                   # Desktop application (Electron)
│
├── packages/                      # Shared functionality packages
│   ├── base/                      # Base components, composables, plugins, styles
│   ├── authApp/                   # Authentication module (Keycloak integration)
│   ├── rbac/                      # Role-based access control
│   ├── icon/                      # Icon components
│   ├── dp-search/                 # Search functionality
│   ├── dp-dashboard/              # Dashboard components
│   ├── dp-easy-form/              # Form builder components
│   ├── dp-editorjs/               # EditorJS integration
│   ├── dp-watermark/              # Watermark functionality
│   ├── dp-workflow/               # Workflow management
│   ├── dp-masterTable/            # Master table components
│   ├── dp-notification/           # Notification system
│   ├── dp-related-folder/         # Related folder functionality
│   ├── dp-cmmn-x6/                # CMMN diagram editor (AntV X6)
│   ├── dp-contact/                # Contact book
│   ├── dp-mdTable/                # Markdown table
│   ├── dp-datatype/               # Data type utilities
│   ├── dp-form/                   # Form utilities
│   ├── dp-language/               # Language utilities
│   ├── sql-store/                 # SQL storage utilities
│   ├── user-setting/              # User settings
│   ├── publicApp/                 # Public-facing components
│   ├── calendar/                  # Calendar components
│   ├── bpmn/                      # BPMN workflow components
│   ├── doc-template/              # Document templates
│   └── workflow/                  # Workflow utilities
│
├── pages/                         # Page modules (client, admin, public)
│   ├── client-*/                  # Client-side pages
│   ├── admin-*/                   # Admin panel pages
│   ├── public-*/                  # Public-facing pages
│   └── super-workflow-form/       # Super admin workflow form
│
├── libraries/                     # External libraries and utilities
│   ├── api/                       # Swagger-generated API client
│   ├── deployment/                # Deployment scripts and i18n resources
│   ├── pdf-js/                    # PDF.js integration
│   ├── pdfSign/                   # PDF signing functionality
│   ├── eventbus/                  # Event handling system
│   ├── V-form/                    # Form designer
│   ├── docpal-document-editor/    # Document editor
│   ├── tiptap-extension-pagination/ # Tiptap pagination extension
│   └── report/                    # Reporting utilities
│
├── dev-tools/                     # Developer tools
│   ├── create-package/            # CLI for scaffolding new packages/pages
│   └── example-package/           # Template for new packages
│
├── demo/                          # Demo/playground modules
├── env/                           # Environment configuration files
└── tasks/                         # Task documentation
```

---

## Workspace Configuration

This is a PNPM monorepo configured via `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - pages/*
  - libraries/*
  - dev-tools/*
  - demo/*
```

All packages use `workspace:*` protocol for internal dependencies.

---

## Build and Development Commands

### Prerequisites

```bash
# Ensure Node.js 22+ is installed
node --version  # Should show v22.x.x

# Initialize git submodules (first time only)
git submodule update --init --recursive
```

### Installation

```bash
pnpm install
```

### Development

```bash
# Start client dev server (uses env/.env.dev.client)
pnpm dev

# Or explicitly:
pnpm -F client dev
```

Before starting development, copy environment files:
```bash
cp env/.env.{serverName}.client env/.env.dev.client
cp env/.env.{serverName}.admin env/.env.dev.admin
```

### Build

```bash
# Build client for production
pnpm -F client build --dotenv ../../env/.env.{environment}.client

# Generate static site
pnpm -F client generate --dotenv ../../env/.env.{environment}.client

# Build all packages
pnpm build
```

Build outputs:
- Client: `/apps/client/.output/public`

### Testing

```bash
# Run all tests
pnpm testw

# Run tests with reports
pnpm test:reports

# Jenkins test reports
pnpm jenkins:reports
```

### API Generation

```bash
# Generate API client from Swagger
pnpm -F api generate

# Configure endpoints in /libraries/api/src/setting.json
```

### Creating New Packages/Pages

```bash
# Interactive CLI for scaffolding
pnpm new
```

This will prompt for:
- Package name (kebab-case)
- Package type (Pages, Package, Demo)
- Side (Client, Admin, Public) - for Pages/Demo

---

## Code Style Guidelines

### File Organization (Vue SFC)
Always keep this order in `.vue` files:
1. `<script setup lang="ts">`
2. `<template>`
3. `<style>`

### Naming Conventions
- **Variables/Functions:** camelCase (`handleClick`, `userData`)
- **Components/Classes:** PascalCase (`UserProfile`, `DataTable`)
- **Files:** kebab-case (`user-profile.vue`, `data-utils.ts`)
- **CSS Variables:** `--app-variable-name` (defined in `packages/base/assets/styles/main.scss`)

### Code Style (Prettier Config)
```json
{
  "trailingComma": "none",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "endOfLine": "auto",
  "printWidth": 160,
  "bracketSpacing": true,
  "quoteProps": "as-needed"
}
```

### ESLint Rules
- Parser: babel-eslint
- Extends: eslint:recommended, plugin:vue/recommended, plugin:prettier/recommended

### Key Coding Rules
1. Use `<script setup lang="ts">` for all Vue components
2. Use SCSS for styling
3. Use early returns for readability
4. Prefer function declarations over arrow functions for top-level functions
5. Event handlers must be prefixed with `handle` (e.g., `handleClick`)
6. Always implement accessibility features (`tabindex="0"`, `aria-label`, `@keydown`)
7. Always use `v-tooltip` for tooltips
8. Use `useVxeTable` composable for all table implementations (DO NOT use Element Plus tables directly)
9. Use Element Plus form components with label position set to `top`
10. Use `ResponsiveFilter` component for all table filtering

### Accessibility Requirements
```vue
<a
  tabindex="0"
  aria-label="Open document"
  @click="handleClick"
  @keydown.enter="handleClick"
>Open</a>
```

---

## Testing Strategy

### Test Framework
- **Unit Tests:** Vitest 3.1.4 + @vue/test-utils
- **E2E Tests:** Playwright
- **DOM:** happy-dom for testing environment

### Test File Location
Place test files in the same directory as the component:
```
ComponentName.vue
ComponentName.spec.ts
```

### Test Naming Convention
- Unit tests: `*.spec.ts` or `*.nuxt.spec.ts`

### Running Tests
```bash
# Run all tests
pnpm testw

# Run with UI
vitest --ui

# Generate coverage reports
pnpm test:reports
```

---

## Nuxt Configuration Architecture

### Module Extension Hierarchy
```
apps/client (main app)
  └─ extends pages/* and packages/*

pages/* (page modules)
  └─ extends packages/base and other packages

packages/* (feature packages)
  └─ extends packages/base (core)
```

### Key Nuxt Modules (in packages/base)
- `@nuxtjs/i18n` - Internationalization
- `@nuxtjs/color-mode` - Dark/Light mode
- `@vueuse/nuxt` - VueUse utilities

### Proxy Configuration (Development)
Configured in `packages/base/nuxt.config.ts`:
- `/api` → CLIENT_PROXY
- `/adminApi/api` → ADMIN_PROXY
- `/public-api/report/v1/api` → DASHBOARD_PROXY
- `/dashboard` → DASHBOARD_PROXY
- `/client` → CLIENT_PROXY
- `/open-api/template` → OPEN_PROXY

---

## API Architecture

### API Client Structure (`libraries/api`)
Generated from Swagger/OpenAPI specs:
- `Client` - Client API endpoints
- `Admin` - Admin API endpoints
- `Public` - Public API endpoints
- `Template` - Template API endpoints

### Usage
```typescript
import { clientApi, adminApi, publicApi, templateApi } from 'api'

// Client API
const response = await clientApi.documents.getDocuments()

// Admin API
const users = await adminApi.users.getUsers()
```

### Base URLs
- Client: `/api`
- Admin: `/adminApi/api`
- Public: `/public-api/report/v1/api`
- Template: `/open-api/template`

---

## i18n (Internationalization)

### Supported Locales
- `en-US` - English (default)
- `zh-CN` - Simplified Chinese
- `zh-HK` - Traditional Chinese

### Locale Files Location
```
libraries/deployment/src/
├── en-US.json
├── zh-HK.json
└── zh-CN.json
```

### Configuration
Configured in `packages/base/nuxt.config.ts` with strategy `no_prefix`.

---

## Menu Configuration

### App Menu (`apps/client/app.config.ts`)
Two main menu structures:
- `appMenu` - Client-side navigation
- `adminMenu` - Admin panel navigation

### Menu Item Structure
```typescript
{
  name: 'unique-route-name',
  label: 'i18n.key',           // Optional, uses i18n
  icon: 'icon-name',           // Optional
  hoverIcon: 'icon-name',      // Optional
  children: [...]              // Optional, for nested menus
}
```

---

## Environment Configuration

### Environment Files Location
All env files are in `/env/` directory:

**Available environments:**
- `.env.dev.client` / `.env.dev.admin` - Development
- `.env.app2.client` / `.env.app2.admin` - App2 environment
- `.env.app4.client` / `.env.app4.admin` - App4 environment
- `.env.app10.client` / `.env.app10.admin` - App10 environment
- `.env.demo.client` / `.env.demo.admin` - Demo environment
- `.env.robot.client` / `.env.robot.admin` - Robot testing
- `.env.sit-v3.client` - SIT environment
- `.env.wcl.client` - WCL environment

### Required Environment Variables
```bash
CLIENTURL=https://demo.docpal.wclsolution.com
ADMINURL=https://demo.docpal.wclsolution.com/admin
PUBLIC_URL=https://demo.docpal.wclsolution.com/public-api/report/v1
CLIENT_PROXY=https://demo.docpal.wclsolution.com/api
ADMIN_PROXY=https://demo.docpal.wclsolution.com/admin/api
PROXY=https://demo.docpal.wclsolution.com/api
DASHBOARD_PROXY=https://demo.docpal.wclsolution.com/public-api/report/v1/api
NOTIFICATION_PROXY=https://demo.docpal.wclsolution.com/notification/api
OPEN_PROXY=https://demo.docpal.wclsolution.com/open-api/template
pdfReaderUrl=https://demo.docpal.wclsolution.com/resources/pdfjs/web/viewer.html
API_ENDPOINT=https://demo.docpal.wclsolution.com/api
```

---

## Deployment

### Jenkins Pipeline
See `jenkins.deploy.md` for the complete Jenkins pipeline configuration.

**Key deployment steps:**
1. Clean workspace
2. Read config from YAML
3. Checkout code with submodules
4. Build Docker image (based on `electronuserland/builder:22-wine`)
5. Generate API and i18n files
6. Install dependencies with pnpm
7. Generate static site
8. Deploy to remote server via SSH

### Docker Build
```bash
docker.build("docpal-ui-image:latest", "--pull -f Dockerfile-build .")
```

### Build Output
Static files are generated to `apps/client/.output/public` and deployed to the server's static path.

---

## Task Management

### Task File Location
Place task files in `/tasks/` folder.

### Naming Convention
```
{gitUserName}-{YYYYMMDD}-{task-name}.md
```

Example: `SeanTsang-20250117-konva-table-poc.md`

### Task Format
```markdown
[ ] 1 Main Task
  - [ ] 1.1 Subtask
  - [ ] 1.2 Subtask
[ ] 2 Another Task
```

---

## BRD (Business Requirement Document)

### BRD File Location
Place BRD files in `/brd/` folder (create if not exists).

### Naming Convention
```
{gitUserName}-{YYYYMMDD}-{task-name}.md
```

Example: `SeanTsang-20250602-generate-random-number.md`

---

## Security Considerations

### Authentication
- Keycloak integration for SSO
- Token-based authentication with refresh token support
- Role-based access control (RBAC)

### API Security
- All API calls go through generated client with proper typing
- Global error handling in API client
- Request timeout: 50000ms

### Build Security
- Console statements are stripped in production build:
  - `console.error`, `console.warn`, `console.debug`, `console.trace` are removed
  - `debugger` statements are dropped

---

## Common Issues and Solutions

### Node.js Version
If you see "Error: Node.js 22+ is required", switch to Node 22:
```bash
nvm use 22
# or
nodenv install 22
```

### Submodule Issues
If submodules are not initialized:
```bash
git submodule update --init --recursive
```

### Lockfile Issues
If pnpm-lock.yaml is out of sync:
```bash
pnpm install --no-frozen-lockfile
```

---

## Useful Resources

### Internal Documentation
- `packages/base/README.md` - Base package documentation
- `libraries/api/README.md` - API generation documentation
- `dev-tools/create-package/README.md` - Package creation CLI
- `installation_build.md` - Build and installation guide
- `jenkins.deploy.md` - Jenkins deployment pipeline

### External Libraries
- [vxe-table Documentation](https://x-extends.github.io/vxe-table/)
- [Element Plus Documentation](https://element-plus.org/)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
