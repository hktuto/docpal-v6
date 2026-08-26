<script lang="ts" setup>
import { clientApi } from 'api'
async function getTableData(params) {
  console.log("getTableData", params)
  const res = await clientApi.instance.get(`/v1/ms/oracle/shipping-copy/list-latest?pageNum=${params.pageNum+1}&pageSize=${params.pageSize}`, {
    baseURL:'/apis'
  })
  res.data.entryList = res.data.items
  res.data.totalSize = res.data.total
  return res
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: "shipConfirmTable",
  api: (pageParams:any) => getTableData(pageParams),
  columns: [
    {
      type: 'checkbox',
      width: 50
    },
    {
      title: "ORG / Invoice# / Version",
      type: "html",
      width: 220,
      formatter: ({ cellValue, row }: any) => {
        return `${row.org_id} / ${row.pi_num} / <div class="el-tag">${row.version_no}</div>`
      }
    },
    {
      field: "customer",
      title: "Customer",
    }, {
      field: "old_plan_date",
      title: "Invoice Date",
    }, {
      field: "new_plan_date",
      title: "Plan Date",
    }, {
      field: "count",
      title: "Download Count",
    }
  ]
})

</script>

<template>
<DashboardCard>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <slot name="toolbar_buttons" />
        </template>
    </VxeGrid>
</DashboardCard>
</template>

<style lang="scss" scoped>
</style>
