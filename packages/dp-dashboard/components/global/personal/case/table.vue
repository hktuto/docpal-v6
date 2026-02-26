<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from "api";
const routerProvider = inject(MenuRouterKey);
const { t } = useI18n();
const platform = useAppPlatform()
let extraParams: any = {};
let caseId = "";
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows,
} = useVxeTable({
  id: "d-case",
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: "case_id", title: "caseManagement.id", fixed: "left" },
    {
      field: "modified_date",
      title: "table_modifiedDate",
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      },
    },
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row);
  },
  saveColumnOrder: false,
});
async function getData(
  params: any = {
    pageNum: 0,
    pageSize: 20,
  }
) {
  try {
    if (!caseId) {
      throw new Error("caseId is null");
    }
    if (platform.value === "admin") return;
    const res = await newClientApi
      .postCaseTypesCasetypeidRecordsPage(caseId, { ...params, ...extraParams })
      .then((res) => res.data);
    return {
      data: {
        entryList: res?.entryList,
        totalSize: res?.totalSize,
      },
    };
  } catch (error) {
    return {
      data: {
        entryList: [],
        totalSize: 0,
      },
    };
  }
}
function handleDblclick(row: any) {
  const item = caseManageDashboardPage({
    instanceId: row.case_id,
    case_id: row.instanceId,
    versionId: row.caseDefinitionVersionId,
  })
  routerProvider?.navigateTo(item);
}
async function setCaseId(id: string) {
  caseId = id;
  reload();
}

defineExpose({
  setCaseId, query, reload
});
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
