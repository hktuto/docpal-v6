<script setup lang="ts">
import type { TreeItem, CaseTreeItemType } from '../../../composables/workspace/useSingleWorkspace'
import { useSingleWorkspaceContext } from '../../../composables/workspace/useSingleWorkspace'
import { ElMessageBox } from 'element-plus'
import type { ViewType, ViewSettings } from '../../../utils/db/schema/newTableSchema'
const targetRef = ref()
const menuItem = ref<TreeItem | null>(null)
const isAdmin = ref(false)
const emit = defineEmits<{
  (e: 'refresh'): void
}>()
const open = (data: { item: TreeItem; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) => {
  console.log('open', data)
  if (!data.isAdmin) return
  targetRef.value = target
  menuItem.value = data.item
  isAdmin.value = data.isAdmin
  console.log('menuItem', menuItem.value)
  popoverRef.value?.open(target, highlight)
}

const menuContext = useSingleWorkspaceContext()
const popoverRef = ref()
const importExcelDialogRef = ref()
const createViewDialogRef = ref()
const permissionPopoverRef = ref()
function close() {
  popoverRef.value?.close()
  setTimeout(() => {
    menuItem.value = null
    isAdmin.value = false
  }, 100)
}

async function handleEdit() {
  if (!menuItem.value) return
  menuContext.startEdit(menuItem.value?.id)
  close()
}

async function handleDelete() {
  if (!menuItem.value) return
  // Customize message based on item type
  let message = `Are you sure you want to delete "${menuItem.value.name}"?`
  let confirmText = 'Delete'

  if (menuItem.value?.item_type === 'master_table') {
    message = `Are you sure you want to delete the table "${menuItem.value.name}"?\n\nThis will permanently delete:\n• The physical database table\n• All fields\n• All data records\n\nThis action cannot be undone.`
    confirmText = 'Delete Table'
  } else if (menuItem.value?.item_type === 'folder' && menuItem.value?.children && menuItem.value?.children.length > 0) {
    message = `Are you sure you want to delete the folder "${menuItem.value.name}" and all its contents?`
  }

  ElMessageBox.confirm(message, 'Delete Item', {
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    type: 'warning',
    dangerouslyUseHTMLString: true
  })
    .then(async () => {
      if (!menuItem.value) return
      await menuContext.deleteItem(menuItem.value.id)
      close()
    })
    .catch(() => {
      // User cancelled
    })
}
async function handleEditSetting(type: CaseTreeItemType) {
  if (!menuItem.value) return
  await menuContext.openSetting(menuItem.value?.id || '', type)
  close()
}
async function handleAddItem(type: CaseTreeItemType) {
  await menuContext.addItem(menuItem.value?.id || null, type)
  close()
  // if(type ==='folder'){

  //   return
  // }
  //
}

function handleImportFromExcel() {
  close()
  const entityId = menuContext.workspace.value?.id
  const parentFolderId = menuItem.value?.item_type === 'folder' ? menuItem.value.id : null
  importExcelDialogRef.value?.open(entityId, parentFolderId)
}

async function handleImportSuccess(tables: { id: string; name: string }[]) {
  // Could navigate to the first imported table if desired
  console.log('Imported tables:', tables)
  await menuContext.getMenuFromDb()
}

function handleAddView() {
  close()
  createViewDialogRef.value?.open()
}

async function handleViewCreated(data: { name: string; tableId: string; viewType: ViewType; viewSettings: ViewSettings }) {
  // Call addItem with 'view' type but pass additional data
  const newItem = await menuContext.addItem(menuItem.value?.id || null, 'view', {
    name: data.name,
    tableId: data.tableId,
    viewType: data.viewType,
    viewSettings: data.viewSettings
  })

  // Navigate to the new view
  if (newItem) {
    menuContext.navigateToItem(newItem)
  }
}

// Handle permission action
function handlePermission(event: MouseEvent) {
  if (!menuItem.value) return

  // Save item reference before closing
  const currentItem = menuItem.value

  close()
  // Open permission popover
  nextTick(() => {
    // Pass the saved item data directly to ensure it's available
    permissionPopoverRef.value?.open(targetRef.value, currentItem)
  })
}

defineExpose({ open, close })
</script>

<template>
  <UiPopoverDialog ref="popoverRef" placement="bottom-start" :showHighlight="false" :width="200">
    <div class="item-actions-menu">
      <template v-if="!menuItem">
        <div class="action-item" @click="handleAddItem('folder')">
          <Icon name="material-symbols:folder-outline" />
          <span>Add Folder</span>
        </div>
        <div class="action-item" @click="handleAddItem('master_table')">
          <Icon name="material-symbols:table-outline" />
          <span>Add Table</span>
        </div>
        <div class="action-item" @click="handleAddView">
          <Icon name="material-symbols:view-list-outline" />
          <span>Add View</span>
        </div>
        <div class="action-item" @click="handleAddItem('dashboard')">
          <Icon name="material-symbols:dashboard-outline" />
          <span>Add Dashboard</span>
        </div>
        <div class="action-divider" />
        <div class="action-item" @click="handleImportFromExcel">
          <Icon name="material-symbols:upload-file-outline" />
          <span>Import from Excel</span>
        </div>
      </template>
      <template v-else>
        <div class="action-item" @click="handleEdit">
          <Icon name="material-symbols:edit-outline" />
          <span>Rename</span>
        </div>

        <!-- Permission Action -->
        <div class="action-item" @click="handlePermission">
          <Icon name="material-symbols:shield-outline" />
          <span>Permissions</span>
        </div>

        <template v-if="menuItem.item_type === 'folder'">
          <div class="action-divider" />
          <div class="action-item" @click="handleAddItem('folder')">
            <Icon name="material-symbols:folder-outline" />
            <span>Add Folder</span>
          </div>
          <div class="action-item" @click="handleAddItem('master_table')">
            <Icon name="material-symbols:table-outline" />
            <span>Add Table</span>
          </div>
          <div class="action-item" @click="handleAddView">
            <Icon name="material-symbols:view-list-outline" />
            <span>Add View</span>
          </div>
          <div class="action-item" @click="handleAddItem('dashboard')">
            <Icon name="material-symbols:dashboard-outline" />
            <span>Add Dashboard</span>
          </div>
          <div class="action-divider" />
          <div class="action-item" @click="handleImportFromExcel">
            <Icon name="material-symbols:upload-file-outline" />
            <span>Import from Excel</span>
          </div>
        </template>
        <template v-if="menuItem.item_type === 'master_table'">
          <div class="action-item" @click="handleEditSetting('master_table')">
            <Icon name="material-symbols:settings-outline" />
            <span>Table Settings</span>
          </div>
        </template>
        <!-- Delete -->
        <div class="action-divider" />
        <div class="action-item danger" @click="handleDelete">
          <Icon name="material-symbols:delete-outline" />
          <span>Delete</span>
        </div>
      </template>
    </div>
  </UiPopoverDialog>

  <!-- Import Excel Dialog -->
  <WorkspacesTableImportExcelDialog ref="importExcelDialogRef" @success="handleImportSuccess" />

  <!-- Create View Dialog -->
  <WorkspacesDialogsCreateViewDialog ref="createViewDialogRef" @created="handleViewCreated" />

  <!-- Permission Popover -->
  <WorkspacesPermissionPopover
    ref="permissionPopoverRef"
    :item-id="menuItem?.id || ''"
    :item-label="menuItem?.label || ''"
    :item-type="menuItem?.item_type || 'folder'"
  />
</template>

<style scoped lang="scss">
.item-actions-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: var(--app-font-size-s);

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.danger {
    color: var(--el-color-danger);

    &:hover {
      background: var(--el-color-danger-light-9);
    }
  }
}

.action-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--app-border-color);
}
</style>
