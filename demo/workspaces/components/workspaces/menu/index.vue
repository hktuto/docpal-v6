<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'
// Types from useWorkspaceMenuContext (auto-imported)
import type { MenuState, MenuContext } from '../../../composables/useWorkspaceMenuState'
import { WorkspaceMenuContextKey } from '../../../composables/useWorkspaceMenuState'



interface Props {
  workspaceId: string
  initialMenu: MenuItem[]
  isAdmin: boolean
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: '',
  initialMenu: [] as any,
  isAdmin: true,
})



const {state,  addItem, saveMenuToDb, getMenuFromDb} = useWorkspaceMenu()


// Helper: Deep compare menu items using JSON stringification
function areMenuItemsEqual(a: MenuItem[], b: MenuItem[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// Debounced save to avoid too many API calls during drag
const saveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const isSaving = ref(false)
const pendingSave = ref(false)

// Track what we last saved to avoid infinite loop with Electric sync
const lastSavedHash = ref<string | null>(null)

function getMenuHash(menu: MenuItem[]): string {
  return JSON.stringify(menu)
}

const debouncedSave = useDebounceFn(async (menu: MenuItem[]) => {
  await saveMenuToDb()
}, 1000)

// Watch for drag changes and save
watch(() => state.value.items, (newMenu) => {
  console.log('newMenu', newMenu)
  // Only auto-save if we're not receiving external updates
  if (!state.value.isDragging) return
  
  console.log('[Menu] Items changed during drag, will save...')
}, { deep: true })


// Helper: Remove item by id recursively
function removeItemById(items: MenuItem[], id: string): MenuItem[] {
  return items.filter(item => {
    if (item.id === id) return false
    if (item.children) {
      item.children = removeItemById(item.children, id)
    }
    return true
  })
}

// Helper: Update order numbers
function updateOrderNumbers(items: MenuItem[]): MenuItem[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
    children: item.children ? updateOrderNumbers(item.children) : undefined,
  }))
}

// API call to update menu
async function saveMenuToServer(menu: MenuItem[]) {
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}`, {
      method: 'PUT',
      body: { menu },
    })
  } catch (error) {
    console.error('Failed to update menu:', error)
    ElMessage.error('Failed to update menu')
    throw error
  }
}



// Helper: Get all table IDs recursively
function getAllTableIds(items: MenuItem[]): string[] {
  const tableIds: string[] = []
  for (const item of items) {
    if (item.type === 'table') {
      tableIds.push(item.id)
    }
    if (item.children) {
      tableIds.push(...getAllTableIds(item.children))
    }
  }
  return tableIds
}

// Handle menu changes from draggable list (v-model update)
async function handleMenuChange(newItems: MenuItem[]) {
  console.log('[Menu] Menu changed from drag:', newItems.length, 'items')
  
  // Update order numbers
  const orderedMenu = updateOrderNumbers(newItems)
  state.value.items = orderedMenu
  
  // Debounced save to server
  debouncedSave(orderedMenu)
}

// Add item popover

const addItemTarget = ref<HTMLElement | null>(null)

// Table creation dialog
const createTablePopover = ref()
const createTableTarget = ref<HTMLElement | null>(null)
const createTableParentId = ref<string | null>(null)
const createTableForm = ref({
  name: '',
  description: '',
  icon: '',
})


async function handleCreateTable() {
  if (!createTableForm.value.name.trim()) {
    ElMessage.error('Table name is required')
    return
  }
  // TODO: create table
  console.log('handleCreateTable', createTableForm.value)
}

onMounted(async () => {
  await getMenuFromDb()
})
</script>

<template>
  <div class="workspace-menu">


    <!-- Menu Content -->
    <div class="menu-content">
      <!-- Empty State -->
      <div v-if="state.items.length === 0" class="empty-state">
        <Icon name="material-symbols:folder-open-outline" size="48" />
        <p class="empty-title">No items yet</p>
        <p class="empty-description">
          {{ isAdmin ? 'Click + to add your first table' : 'No items to display' }}
        </p>
      </div>

      <!-- Draggable Menu Items -->
      <WorkspacesMenuDraggableList
        v-else
        v-model="state.items"
        :level="0"
        :parent-id="null"
        :is-admin="isAdmin"
        @update:model-value="handleMenuChange"
      />
    </div>

    <slot/>
    <!-- Create Table Dialog -->
    <UiPopoverDialog
      ref="createTablePopover"
      placement="right-start"
      :width="400"
      title="Create New Table"
    >
      <el-form label-position="top" class="create-table-form">
        <el-form-item label="Table Name" required>
          <el-input
            v-model="createTableForm.name"
            placeholder="e.g. Projects, Customers, Tasks"
            maxlength="100"
            @keyup.enter="handleCreateTable"
          />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="createTableForm.description"
            type="textarea"
            :rows="3"
            placeholder="Optional description for this table"
            maxlength="500"
          />
        </el-form-item>

        <el-form-item label="Icon">
          <CommonIconPickerInput v-model="createTableForm.icon" />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="createTablePopover?.close()">Cancel</el-button>
          <el-button type="primary" @click="handleCreateTable">
            Create Table
          </el-button>
        </div>
      </el-form>
    </UiPopoverDialog>
  </div>
</template>

<style scoped lang="scss">
.workspace-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-xs);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl) var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-secondary);

  .empty-title {
    margin: var(--app-space-m) 0 var(--app-space-xs);
    font-size: var(--app-font-size-m);
    font-weight: 500;
  }

  .empty-description {
    margin: 0;
    font-size: var(--app-font-size-s);
  }
}

.add-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.add-menu-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  span {
    font-size: var(--app-font-size-s);
  }
}

.create-table-form {
  padding: var(--app-space-m);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-m);
}
</style>
