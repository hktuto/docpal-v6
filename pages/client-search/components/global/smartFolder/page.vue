<script lang="ts" setup>
import { newClientApi } from "api";
import { routeSmartFolderDetail } from "~/utils/routerHelper";
const routerProvider = inject(MenuRouterKey);
if (!routerProvider) {
  throw new Error("MenuRouterKey is not provided");
}
const state = reactive<any>({
  breadcrumbs: [{ path: '/smartFolder', icon: '/icons/home.svg'}],
})
let extraParams: any = {};
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows,
} = useVxeTable({
  id: "my_task",
  api: async(pageParams: any) => {
    const res = await newClientApi.getDmsSmartFolder({
      ...pageParams,
      ...extraParams
    }).then(res => res.data)
    return {
      data: {
        entryList: res,
        total: res?.length || 0
      }
    }
  },
  columns: [
    { field: "name", title: "smartFolder_name", fixed: "left" },
    { title: "dpDocument_fileType",
      formatter ({ cellValue }:any) {
        return 'Smart Folder'
      }
    }
  ],
  bodyActions: [
    [{
        code: "preview",
        name: "smartFolder_preview",
        action: ({ row }: any) => {
          handleDblclick(row);
        },
      }
    ],
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row);
  },
});
function handleDblclick(row: any) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeSmartFolderDetail({
    ...row
  }), false);
}
</script>
<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <SmartFolderBreadCrumb :breadcrumbs="state.breadcrumbs"></SmartFolderBreadCrumb>
      </template>
    </VxeGrid>
  </div>
</template>
<style lang="scss" scoped>
</style>