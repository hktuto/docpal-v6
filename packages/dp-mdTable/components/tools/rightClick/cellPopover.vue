<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { MdTableContextKey, type mdTable } from '../../../composables/useMDTable'
import { newClientApi } from 'api'
interface CellPopoverOption {
  label: string
  icon: string
  onClick: () => Promise<void>
}
const props = defineProps<{
  tableId:string
}>()
const { t } = useI18n()
const mdTableContext = inject<mdTable | null>(MdTableContextKey, null)
const { gridRef, tableData, deleteRow } = useTableDataInject()

const popoverRef = ref()
const selectedRows = ref<Record<string, any>[]>([])
const optionList = ref<CellPopoverOption[]>([])
const emit = defineEmits<{
  'delete-rows': [pureIds: string[]]
}>()
function open(mouseEvent: MouseEvent, row: any) {
  if (!row?.id) {
    return
  }

  selectedRows.value = gridRef.value?.getCheckboxRecords?.() || []
  if (selectedRows.value.length > 0) {
    const isInSelected = selectedRows.value.some((item) => item.id === row.id)
    if (!isInSelected) {
      mdTableContext?.clearCheckboxRow()
      return
    } else {
      optionList.value = [createDeleteOption(selectedRows.value)]
    }
  } else {
    // no selected row, default to add detele option
    optionList.value = [createDeleteOption([row])]
    // check for automation test for current row data to get all triggeable actions
    checkWorkflowForRow(row)
  }

  popoverRef.value.open(mouseEvent)
}

async function checkWorkflowForRow(row:any){
  // when production, use trigger test to get when can be trigger
  // const res = await newClientApi.postDynamicDbTableMastertableidTriggerSettingsTest(
  //   props.tableId,
  // {
  //   event_type:"manual",
  //   data: row
  // })
  // current get all trigger item with trigger type is manual and push to optionList
  const res = await newClientApi.postDynamicDbTableMastertableidTriggerSettingsPage(props.tableId,{
    pageNum: 0,
    pageSize: 200
  })
  if(res.data?.entryList?.length){
    res.data?.entryList?.filter((t:any) => t.event_type === 'manual' && t.workflow_id).forEach( (trigger:any) => {
      optionList.value.push({
        label: trigger.trigger_name,
        icon: 'dp-icon:flow-outline',
        onClick: () => triggerWorkflow(row, trigger.workflow_id)
      })
    })
  }
}

async function triggerWorkflow(row:any, workflowId:string){
  // @joshua, get workflow form here.
  console.log("trigger fire", {
    row, workflowId
  })
}
function createDeleteOption(row: Record<string, any>[]): CellPopoverOption {
  const rows = Array.isArray(row) ? row : [row]
  const idsToDelete = rows.reduce((acc, row) => {
    if (row.children && row.children.length > 0) {
      const cIds = row.children.map((child) => String(child.id))
      acc.push(...cIds)
    } else {
      acc.push(row.id)
    }
    return acc
  }, [])
  const pureIds = [...new Set(idsToDelete)]
  const isBatchDelete = pureIds.length > 1

  return {
    label: isBatchDelete ? t('mdTable.deleteSelectedRow', { count: pureIds.length }) : t('mdTable.deleteRow'),
    icon: 'material-symbols:delete-outline',
    onClick: () => handleDeleteRows(pureIds)
  }
}

async function handleDeleteRows(pureIds: string[]) {
  const message = pureIds.length > 1 ? t('mdTable.deleteSelectedRow', { count: pureIds.length }) : t('mdTable.deleteRow', { count: 1 })
  try {
    await ElMessageBox.confirm(message, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      dangerouslyUseHTMLString: true
    })
    await deleteRow(pureIds.length > 1 ? pureIds : pureIds[0])
    emit('delete-rows', pureIds)
  } catch {
    // 用户取消确认框时保持静默。
  } finally {
    close()
  }
}

function close() {
  popoverRef.value?.close()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiDpPopover ref="popoverRef">
    <div class="cell-popover">
      <div
        v-for="item in optionList"
        :key="item.label"
        class="cell-popover-item"
        tabindex="0"
        :aria-label="item.label"
        @click="item.onClick"
        @keydown.enter="item.onClick"
      >
        <Icon :name="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </div>
  </UiDpPopover>
</template>

<style scoped lang="scss">
.cell-popover {
  margin: var(--app-space-xs);
}
.cell-popover-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  &:hover {
    background: var(--app-primary-alpha-30);
    color: var(--app-primary-color);
  }
}
</style>
