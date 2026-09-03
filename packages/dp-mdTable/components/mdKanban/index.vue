<script lang="ts" setup>
import { useMDKanban, type MDKanbanProps } from '../../composables/mdKanban/useMDKanban'
import Sortable from 'sortablejs'
import ToolsBar from '../tools/bar.vue'
import { useTableViewsInject } from '../../../dynamic-db/composables/table/useTableViews'
import { Plus, Setting } from '@element-plus/icons-vue'
const props = withDefaults(defineProps<MDKanbanProps>(), {
  tableId: '',
  editable: false,
  isMirror:false,
  canEditTable: false,
  canManageTable: false,
  extraColumnConfig: () => ({
    columns: [],
    deleteColumn: () => {},
    updateColumn: () => {},
    addColumn: () => {},
    tableFields: [],
    updatedViewColumnsConfig: () => {},
    saveColumnOrder: () => {},
    columnFilterRules: [],
    columnGroupRules: [],
    columnSortRules: []
  })
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'add-row': []
  'update-label': [payload: { id: string | null, label: string }],
  'start-edit-row': [row: any],
  'exit-edit-row': [row: any]
}>()

const showToolbar = computed(() => {
  return columns.value && columns.value.length > 0
})
const { columns, cardRef, getTableData, addRow, systemFieldsTypes, viewStyleConfig, columnFilterRules } = useMDKanban(props)
const { updateField, currentView } = useTableViewsInject()

// open setting logic
const kanbanSettingRef = ref()

function generateDefaultLayout(selectedColumnId: string) {
  const availableFields = columns.value
    ?.filter((col: any) => col.field_name !== selectedColumnId)
    .slice(0, 5)
  if (availableFields && availableFields.length > 0) {
    return {
      title: availableFields[0].field_name,
      content: availableFields.slice(1).map((col: any) => col.field_name)
    }
  }
  return { title: '', content: [] }
}

function normalizeViewStyleConfig() {
  const config = viewStyleConfig.value
  if (!config?.selectedColumnId || !columns.value?.length) {
    return { valid: false, changed: false }
  }

  const selectedColumn = columns.value.find(
    (col: any) => col.field_name === config.selectedColumnId
  )

  // Selected column no longer exists or is not a single-select field
  if (!selectedColumn || selectedColumn.business_type?.toString() !== '3') {
    config.selectedColumnId = ''
    config.options = []
    if (config.layout) {
      config.layout = { title: '', content: [] }
    }
    return { valid: false, changed: true }
  }

  const currentOptions = selectedColumn.display_structure?.options || []
  const currentOptionIds = new Set(currentOptions.map((opt: any) => opt.id))
  const currentOptionsMap = new Map(currentOptions.map((opt: any) => [opt.id, opt]))

  const originalOptions = config.options || []
  const normalizedOptions = originalOptions
    .filter((opt: any) => currentOptionIds.has(opt.id))
    .map((opt: any) => {
      const currentOpt = currentOptionsMap.get(opt.id)
      return {
        ...opt,
        label: currentOpt?.label ?? opt.label,
        color: currentOpt?.color ?? opt.color
      }
    })
  const existingIds = new Set(normalizedOptions.map((opt: any) => opt.id))
  const newOptions = currentOptions.filter((opt: any) => !existingIds.has(opt.id))

  config.options = [...normalizedOptions, ...newOptions]

  // Ensure layout exists with defaults
  if (!config.layout) {
    config.layout = generateDefaultLayout(config.selectedColumnId)
  }

  let layoutChanged = false
  if (config.layout?.content && Array.isArray(config.layout.content)) {
    const validFieldNames = new Set(columns.value.map((col: any) => col.field_name))
    const originalLayoutLength = config.layout.content.length
    config.layout.content = config.layout.content.filter((field: any) => {
      const fieldName = typeof field === 'string' ? field : field?.field_name
      return validFieldNames.has(fieldName)
    })
    layoutChanged = config.layout.content.length !== originalLayoutLength
  }

  const changed =
    normalizedOptions.length !== originalOptions.length ||
    newOptions.length > 0 ||
    layoutChanged

  return { valid: true, changed }
}

function initSetting() {
  if (viewStyleConfig.value && viewStyleConfig.value.selectedColumnId) {
    const result = normalizeViewStyleConfig()
    if (!result.valid) {
      setTimeout(() => {

        openSetting()
      },100)
      return
    }
    if (result.changed) {
      props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)
    }
    return
  }

  // check if columns has single select field
  const selectColumn = columns.value.filter((col) => col.business_type === '3')
  if (selectColumn && selectColumn.length == 1) {
    // only one select column, auto selecte this column
    viewStyleConfig.value.selectedColumnId = selectColumn[0].field_name
    viewStyleConfig.value.options = selectColumn[0].display_structure.options
    viewStyleConfig.value.layout = generateDefaultLayout(selectColumn[0].field_name)
    props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)
  } else {
    openSetting()
  }
}
function openSetting() {
  if (!viewStyleConfig.value.layout) {
    viewStyleConfig.value.layout = generateDefaultLayout(viewStyleConfig.value.selectedColumnId)
  }
  kanbanSettingRef.value.open()
}


