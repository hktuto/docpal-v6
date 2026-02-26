<script lang="ts" setup>
import { newClientApi } from 'api'
import { rendererFunction } from '@packages/dp-dashboard/components/formSlot/displayColumn/vxeTableRender'
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
const list = ref<any>([])
const DynamicRenderer = ({ column, data }: any) => {
  if (column.cellRender?.name && rendererFunction[column.cellRender.name]) {
    return rendererFunction[column.cellRender.name](
      {
        params: column.cellRender.params
      },
      { row: data, column: { field: column.field } }
    )
  }
  const value = column.formatter ? column.formatter({ cellValue: data[column.field] }) : data[column.field]
  return h(
    'div',
    {
      class: 'card-item-value'
    },
    value
  )
}

async function getList() {
  if (platform.value === 'admin') {
    list.value = []
    return
  }
  const { data } = await newClientApi.postDmsMasterTableRecordPageNonpermission({
    name: name,
    ...pageParams,
    ...extraParams
  })
  list.value = data || []
}
const columnsSetting = ref<any>([])
async function reorderColumn(columns: any) {
  try {
    console.log('reorderColumn', columns)
    columnsSetting.value = columns
  } catch (e) {
    console.error('error', e)
  }
}

function reload() {
  getList()
}

function query() {
  getList()
}

onMounted(() => {
  getList()
})

defineExpose({ reorderColumn, reload, query })
</script>
<template>
  <div class="cardListContainer">
    <div v-for="item in list" :key="item.id" class="card">
      <div v-for="column in columnsSetting" :key="column.field" class="card-item">
        <div class="card-item-label">{{ column.title }}</div>
        <!-- value -->
        <DynamicRenderer class="card-item-value" :column="column" :data="item" />
        <!-- <div class="card-item-value">
          {{ column.formatter ? column.formatter({cellValue: item[column.field]}) : item[column.field] }}
        </div> -->
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.cardListContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  height: 100%;
  overflow: auto;
}
.card {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}
.card-item-label {
  font-size: var(--app-font-size-m);
  color: var(--app-grey-600);
}
.card-item-value {
  font-size: var(--app-font-size-l);
  color: var(--el-text-color-primary);
  font-weight: 600;
  word-break: break-all;
}
.card + .card {
  padding-top: var(--app-space-xs);
  border-top: 1px solid var(--el-border-color-light);
}
</style>
