<script setup lang="ts">
import { Refresh, Plus, Grid, Brush } from '@element-plus/icons-vue'
import MdCardView from './view.vue'
import type { MDCardProps } from '../../composables/mdCard/useMDCard'
type Props = {
  tableId: string
  editable: boolean
  isMirror: boolean
  canEditTable: boolean
  canManageTable: boolean
  extraColumnConfig: {
    columns: ColumnConfig[]
  }
}
const props = withDefaults(defineProps<Props>(), {
  tableId: '',
  editable: false,
  isMirror: false,
  canEditTable: false,
  canManageTable: false,
  extraColumnConfig: () => ({
    columns: []
  })
})

const { t } = useI18n()

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'add-row': []
  'start-edit-row': [row: any]
  'exit-edit-row': [row?: any]
}>()
const refreshLoading = ref(false)
const { columns, cardRef, getTableData, addRow, systemFieldsTypes, currentEditing } = useMDCard(props)

const rightClickCellPopoverRef = ref()
const isGroupingEnabled = computed(() => {
  return props.extraColumnConfig?.columnGroupRules?.value?.length > 0
})
async function handleRefresh() {
  refreshLoading.value = true
  await getTableData({ pageNum: 0 })
  emit('refresh')
  setTimeout(() => {
    refreshLoading.value = false
  }, 300)
}

function handleSearch(value: string) {
  emit('search', value)
}

function handleStartEditRow(row: any) {
  emit('start-edit-row', { row, mode: 'edit' })
}
function handleExitEditRow(row?: any) {
  emit('exit-edit-row', row)
}
function handleRowContextMenu(row: any, event: MouseEvent) {
  rightClickCellPopoverRef.value?.open(event, { ...row })
}
</script>

<template>
  <div class="md-card-view">
    <ToolsBar
      :groupMaxCount="1"
      :showMirrorButton="!isMirror"
      :showAutomationButton="!isMirror && canManageTable"
      :showAuditLogButton="!isMirror && canManageTable"
      :disabled="isMirror"
      :showColumnConfig="false"
      :showAddRowButton="canEditTable"
      @refresh="handleRefresh"
      @add-row="handleAddRow"
    >
      <template #toolbar-left-before>
        <el-popover placement="bottom-start" :width="280" trigger="click" popper-class="md-card-setting-popover">
          <template #reference>
            <el-button v-if="!isMirror && canManageTable" :icon="Grid" :aria-label="t('mdTable.cardToolbar.layout')" tabindex="0">
              {{ t('mdTable.cardToolbar.layout') }}
            </el-button>
          </template>
          <MdCardSettingLayout />
        </el-popover>
        <el-popover placement="bottom-start" :width="320" trigger="click" popper-class="md-card-setting-popover">
          <template #reference>
            <el-button style="margin-left: 0px" v-if="!isMirror && canManageTable" :aria-label="t('mdTable.cardToolbar.style')" tabindex="0" :icon="Brush">
              {{ t('mdTable.cardToolbar.style') }}
            </el-button>
          </template>
          <MdCardSettingStyle />
        </el-popover>
      </template>
    </ToolsBar>

    <MdCardView
      :ref="cardRef"
      :draggable="props.editable"
      :isGroupingEnabled="isGroupingEnabled"
      :canEditTable="canEditTable"
      @start-edit-row="handleStartEditRow"
      @exit-edit-row="handleExitEditRow"
      @row-context-menu="handleRowContextMenu"
      @reload="handleRefresh"
    />
    <ToolsRightClickCellPopover ref="rightClickCellPopoverRef" @delete-rows="handleRefresh" />
  </div>
</template>

<style scoped lang="scss">
.md-card-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}
</style>
<style>
.md-card-setting-popover {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
