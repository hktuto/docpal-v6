<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'
import { ElMessageBox } from 'element-plus'

const item = ref<MenuItem | null>(null)
const isAdmin = ref(false)
const open = (data: {item: MenuItem, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) => {
  if(!data.isAdmin) return;
  item.value = data.item
  isAdmin.value = data.isAdmin
  popoverRef.value?.open(target, highlight)
}

const menuContext = useSingleWorkspaceContext()
const popoverRef = ref()
const importExcelDialogRef = ref()


function close() {
  popoverRef.value?.close()
  item.value = null
  isAdmin.value = false
}

async function handleEdit() {
  if(!item.value) return
  menuContext.startEdit(item.value?.id)
  close() 
}

async function handleDelete() {
  if(!item.value) return
  // Customize message based on item type
  let message = `Are you sure you want to delete "${item.value.label}"?`
  let confirmText = 'Delete'
  
  if (item.value?.type === 'table') {
    message = `Are you sure you want to delete the table "${item.value.label}"?\n\nThis will permanently delete:\n• The physical database table\n• All columns\n• All data records\n\nThis action cannot be undone.`
    confirmText = 'Delete Table'
  } else if (item.value?.type === 'folder' && item.value?.children && item.value?.children.length > 0) {
    message = `Are you sure you want to delete the folder "${item.value.label}" and all its contents?`
  }
  
  ElMessageBox.confirm(message, 'Delete Item', {
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    type: 'warning',
    dangerouslyUseHTMLString: true,
  }).then(async () => {
    if(!item.value) return
    await menuContext.deleteItem(item.value.id)
    close()
  }).catch(() => {
    // User cancelled
  })
}
async function handleEditSetting(type: MenuItem['type']) {
  if(!item.value) return
  await menuContext.openSetting(item.value.slug, type)
  close()
}
async function handleAddItem(type: MenuItem['type']) {
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

defineExpose({ open, close })
</script>

<template>
  <UiPopoverDialog
    ref="popoverRef"
    placement="bottom-start"
    :width="180"
  >
    <div class="item-actions-menu">
      <template v-if="!item">
        <div class="action-item" @click="handleAddItem('folder')">
          <Icon name="material-symbols:folder-outline" />
          <span>Add Folder</span>
        </div>
        <div class="action-item" @click="handleAddItem('table')">
          <Icon name="material-symbols:table-outline" />
          <span>Add Table</span>
        </div>
        <div class="action-item" @click="handleAddItem('view')">
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
        <template v-if="item.type === 'folder'">
          <div class="action-divider" />
          <div class="action-item" @click="handleAddItem('folder')">
            <Icon name="material-symbols:folder-outline" />
            <span>Add Folder</span>
          </div>
          <div class="action-item" @click="handleAddItem('table')">
            <Icon name="material-symbols:table-outline" />
            <span>Add Table</span>
          </div>
          <div class="action-item" @click="handleAddItem('view')">
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
        <template v-if="item.type === 'table'">
          <div class="action-item" @click="handleEditSetting('table')">
            <Icon name="material-symbols:settings-outline" />
            <span>table settings</span>
          </div>
        </template>
        <!-- Delete -->
        <div class="action-divider" />
        <div class="action-item danger" @click="handleDelete">
          <Icon name="material-symbols:delete-outline" />
          <span>Delete</span>
        </div>
      </template>
      <!-- Edit -->
      

      <!-- Add submenu (only for folders) -->
      
      
    </div>
  </UiPopoverDialog>

  <!-- Import Excel Dialog -->
  <WorkspacesTableImportExcelDialog
    ref="importExcelDialogRef"
    :workspace-id="menuContext.workspace.value?.id || ''"
    :parent-folder-id="item?.type === 'folder' ? item.id : null"
    @success="handleImportSuccess"
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
  padding: var(--app-space-xs) ;
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

