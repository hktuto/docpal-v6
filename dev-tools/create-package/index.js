#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory (ui_v4)
const ROOT_DIR = path.resolve(__dirname, '../..');
const EXAMPLE_PACKAGE_DIR = path.resolve(__dirname, '../example-package');

// Target directories
const TARGETS = {
  pages: path.join(ROOT_DIR, 'pages'),
  package: path.join(ROOT_DIR, 'packages'),
  demo: path.join(ROOT_DIR, 'demo')
};

// Side prefixes for pages
const SIDE_PREFIXES = {
  client: 'client',
  admin: 'admin',
  public: 'public'
};

async function main() {
  console.log(chalk.cyan.bold('\n🚀 DocPal V5 Package Creator\n'));

  // Ask for package name
  const { packageName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'packageName',
      message: 'Enter the package name (kebab-case):',
      validate: (input) => {
        if (!input.trim()) {
          return 'Package name is required';
        }
        if (!/^[a-z][a-z0-9-]*$/.test(input)) {
          return 'Package name must be in kebab-case (lowercase letters, numbers, and hyphens)';
        }
        return true;
      }
    }
  ]);

  // Ask for package type
  const { packageType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageType',
      message: 'Select the package type:',
      choices: [
        { name: '📄 Pages - A page module', value: 'pages' },
        { name: '📦 Package - A reusable package', value: 'package' },
        { name: '🎮 Demo - A demo/playground', value: 'demo' }
      ]
    }
  ]);

  let side = null;
  let finalFolderName = packageName;

  // If pages or demo, ask for side (client, admin, public)
  if (packageType === 'pages') {
    const { pageSide } = await inquirer.prompt([
      {
        type: 'list',
        name: 'pageSide',
        message: 'Select which side this page belongs to:',
        choices: [
          { name: '👤 Client - Client-facing pages', value: 'client' },
          { name: '🔧 Admin - Admin panel pages', value: 'admin' },
          { name: '🌐 Public - Public pages', value: 'public' }
        ]
      }
    ]);
    side = pageSide;
    finalFolderName = `${SIDE_PREFIXES[side]}-${packageName}`;
  } else if (packageType === 'demo') {
    const { demoSide } = await inquirer.prompt([
      {
        type: 'list',
        name: 'demoSide',
        message: 'Select which menu this demo belongs to:',
        choices: [
          { name: '👤 Client Menu - Add to client menu', value: 'client' },
          { name: '🔧 Admin Menu - Add to admin menu', value: 'admin' }
        ]
      }
    ]);
    side = demoSide;
    // No prefix for demo folder name
    finalFolderName = packageName;
  }

  // Determine target directory
  const targetDir = path.join(TARGETS[packageType], finalFolderName);

  // Check if target already exists
  if (await fs.pathExists(targetDir)) {
    console.log(chalk.red(`\n❌ Error: Directory already exists: ${targetDir}`));
    process.exit(1);
  }

  console.log(chalk.yellow(`\n📁 Creating ${packageType} at: ${targetDir}\n`));

  try {
    // Copy example-package to target directory
    await fs.copy(EXAMPLE_PACKAGE_DIR, targetDir);

    // Update package.json
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = finalFolderName;
    packageJson.description = `DocPal V5 ${packageType} module: ${finalFolderName}`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    console.log(chalk.green('✅ Package files copied and configured'));

    // Calculate relative path for nuxt.config.ts
    const relativePathFromApps = `../../${packageType === 'package' ? 'packages' : packageType}/${finalFolderName}`;

    // If pages or demo type, create app.config.ts and page.vue
    if (packageType === 'pages' || packageType === 'demo') {
      await createAppConfig(targetDir, finalFolderName, packageName, packageType);
      console.log(chalk.green('✅ Created app.config.ts'));
      
      await createPageVue(targetDir, finalFolderName, packageName, packageType);
      console.log(chalk.green('✅ Created placeholder page.vue'));
    }

    // Update apps/client/nuxt.config.ts
    await updateNuxtConfig(relativePathFromApps, packageType, finalFolderName);
    console.log(chalk.green('✅ Updated apps/client/nuxt.config.ts'));

    // If pages or demo, update apps/client/app.config.ts menu
    if (packageType === 'pages' || packageType === 'demo') {
      await updateAppConfigMenu(finalFolderName, side);
      console.log(chalk.green('✅ Updated apps/client/app.config.ts menu'));
    }

    // Success message
    console.log(chalk.cyan.bold('\n🎉 Package created successfully!\n'));
    console.log(chalk.white('Package location:'), chalk.yellow(targetDir));
    console.log(chalk.white('Package name:'), chalk.yellow(finalFolderName));

    // Remind user to install packages
    console.log(chalk.magenta.bold('\n⚠️  Remember to install dependencies:\n'));
    console.log(chalk.white(`   cd ${ROOT_DIR}`));
    console.log(chalk.white('   pnpm install\n'));

    // Additional hints
    console.log(chalk.cyan('📝 Next steps:'));
    console.log(chalk.white(`   1. Navigate to ${targetDir}`));
    if (packageType === 'pages' || packageType === 'demo') {
      console.log(chalk.white('   2. Edit the placeholder page.vue in components/global/'));
      console.log(chalk.white('   3. Update app.config.ts with your menu configuration (icon, label)'));
      console.log(chalk.white('   4. Add i18n translations if needed'));
    } else {
      console.log(chalk.white('   2. Add your components in components/global/'));
    }
    console.log('');

  } catch (error) {
    console.log(chalk.red(`\n❌ Error creating package: ${error.message}`));
    // Cleanup on error
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
    }
    process.exit(1);
  }
}