const kanbanContainerRef = ref<HTMLDivElement>()
const groupListRef = ref<HTMLDivElement>()
const sortableInstance = ref<any>()

// New group popover
const newGroupPopoverRef = ref()
const newGroupBtnRef = ref<HTMLDivElement>()
const newGroupLabel = ref('')
const newGroupColor = ref('#409EFF')

function handleOpenNewGroupPopover() {
  newGroupLabel.value = ''
  newGroupColor.value = '#409EFF'
}

async function handleAddNewGroup() {
  const label = newGroupLabel.value.trim()
  if (!label) return

  const newOption = {
    id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    label,
    color: newGroupColor.value
  }

  // Update column definition
  const selectedColumn = columns.value.find(
    (c: any) => c.field_name === viewStyleConfig.value.selectedColumnId
  ) as ColumnConfig
  if (selectedColumn?.display_structure?.options) {
    selectedColumn.display_structure.options.push(newOption)
    const newData = JSON.parse(JSON.stringify(selectedColumn))
    delete newData.field_name
    delete newData.field_name_alias
    updateField(viewStyleConfig.value.selectedColumnId, newData)
  }

  // Update view config
  viewStyleConfig.value.options.push(newOption)
  await props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)

  // Close popover and reset
  newGroupPopoverRef.value?.close?.()
  newGroupLabel.value = ''
}

function initSortable() {
  if (!groupListRef.value) return
  sortableInstance.value = Sortable.create(groupListRef.value, {
    handle: '.title',
    animation: 150,
    onEnd: async (event) => {
      const { oldIndex, newIndex } = event
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return
      }
      const options = viewStyleConfig.value.options
      const movedItem = options.splice(oldIndex, 1)[0]
      options.splice(newIndex, 0, movedItem)
      await props.extraColumnConfig?.updateViewFilterSortGroup?.('style', viewStyleConfig.value)
    }
  })
}



watch(viewStyleConfig ,(style) => {
  if(style && !style.selectedColumnId || (!style.options || !style.options.length)){
    nextTick(() => {
      openSetting()
    })
  }
},{
  deep: true,
})
const groupRef = ref<Record<string, any>>({})
const allGroupRef = ref()
function handleNeedRefresh(groupId: string = 'all') {

  if (groupId === 'all' || !groupId) {
    allGroupRef.value?.refresh()
    return
  }
  const items = Array.isArray(groupRef.value) ? groupRef.value : groupRef.value ? [groupRef.value] : []
  items.forEach((el: any) => {
    if (el?.groupId === groupId) {
      el.refresh()
    }
  })
}

function updateLabel(e:any){
  console.log('updateLabel', e)
  if(!columns || !columns.value){
    return
  }
  // update tableFields
  const selectedColumn = columns.value.find((c) => c.field_name === viewStyleConfig.value.selectedColumnId) as ColumnConfig
  const columnOptionIndex =  selectedColumn?.display_structure.options.findIndex((v:any) => v.id === e.id)
  selectedColumn.display_structure.options[columnOptionIndex].label = e.label
  const newData = JSON.parse(JSON.stringify(selectedColumn))
  delete newData.field_name
  delete newData.field_name_alias
  updateField(viewStyleConfig.value.selectedColumnId, newData)
  // update options
  const index = viewStyleConfig.value.options.findIndex( (v:any) => v.id === e.id)
  viewStyleConfig.value.options[index].label = e.label
  props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)
}

function updateColor(e: { id: string; color: string }) {
  if (!columns || !columns.value) return
  const selectedColumn = columns.value.find(
    (c) => c.field_name === viewStyleConfig.value.selectedColumnId
  ) as ColumnConfig
  if (!selectedColumn?.display_structure?.options) return

  const columnOptionIndex = selectedColumn.display_structure.options.findIndex(
    (v: any) => v.id === e.id
  )
  if (columnOptionIndex === -1) return

  selectedColumn.display_structure.options[columnOptionIndex].color = e.color
  const newData = JSON.parse(JSON.stringify(selectedColumn))
  delete newData.field_name
  delete newData.field_name_alias
  updateField(viewStyleConfig.value.selectedColumnId, newData)

  const index = viewStyleConfig.value.options.findIndex((v: any) => v.id === e.id)
  if (index !== -1) {
    viewStyleConfig.value.options[index].color = e.color
    props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)
  }
}

