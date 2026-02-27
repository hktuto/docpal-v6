<script lang="ts" setup>
import { newAdminApi } from 'api'

const props = defineProps<{
  id: string
  expandedItems: any[]
}>()

const { id, expandedItems = [] } = toRefs(props)

const emits = defineEmits(['idChange', 'expandedItemsChange'])

const selectedRow = ref<any>(null)
let extraParams = {
  orderBy: 'name',
  isDesc: 'asc'
}
let isFilter = false

async function getChildApi(id: string = 'root') {
  return newAdminApi.postDocpalAclDocumentList({
    documentId: id,
    ...extraParams
  })
    .then((res: any) => res.data)
}

function recursiveLoadChild(checkList: any[] = [], treeData: any[], result: any[] = []) {
  checkList.forEach((row, index) => {
    const rowData = treeData.find((el) => el.id === row)
    if (rowData) {
      if (!tableRef.value?.isTreeExpandByRow(rowData)) {
        result.push(rowData)
      } else {
        result = recursiveLoadChild(checkList, rowData.children, result)
      }
    }
  })
  return result
}

const tableDialogRef = ref<any>(null)

function dblClickHandler(row: any) {
  if (!row.isFolder) {
    tableDialogRef.value.open({ ...row })
  } else {
    emits('idChange', row.id)
  }
}