/**
 * Create app.config.ts for pages or demo type
 */
async function createAppConfig(targetDir, folderName, packageName, packageType) {
  // Convert kebab-case to PascalCase for component name
  // This matches the folder structure in components/global/{PascalCase}/page.vue
  const componentName = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const appConfigContent = `// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "${folderName}": {
      id: "${folderName}",
      name: "${folderName}",
      label: "menu.${folderName}",
      icon: "lucide:file",
      hoverIcon: "lucide:file",
      component: "Lazy${componentName}Page",
      feature: "CORE",
      props: {},
    }
  },
})
`;

  await fs.writeFile(path.join(targetDir, 'app.config.ts'), appConfigContent);
}

/**
 * Create placeholder page.vue for pages or demo type
 * Structure: components/global/{ComponentFolder}/page.vue
 * Folder name uses PascalCase to match Nuxt component naming convention
 */
async function createPageVue(targetDir, folderName, packageName, packageType) {
  // Convert kebab-case to PascalCase for component folder name
  // For pages: my-feature → MyFeature
  // For demo: database-management → DatabaseManagement
  const componentFolder = packageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // Convert folder name to title case for display
  const pageTitle = folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const pageVueContent = `<script lang="ts" setup>
// Props passed from menu router
const props = defineProps<{
  id?: string
}>()

// Inject menu router for navigation/props updates
const routerProvider = inject(MenuRouterKey)

// Example: Update props when needed
// function handleIdChange(newId: string) {
//   routerProvider?.updateProps({ id: newId })
// }
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <h1>${pageTitle}</h1>
      <p>This is a placeholder page. Start building your component here!</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
}

.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--app-space-m);
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--app-text-color);
  }
  
  p {
    color: var(--app-text-color-secondary);
  }
}
</style>
`;

  // Create the directory structure: components/global/{componentFolder}/
  const pageDir = path.join(targetDir, 'components', 'global', componentFolder);
  await fs.ensureDir(pageDir);
  
  // Write the page.vue file
  await fs.writeFile(path.join(pageDir, 'page.vue'), pageVueContent);
}

/**
 * Update apps/client/nuxt.config.ts to add the new package to extends
 */