function handleRemove(e: { id: string }) {
  if (!columns || !columns.value) return
  const selectedColumn = columns.value.find(
    (c) => c.field_name === viewStyleConfig.value.selectedColumnId
  ) as ColumnConfig
  if (!selectedColumn?.display_structure?.options) return

  const columnOptionIndex = selectedColumn.display_structure.options.findIndex(
    (v: any) => v.id === e.id
  )
  if (columnOptionIndex === -1) return

  selectedColumn.display_structure.options.splice(columnOptionIndex, 1)
  const newData = JSON.parse(JSON.stringify(selectedColumn))
  delete newData.field_name
  delete newData.field_name_alias
  updateField(viewStyleConfig.value.selectedColumnId, newData)

  const index = viewStyleConfig.value.options.findIndex((v: any) => v.id === e.id)
  if (index !== -1) {
    viewStyleConfig.value.options.splice(index, 1)
    props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)
  }
}

function handleRefresh() {
  emit('refresh')
  allGroupRef.value?.refresh()
  const items = Array.isArray(groupRef.value) ? groupRef.value : groupRef.value ? [groupRef.value] : []
  items.forEach((el: any) => {
    el?.refresh?.()
  })
}

function startEdit(params: any) {
  emit('start-edit-row', params)
}
function exitEdit(params:any){
  emit('exit-edit-row', params)
}

onMounted(() => {
  initSortable()
  initSetting()
})

onBeforeUnmount(() => {
  sortableInstance.value?.destroy()
})

</script>


<template>
<div ref="kanbanContainerRef" class="kanbanViewContainer">
    <ToolsBar
      v-if="showToolbar"
      :isMirror="isMirror"
       :showMirrorButton="!isMirror && canManageTable"
      :showAutomationButton="!isMirror && canManageTable"
      :showAuditLogButton="!isMirror && canManageTable"
      :showAddRowButton="false"
      :showGroupingButton="false"
      @refresh="handleRefresh"
    >
      <template #toolbar-right>
        <el-button  v-if="!isMirror" text :icon="Setting" @click="openSetting">
          Setting
        </el-button>
        <slot name="toolbar-right" />
      </template>
    </ToolsBar>
    <div v-if="viewStyleConfig.selectedColumnId" class="kanban-groups">
        <MdKanbanGroup
            class="allData"
            ref="allGroupRef"
            :group="{ id: null, label: 'All Data' }"
            :field="viewStyleConfig.selectedColumnId"
            :table-id="props.tableId"
            :canEditTable="canEditTable"
            @start-edit-row="startEdit"
            @exit-edit-row="exitEdit"
            @needRefresh="handleNeedRefresh"
        />
        <div ref="groupListRef" class="group_list">
            <MdKanbanGroup
                v-for="option in viewStyleConfig.options"
                :key="option.id"
                ref="groupRef"
                :group="option"
                :color="option.color"
                :field="viewStyleConfig.selectedColumnId"
                :table-id="props.tableId"
                :canEditTable="canEditTable"
                @needRefresh="handleNeedRefresh"
                @update-label="updateLabel"
                @update-color="updateColor"
                @start-edit-row="startEdit"
                @exit-edit-row="exitEdit"
                @remove="handleRemove"
            />
        </div>
        <UiPopoverDialog
            ref="newGroupPopoverRef"
            :width="220"
            placement="bottom-start"
            :close-on-click-outside="true"
            @open="handleOpenNewGroupPopover"
        >
            <div class="newGroupForm">
                <ElInput v-model="newGroupLabel" placeholder="Group name" clearable />
                <ElColorPicker v-model="newGroupColor" show-alpha />
                <ElButton type="primary" size="small" @click="handleAddNewGroup">Add</ElButton>
            </div>
        </UiPopoverDialog>
        <div ref="newGroupBtnRef" class="newGroup">
            <ElButton text class="newGroupBtn" @click="newGroupPopoverRef?.open?.(newGroupBtnRef)">
                <ElIcon><Plus /></ElIcon>
            </ElButton>
        </div>
    </div>
    <MdKanbanSettingDialog  ref="kanbanSettingRef" />
</div>
</template>

<style lang="scss" scoped>
.kanbanViewContainer{
    width:100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    gap: var(--app-space-xs);
}
.kanban-groups{
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-xs);
    overflow: auto;
    flex: 1;
    padding: var(--app-space-s);
}
.group_list{
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-xs);
}
.newGroup{
    flex: 0 0 220px;
    width: 220px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: var(--app-space-s);
}
.newGroupBtn{
    width: 100%;
    height: 40px;
    border: 2px dashed var(--app-grey-600);
    border-radius: var(--app-border-radius-s);
    color: var(--app-grey-300);

    &:hover{
        border-color: var(--app-primary);
        color: var(--app-primary);
    }
}
.newGroupForm{
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
}
</style>
