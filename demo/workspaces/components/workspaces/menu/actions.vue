<script setup lang="ts">
import type { TreeItem, CaseTreeItemType } from '../../../composables/workspace/useSingleWorkspace'
import { useSingleWorkspaceContext } from '../../../composables/workspace/useSingleWorkspace'
import { ElMessageBox } from 'element-plus'
import type { ViewType, ViewSettings } from '../../../utils/db/schema/newTableSchema'
const targetRef = ref()
const item = ref<TreeItem | null>(null)
const isAdmin = ref(false)
const open = (data: { item: TreeItem; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) => {
  if (!data.isAdmin) return
  targetRef.value = target
  item.value = data.item
  isAdmin.value = data.isAdmin
  popoverRef.value?.open(target, highlight)
}

const menuContext = useSingleWorkspaceContext()
const popoverRef = ref()
const importExcelDialogRef = ref()
const createViewDialogRef = ref()
const permissionPopoverRef = ref()

function close() {
  popoverRef.value?.close()
  item.value = null
  isAdmin.value = false
}

async function handleEdit() {
  if (!item.value) return
  menuContext.startEdit(item.value?.id)
  close()
}

async function handleDelete() {
  if (!item.value) return
  // Customize message based on item type
  let message = `Are you sure you want to delete "${item.value.name}"?`
  let confirmText = 'Delete'

  if (item.value?.item_type === 'master_table') {
    message = `Are you sure you want to delete the table "${item.value.name}"?\n\nThis will permanently delete:\n• The physical database table\n• All fields\n• All data records\n\nThis action cannot be undone.`
    confirmText = 'Delete Table'
  } else if (item.value?.item_type === 'folder' && item.value?.children && item.value?.children.length > 0) {
    message = `Are you sure you want to delete the folder "${item.value.name}" and all its contents?`
  }

  ElMessageBox.confirm(message, 'Delete Item', {
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    type: 'warning',
    dangerouslyUseHTMLString: true
  })
    .then(async () => {
      if (!item.value) return
      await menuContext.deleteItem(item.value.id)
      close()
    })
    .catch(() => {
      // User cancelled
    })
}
async function handleEditSetting(type: CaseTreeItemType) {
  if (!item.value) return
  await menuContext.openSetting(item.value?.id || '', type)
  close()
}
async function handleAddItem(type: CaseTreeItemType) {
  await menuContext.addItem(item.value?.id || null, type)
  close()
  // if(type ==='folder'){

  //   return
  // }
  //
}

function handleImportFromExcel() {
  close()
  importExcelDialogRef.value?.open()
}

function handleImportSuccess(tables: { id: string; name: string }[]) {
  // Could navigate to the first imported table if desired
  console.log('Imported tables:', tables)
}

function handleAddView() {
  close()
  createViewDialogRef.value?.open()
}

async function handleViewCreated(data: { name: string; tableId: string; viewType: ViewType; viewSettings: ViewSettings }) {
  // Call addItem with 'view' type but pass additional data
  const newItem = await menuContext.addItem(item.value?.id || null, 'view', {
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
  if (!item.value) return

  // Save item reference before closing
  const currentItem = item.value

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
      <template v-if="!item">
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

        <template v-if="item.item_type === 'folder'">
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
        <template v-if="item.item_type === 'master_table'">
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
  <WorkspacesTableImportExcelDialog
    ref="importExcelDialogRef"
    :entity-id="menuContext.workspace.value?.id || ''"
    :parent-folder-id="item?.item_type === 'folder' ? item.id : null"
    @success="handleImportSuccess"
  />

  <!-- Create View Dialog -->
  <WorkspacesDialogsCreateViewDialog ref="createViewDialogRef" @created="handleViewCreated" />

  <!-- Permission Popover -->
  <WorkspacesPermissionPopover ref="permissionPopoverRef" :item-id="item?.id || ''" :item-label="item?.label || ''" :item-type="item?.item_type || 'folder'" />
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
