<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
          inputKey="documentName"
          inputPlaceHolder="holdPolicy_clientFilter"
        />
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { routeHoldPageFolder } from '../../../utils/routerHelper.ts'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
let extraParams = {}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'c-hold',
  api: async (pageParams: any) => {
    return clientApi.api.postDmsPolicyHoldDocumentListQuery({ ...pageParams, ...extraParams })
  },
  columns: [
    {
      field: 'documentName',
      title: 'tableHeader.folderName',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/folder.svg'
        return `<span class="tableRow-icon-cell"><img src="${icon}" /> ${cellValue}</span>`
      }
    },
    { field: 'documentPath', title: 'document_folderPath' },
    { field: 'policyHoldName', title: 'tableHeader_policyName' },
    { field: 'applyBy', title: 'tableHeader_applyBy' },
    { field: 'applyApprovedBy', title: 'tableHeader_approver' },
    {
      field: 'applyApprovedDate',
      title: 'tableHeader_confirmAt',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
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
  const data: any = await clientApi.api.getDmsPolicyHoldDocumentListConditions().then((res) => res.data)
  data.forEach((item: any) => {
    if (item.options && item.options.length > 0) {
      item.options.sort((a: any, b: any) => a.value.toString().localeCompare(b.value.toString()))
    }
  })
  data.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader_applyBy', value: 'applyBy' },
        { label: 'tableHeader_approver', value: 'applyApprovedBy' },
        { label: 'tableHeader.folderName', value: 'documentName' },
        { label: 'tableHeader_path', value: 'documentPath' }
        // { label: 'tableHeader_policyName', value: 'policyHoldName' },
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

  ResponsiveFilterRef.value?.init(data)
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

// #endregion
function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeHoldPageFolder(row), false)
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
