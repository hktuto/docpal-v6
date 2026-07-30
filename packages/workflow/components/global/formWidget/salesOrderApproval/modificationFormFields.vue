<script setup lang="ts">
export interface DataItemType {
  line_id: string
  customer_po_line: number
  quantity: number
  tax_code: string
  request_date: string
  quantity_cancelled: number
  customer_po: string
  uom: string
  tax_amount: number
  promise_date: string
  quantity_shipped: number
  customer_item: string
  customer_unit_price: number
  lead_time: number
  scheduled_ship_date: string
  schedule_arrival_date: string
  ordered_item: string
  unit_price: number
  description: string
  sub_inventory: string
  references: string
  pi_remark: string
  remarks: string
  status: string
}

const rowData = defineModel<DataItemType>({ required: true })

const {
  disabled = false,
  columns = 4,
  partList = [],
  tax_codeList = [],
  sub_inventoryList = []
} = defineProps<{
  disabled?: boolean
  columns?: 2 | 4
  partList?: any[]
  tax_codeList?: any[]
  sub_inventoryList?: any[]
}>()

const colSpan = computed(() => (columns === 2 ? 12 : 6))
const remarkSpan = computed(() => (columns === 2 ? 24 : 12))
</script>

<template>
  <el-form label-position="top" class="all-input-style" :disabled="disabled">
    <el-row>
      <el-col :span="colSpan">
        <el-form-item label="客戶採購訂單行 Customer PO Line">
          <el-input-number v-model="rowData.customer_po_line" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="數量 Quantity">
          <el-input-number v-model="rowData.quantity" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="稅碼 Tax Code">
          <el-select v-model="rowData.tax_code">
            <el-option v-for="part in tax_codeList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申請日期 Request Date">
          <el-date-picker v-model="rowData.request_date" type="date" />
        </el-form-item>
        <el-form-item label="取消數量 Quantity Cancelled">
          <el-input v-model="rowData.quantity_cancelled" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶訂單 Customer PO">
          <el-input v-model="rowData.customer_po" />
        </el-form-item>
        <el-form-item label="計量單位 UOM">
          <el-input v-model="rowData.uom" />
        </el-form-item>
        <el-form-item label="稅額 Tax Amount">
          <el-input v-model="rowData.tax_amount" disabled />
        </el-form-item>
        <el-form-item label="承諾日期 Promise Date">
          <el-date-picker v-model="rowData.promise_date" type="date" />
        </el-form-item>
        <el-form-item label="出貨數量 Quantity Shipped">
          <el-input v-model="rowData.quantity_shipped" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶商品編號 Customer Item">
          <el-input v-model="rowData.customer_item" />
        </el-form-item>
        <el-form-item label="客戶單價 Customer Unit Price">
          <el-input-number v-model="rowData.customer_unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="交貨週期（天）Lead Time(Days)">
          <el-input-number v-model="rowData.lead_time" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="預定出貨日期 Scheduled Ship Date">
          <el-date-picker v-model="rowData.scheduled_ship_date" type="date" />
        </el-form-item>
        <el-form-item label="參考 References">
          <el-input v-model="rowData.references" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="訂單商品編號 Ordered Item">
          <el-select v-model="rowData.ordered_item" filterable>
            <el-option v-for="part in partList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="單價 Unit Price">
          <el-input-number v-model="rowData.unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="描述 Description">
          <el-input v-model="rowData.description" disabled />
        </el-form-item>
        <el-form-item label="預定抵達日期 Scheduled Arrival Date">
          <el-date-picker v-model="rowData.schedule_arrival_date" type="date" disabled />
        </el-form-item>
        <el-form-item label="子庫存 Sub-Inventory">
          <el-select v-model="rowData.sub_inventory">
            <el-option v-for="part in sub_inventoryList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="remarkSpan">
        <el-form-item label="PI 備註 PI Remark">
          <el-input v-model="rowData.pi_remark" style="width: 95%" />
        </el-form-item>
      </el-col>

      <el-col :span="remarkSpan">
        <el-form-item label="備註 Remarks">
          <el-input v-model="rowData.remarks" style="width: 95%" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input) {
    width: 90%;
  }
  ::v-deep(.el-input-number) {
    width: 90%;
  }
  ::v-deep(.el-select) {
    width: 90%;
  }
}
</style>
