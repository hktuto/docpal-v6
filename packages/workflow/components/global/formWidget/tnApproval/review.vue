<script setup lang="ts">
type ReviewPayload = {
  office: string
  toPlannedDate: string | number
  commodityInspection: string
  remark: string
  dataList: any[]
}

const visible = ref<boolean>(false)
const formModel = reactive({
  office: '',
  toPlannedDate: '' as string | number,
  commodityInspection: '',
  remark: ''
})
const dataList = ref<any[]>([])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => dataList.value,
  columns: [
    {
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'po_number',
      title: 'PO編號 PO Number',
      minWidth: 240
    },
    {
      field: 'part_number',
      title: '零件編號 Part Number',
      minWidth: 240
    },
    {
      field: 'origin',
      title: '來源 Origin',
      minWidth: 100
    },
    {
      field: 'sys_qty',
      title: '系統數量 Sys Qty',
      minWidth: 240
    },
    {
      field: 'product_name',
      title: '產品名稱 Product Name',
      minWidth: 240
    },
    {
      field: 'from_sub_inventory',
      title: '來自子庫存 From Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: '至子庫存 To Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'qty',
      title: '轉移數量 Transfer Qty',
      minWidth: 140
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price',
      minWidth: 160
    },
    {
      field: 'amount',
      title: '合計 Amount',
      minWidth: 150
    }
  ],
  zoom: false,
  customeToolBar: true,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false
})

function open(payload: ReviewPayload) {
  visible.value = true
  formModel.office = payload.office
  formModel.toPlannedDate = payload.toPlannedDate
  formModel.commodityInspection = payload.commodityInspection
  formModel.remark = payload.remark
  dataList.value = payload.dataList

  nextTick(() => reload())
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Transfer Note Creation - Confirm" append-to-body class="big" destroy-on-close @close="visible = false">
    <el-form :model="formModel" label-position="top" class="tn-review-form">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="辦事處 Office">
            <el-input :model-value="formModel.office" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="TN計畫日期 TN Planned Date">
            <el-input :model-value="formModel.toPlannedDate" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品檢驗 Commodity Inspection">
            <el-input :model-value="formModel.commodityInspection" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="備註 Remarks">
        <el-input :model-value="formModel.remark" disabled />
      </el-form-item>
    </el-form>

    <div class="tn-review-table">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" />
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.tn-review-form {
  margin-bottom: 12px;
}

.tn-review-table {
  height: 50vh;
}
</style>
