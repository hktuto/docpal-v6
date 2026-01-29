<script lang="ts" setup>
import { clientApi } from 'api'
const tableData = defineModel<any>('tableData', { required: true })

const emit = defineEmits(['update:tableData', 'db-click', 'delete'])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'client-share-table',
  saveColumnOrder: false,
  virtualScroll: true,
  columns: [
    { title: 'table_name', field: 'name' },
    { slots: { default: 'watermark' }, title: 'watermark.watermark' },
    { slots: { default: 'readOnly' }, title: 'button.readOnly' },
    {
      title: 'table_modifiedDate',
      field: 'modifiedDate',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: any) => {
          emit('delete', row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    emit('db-click', row)
  }
})
const state = reactive<State>({
  loading: false,
  // tableData: [],
  options: {
    // multiSelect: true,
    showPagination: false
  },
  watermarkList: []
})
// const tableRef = ref()

function getUseWatermark(mimeType: string) {
  // check mintype is image, pdf or video
  if (mimeType.includes('image') || mimeType.includes('pdf') || mimeType.includes('video')) {
    return true
  }
  return false
}

// #endregion

function handleDblclick(row: any) {
  emit('db-click', row)
}
onMounted(async () => {
  if (!allowFeature('WATERMARK')) {
  } else {
    const data = await clientApi.api.getDocpalWatermarkTemplatesAll().then(r => r.data)
    state.watermarkList = data.sort((a, b) => a.name.localeCompare(b.name))
  }
})
function loadData() {
  tableRef.value.loadData(tableData.value)
}
onMounted(() => {
  nextTick(() => {
    loadData()
  })
})
watch(
  tableData,
  () => {
    if (tableRef.value) {
      loadData()
    }
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="tableContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #watermark="{ row, index }">
        <el-select v-if="row.mimeType && getUseWatermark(row.mimeType)" v-model="row.watermark" filterable default-first-option clearable>
          <el-option v-for="item in state.watermarkList" :key="item.id" :value="item.id" :label="item.name"></el-option>
        </el-select>
      </template>
      <template #readOnly="{ row, index }">
        <el-switch v-model="row.readOnly" active-color="#13ce66" inactive-color="#ff4949"></el-switch>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
.tableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}
</style>
