<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
        />
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

import { createBrowseListPageParams, createUploadRequestDetailParams } from '../../../utils/browseMenuHelper'
import { MenuRouterKey } from '#imports'

const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
let extraParams: any = {}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'clientUploadRequestList',
  api: async (pageParams: any) => {
    const _pageParams = {
      ...pageParams,
      pageIndex: pageParams.pageNum,
      pageSize: pageParams.pageSize
    }
    delete pageParams.pageNum
    const data = await newClientApi.getDmsUploadRequest({
      ..._pageParams,
      ...extraParams
    }).then(r => r.data)
    return {
      data: {
        entryList: data?.requests,
        totalSize: data?.total
      }
    }
  },
  columns: [
    { field: 'email', title: 'user_email' },
    { field: 'logicalPath', title: 'document_folderPath' },
    { field: 'message', title: 'dpTable_message' },
    {
      field: 'status',
      title: 'document_uploadStatus',
      formatter({ cellValue }: any) {
        if (cellValue === 'completed') return t(`pending_${cellValue}`)
        return t(cellValue)
      }
    },
    {
      field: 'createdDate',
      title: 'document_uploadDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'preview',
        name: 'common_preview',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'toFolder',
        name: 'document_view',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          toFolder(row)
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
      case 'preview':
        return {
          visible: args.row.status === 'pending_approval',
          disabled: false
        }

      // case "toFolder":
      //   return {
      //     visible: args.row.status === "completed",
      //     disabled: false,
      //   };
    }
    return {
      visible: true,
      disabled: false
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  optionalConfig: {
    cellClassName({ row, column }) {
      if (row.status === 'completed') return 'completed-row'
      else if (row.status !== 'pending_approval') return 'disabled-row'
      return null
    }
  }
})

function handleDblclick(row: any) {
  if (row.status !== 'pending_approval') return
  routerProvider?.navigateTo(
    createUploadRequestDetailParams({ ...row, paramKey: 'taskId' }),
    false
  )
}

function toFolder(row: any) {
  routerProvider?.navigateTo(
    createBrowseListPageParams({ idOrPath: row.documentId }),
    false
  )
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
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
        { label: 'user_email', value: 'email' },
        { label: 'document_folderPath', value: 'logicalPath' },
        { label: 'document_uploadDate', value: 'createdDate' },
        { label: 'document_uploadStatus', value: 'status' }
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
  // getFilter()
})
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

:deep(.disabled-row) {
  background-color: var(--app-grey-800);
  // color: var(--app-grey-900)
}

:deep(.completed-row) {
  background-color: var(--app-grey-800);
  // color: var(--app-grey-900)
}
</style>
