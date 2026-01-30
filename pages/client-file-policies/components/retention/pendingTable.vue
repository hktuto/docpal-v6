<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="documentName" />
      <!-- <el-button id="RetentionList__RetentionPendingList__Refresh" text :loading="refreshLoading"
                 @click="handleRefresh">
        {{ $t('common_refresh') }}
      </el-button> -->
    </template>
    <template #commonActions="{ row }">
      <template v-if="row.status === 'P'">
        <template v-if="row.applyApprovedBy === userId">
          <el-button id="RetentionList__RetentionPendingList__Approve" class="approval-btn el-icon--left" size="small" type="primary" @click.stop="handleApprove(true, row)">
            {{ $t('workflow_startAdhocWorkflow_approve') }}
          </el-button>
          <el-button id="RetentionList__RetentionPendingList__Reject" class="approval-btn " size="small" type="danger" @click.stop="handleApprove(false, row)">
            {{ $t('workflow_startAdhocWorkflow_reject') }}
          </el-button>
        </template>
        <template v-else>
          <el-button id="RetentionList__RetentionPendingList__PendingApproval" text :disabled="true">
            {{ $t('workflow_statuspendingApproval') }} 
          </el-button>
        </template>
      </template>
      <template v-else>
        <el-dropdown v-if="!!row && !!row.policyRetentionId" trigger="click">
          <span class="el-dropdown-link">
            <el-button text>
              <el-icon>
                <MoreFilled />
              </el-icon>
            </el-button>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in events[row.policyRetentionId]" :key="item.id" @click.stop="handleEvent(item, row)">
                {{ item.eventLabel }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </template>
  </VxeGrid>
</template>
<script lang="ts" setup>
import { MoreFilled } from '@element-plus/icons-vue'
import { clientApi } from 'api'
import { MenuRouterKey } from '#imports'
import { ElMessageBox } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
let extraParams = {}
const { t } = useI18n()
const initParams = {
  orderBy: 'createdDate',
  isDesc: true,
  states: ['D', 'P']
}

const events = ref<any>({})
const userId: string = useUserId().value

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'clientRetentionPendingList',
  api: async (pageParams: any) => {
    return clientApi.api.postDmsPolicyRetentionDocumentListQuery({
      ...initParams,
      ...pageParams,
      ...extraParams
    })
  },
  columns: [
    {
      field: 'documentName',
      title: 'tableHeader_name',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        return `<span class="tableRow-icon-cell"><img src="${icon}" /> ${cellValue}</span>`
      }
    },
    { field: 'documentPath', title: 'document_filePath' },
    { field: 'policyName', title: 'tableHeader_policyName' },
    {
      field: 'expireDate',
      title: 'tableHeader_dueDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'applyApprovedBy', title: 'retention_approvedBy' },
    {
      title: 'tableHeader_actions',
      slots: {
        default: 'commonActions'
      },
      width: 200
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  optionalConfig: {
    cellClassName({ row, column }) {
      if (column.title === 'tableHeader_actions') {
        return 'row-actions'
      }
      return null
    }
  }
})
const refreshLoading = ref(false)
// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function getFilter() {
  // TODO：缺少新的API
  const data: any = await clientApi.api.getPolicyRetentionsDocumentPageConditions().then((res) => res.data)
  const foundItem = data.find((item: any) => item.key === 'retentionPolicyIds')
  if (foundItem.options.length > 0) {
    foundItem.options.sort((a: any, b: any) => a.label.localeCompare(b.label))
    data[data.indexOf(foundItem)].options = foundItem.options
  }
  data.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader_dueDate', value: 'expireDate' },
        { label: 'document_filePath', value: 'createdDate' },
        { label: 'tableHeader_name', value: 'documentName' },
        { label: 'retention_approvedBy', value: 'applyApprovedBy' }
        // { label: 'tableHeader_policyName', value: 'policyName' },
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

  ResponsiveFilterRef.value.init(data)
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

// #endregion

async function handleRefresh() {
  refreshLoading.value = true
  await clientApi.api.getPolicyRetentionsScanDocument()
  refreshLoading.value = false
  reload()
}

async function handleApprove(state: boolean, row: any) {
  try {
    let msg = t('msg_confirmWhetherToExecuteCommand')
    const command = state ? t('workflow_startAdhocWorkflow_approve') : t('workflow_startAdhocWorkflow_reject')
    const action = await ElMessageBox.confirm(`${msg}: ${command}`)
    if (action !== 'confirm') return
    await clientApi.api.patchDmsPolicyRetentionDocumentRetentiondocumentidStatusStatus(row.id, state)
    reload()
  } catch (error) {
    console.log(error)
  }
}

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    createDetailPageParams({
      docName: row.documentName,
      idOrPath: row.documentId,
      showHeaderAction: false
    }),
    false
  )
}

async function getEvents() {
  events.value = await clientApi.api.getDmsPolicyRetentionEventList().then((res) => res.data)
}
async function handleEvent(event: any, row: any) {
  try {
    let msg = t('msg_confirmWhetherToExecuteCommand')
    const action = await ElMessageBox.confirm(`${msg}: ${event.eventLabel}`)
    if (action !== 'confirm') return
    await clientApi.api.postDmsPolicyRetentionDocumentEvent({ eventId: event.id, documentId: row.documentId })
    reload()
  } catch (error) {
    console.log(error)
  }
}
onMounted(() => {
  getFilter()
  getEvents()
})
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

.responsive-container {
  width: 70%;
}

:deep(.row-actions) {
  .vxe-cell {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);

    .el-button {
      margin-left: unset;
    }
  }
}

:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}
</style>
