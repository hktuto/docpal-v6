<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <!-- TODO: muultiple select -->
    <template #toolbar_buttons>
      <div v-if="state.selectList.length === 0" class="flex-x-between">
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="q" inputPlaceHolder="masterTable_detailRecordsFilter" @form-change="handleFilterFormChange" />
        <div class="flex-x-end">
          <div v-for="item in ['optional', 'unique', 'required']" class="column-dynamic el-icon--left" :style="`--column-color: ${getColor('', item)}`">
            {{ t(`marsterTable.${item}`) }}
            <div class="column-dynamic-point"></div>
          </div>
          <el-button
            id="MasterTable__Add"
            v-if="permission?.create && !!platform && platform !== 'admin'"
            class="el-icon--right"
            type="primary"
            size="small"
            @click="handleAddRow()"
          >
            {{ t('button.add') }}
          </el-button>
        </div>
      </div>
      <div v-else class="flex-x-between">
        <div class="title-select color__primary">
          <b class="el-icon--left"> {{ t('masterTable_selected') }}: {{ state.selectList.length }} </b>
          <Icon id="MasterTable__Tables__Detail__Records__CleanSelected" name="ic:baseline-clear" class="normal cursor-pointer" @click="cleanSelectedRows">
          </Icon>
        </div>
        <div>
          <!-- v-if="isSuperAdmin && platform === 'admin'" -->
          <el-button id="MasterTable__Tables__Detail__Records__Delete" type="danger" @click="handleDeleteSelected">
            {{ t('common_delete') }}
          </el-button>
          <el-dropdown id="MasterTable__Tables__Detail__Records__Active" v-if="platform === 'admin' || permission?.enable" trigger="click">
            <el-button class="el-icon--left el-icon--right" type="warning">
              {{ t('actions.active') }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleBatchActive(true)">
                  {{ t('actions.active') }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleBatchActive(false)">
                  {{ t('actions.inactive') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button id="MasterTable__Tables__Detail__Records__BatchEdit" type="primary" @click="handleBatchEdit">
            {{ t('button.batchEdit') }}
          </el-button>
        </div>
      </div>
    </template>
    <template #defaultHeader="{ column }">
      <span class="column-dynamic" :style="`--column-color: ${getColor(column.field)}`">
        {{ t(column.title) }}
        <!-- <div class="column-dynamic-point"></div> -->
      </span>
    </template>
    <template v-for="(item, index) in state.slot" v-slot:[`${item}`]="{ row }">
      {{ row[item] }}
      <template v-if="row[`Relation_${item}`]">
        -
        <el-tag round> {{ row[`Relation_${item}`] }}</el-tag>
      </template>
    </template>
    <template #status="{ row }">
      <el-tag v-if="row.status" type="success">
        {{ t('actions.activated') }}
      </el-tag>
      <el-tag v-else type="danger">{{ t('actions.inactive') }}</el-tag>
    </template>
  </VxeGrid>
  <MasterTableRecordDialog ref="MasterTableNewRowDialogRef" :ignoreList="ignoreList" :tableId="tableId" @refresh="query" />
  <MasterTableBatchEditDialog ref="BatchDialogRef" :tableId="tableId" :ignoreList="ignoreList" @refresh="query" />
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import type { MTColumnInfo } from 'api/src/generate/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const emits = defineEmits(['filter-change'])
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()
const ignoreList = getIgnoreSchemas()
// const isSuperAdmin = useIsSuperAdmin()
const props = defineProps<{
  tableId: string
  permission: any
}>()
const state = reactive<{
  loading: boolean
  fields: MTColumnInfo[]
  extraParams: any
  slot: string[]
  selectList: any[]
}>({
  loading: false,
  fields: [],
  extraParams: {},
  slot: [],
  selectList: []
})
const baseTableColumns: any = [
  { type: 'checkbox', fixed: 'left', width: 47 },
  { field: 'id', title: 'masterTable_id' },
  {
    field: 'created_date',
    title: 'workflow_createDate',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  },
  {
    field: 'modified_date',
    title: 'tableHeader_modifiedDate',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  },
  { field: 'created_by', title: 'role.creator' },
  { field: 'modified_by', title: 'modified_by' },
  {
    field: 'status',
    title: 'common_status',
    slots: {
      default: 'status'
    }
  }
]
const { tableConfig, tableEvent, tableRef, reload, query, cleanSelectedRows } = useVxeTable({
  id: 'mt_' + props.tableId,
  api: async (pageParams: any) => {
    if (!props.tableId)
      return {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    const { data } = await clientApi.api.postDmsMasterTableRecordPage({
      ...pageParams,
      ...state.extraParams,
      id: props.tableId
    })
    return {
      data: {
        entryList: data?.entryList || [],
        totalSize: data?.totalSize || 0
      }
    }
  },
  columns: [...baseTableColumns],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }: any) => {
          handleAddRow(row)
        }
      },
      {
        code: 'delete',
        name: 'trash_actions_delete',
        action: ({ row }: any) => {
          handleDelete(row)
        }
      },
      {
        code: 'inactive',
        name: 'actions.inactive',
        action: ({ row }: any) => {
          handleActive(row, false)
        }
      },
      {
        code: 'active',
        name: 'actions.active',
        action: ({ row }: any) => {
          handleActive(row, true)
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }

    // options 是 menuConfig 中的 body 配置
    switch (args.code) {
      case 'edit':
        return {
          visible: props.permission.edit,
          disabled: false
        }
      case 'delete':
        return {
          visible: platform.value === 'admin',
          disabled: false
        }
      case 'active':
        return {
          visible: props.permission.enable && !args.row.status,
          disabled: false
        }
      case 'inactive':
        return {
          visible: props.permission.enable && args.row.status,
          disabled: false
        }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectList = [...selectedRows]
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleAddRow(row)
  },
  optionalConfig: {
    rowConfig: {
      height: 60,
      isCurrent: true,
      isHover: true
    }
  }
})

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    const result = await clientApi.api.deleteDmsMasterTableIdRecord(props.tableId, { recordId: row.id }, {})
    if (!result) {
      routerProvider?.message.error(t('dpTip.deleteFailed'))
      return
    }
    query()
  } catch (error) {
    console.log(error)
  }
}

const BatchDialogRef = ref()

function handleBatchEdit() {
  const fields = state.fields.filter((item) => !item.unique && !item.primaryKey)
  BatchDialogRef.value.handleOpen(fields, state.selectList)
}

const MasterTableNewRowDialogRef = ref()

function handleAddRow(row?: any) {
  MasterTableNewRowDialogRef.value.handleOpen(state.fields, row)
}

async function handleBatchActive(status: boolean) {
  try {
    const ids = state.selectList.map((item: any) => item.id)
    await clientApi.api.patchDmsMasterTableIdBatchRecordStatus(props.tableId, {
      in: {
        id: ids
      },
      status
    })
    ElMessage.success(t('dpMsg_success'))
    query()
  } catch (error) {
  } finally {
  }
}

async function handleActive(row, status: boolean) {
  try {
    row.loading = true
    row.status = status
    await clientApi.api.patchDmsMasterTableIdRecordStatus(props.tableId, {
      id: row.id,
      status
    })
    ElMessage.success(t('dpMsg_success'))
  } catch (error) {
    row.status = !row.status
  } finally {
    row.loading = false
  }
}

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

function handleFilterFormChange(formModel: any) {
  state.extraParams = formModel
  console.log('handleFilterFormChange', state.extraParams)
  reload()
}

function getColor(prop: any, option?: any) {
  try {
    if (!!prop) {
      const mItem: any = state.fields.find((item: any) => item.columnName === prop)
      if (mItem.unique) return '#0099FF'
      else if (mItem.required) return '#7B61FF'
    }
  } catch (error) {}
  switch (option) {
    case 'unique':
      return '#0099FF'
    case 'required':
      return '#7B61FF'
    default:
      break
  }
  // return 'red'
  return '#373D43'
}

// #endregion
async function initTableColumns(fields: any) {
  state.selectList = []
  if (!fields || fields.length === 0) return
  state.slot = []
  state.fields = fields
  const columns = fields
    .filter((item: any) => !baseTableColumns.find((c) => c.field === item.columnName))
    .map((item: any) => {
      if (!item.columnName) return item
      const _item: any = {
        title: item.columnName,
        field: item.columnName,
        slots: { header: 'defaultHeader' },
        width: 200
      }
      if (item.dataType === 'timestamp') {
        item.formatter = ({ cellValue }: any) => {
          return formatDate(cellValue)
        }
      }
      if (item.relationTable) {
        ;(_item.slots.default = item.columnName), state.slot.push(item.columnName)
      }
      return _item
    })
  // TODO: platform
  // if (!props.permission?.edit && !props.permission?.enable && platform !== "admin") {
  //   const index = baseTableColumns.findIndex(
  //     (item) => item.title === "dpTable_actions"
  //   );
  //   if (index !== -1)baseTableColumns.splice(index, 1);
  // }
  const newColumns = [...baseTableColumns]
  let selectItemIndex = newColumns.findIndex((item: any) => item.field === 'id')
  if (selectItemIndex < 0) selectItemIndex = 0
  else selectItemIndex++
  newColumns.splice(selectItemIndex, 0, ...columns)
  const actions = tableConfig.columns.find((item: any) => item.title === 'dpTable_actions')
  if (actions) {
    newColumns.push(actions)
  }
  tableConfig.columns = newColumns
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(t('masterTable_deleteSelectedMsg', { name: props.permission.name }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const ids = state.selectList.map((item: any) => item.id)
    await clientApi.api.postDmsMasterTableBatchDelete({
      tableId: props.tableId,
      recordIds: ids
    })
    ElMessage.success(t('masterTable_deleteSelectedSuccessMsg', { name: props.permission.name }))
    cleanSelectedRows()
    state.extraParams = {}
    if (ids.length === tableConfig.data.length) query()
    else reload()
  } catch (error) {
    console.log(error)
  }
}

async function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        // { label: 'modified_by', value: 'modified_by' },
        // { label: 'tableHeader_modifiedDate', value: 'modified_date' },
        // { label: 'masterTable_id', value: 'id' },
        // { label: 'common_status', value: 'status' },
        // { label: 'workflow_createDate', value: 'created_date' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  ]
  const { data: filterData } = await clientApi.api.getDmsMasterTableRecordSortOptionTableid(props.tableId)
  data[0].options = filterData
  ResponsiveFilterRef.value.init(data)
}

watch(
  () => props.tableId,
  (newValue: any) => {
    if (newValue) {
      reload()
      getFilter()
    }
  },
  { immediate: true, deep: true }
)
defineExpose({ query, reload, initTableColumns })
</script>

<style lang="scss" scoped>
.responsive-container {
  :deep(.el-input) {
    width: 200px;
  }
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.flex-x-end {
  display: flex;
  justify-content: flex-end;
}

.column-dynamic {
  min-width: 3rem;
  color: var(--column-color);
  display: flex;
  align-items: center;
  margin-right: var(--app-space-xs);

  &-point {
    width: 8px;
    height: 8px;
    margin-left: 3px;
    border-radius: 50%;
    background-color: var(--column-color);
  }
}
</style>
