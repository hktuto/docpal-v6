<script setup lang="ts">
import type { FormRules } from 'element-plus'

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
  oldData = {},
  disabled = false,
  columns = 4,
  partList = [],
  taxCodeList = [],
  subInventoryList = []
} = defineProps<{
  oldData?: DataItemType
  disabled?: boolean
  columns?: 2 | 4
  partList?: any[]
  taxCodeList?: any[]
  subInventoryList?: any[]
}>()
const colSpan = computed(() => (columns === 2 ? 12 : 6))
const remarkSpan = computed(() => (columns === 2 ? 24 : 12))
const rules: FormRules<DataItemType> = {
  ordered_item: [{ required: true, message: '請選擇訂單商品編號 Ordered Item', trigger: 'change' }],
  quantity: [{ required: true, message: '請填寫數量 Quantity', trigger: 'change' }],
  tax_code: [{ required: true, message: '請選擇稅碼 Tax Code', trigger: 'change' }],
  request_date: [{ required: true, message: '請選擇申請日期 Request Date', trigger: 'change' }],
  unit_price: [{ required: true, message: '請填寫單價 Unit Price', trigger: 'change' }],
  sub_inventory: [{ required: true, message: '請選擇子庫存 Sub-Inventory', trigger: 'change' }]
}

function handlePartNumberChange() {
  if (disabled) return
  const find = partList.find((item: any) => item.value === rowData.value.ordered_item)
  rowData.value.description = !!find ? find.description : ''
  rowData.value.uom = !!find ? find.uom : ''
}

function normalizeValue(value: unknown): string {
  if (value == null || value === '') return ''
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value)
}

/** 與 oldData 原值比對，不一致則高亮 */
function isFieldChanged(field: keyof DataItemType): boolean {
  console.log(123, oldData)
  if (!disabled && !oldData) return false
  if (!oldData || Object.keys(oldData).length === 0) return false
  return normalizeValue(rowData.value[field]) !== normalizeValue(oldData[field])
}
</script>

<template>
  <el-form ref="formRef" :model="rowData" :rules="rules" label-position="top" class="all-input-style" :disabled="disabled">
    <el-row>
      <el-col :span="colSpan">
        <el-form-item label="客戶採購訂單行 Customer PO Line" :class="{ 'field-changed': isFieldChanged('customer_po_line') }">
          <el-input-number v-model="rowData.customer_po_line" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="數量 Quantity" prop="quantity" :class="{ 'field-changed': isFieldChanged('quantity') }">
          <el-input-number v-model="rowData.quantity" controls-position="right" :min="1" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="稅碼 Tax Code" prop="tax_code" :class="{ 'field-changed': isFieldChanged('tax_code') }">
          <el-select v-model="rowData.tax_code">
            <el-option v-for="part in taxCodeList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申請日期 Request Date" prop="request_date" :class="{ 'field-changed': isFieldChanged('request_date') }">
          <el-date-picker v-model="rowData.request_date" type="date" />
        </el-form-item>
        <el-form-item label="取消數量 Quantity Cancelled" :class="{ 'field-changed': isFieldChanged('quantity_cancelled') }">
          <el-input v-model="rowData.quantity_cancelled" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶訂單 Customer PO" :class="{ 'field-changed': isFieldChanged('customer_po') }">
          <el-input v-model="rowData.customer_po" />
        </el-form-item>
        <el-form-item label="計量單位 UOM" :class="{ 'field-changed': isFieldChanged('uom') }">
          <el-input v-model="rowData.uom" disabled />
        </el-form-item>
        <el-form-item label="稅額 Tax Amount" :class="{ 'field-changed': isFieldChanged('tax_amount') }">
          <el-input v-model="rowData.tax_amount" disabled />
        </el-form-item>
        <el-form-item label="承諾日期 Promise Date" :class="{ 'field-changed': isFieldChanged('promise_date') }">
          <el-date-picker v-model="rowData.promise_date" type="date" />
        </el-form-item>
        <el-form-item label="出貨數量 Quantity Shipped" :class="{ 'field-changed': isFieldChanged('quantity_shipped') }">
          <el-input v-model="rowData.quantity_shipped" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="客戶商品編號 Customer Item" :class="{ 'field-changed': isFieldChanged('customer_item') }">
          <el-input v-model="rowData.customer_item" />
        </el-form-item>
        <el-form-item label="客戶單價 Customer Unit Price" :class="{ 'field-changed': isFieldChanged('customer_unit_price') }">
          <el-input-number v-model="rowData.customer_unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="交貨週期（天）Lead Time(Days)" :class="{ 'field-changed': isFieldChanged('lead_time') }">
          <el-input-number v-model="rowData.lead_time" controls-position="right" :min="0" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="預定出貨日期 Scheduled Ship Date" :class="{ 'field-changed': isFieldChanged('scheduled_ship_date') }">
          <el-date-picker v-model="rowData.scheduled_ship_date" type="date" />
        </el-form-item>
        <el-form-item label="參考 References" :class="{ 'field-changed': isFieldChanged('references') }">
          <el-input v-model="rowData.references" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="colSpan">
        <el-form-item label="訂單商品編號 Ordered Item" prop="ordered_item" :class="{ 'field-changed': isFieldChanged('ordered_item') }">
          <el-select v-model="rowData.ordered_item" filterable @change="handlePartNumberChange">
            <el-option v-for="part in partList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="單價 Unit Price" prop="unit_price" :class="{ 'field-changed': isFieldChanged('unit_price') }">
          <el-input-number v-model="rowData.unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
        </el-form-item>
        <el-form-item label="描述 Description" :class="{ 'field-changed': isFieldChanged('description') }">
          <el-input v-model="rowData.description" disabled />
        </el-form-item>
        <el-form-item label="預定抵達日期 Scheduled Arrival Date" :class="{ 'field-changed': isFieldChanged('schedule_arrival_date') }">
          <el-date-picker v-model="rowData.schedule_arrival_date" type="date" disabled />
        </el-form-item>
        <el-form-item label="子庫存 Sub-Inventory" prop="sub_inventory" :class="{ 'field-changed': isFieldChanged('sub_inventory') }">
          <el-select v-model="rowData.sub_inventory">
            <el-option v-for="part in subInventoryList" :key="part.id" :label="part.label" :value="part.value" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="remarkSpan">
        <el-form-item label="PI 備註 PI Remark" :class="{ 'field-changed': isFieldChanged('pi_remark') }">
          <el-input v-model="rowData.pi_remark" style="width: 95%" />
        </el-form-item>
      </el-col>

      <el-col :span="remarkSpan">
        <el-form-item label="備註 Remarks" :class="{ 'field-changed': isFieldChanged('remarks') }">
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

.field-changed {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px #ff8c00 inset;
  }
}
</style>
