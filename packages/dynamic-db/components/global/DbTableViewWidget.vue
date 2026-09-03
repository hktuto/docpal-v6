<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div v-loading="isConfigured && !isReady" class="db-table-view-widget">
      <DbWidgetEmptyState v-if="!isConfigured" description="Select a table and view in widget settings" />
      <DbWidgetErrorState v-else-if="loadError" description="Failed to load view" show-retry @retry="loadView" />
      <DbWidgetEmptyState v-else-if="isReady && !currentView" description="View not found — please reconfigure the widget" />
      <DbTableViewWidgetGrid v-else-if="isReady" ref="gridRef" :table-id="props.setting.tableId" />
    </div>
  </DashboardCard>
  <DbTableViewWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { useTableViews } from '../../composables/table/useTableViews'
import { useRelationConfig } from '../../composables/table/useRelationConfig'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { EventType, useEventBus } from 'eventbus'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const cardRef = ref()
const settingRef = ref()
const gridRef = ref()
const isReady = ref(false)
const loadError = ref(false)

const displayTitle = computed(() => props.setting?.title || 'Table View')
const isConfigured = computed(() => !!props.setting?.tableId && !!props.setting?.viewId)
const tableId = computed(() => props.setting?.tableId || '')

// Provider side of the TableViewsInjectKey context. The consumer is the inner
// DbTableViewWidgetGrid — Vue inject() only reads ancestor provides, so the
// provider/consumer split (mirroring table.vue → view.vue) is required.
const { currentView, tableFields, getViews } = useTableViews({ tableId, reference_entity_id: ref('') })
const { setRelationConfig } = useRelationConfig()

async function loadView() {
  if (!isConfigured.value) return
  isReady.value = false
  loadError.value = false
  try {
    await getViews(props.setting.viewId)
    // Relation columns need the related table's fields to render labels
    setRelationConfig(tableFields.value)
  } catch (error) {
    console.error('DbTableViewWidget: failed to load view', error)
    loadError.value = true
  } finally {
    isReady.value = true
  }
}

// Array-of-getters source: element-wise comparison, so a parent replacing the
// setting object with identical values does not trigger a redundant reload.
watch([() => props.setting?.tableId, () => props.setting?.viewId], () => loadView(), { immediate: true })

useDashboardLiveUpdate(tableId, async () => {
  if (!currentView.value) return
  await getViews(currentView.value.id, { silent: true })
  // Silent getViews only syncs column config — row data needs an explicit
  // refetch (aggregate footer counts stay stale: MdTable exposes no getAgg).
  gridRef.value?.refresh?.()
})

const mdTableRefreshBus = useEventBus<{ table_id?: string }>(EventType.MD_TABLE_NEED_REFRESH)
const stopMdTableRefresh = mdTableRefreshBus.on(async (payload) => {
  if (!payload?.table_id || payload.table_id !== tableId.value) return
  await getViews(currentView.value?.id, { silent: true })
  await setRelationConfig(tableFields.value)
  await nextTick()
  gridRef.value?.refresh?.()
})
onBeforeUnmount(() => {
  stopMdTableRefresh()
})

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting?: any) {
  emit('refreshSetting', newSetting)
  // Dialog submit carries a changed setting → the watch above reloads once props
  // update. Only the card refresh button (unchanged setting) needs an explicit
  // reload here.
  const viewChanged = newSetting && (newSetting.tableId !== props.setting?.tableId || newSetting.viewId !== props.setting?.viewId)
  if (!viewChanged) {
    loadView()
  }
}

defineExpose({
  resize: () => {
    gridRef.value?.gridRef?.recalculate()
  }
})
</script>

<style scoped lang="scss">
.db-table-view-widget {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.multi-dimension-table) {
    flex: 1;
    min-height: 0;
  }

  // Read-only widget: no filter/sort/group/add-row toolbar.
  // (ToolsBar has a showToolbar prop, but mdTable does not forward one.)
  :deep(.table-toolbar) {
    display: none;
  }

  // Read-only widget: no add-column side handle.
  :deep(.table-right-panel) {
    display: none;
  }

  // mdTable caps its scroll area at 90vh inline; let it fill the card instead.
  :deep(.table-left-panel) {
    max-height: none !important;
  }

  // Read-only widget: relation-tag clicks open an edit form with real
  // persistence (useRelationCellClick hardcodes mode='edit'); block them.
  :deep(.relation-tag) {
    pointer-events: none;
  }
}
</style>
