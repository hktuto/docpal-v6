<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter
        ref="ResponsiveFilterRef"
        @form-change="handleFilterFormChange"
        inputKey="documentName"
      />
    </template>
  </VxeGrid>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
let extraParams = {}
let doneParams = {
  orderBy: 'createdDate',
  isDesc: true,
  states: ['A']
}

const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'c-retention-done',
  api: async (pageParams: any) => {
    // TODO 缺少新APi
    return clientApi.api.postPolicyRetentionsDocumentPage({
      ...doneParams,
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
      field: 'approver', title: 'tableHeader_approver',
      formatter({ cellValue }: any) {
        if (!cellValue) return t('System')
        else return cellValue
      }
    },
    {
      field: 'confirmAt',
      title: 'tableHeader_confirmAt',
      formatter({ cellValue, row }: any) {
        const date = row.applyApprovedDate ? row.applyApprovedDate : row.modifiedDate
        return formatDate(date)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'preview',
        name: 'retention_donePreview',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function getFilter() {
  // TODO 缺少新APi
  const data = await clientApi.api.getPolicyRetentionsDocumentPageConditions().then((res) => res.data)
  const foundItem = data.find(item => item.key === 'retentionPolicyIds')
  if (foundItem.options.length > 0) {
    foundItem.options.sort((a, b) => a.label.localeCompare(b.label))
    data[data.indexOf(foundItem)].options = foundItem.options
  }
  data.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'document_filePath', value: 'documentPath' },
        { label: 'tableHeader_name', value: 'documentName' }
        // { label: 'tableHeader_policyName', value: 'policyName' },
        // { label: 'tableHeader_approver', value: 'approver' },
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
  )
  ResponsiveFilterRef.value.init(data)
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

// #endregion
function handleDblclick(row: any) {
  routerProvider?.navigateTo(createDetailPageParams({
    docName: row.documentName,
    idOrPath: row.documentId,
    showHeaderAction: false
  }), false)
}

onMounted(() => {
  getFilter()
})
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
