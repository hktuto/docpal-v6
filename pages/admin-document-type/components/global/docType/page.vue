<template>
  <div class="tableContainer pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actionsButtonsContainer">
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name"
                            inputPlaceHolder="documentType_filter" />
          <div class="btns">

            <el-button id="DocumentType__CreateNewDocumentType" type="primary" @click="handleCreate">
              {{ $t('docType.new') }}
            </el-button>
            <el-button id="DocumentType__ExportCSV" type="primary" @click="handleExport">
              {{ t('metadata.export') }}
            </el-button>
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.active === 'Active'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>

    <DocTypeDialogNew ref="DocTypeDialogNewRef" @refresh="query({})" />
    <DocTypeDialogDuplicate ref="DocTypeDialogDuplicateRef" @refresh="query({})" />
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElLoading } from 'element-plus'
import { routeDocDetail } from '~/utils/routerHelper'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
let extraParams: any = {}
const state = reactive<any>({})
const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'docTypeManage',
  api: async (pageParams: any) => {
    return await newAdminApi.postAdmindmsDocpalTypePage({
      ...pageParams,
      ...extraParams
    })
  },
  columns: [
    {
      field: 'name',
      title: 'search.type',
      fixed: 'left',
      type: 'html',
      formatter({ cellValue, row }: any) {
        let icon = '/icons/doc/file.svg'
        if (row.isFolder === 'Yes') {
          icon = '/icons/doc/folder.svg'
        }
        return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
      }
    },
    { field: 'category', title: 'docType.category' },
    {
      field: 'status',
      title: 'documentType_Status',
      slots: {
        default: 'status'
      }
    },
    { field: 'createdBy', title: 'role.creator' },
    {
      field: 'lastModifiedDate',
      title: 'table_last_update',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'documentType_edit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'duplicate',
        name: 'documentType_duplicate',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDuplicate(row)
        }
      },
      {
        code: 'active',
        name: 'documentType_activate',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, true)
        }
      },
      {
        code: 'inactive',
        name: 'documentType_inactivate',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, false)
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    switch (args.code) {
      case 'active':
        console.log(args.row)
        return {
          visible: args.row.active !== 'Active',
          disabled: false
        }
      case 'inactive':
        return {
          visible: args.row.active === 'Active',
          disabled: false
        }
      default:
        return {
          visible: true,
          disabled: false
        }
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row) {
  // TODO : update dupliate dialog iwth new api
  routerProvider?.navigateTo(routeDocDetail(row), false)
}

const DocTypeDialogDuplicateRef = ref()
const DocTypeDialogNewRef = ref()

function handleDuplicate(row: any) {
  DocTypeDialogDuplicateRef.value.handleOpen(row)
}

async function handleActive(row: any, isActive: boolean) {
  const result = await newAdminApi.patchAdmindmsDocpalTypeActive({
    name: row.name,
    enable: isActive
  }).then((res) => res.data)
  if (!!result) {
    row.active = isActive ? 'Active' : 'Inactive'
  }
}

async function handleCreate() {
  DocTypeDialogNewRef.value.handleOpen()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  if (formModel.orderBy === 'enable') {
    formModel.isDesc = !formModel.isDesc
  }
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  const filters = await newAdminApi.getAdmindmsDocpalTypePageConditions().then((res) => res.data)
  ResponsiveFilterRef.value?.init([
    ...filters,
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'select',
      isMultiple: false,
      value: ['name'],
      options: [
        { label: 'docType.category', value: 'category' },
        { label: 'role.creator', value: 'createdBy' },
        { label: 'search.type', value: 'name' },
        { label: 'documentType_Status', value: 'enable' },
        { label: 'table_last_update', value: 'modifiedDate' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'select',
      isMultiple: false,
      value: [false],
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  ])
  nextTick(() => {
    extraParams.orderBy = 'name'
    extraParams.isDesc = false
    reload()
  })
}

async function handleExport() {
  const exportLoading = ElLoading.service({
    lock: true,
    text: t('metadata.export_loading'),
    background: 'rgba(0, 0, 0, 0.7)'
  })
  const result = await newAdminApi.postAdmindmsDocpalTypeExportCvs({
    pageNum: 0,
    pageSize: 1000
  }, {
    format: 'blob',
    timeout: 0
  })
  downloadBlob(result, 'documentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  exportLoading.close()
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper ) {
  display: flex;
  justify-content: space-between;
}

.tableContainer {
  :deep(.browseFileIcon) {
    width: calc(var(--app-space-m) * 1.5);
    height: calc(var(--app-space-m) * 1.5);
  }

  :deep(.browseNameCell) {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}

.actionsButtonsContainer {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: var(--app-space-xs);
  @container (width < 600px) {
    grid-template-columns: 1fr;
  }
}

</style>
