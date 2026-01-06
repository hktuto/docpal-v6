<template>
  <div style="height: 100%;overflow: hidden">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          inputKey="label"
          @form-change="handleFilterFormChange"
          inputPlaceHolder="folder_cabinetFilterItemName"
        />
        <el-button v-if="id"
          id="FolderCabinet__AllowOtherFilesCabinet__NewItem"
          data-testid="folderCabinetConfig-new-button"
          type="primary"
          @click="handleAdd()"
        >
          {{ $t('folderCabinet.newItem') }}
        </el-button>
      </template>
      <template #status="{ row, index }">
        <SvgIcon :src="`/icons/file/status-${row.state}.svg`"></SvgIcon>
      </template>
    </VxeGrid>
  </div>
  <FolderCabinetCreateDialog ref="CreateDialogRef" @refresh="reload" />
</template>
<script lang="ts" setup>
import type { VxeGridPropTypes } from 'vxe-table'

import { clientApi } from 'api'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const props = defineProps(['id', 'detail'])
const emits = defineEmits(['row-click'])
const { t } = useI18n()
let extraParams: any = {}
const basicColumns: VxeGridPropTypes.Columns = [
  {
    field: 'status',
    title: 'folder_cabinetStatus',
    fixed: 'left',
    slots: { default: 'status' },
    width: 120
  },
  { field: 'label', title: 'folder_cabinetItemName' },
  { field: 'createdBy', title: 'role.creator', width: 220 },
  {
    field: 'modifiedDate',
    title: 'tableHeader_modifiedDate',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    },
    width: 220
  },
  {
    field: 'deadline',
    title: 'tableHeader_dueDate',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    },
    width: 220
  },
  {
    field: 'documentType',
    title: 'tableHeader_type',
    formatter({ cellValue }: any) {
      return cellValue ? t(cellValue) : ""
    },
    width: 220
  }
]
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'fcc',
  api: async (pageParams: any) => {
    if (!props.id)
      return {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    initFilter(props.id)
    return await clientApi.api.postDmsCabinetPage({
      ...pageParams,
      ...extraParams,
      templateId: props.id
    })
  },
  columns: [...basicColumns],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  bodyActions: [
    [
      {
        code: 'toFolder',
        name: 'common_viewFolder',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          routerProvider?.navigateTo(
            createBrowseListPageParams({ idOrPath: row.documentId }),
            false
          )
        }
      }
    ]
  ]
})

function handleDblclick(row: any) {
  emits('row-click', row)
  // routerProvider?.navigateTo(routeFolderCabinetDetail(row), false);
}

const CreateDialogRef = ref()

function handleAdd() {
  CreateDialogRef.value.handleOpen(props.id)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!formModel.orderBy) formModel.orderBy = 'modified_date_'
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc === 'false' ? false : true
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

async function initFilter(id: string) {
  tableConfig.id = 'fc-' + id
  let data: any = await clientApi.api
    .getCabinetTemplateidPageConditions(id)
    .then((res) => res.data)
  if (!data) return
  data.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'role.creator', value: 'created_by_' },
        { label: 'tableHeader_dueDate', value: 'deadline' },
        { label: 'folder_cabinetItemName', value: 'label' },
        { label: 'folder_cabinetStatus', value: 'state' },
        { label: 'search.contributors', value: 'modified_by_' },
        { label: 'tableHeader_modifiedDate', value: 'modified_date_' }
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
  )

  const foundItem = data.find((item: any) => item.key === 'createdBy')
  if (foundItem) {
    if (foundItem.options.length > 0) {
      foundItem.options.sort((a: any, b: any) => a.label.localeCompare(b.label))
    }
    data[data.indexOf(foundItem)].options = foundItem.options
  }

  ResponsiveFilterRef.value.init(data, extraParams)
  const ignoreList = ['createdBy', 'complete', 'isDesc', 'orderBy', 'state']
  const columns = data.reduce((prev: any, item: any) => {
    if (!ignoreList.includes(item.key)) {
      prev.push(getColumn(item))
    }
    return prev
  }, [])
  const newColumns = [...basicColumns]
  newColumns.splice(2, 0, ...columns)
  const actionColumn = tableConfig.columns.find((item: any) => item.title === 'dpTable_actions')
  if (!!actionColumn) newColumns.push(actionColumn)
  tableConfig.columns = newColumns

  function getColumn(row: any) {
    if (row.type === 'date')
      return {
        field: row.key,
        title: row.label,
        width: 200,
        formatter({ cellValue }: any) {
          return cellValue ? t(cellValue) : ""
        }
      }
    else {
      return {
        field: row.key,
        title: row.label
      }
    }
  }
}

defineExpose({ reload })
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  width: 100%;
  justify-content: space-between;

  .responsive-container {
    width: 70%;
  }
}

:deep(.el-input) {
  width: 200px;
}
</style>