async function updateNuxtConfig(relativePath, packageType, folderName) {
  const nuxtConfigPath = path.join(ROOT_DIR, 'apps/client/nuxt.config.ts');
  let content = await fs.readFile(nuxtConfigPath, 'utf-8');

  if (packageType === 'pages') {
    // Check if it's a public page
    if (folderName.startsWith('public-')) {
      // Add after existing public pages (before dp-contact)
      const searchPattern = /'\.\.\/\.\.\/pages\/public-easy-form',/;
      if (content.match(searchPattern)) {
        content = content.replace(searchPattern, (match) => {
          return `${match}\n        '${relativePath}',`;
        });
      }
    } else if (folderName.startsWith('admin-')) {
      // Add after existing admin pages  
      const searchPattern = /'\.\.\/\.\.\/pages\/admin-database',/;
      if (content.match(searchPattern)) {
        content = content.replace(searchPattern, (match) => {
          return `${match}\n        '${relativePath}',`;
        });
      }
    } else {
      // Client pages - add after client-user-setting
      const searchPattern = /'\.\.\/\.\.\/pages\/client-user-setting',/;
      if (content.match(searchPattern)) {
        content = content.replace(searchPattern, (match) => {
          return `${match}\n        '${relativePath}',`;
        });
      }
    }
  } else if (packageType === 'package') {
    // Add after existing packages (before demo section)
    const searchPattern = /'\.\.\/\.\.\/packages\/dp-contact',/;
    if (content.match(searchPattern)) {
      content = content.replace(searchPattern, (match) => {
        return `${match}\n        '${relativePath}',`;
      });
    }
  } else if (packageType === 'demo') {
    // Demo - add to demo packages section
    // First check if there's an existing demo section
    const demoSectionPattern = /(\/\/ demo packages\n)/;
    if (content.match(demoSectionPattern)) {
      // Add after the demo packages comment
      content = content.replace(demoSectionPattern, (match) => {
        return `${match}        '${relativePath}',\n`;
      });
    } else {
      // No demo section yet, add before the closing bracket of extends
      const extendsEndPattern = /(\s*\],\s*features:)/;
      if (content.match(extendsEndPattern)) {
        content = content.replace(extendsEndPattern, (match, group1) => {
          return `\n        // demo packages\n        '${relativePath}',\n    ${group1}`;
        });
      }
    }
  }

  await fs.writeFile(nuxtConfigPath, content);
}

/**
 * Update apps/client/app.config.ts to add the new page to menu
 */
async function updateAppConfigMenu(folderName, side) {
  const appConfigPath = path.join(ROOT_DIR, 'apps/client/app.config.ts');
  let content = await fs.readFile(appConfigPath, 'utf-8');

  const menuEntry = `{
      name: '${folderName}'
    }`;

  if (side === 'client') {
    // Add to appMenu before the closing bracket
    const appMenuEndPattern = /(contact-book'\s*\}\s*\],)/;
    if (content.match(appMenuEndPattern)) {
      content = content.replace(appMenuEndPattern, (match, group1) => {
        return `contact-book'\n    },\n    ${menuEntry}\n  ],`;
      });
    }
  } else if (side === 'admin') {
    // Add to adminMenu before the closing bracket
    const adminMenuEndPattern = /(admin-calendar-setting'\s*\}\s*\n\s*\/\/ \{)/;
    if (content.match(adminMenuEndPattern)) {
      content = content.replace(adminMenuEndPattern, (match, group1) => {
        return `admin-calendar-setting'\n    },\n    ${menuEntry},\n\n    // {`;
      });
    } else {
      // Alternative pattern
      const altPattern = /(name: 'admin-calendar-setting'\s*\})/;
      if (content.match(altPattern)) {
        content = content.replace(altPattern, (match) => {
          return `${match},\n    ${menuEntry}`;
        });
      }
    }
  } else if (side === 'public') {
    // Public pages typically don't need menu entries, but we can add a comment
    console.log(chalk.yellow('   ℹ️  Public pages typically don\'t need menu entries'));
  }

  await fs.writeFile(appConfigPath, content);
}

// Run the CLI
main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});

