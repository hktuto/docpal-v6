<template>
  <div class="workspace-table-views">
    <div class="workspace-table-views__tabs">
      <draggable
        v-model="localViews"
        item-key="id"
        tag="div"
        class="workspace-table-views__tab-list"
        :animation="150"
        handle=".workspace-table-views__tab-label"
        @end="handleDragEnd"
      >
        <template #item="{ element: view }">
          <div
            class="workspace-table-views__tab"
            :class="{ 'workspace-table-views__tab--active': view.id === activeViewId }"
            @click="handleSelectView(view.id)"
          >
            <div class="workspace-table-views__tab-label">
              {{ view.name }}
            </div>
            <el-button text size="small" :icon="MoreFilled" class="workspace-table-views__tab-more-btn" @click.stop="handleMoreView(view.id, $event)" />
          </div>
        </template>
      </draggable>
      <button class="workspace-table-views__add-btn el-icon--right" type="button" @click.stop="handleAddView">
        <el-icon :size="16">
          <Plus />
        </el-icon>
      </button>
    </div>
    <div class="workspace-table-views__content">
      <WorkspacesTableView
        :data-table-id="tableId"
      />
    </div> 

    <WorkspacesDetailTableViewsActions ref="actionsRef" />
  </div>
</template>

<script lang="ts" setup>
import type { ViewConfig } from '../../../utils/db/schema/tableView'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const { workspaceRouteParams, workspace } = useSingleWorkspaceContext()
const tableId = computed(() => workspaceRouteParams.value.item_id)
const reference_entity_id = computed(() => workspace.value.id)

const { getViews, currentView, tableViews, createView, setCurrentView, reorderViews } = useTableViews({
  tableId,
  reference_entity_id
})

const actionsRef = ref()
const localViews = ref<ViewConfig[]>([])

watch(
  tableViews,
  (views) => {
    localViews.value = [...views]
  },
  { immediate: true, deep: true }
)

const activeViewId = computed(() => currentView.value?.id ?? '')

async function handleAddView() {
  const baseName = currentView.value?.name || '新视图'
  const created = await createView({
    name: `${baseName}`
  })
  if (created?.id) {
    setCurrentView(created)
  }
}

function handleSelectView(id: string) {
  if (!id || id === currentView.value?.id) {
    return
  }
  setCurrentView(id)
}

function handleMoreView(viewId: string, event: MouseEvent) {
  const view = tableViews.value.find((v: ViewConfig) => v.id === viewId)
  if (!view) {
    return
  }
  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }
  actionsRef.value?.open(target, view)
}

async function handleDragEnd(event: any) {
  const { oldIndex, newIndex } = event
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
    return
  }
  await reorderViews(oldIndex, newIndex)
}

onMounted(async () => {
  await getViews()
})
</script>

<style scoped lang="scss">
.workspace-table-views {
  margin: 0 var(--app-space-s);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__tabs {
    display: flex;
    align-items: center;
    padding: 0;
    margin: 0;
  }

  &__tab-list {
    display: flex;
    align-items: flex-end;
    overflow-x: auto;
    overflow-y: hidden;
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: var(--app-space-xxs);
    padding: 6px 10px;
    border-radius: var(--app-border-radius-s) var(--app-border-radius-s) 0 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
    border: 1px solid transparent;
    border-bottom: none;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--app-text-color);
    }

    &--active {
      color: var(--app-text-color);
      background-color: var(--el-fill-color-light);
      border-color: var(--app-border-color);
      border-bottom-color: var(--app-paper);
      font-weight: 500;
    }
  }
  .workspace-table-views__tab-label {
    font-size: var(--app-font-size-m);
    cursor: move;
  }
  &__add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--app-border-radius-s);
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    color: var(--app-text-color-secondary);
    flex-shrink: 0;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--app-text-color);
    }
  }
  .workspace-table-views__content {
    flex: 1;
    overflow: hidden;
  }
  .workspace-table-views__tab-more-btn {
    padding: var(--app-space-xxs);
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
    :deep(.el-icon) {
      rotate: 90deg;
    }
  }
}
</style>
