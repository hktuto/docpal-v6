<script setup lang="ts">
import dayjs from 'dayjs'

const emits = defineEmits<{
  confirm: [payload: ReviewPayload]
}>()

type ReviewPayload = {
  office: string
  tnPlannedDate: string | number
  commodityInspection: string
  remark: string
  dataList: any[]
}

const visible = ref(false)
const formModel = reactive({
  office: '',
  tnPlannedDate: '' as string | number,
  commodityInspection: '',
  remark: ''
})
const dataList = ref<any[]>([])

function formatNumber(value: unknown, fractionDigits?: number) {
  const num = Number(value)
  if (Number.isNaN(num)) return value ?? ''
  return num.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits ?? 6
  })
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => dataList.value,
  columns: [
    {
      field: 'index',
      title: 'Ln.',
      align: 'center',
      type: 'seq',
      width: 60
    },
    {
      field: 'po_line_number',
      title: 'PO行號 PO Line',
      minWidth: 120
    },
    {
      field: 'po_number',
      title: 'PO編號 PO Number',
      minWidth: 160
    },
    {
      field: 'part_number',
      title: '零件編號 Part Number',
      minWidth: 160
    },
    {
      field: 'origin',
      title: '來源 Origin',
      minWidth: 100
    },
    {
      field: 'onhand_qty',
      title: '在手數量 Onhand Qty',
      minWidth: 140,
      formatter({ cellValue }: any) {
        return formatNumber(cellValue, 0)
      }
    },
    {
      field: 'product_name',
      title: '產品名稱 Product Name',
      minWidth: 160
    },
    {
      field: 'from_sub_inventory',
      title: '來自子庫存 From Sub-Inv',
      minWidth: 150
    },
    {
      field: 'sub_inventory',
      title: '至子庫存 To Sub-Inv',
      minWidth: 140
    },
    {
      field: 'qty',
      title: '轉移數量 Transfer Qty',
      minWidth: 140,
      formatter({ cellValue }: any) {
        return formatNumber(cellValue, 0)
      }
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price (CNY)',
      minWidth: 160,
      formatter({ cellValue }: any) {
        return formatNumber(cellValue, 6)
      }
    },
    {
      field: 'amount',
      title: '合計 Amount (CNY)',
      minWidth: 150,
      formatter({ cellValue }: any) {
        return formatNumber(cellValue, 2)
      }
    }
  ],
  zoom: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false
})

function open(payload: ReviewPayload) {
  formModel.office = payload.office || ''
  formModel.tnPlannedDate = payload.tnPlannedDate || ''
  formModel.commodityInspection = payload.commodityInspection || ''
  formModel.remark = payload.remark || ''
  dataList.value = (payload.dataList || []).map((item) => ({
    ...item,
    onhand_qty: item.onhand_qty ?? item.sys_qty
  }))
  visible.value = true
  nextTick(() => reload())
}

function handleCancel() {
  visible.value = false
}

function handleConfirm() {
  emits('confirm', {
    office: formModel.office,
    tnPlannedDate: formModel.tnPlannedDate,
    commodityInspection: formModel.commodityInspection,
    remark: formModel.remark,
    dataList: dataList.value
  })
  visible.value = false
}

const displayTnPlannedDate = computed(() => {
  if (!formModel.tnPlannedDate) return ''
  return dayjs(formModel.tnPlannedDate).format('YYYY/MMM/DD')
})

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Transfer Note Creation - Confirm"
    append-to-body
    class="big"
    destroy-on-close
    align-center
  >
    <el-form :model="formModel" label-position="top" class="tn-review-form">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="辦事處 Office">
            <el-input :model-value="formModel.office" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="TN計畫日期 TN Planned Date">
            <el-input :model-value="displayTnPlannedDate" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品檢驗 Commodity Inspection">
            <el-input :model-value="formModel.commodityInspection" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="備註 Remarks">
        <el-input :model-value="formModel.remark" type="textarea" :rows="2" disabled />
      </el-form-item>
    </el-form>

    <div class="tn-review-table">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" />
    </div>

    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button type="primary" @click="handleConfirm">Confirm and Submit</el-button>
    </template>
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
