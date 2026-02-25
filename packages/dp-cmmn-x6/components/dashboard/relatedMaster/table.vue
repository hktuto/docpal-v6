<script lang="ts" setup>
import { newClientApi } from 'api'
import '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/vxeTableRender.ts'
const platform = useAppPlatform()
const { name, detail, relatedField } = defineProps<{
  name: string
  detail: any
  relatedField: any
}>()

const CMDProvider = inject(CaseManagementDashboardKey)
const caseId = CMDProvider?.instanceId?.value || null
let where = ref({})
const { t } = useI18n()
const emits = defineEmits(['filter-change', 'refresh'])
const routerProvider = inject(MenuRouterKey)

const caseEvents = ref<any>([])
const pageParams: any = {
  pageNum: 0,
  pageSize: 20,
  orderBy: 'created_date',
  isDesc: true
}
const extraParams: any = {
  where: {
    [relatedField]: caseId
  }
}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: `dashboardRelatedMasterTable${caseId}-${name}`,
  refresh: false,
  virtualScroll: true,
  api: async (params: any) => {
    if (platform.value === 'admin') {
      return []
    }
    const { data } = await newClientApi.postDmsMasterTableRecordPageNonpermission({
      name: name,
      ...pageParams,
      ...extraParams
    })
    return data
  },
  columns: [],
  zoom: false,
  saveColumnOrder: false
})

const dialogRef = ref()

async function reorderColumn(columns: any) {
  try {
    tableConfig.columns = columns
  } catch (e) {
    console.error('error', e)
  }
}
const responsiveFilterRef = ref()
function handleFilterFormChange(formModel) {
  if (formModel.q) {
    extraParams.where.q = formModel.q
  } else {
    delete extraParams.where.q
  }
  reload()
}

defineExpose({ reorderColumn, reload, query })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
</template>

<style lang="scss" scoped>
.tableActions {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  overflow: hidden;
  gap: var(--app-space-s);
  .responsive-container {
    flex: 1 0 auto;
    width: auto;
  }
}
:deep(.el-input) {
  width: 200px;
}
</style>
