# DocPal V5 Package Creator CLI

A CLI tool to quickly scaffold new packages, pages, or demos for the DocPal V5 project.

## Installation

From the project root directory:

```bash
pnpm install
```

## Usage

### Option 1: Run directly with Node

```bash
cd dev-tools/create-package
node index.js
```

### Option 2: Run via pnpm

```bash
pnpm --filter create-package start
```

### Option 3: Link globally (optional)

```bash
cd dev-tools/create-package
npm link
create-package
```

## What it does

The CLI will prompt you for:

1. **Package name** - The name of your new package (in kebab-case)
2. **Package type** - Choose from:
   - **Pages** - A page module (goes to `/pages/`)
   - **Package** - A reusable package (goes to `/packages/`)
   - **Demo** - A demo/playground (goes to `/demo/`)
3. **Side** (for Pages and Demo) - Choose from:
   - **Client** - Client-facing pages (prefix: `client-` for pages, no prefix for demos)
   - **Admin** - Admin panel pages (prefix: `admin-` for pages, no prefix for demos)
   - **Public** - Public pages (prefix: `public-`, only for pages)

## What gets created

The CLI will:

1. ✅ Copy the `example-package` template to the target directory
2. ✅ Rename the package with the appropriate prefix
3. ✅ Update `package.json` with the new name
4. ✅ Add the new package to `apps/client/nuxt.config.ts` extends
5. ✅ (Pages & Demo) Create an `app.config.ts` with menu configuration
6. ✅ (Pages & Demo) Create a placeholder `page.vue` in `components/global/{name}/`
7. ✅ (Pages & Demo) Add the page to the appropriate menu in `apps/client/app.config.ts`

## Example

Creating a new admin page called "reports":

```
🚀 DocPal V5 Package Creator

? Enter the package name (kebab-case): reports
? Select the package type: 📄 Pages - A page module
? Select which side this page belongs to: 🔧 Admin - Admin panel pages

📁 Creating pages at: /path/to/ui_v4/pages/admin-reports

✅ Package files copied and configured
✅ Created app.config.ts
✅ Updated apps/client/nuxt.config.ts
✅ Updated apps/client/app.config.ts menu

🎉 Package created successfully!

⚠️  Remember to install dependencies:

   cd /path/to/ui_v4
   pnpm install
```

## After Creation

1. Navigate to your new package directory
2. Edit the placeholder `page.vue` in `components/global/{name}/`
3. Update `app.config.ts` with your menu configuration (icon, label, etc.)
4. Add i18n translations to the locale files if needed
5. Run `pnpm install` from the project root

## File Structure (Pages & Demo)

```
{package-folder}/
├── components/
│   └── global/
│       └── {component-name}/
│           └── page.vue      ← Placeholder page component
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── app.config.ts             ← Menu configuration
```

