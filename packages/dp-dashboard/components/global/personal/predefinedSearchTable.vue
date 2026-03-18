<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #fileType> Smart Folder </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from "api";
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {};
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows,
} = useVxeTable({
  id: "d-smartFolder",
  zoom: false,
  virtualScroll: true,
  api: async (pageParams: any) => {
    return await newClientApi.getDmsSmartFolder({ ...pageParams, ...extraParams }).then(r => r.data)
  },
  columns: [
    { field: "name", title: "table_name", fixed: "left" },
    { field: "fileType", title: "dpDocument_fileType", 
      slots: {
        default: 'fileType'
      }
    },
  ],

  dblClickAction: ({ row, column, event }:any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
});
function handleDblclick(row: any) {
  
  routerProvider?.navigateTo(routeSmartFolderDetail(row), false)
}
onMounted(() => {
})
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
