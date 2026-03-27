<script setup lang="ts">
import { newClientApi } from 'api'

const props = defineProps<{
  project: string
  name: string
  startDate: string
  endDate: string
  stage: string
  sortingField: string
  orderBy: boolean
}>()

const emits = defineEmits(['dataLoaded'])

const dataList = ref<any[]>([])
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-ApplicationFormsPassLog',
  virtualScroll: true,
  api: () => getData(),
  columns: [
    { field: 'datetime', title: 'Date Time', fixed: 'left' },
    {
      field: 'batch_no',
      title: 'Batch No.',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'from_application_number',
      title: 'Form',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'to_application_number',
      title: 'To',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'no_of_application',
      title: 'No of Applications',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'form_type',
      title: 'Form Type',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    { field: 'user_id', title: 'User ID' },
    {
      field: 'insert_replace',
      title: 'Insert/Replace',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'remark',
      title: 'Remark',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

async function getData() {
  const rpcParams = {
    p_project_id: props.project,
    p_start_date: props.startDate,
    p_end_date: props.endDate,
    p_stage: props.stage,
    p_distinct_flag: 2,
    default_schema: true
  }
  const data: any[] = await newClientApi.postPostgrestRpcFunc('get_batch_stage_detail_report', JSON.stringify(rpcParams)).then((res: any) => res.data)
  dataList.value = data as any[]
  // Emit data to parent
  emits('dataLoaded', { stage: props.stage, data })
  return data
}

function HandleSorting() {
  const field = props.sortingField
  if (!field) return
  const getVal = (row: any) => {
    const v = row?.[field]
    return v == null ? '' : String(v)
  }
  const sorted = [...dataList.value].sort((a, b) => {
    const va = getVal(a)
    const vb = getVal(b)
    const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' })
    return props.orderBy ? cmp : -cmp
  })
  tableRef.value?.loadData(sorted)
}

defineExpose({
  query,
  HandleSorting,
  getDataList: () => dataList.value
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
