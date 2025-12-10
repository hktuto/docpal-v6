# DocPal v4.0

# 專案設置

### 1. test初始化 Git Submodules

在克隆此存儲庫後，請運行以下命令來初始化和更新所有子模塊：

```bash
git submodule update --init --recursive
```

這個命令會：
- 初始化所有子模塊
- 更新子模塊到正確的提交
- 遞迴初始化嵌套的子模塊

### 2. 安裝依賴

使用 pnpm 安裝所有依賴：

```bash
pnpm install
```

注意：本項目使用 pnpm 作為包管理器，並已配置為自動處理遞迴安裝。


## 🚀 Features

- Document management and organization
- User authentication and authorization (Keycloak integration)
- Multi-language support (i18n)
- Dark/Light mode support
- Advanced search capabilities
- Document sharing and collaboration
- Workflow management
- Administrative controls

## 📁 Project Structure

```
docpal-v4/
├── apps/                    # Application frontends
│   ├── admin/              # Admin dashboard
│   └── client/             # Client web application
├── libraries/              # Shared libraries
│   ├── api/                # Swagger-generated API client
│   ├── eventbus/          # Event handling system
│   └── pdf-js/            # PDF handling utilities
├── packages/              # Core functionality packages
│   ├── base/              # Base components and utilities
│   ├── authApp/           # Authentication module
│   ├── dp-search/         # Search functionality
│   └── publicApp/         # Public-facing components
├── pages/                 # Pages ui for admin and client
├── dev-tools/             # Developer tools
│   └── create-package/    # CLI for scaffolding new packages/pages
```

## 🛠️ Technology Stack

- Vue.js 3
- Nuxt.js 3
- Element Plus UI
- Keycloak for authentication
- TypeScript
- Vitest for testing
- PNPM for package management

## 🚦 Getting Started

### Prerequisites

- Node.js 22+ (Required for Mac)
- PNPM 8.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd docpal-v4
   ```

2. Ensure you're using Node.js 22+:
   
   If using **nvm**:
   ```bash
   nvm use
   ```
   
   If using **nodenv** or **asdf**:
   ```bash
   nodenv install 22  # or: asdf install nodejs 22
   ```
   
   To check your Node version:
   ```bash
   node --version  # Should show v22.x.x
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment variables:
   ```bash
   cp env/.env.example env/.env
   ```

### Development

Before starting the development server, copy the environment files for your server:

```bash
cp env/.env.{serverName}.client env/.env.dev.client
cp env/.env.{serverName}.admin env/.env.dev.admin
```

Replace `{serverName}` with your actual server name (e.g., `local`, `staging`, `prod`).

To start the development server:

```bash
pnpm dev
```

To run tests:

```bash
pnpm test
```

To build for production:

```bash
pnpm build
```

### Creating New Packages/Pages

Use the CLI tool to quickly scaffold new packages, pages, or demos:

```bash
pnpm new
```

The CLI will prompt you to select:
- **Package name** - Name in kebab-case (e.g., `my-feature`)
- **Package type**:
  - 📄 **Pages** - A page module (goes to `/pages/`)
  - 📦 **Package** - A reusable package (goes to `/packages/`)
  - 🎮 **Demo** - A demo/playground (goes to `/demo/`)
- **Side** (for Pages/Demo) - Client, Admin, or Public

The tool automatically:
- Copies the `example-package` template
- Updates `package.json` with the new name
- Adds the package to `apps/client/nuxt.config.ts`
- Creates `app.config.ts` with menu configuration (for Pages/Demo)
- Creates a placeholder `page.vue` component (for Pages/Demo)
- Updates the menu in `apps/client/app.config.ts` (for Pages/Demo)

For more details, see `dev-tools/create-package/README.md`.

## 📚 Documentation

Additional documentation can be found in the following locations:
- API Documentation: `libraries/api/README.md`
- Component Library: `packages/base/README.md`
- Authentication: `packages/authApp/README.md`

- Apps
	- Web <- 網頁客氣端
	- Packages <- 所有功能
- Library 
	- [[libraries/api/README|API]] <- 從 Swagger 生成來的 Axios 客戶