const reopenFolder = useDebounceFn(() => {
  if (!tableRef.value || expandedItems.value.length === 0) return
  const tableData = tableRef.value.getData()
  let needExpandList: any[] = recursiveLoadChild(expandedItems.value, tableData, [])
  console.log(needExpandList, 'needExpandList')
  tableRef.value?.setTreeExpand(needExpandList, true)
  // get table opened row
}, 300)

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'rbac-resource-document-table',
  api: async (pageParams: any) => {
    const data = await getChildApi(id.value || 'root')
    return data
  },
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  childChangeHandler: () => {
    // reopenFolder()
  },
  dblClickAction: ({ row, column, event }) => {
    dblClickHandler(row)
  },
  columns: [
    {
      field: 'name',
      title: 'document_name',
      minWidth: 200,
      treeNode: true,
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        const mimeType = row.fileContent?.mime_type || ''
        // logic to get icon
        if (row.isFolder) {
          icon = '/icons/doc/folder.svg'
        }
        if (mimeType?.startsWith('image')) {
          icon = '/icons/doc/image.svg'
        } else if (mimeType?.startsWith('video')) {
          icon = '/icons/doc/video.svg'
        } else if (mimeType?.startsWith('audio')) {
          icon = '/icons/doc/audio.svg'
        } else if (mimeType?.startsWith('application/pdf')) {
          icon = '/icons/doc/pdf.svg'
        } else if (mimeType?.startsWith('application/zip')) {
          icon = '/icons/doc/zip.svg'
        } else if (
          mimeType?.startsWith('application/msword') ||
          mimeType?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        ) {
          icon = `/icons/doc/word.svg`
        } else if (
          mimeType?.startsWith('application/vnd.ms-powerpoint') ||
          mimeType?.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')
        ) {
          icon = `/icons/doc/ppt.svg`
        }
        return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} </span> `
      }
    },
    {
      field: 'documentType',
      title: 'docType_documentType'
    },
    {
      field: 'read',
      title: 'permission.read'
    },
    {
      field: 'readWrite',
      title: 'permission.write'
    },
    {
      field: 'manage',
      title: 'permission.manage'
    },
    {
      field: 'custom',
      title: 'permission.custom'
    }
  ],
  bodyActions: [
    [
      {
        code: 'detail',
        name: 'View Details',
        action: ({ row }: any) => {
          console.log(row)
          tableDialogRef.value.open({ ...row })
        }
      },
      {
        code: 'toggleExpand',
        name: 'toggleExpand',
        action: ({ row }: any) => {
          // TODO : toggle expand
          tableRef.value.toggleTreeExpand(row)
        }
      }
    ]
  ],
  permissionMethod: ({
                       options,
                       code,
                       column,
                       row,
                       rowIndex,
                       additionalData
                     }: any): {
    visible: boolean
    disabled: boolean
  } => {
    if (!row) {
      return {
        visible: false,
        disabled: false
      }
    }
    if (code === 'toggleExpand') {
      return {
        visible: row.isFolder,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  optionalConfig: {
    treeConfig: {
      transform: true,
      parentField: 'parentId',
      lazy: true,
      indent: 20,
      showLine: true,
      hasChildField: 'isFolder',
      loadMethod: async (params) => {
        const entry = await getChildApi(params.row.id)
        return entry
      }
    },
    checkboxConfig: {
      checkStrictly: true,
      showHeader: false,
      highlight: true,
      trigger: 'cell',
      visibleMethod: ({ row }: any) => row.source !== 'tempFile'
    },
    rowConfig: {
      height: 42,
      isCurrent: true,
      isHover: true,
      useKey: true
    },
    rowStyle: ({ rowIndex, row }) => {
      // TODO : remove this
      if (row.source === 'tempFile') {
        return {
          backgroundColor: 'var(--app-grey-800)'
        }
      }
    }
  },
  optionalEvent: {
    toggleTreeExpand: ({ expanded, row }) => {
      if (expanded) {
        // check if item exist in expandedItems
        if (expandedItems.value.includes(row.id)) return
        expandedItems.value.push(row.id)
        emits('expandedItemsChange', expandedItems.value)
      } else {
        const index = expandedItems.value.findIndex((ex) => ex === row.id)
        if (index !== -1) expandedItems.value.splice(index, 1)
        emits('expandedItemsChange', expandedItems.value)
      }
    }
  }
})

const ResponsiveFilterRef = ref()

function handleFilterFormChange(formData: any) {
  extraParams = formData
  isFilter = true
  query()
  setTimeout(() => {
    isFilter = false
  }, 2000)
}

let treeDataCopy = []

const { flatRole } = useRBAC()

async function getFilter() {
  async function getGroupList() {
    try {
      return await newAdminApi.postUcenterGroups().then(r => r.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async function getUserList() {
    try {
      return await newAdminApi.postUcenterGetKeycloakAllUsers({}).then((res) => res.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const userList = await getUserList()
  const groupList = await getGroupList()
  const filterSetting = [
    // {
    //   key: 'user',
    //   label: 'user_users',
    //   type: 'string',
    //   isMultiple: true,
    //   options: userList.map((item: any) => ({
    //     label: item.username,
    //     value: item.userId
    //   }))
    // },
    // {
    //   key: 'group',
    //   label: 'user_groups',
    //   type: 'string',
    //   isMultiple: true,
    //   options: groupList.map((item: any) => ({
    //     label: item.name,
    //     value: item.id
    //   }))
    // },
    // {
    //   key: 'role',
    //   label: 'user_role',
    //   type: 'string',
    //   isMultiple: false,
    //   options: flatRole.value.map((item) => ({
    //     label: item.name,
    //     value: item.id
    //   }))
    // },
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [{ label: 'document_name', value: 'name' }]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: 'asc' },
        { label: 'tableHeader.desc', value: 'desc' }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(filterSetting)
}

function getTable() {
  const tableData = tableRef.value.getData()
  const row = tableData.find((item: any) => item.id === '77f07980-3d28-11f0-b669-c5677da71c82')
  tableRef.value.toggleTreeExpand(row)
}

onMounted(() => {
  getFilter()
})
watch(
  id,
  () => {
    reload()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <!-- <div class="rbac-resource-document-table">
    <div style="overflow: hidden"> -->
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <div class="action_list_container">
        <!-- <el-button type="primary" @click="getTable()">Clear</el-button> -->
        <ResourceDocumentBreadcrumb :id="id" @idChange="emits('idChange', $event)" />
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
      </div>
    </template>
  </VxeGrid>
  <!-- </div> -->
  <ResourceDocumentPermissionDialog ref="tableDialogRef" />
  <!-- </div> -->
</template>

<style lang="scss" scoped>
.rbac-resource-document-table {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
}

.vxe-grid {
  :deep(.browseFileIcon) {
    width: calc(var(--app-space-m) * 1.5);
    height: calc(var(--app-space-m) * 1.5);
  }

  :deep(.browseNameCell) {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    cursor: pointer;
  }
}

.action_list_container {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-s);

  .breadcrumbContainer {
    flex: 1 0 auto;
  }

  .responsive-container {
    flex: 0 0 auto;
    border-left: 1px solid var(--app-grey-800);
  }
}
</style>
