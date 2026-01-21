<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
        />
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 0" type="info">
          {{ $t('dpStatus.pending') }}
        </el-tag>
        <el-tag v-else-if="row.status === 1" type="primary">
          {{ $t('dpStatus.shared') }}
        </el-tag>
        <el-tag v-else-if="row.status === 2" type="danger">
          {{ $t('dpStatus.stopSharing') }}
        </el-tag>
        <el-tag v-else-if="row.status === 3" type="info">
          {{ $t('dpStatus.expired') }}
        </el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { routeShareMePageFolder } from '~/utils/routerHelper'
import { MenuRouterKey } from '#imports'

const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'internal-me',
  api: (pageParams: any) =>
    clientApi.api.postDmsInternalshareMe({ ...pageParams, ...extraParams }),
  columns: [
    {
      field: 'documentNames',
      title: 'tableHeader.fileOrFolderName',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        if (row.isFolder) {
          icon = '/icons/doc/folder.svg'
        }
        return `<span class="tableRow-icon-cell"><img src="${icon}" /> ${cellValue}</span>`
      }
    },
    { field: 'path', title: 'document_path' },
    { field: 'createdUserId', title: 'tableHeader_shareBy' },
    {
      field: 'createdDate',
      title: 'tableHeader_shareDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'startDate',
      title: 'shareWithMe_startDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'expiredDate',
      title: 'shareWithMe_endDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'permission',
      title: 'dpTable_permission',
      formatter({ cellValue }: any) {
        return t(`permission.${cellValue}`)
      }
    },
    {
      field: 'status',
      title: 'shareWithMe_status',
      slots: {
        default: 'status'
      }
    }
  ],
  // bodyActions: [
  //   [
  //     {
  //       code: "preview",
  //       name: t("common_preview"),
  //       visible: true,
  //       disabled: false,
  //       action: ({ row }: any) => {
  //         handleDblclick(row);
  //       },
  //     },
  //   ],
  // ],
  bodyActions: [
    [
      {
        code: 'docOpen',
        name: 'common_open',
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'docActionAddFolder',
        name: 'filePopover_newFolder',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionAddFolder', {
            detail: initToDocument(row)
          })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionNewFile',
        name: 'filePopover_newFile',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionNewFile', { detail: initToDocument(row) })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionUploadFile',
        name: 'filePopover_uploadFile',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionUploadFile', {
            detail: initToDocument(row)
          })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionUploadFolder',
        name: 'filePopover_uploadFolder',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionUploadFolder', {
            detail: initToDocument(row)
          })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionRename',
        name: 'filePopover_rename',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionRename', { detail: initToDocument(row) })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionChangeDocType',
        name: 'filePopover_changeDocType',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionChangeDocType', {
            detail: initToDocument(row)
          })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docWatermark',
        name: 'filePopover_watermark',
        action: async ({ row }: any) => {
          const detail = await clientApi.api
            .postNuxeoDocument({ idOrPath: row.documentIds })
            .then((res) => res.data)
          const ev = new CustomEvent('docWatermark', { detail: detail })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionInternalShare',
        name: 'filePopover_internalShare',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionInternalShare', {
            detail: initToDocument(row)
          })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionDelete',
        name: 'filePopover_delete',
        action: ({ row }: any) => {
          const ev = new CustomEvent('docActionDelete', { detail: initToDocument(row) })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionRefresh',
        name: 'common_refresh',
        action: ({ row }: any) => {
          reload()
        }
      },
      {
        code: 'docActionNewTab',
        name: 'rightClick.newTab',
        action: ({ row }: any) => {
          if (row.isFolder) {
            const link = createBrowseListPageParams({
              idOrPath: row.documentIds
            })
            routerProvider?.navigateTo(link, true)
            return
          }
          const detailLink = createDetailPageParams({
            idOrPath: row.documentIds,
            docName: row.documentNames,
            showHeaderAction: true
          })
          routerProvider?.navigateTo(detailLink, true)
        }
      },
      {
        code: 'docActionDownload',
        name: 'rightClick.download',
        action: ({ row }: any) => {
          downloadHandler(initToDocument(row))
        }
      }
    ]
  ],
  additionalPermission: async ({ row }: any) => {
    if (!row) {
      return {}
    }
    const userId = useUserId()
    const permission = await getPermission(row.documentIds, userId.value)
    return permission
  },
  permissionMethod: ({ options, code, column, row, rowIndex, additionalData }: any) => {
    // if click on empty row, return empty
    if (!row) {
      return {
        visible: false,
        disabled: false
      }
    }
    const publicActionsCode = ['docActionRefresh', 'docActionNewTab', 'docOpen']
    if (publicActionsCode.includes(code)) {
      return { visible: true, disabled: false }
    }
    // hide all action when click on temp file
    if (row.source === 'tempFile') {
      return { visible: false, disabled: false }
    }
    // need other permissiion check list
    if (code === 'docActionPaste') {
      return {
        visible:
          AllowTo({ feature: 'ReadWrite', permission: additionalData }) &&
          copyDocumentList.value.length > 0,
        disabled: false
      }
    }
    const actionThatFolderAndFileHave = [
      'docActionRename',
      'docActionInternalShare',
      'docActionChangeDocType',
      'docActionCopy',
      'docActionCut',
      'docActionPaste',
      'docActionDelete'
    ]
    if (actionThatFolderAndFileHave.includes(code)) {
      const ManageCode = ['docActionInternalShare']
      if (ManageCode.includes(code)) {
        return {
          visible: AllowTo({ feature: 'ManageRecord', permission: additionalData })
        }
      }
      return {
        visible: AllowTo({ feature: 'ReadWrite', permission: additionalData })
      }
    }
    // get permission
    const folderActionsCode = [
      'docActionAddFolder',
      'docActionNewFile',
      'docActionUploadFile',
      'docActionUploadFolder'
    ]
    // handle folder actions
    if (folderActionsCode.includes(code)) {
      return {
        visible:
          row.isFolder && AllowTo({ feature: 'ReadWrite', permission: additionalData }),
        disabled: false
      }
    } else {
      return {
        visible:
          !row.isFolder && AllowTo({ feature: 'ReadWrite', permission: additionalData }),
        disabled: false
      }
    }
    return {
      visible: false,
      disabled: false
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function initToDocument(row: any) {
  return {
    id: row.documentIds,
    name: row.documentNames
  }
}

function handleDblclick(row: any) {
  if (row.isFolder) {
    routerProvider?.navigateTo(routeShareMePageFolder(row), false)
  } else {
    routerProvider?.navigateTo(
      createDetailPageParams({
        docName: row.documentNames,
        idOrPath: row.documentIds,
        showHeaderAction: true
      }),
      false
    )
  }
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
        { label: 'tableHeader.fileOrFolderName', value: 'documentNames' },
        { label: 'document_path', value: 'path' },
        { label: 'dpTable_permission', value: 'permission' },
        { label: 'tableHeader_shareBy', value: 'createdUserId' },
        { label: 'tableHeader_shareDate', value: 'createdDate' },
        { label: 'shareWithMe_endDate', value: 'expiredDate' },
        { label: 'shareWithMe_startDate', value: 'startDate' },
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
</style>
