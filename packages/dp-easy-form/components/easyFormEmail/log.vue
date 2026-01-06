<template>
  <div v-loading="loading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
          inputKey="email"
          :inputPlaceHolder="$t('dpTip.filterBy', {
            name: $t('user_email')
          })"
        />
      </template>
      <template #relatedWorkflow="{ row }">
        <template
          v-for="(item, index) in row.relatedWorkflows"
          :key="item.actionId + index"
        >
          <el-tag v-if="item.workflowInstanceId" class="cursorPointer" @click="(e) => handleOpenWorkflow(item, e)">
            {{ item.actionName }}
          </el-tag>
        </template>
        <!-- <el-tag @click="handleOpenWorkflow()">bjnh</el-tag
        > -->
      </template>
      <template #relatedCase="{ row }">
        <template
          v-for="(item, index) in row.relateCases"
          :key="item.actionId + index"
        >
          <el-tag v-if="item.caseId" class="cursorPointer" @click="(e) => handleOpenCase(item, e)">
            {{ item.actionName }}
          </el-tag>
        </template>
      </template>
    </VxeGrid>

    <EasyFormEmailDialog ref="DialogRef" @email-update="update" />
    <EasyFormEmailDialogReadonly ref="DialogReadonlyRef" />
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

const emits = defineEmits(['email-update'])
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps(['easyFormId', 'canOpen'])
const extraParams = {
  orderBy: 'email',
  isDesc: true
}
let filterParams: any = {}
const { t } = useI18n()
const loading = ref(false)
const {
  tableConfig,
  tableEvent,
  tableRef,
  reload,
  query,
  cleanSelectedRows
} = useVxeTable({
  id: 'clientTrashList',
  api: async (pageParams: any) => {
    pageParams.easyFormId = props.easyFormId
    if (!pageParams.easyFormId)
      return {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    return clientApi.api.postDmsEasyFormEmailLogPage({
      ...pageParams,
      ...extraParams,
      ...filterParams
    })
  },
  columns: [
    { field: 'email', title: 'user_email' },
    { field: 'subject', title: 'tableHeader_subject' },
    { field: 'createdBy', title: 'tableHeader.sentBy' },
    {
      field: 'status',
      title: 'common_status',
      type: 'html',
      formatter: ({ cellValue }) => {
        return cellValue ? `<div class="${cellValue} tag">${cellValue}</div>` : ''
      }
    },
    {
      field: 'sentDate',
      title: 'tableHeader.sentDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      title: 'tableHeader.relatedWorkflow',
      field: 'relatedWorkflows',
      slots: {
        default: 'relatedWorkflow'
      }
    },
    {
      title: 'tableHeader.relatedCase',
      field: 'relateCases',
      slots: {
        default: 'relatedCase'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'viewDetails',
        name: t('actions.viewDetails'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleViewEmail(row)
        }
      },
      {
        code: 'sendEmail',
        name: t('actions.sendEmail'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleSend(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleViewEmail(row)
  }
})

const ResponsiveFilterRef = ref()

async function initCondition() {
  console.log('initCondition', ResponsiveFilterRef)

  const data = [
    {
      key: 'status',
      label: 'common_status',
      type: 'String',
      isMultiple: false,
      options: [
        { label: 'Sent', value: 'Sent' },
        { label: 'Fail', value: 'Fail' },
        { label: 'Pending', value: 'Pending' }
      ]
    },
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'String',
      isMultiple: false,
      options: [
        { label: 'user_email', value: 'email' },
        { label: 'tableHeader.sentBy', value: 'createdBy' },
        { label: 'tableHeader.sentDate', value: 'sentDate' },
        { label: 'common_status', value: 'status' },
        { label: 'tableHeader_subject', value: 'subject' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.desc', value: false },
        { label: 'tableHeader.asc', value: true }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  filterParams = { ...formModel }
  if (!filterParams.email) delete filterParams.email
  try {
    reload()
  } catch (error) {
    console.log(error)
  }
}

// #region module:
const DialogReadonlyRef = ref()
const DialogRef = ref()

function handleSend(row) {
  DialogRef.value.handleOpen(props.easyFormId, row.email)
}

function update() {
  setTimeout(() => {
    query()
  }, 1000)
}

function handleViewEmail(row) {
  DialogReadonlyRef.value.handleOpen(row)
}

async function handleOpenWorkflow(row: any = {}, event) {
  if (!props.canOpen) return
  // row.processInstanceId = "b2ae2c95-0078-11f0-a987-56bed584d4f1"
  event.preventDefault()
  event.stopPropagation()
  if (!row.workflowInstanceId) return

  loading.value = true
  const newItem = await getWorkflowRoute(row.workflowInstanceId)
  if (!!newItem) routerProvider?.navigateTo(newItem)
  loading.value = false
}

function handleOpenCase(row: any = {}, event) {
  if (!props.canOpen) return
  event.preventDefault()
  event.stopPropagation()
  if (!row.caseId && !row.caseDefinitionVersionId) return
  loading.value = true
  // row.case_id = "single-case-000017";
  // row.caseDefinitionVersionId = "23:73a7cf5a-643f-4adf-bc3e-1c638b501589";
  const param = {
    instanceId: row.caseId,
    versionId: row.caseDefinitionVersionId,
    case_id: row.caseId
  }
  routerProvider?.navigateTo(caseManageDashboardPage(param))
  loading.value = false
}

// #endregion
onMounted(() => {
  initCondition()
})
defineExpose({ reload })
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

.vxe-grid {
  :deep(.tag) {
    display: inline-block;
    padding-inline: var(--app-space-xs);

    &.Fail {
      background: var(--app-error-color);
      color: #fff;
    }

    &.Sent {
      background: var(--app-success-color);
      color: #fff;
    }

    &.Pending {
      background: var(--app-info-color);
      color: #fff;
    }
  }

  .el-tag {
    margin: 1px var(--app-space-xs) 1px 0;
  }
}
</style>
