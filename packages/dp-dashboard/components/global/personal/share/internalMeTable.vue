<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-internalShare',
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: 'documentNames', title: 'tableHeader.fileOrFolderName', fixed: 'left' },
    { field: 'createdUserId', title: 'tableHeader_shareBy' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})
async function getData(params: any = {}) {
  if (platform.value === 'admin') return
  const res = await newClientApi.postDmsInternalshareMe({ ...params, ...extraParams }).then((res) => res.data)
  return {
    data: {
      entryList: res?.entryList,
      totalSize: res?.totalSize
    }
  }
}
function handleDblclick(row: any) {
  if (platform.value === 'admin') return
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
defineExpose({ query, reload })
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}
.responsive-container {
  width: 70%;
  :deep(.el-input) {
    width: 200px;
  }
}
</style>
