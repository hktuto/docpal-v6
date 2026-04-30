<template>
  <div class="workspace-table-views">
    <div class="workspace-table-views__tabs" v-if="!isMirror">
      <draggable v-model="localViews" item-key="id" tag="div" class="workspace-table-views__tab-list" :animation="150" handle=".handler" @end="handleDragEnd">
        <template #item="{ element: view }">
          <div
            class="workspace-table-views__tab"
            :class="{ 'workspace-table-views__tab--active': view.id === activeViewId }"
            @click="handleSelectView(view.id)"
          >
            <div class="handler" style="cursor: grab">
              <Icon name="meteor-icons:grip-dots-vertical" />
            </div>
            <div class="workspace-table-views__tab-label">
              {{ view.name }}
            </div>
            <el-button v-if="canManageTable" text size="small" :icon="MoreFilled" class="workspace-table-views__tab-more-btn" @click.stop="handleMoreView(view.id, $event)" />
          </div>
        </template>
      </draggable>
      <el-dropdown v-if="canManageTable" trigger="click" @command="handleAddView">
        <button class="workspace-table-views__add-btn el-icon--right" type="button">
          <el-icon :size="16">
            <Plus />
          </el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="{ name: 'Table', type: 'table' }"> Table </el-dropdown-item>
            <el-dropdown-item :command="{ name: 'Kanban', type: 'kanban' }"> Kanban </el-dropdown-item>
            <el-dropdown-item :command="{ name: 'Card', type: 'card' }"> Card </el-dropdown-item>
            <el-dropdown-item :command="{ name: 'Calendar', type: 'calendar' }"> Calendar </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="workspace-table-views__content">
      <DatabaseTableView v-if="isReady" :is-mirror="isMirror" :data-table-id="tableId" />
      <template v-else>
        <el-skeleton :rows="10" animated />
      </template>
    </div>
    <DatabaseDetailTableViewsActions ref="actionsRef" />
  </div>
</template>

<script lang="ts" setup>
import { useTableViews } from '../../../../composables/table/useTableViews'
import type { ViewConfig, ViewType } from '../../../../utils/databaseType'
import { useRelationConfig } from '../../../../composables/table/useRelationConfig'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const { databaseMenuRouteParams, database, checkMenuItemPermission } = useSingleDatabaseContext()
const { setRelationConfig } = useRelationConfig()
const canManageTable = computed(() => databaseMenuRouteParams.value.detailId && checkMenuItemPermission(databaseMenuRouteParams.value.detailId, 'Manage'))

const tableId = computed(() => databaseMenuRouteParams.value.tableId ?? databaseMenuRouteParams.value.item_id)
const reference_entity_id = computed(() => database.value.id)
const isReady = ref(false)
const isMirror = computed(() => databaseMenuRouteParams.value.detailType === 'view')
const { getViews, currentView, tableViews, createView, setCurrentView, reorderViews, tableFields } = useTableViews({
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

async function handleAddView(command: { name: string; type: ViewType }) {
  // const baseName = command === 'card' ? '卡片视图' : '表格视图'
  const created = await createView({
    name: `${command.name}`,
    type: command.type
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

watch(
  databaseMenuRouteParams,
  async (newVal) => {
    console.log('databaseMenuRouteParams', newVal)
    if (newVal.item_id) {
      isReady.value = false
      currentView.value = null;
      await getViews(newVal.viewId)
      setRelationConfig(tableFields.value)
      setTimeout(() => {
        isReady.value = true
      }, 1000)
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="scss">
.workspace-table-views {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--app-grey-950);
  padding-top: var(--app-space-xs);
  /* width */

  &__tabs {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: 0;
    align-items: center;
    ::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #888;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  }

  &__tab-list {
    display: flex;
    align-items: flex-end;
    overflow: auto;
    /* overflow-y: hidden; */
  }

  &__tab {
    max-width: 220px;
    display: inline-flex;
    align-items: center;
    gap: var(--app-space-xxs);
    padding: 6px 10px;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
    border-bottom: none;
    background-color: var(--app-grey-950);
    border: 1px solid transparent;
    border-bottom: 1px solid var(--app-grey-900);

    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;

    &:hover:not(.workspace-table-views__tab--active) {
      background-color: var(--el-fill-color-light);
      color: var(--app-text-color);
    }

    &--active {
      color: var(--app-text-color);
      background-color: var(--app-paper);
      border-bottom-color: var(--app-paper);
      font-weight: 700;
      border-radius: var(--app-border-radius-m) var(--app-border-radius-m) 0 0;
      border-color: var(--app-grey-900);
      border-bottom: 2px solid var(--app-accent-color);
    }
  }
  .workspace-table-views__tab-label {
    font-size: var(--app-font-size-m);
    cursor: move;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
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
