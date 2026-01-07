<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'

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

const { menuState: state, addItem, saveMenuToDb, getMenuFromDb } = useSingleWorkspaceContext()



const debouncedSave = useDebounceFn(async (menu: MenuItem[]) => {
  await saveMenuToDb()
}, 1000)
// Helper: Update order numbers
function updateOrderNumbers(items: MenuItem[]): MenuItem[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
    children: item.children ? updateOrderNumbers(item.children) : undefined,
  }))
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
