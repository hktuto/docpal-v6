<script setup lang="ts">
import { newClientApi } from 'api'

const props = defineProps<{
  name: string
  startDate: string
  endDate: string
  stage: string
  sortingField: string
  orderBy: boolean
}>()

const dataList = ref([])
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-ApplicationFormsPassLog',
  virtualScroll: true,
  api: () => getData(),
  columns: [
    { field: 'datetime', title: 'Date Time', fixed: 'left' },
    { field: 'batch_no', title: 'Batch No.' },
    { field: 'form', title: 'Form' },
    { field: 'to', title: 'To' },
    { field: 'No of Applications', title: 'No of Applications' },
    { field: 'form_type', title: 'Form Type' },
    { field: 'user_id', title: 'User ID' },
    { field: 'is_overwrite', title: 'Insert/Replace' },
    { field: 'remark', title: 'Remark' }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

async function getData() {
  const rpcParams = {
    p_start_date: props.startDate,
    p_end_date: props.endDate,
    p_stage: props.stage,
    p_distinct_flag: 2,
    default_schema: true
  }
  const data: any[] = await newClientApi.postPostgrestRpcFunc('get_batch_stage_detail_report', JSON.stringify(rpcParams)).then((res: any) => res.data)
  dataList.value = data as any[]
  return data
}

function HandleSorting() {
  const sort = dataList.value.sort((a, b) => {
    if (props.orderBy) {
      return b[props.sortingField].localeCompare(a[props.sortingField], undefined, { sensitivity: 'base' })
    } else {
      return a[props.sortingField].localeCompare(b[props.sortingField], undefined, { sensitivity: 'base' })
    }
  })
  tableRef.value.loadData(sort)
}

defineExpose({
  query,
  HandleSorting
})
</script>

<template>
  <div class="pageContainer--padding">
    <VxeGrid show-footer ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <span style="font-size: 23px; font-weight: bold">{{ props.name }}</span>
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss"></style>
