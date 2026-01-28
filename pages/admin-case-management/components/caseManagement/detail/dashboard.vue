<template>
  <el-card style="height: 60vh" class="viewer">
    <template #header>
      <div class="card-header">
        <h4>{{ $t('caseManagement_detailCaseDashboardView') }}</h4>
      </div>
    </template>
    <div style="height: 100%">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <div class="actions">
            <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" />
            <el-button id="CaseManagement__Detail__CaseDashboardView__Add" type="primary" @click="handleAdd()">
              {{ $t('button.add') }}
            </el-button>
          </div>
        </template>
      </VxeGrid>

      <CaseManagementDetailDashboardDialog ref="dialogRef" v-bind="props" @refresh="reload" />
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const ResponsiveFilterRef = ref()
const props = defineProps<{
  caseDetail: any
  caseTypeId: string
  name: string
  currentVersion: string
  caseDetailId: string
}>()
const pageParams = {
  pageNum: 0,
  pageSize: 20,
  orderBy: 'createdDate',
  isDesc: true
}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'case-dashboard-table',
  api: async (params: any) => {
    if (!params.orderBy) {
      params.orderBy = 'createdDate'
      params.isDesc = false
    }
    if (props.currentVersion) params.versionNumber = props.currentVersion
    if (props.caseDetailId) params.caseTypeId = props.caseDetailId
    if (!params.caseTypeId)
      return {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    return await clientApi.admin.postAdmincaseDashboardPage({ ...params, ...state.extraParams })
  },
  defaultSort: [
    {
      field: 'createdDate',
      order: 'desc'
    }
  ],
  columns: [
    {
      field: 'label',
      title: 'table_name',
      fixed: 'left'
    },
    {
      field: 'permissions',
      title: 'rbac.permission.permissionLevel',
      formatter({ cellValue }: any) {
        if (!cellValue) return '-'
        const permissions = cellValue.map((item: any) => {
          return item.name
        })
        return permissions.join(',')
      }
    },
    {
      field: 'createdDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
    // {
    //   field: "status",
    //   title: "dpTable_status",
    //   formatter({ cellValue }: any) {
    //     return cellValue === "A" ? t("actions.activated") : t("actions.inactive");
    //   },
    // },
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'workflowEditor.editInfo',
        action: ({ row }) => {
          handleAdd(row)
        }
      },
      {
        code: 'edit',
        name: 'caseManage.editLayout',
        action: ({ row }) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: 'common_delete',
        action: ({ row }) => {
          handleDelete(row)
        }
      }
    ]
  ]
})
// const tableSetting = {
//   columns: [
//     { id: '1', label: 'table_name', prop: 'label', defaultColumn: true },
//     { id: '2', label: 'workflow_createDate', prop: 'createdDate', width: 200,
//         formatList: [ datesFormat('createdDate') ]
//     },
//     { id: '3', label: 'table_modifiedDate', prop: 'modifiedDate', width: 200,
//         formatList: [ datesFormat('modifiedDate') ]
//     },
//     { id: '4', label: 'caseManagement.userGroup', prop: 'userGroup'  },
//     { id: '5', label: 'dpTable_status', prop: 'publishStatus', slot: 'publishStatus', width: 120 },
//     { id: '6', type: "", label: "dpTable_actions", slot: 'dpTable_actions', width: 80 }
//   ],
//   events: ['delete'],
//   slots: [
//   ],
//   options: { pageSize: 20 }
// }
const state = reactive<State>({
  loading: false,
  tableData: [],
  options: {
    showPagination: true,
    paginationConfig: {
      total: 0,
      currentPage: 1,
      pageSize: pageParams.pageSize
    },
    rowKey: 'id'
  },
  extraParams: {}
})

async function handleDblclick(row) {
  const newItem = newCaseDashboardLink(row)
  routerProvider?.navigateTo(newItem)
}

async function handleDelete(row) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    state.loading = true
    await clientApi.admin.deleteAdmincaseDashboardId(row.id).then(r => r.data)
    reload()
    // await deleteCaseDashboardApi(row.id)
  } catch (error) {
  } finally {
    state.loading = false
  }
}

const dialogRef = ref()

function handleAdd(setting: any = null) {
  dialogRef.value.handleOpen(setting)
  reload()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  state.extraParams = formModel
  reload()
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'table_modifiedDate', value: 'modifiedDate' },
        { label: 'table_name', value: 'label' },
        { label: 'workflow_createDate', value: 'createdDate' },
        { label: 'caseManagement.userGroup', value: 'userGroup' }
        // { label: 'tableHeader_confirmAt', value: 'confirmAt' }
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
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
.responsive-container {
  :deep(.el-input) {
    width: 200px;
  }

  width: 100%;
}

:deep(.el-card__body) {
  height: 70vh;
}

.responsive-container {
  margin-bottom: 10px;
}

.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
</style>
