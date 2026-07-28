<script setup lang="ts">
export interface DataItemType {
  line_id: string
  customerPoLine: number
  quantity: number
  taxCode: string
  requestDate: string
  quantityCancelled: number
  customerPo: string
  uom: string
  taxAmount: number
  promiseDate: string
  quantityShipped: number
  customerItem: string
  customerUnitPrice: number
  leadTime: number
  scheduledShipDate: string
  scheduledArrivalDate: string
  orderedItem: string
  unitPrice: number
  description: string
  subInventory: string
  references: string
  piRemark: string
  remarks: string
}

const rowData = defineModel<DataItemType>({ required: true })

const {
  disabled = false,
  columns = 4,
  partList = [],
  taxCodeList = [],
  subInventoryList = []
} = defineProps<{
  disabled?: boolean
  columns?: 2 | 4
  partList?: any[]
  taxCodeList?: any[]
  subInventoryList?: any[]
}>()

const colSpan = computed(() => (columns === 2 ? 12 : 6))
const remarkSpan = computed(() => (columns === 2 ? 24 : 12))
</script>

<template>
  <el-form label-position="top" class="all-input-style" :disabled="disabled">
    <el-row>
      <el-col :span="colSpan">
        <el-form-item label="客戶採購訂單行 Customer PO Line">
          <el-input-number v-model="rowData.customerPoLine" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="數量 Quantity">
          <el-input-number v-model="rowData.quantity" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="稅碼 Tax Code">
          <el-select v-model="rowData.taxCode">
            <el-option v-for="part in taxCodeList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申請日期 Request Date">
          <el-date-picker v-model="rowData.requestDate" type="date" />
        </el-form-item>
        <el-form-item label="取消數量 Quantity Cancelled">
          <el-input v-model="rowData.quantityCancelled" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶訂單 Customer PO">
          <el-input v-model="rowData.customerPo" />
        </el-form-item>
        <el-form-item label="計量單位 UOM">
          <el-input v-model="rowData.uom" />
        </el-form-item>
        <el-form-item label="稅額 Tax Amount">
          <el-input v-model="rowData.taxAmount" disabled />
        </el-form-item>
        <el-form-item label="承諾日期 Promise Date">
          <el-date-picker v-model="rowData.promiseDate" type="date" />
        </el-form-item>
        <el-form-item label="出貨數量 Quantity Shipped">
          <el-input v-model="rowData.quantityShipped" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶商品編號 Customer Item">
          <el-input v-model="rowData.customerItem" />
        </el-form-item>
        <el-form-item label="客戶單價 Customer Unit Price">
          <el-input-number v-model="rowData.customerUnitPrice" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="交貨週期（天）Lead Time(Days)">
          <el-input-number v-model="rowData.leadTime" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="預定出貨日期 Scheduled Ship Date">
          <el-date-picker v-model="rowData.scheduledShipDate" type="date" />
        </el-form-item>
        <el-form-item label="參考 References">
          <el-input v-model="rowData.references" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="訂單商品編號 Ordered Item">
          <el-select v-model="rowData.orderedItem" filterable>
            <el-option v-for="part in partList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="單價 Unit Price">
          <el-input-number v-model="rowData.unitPrice" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="描述 Description">
          <el-input v-model="rowData.description" disabled />
        </el-form-item>
        <el-form-item label="預定抵達日期 Scheduled Arrival Date">
          <el-date-picker v-model="rowData.scheduledArrivalDate" type="date" disabled />
        </el-form-item>
        <el-form-item label="子庫存 Sub-Inventory">
          <el-select v-model="rowData.subInventory">
            <el-option v-for="part in subInventoryList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="remarkSpan">
        <el-form-item label="PI 備註 PI Remark">
          <el-input v-model="rowData.piRemark" style="width: 95%" />
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
