<script setup lang="ts">
const emits = defineEmits(['submit'])

const { disabled } = defineProps<{
  disabled: boolean
}>()

const visible = ref(false)
const rowData = ref<any>({})
const subInventoryList = ref<any[]>([
  { label: 'OSWF', value: 'OSWF' },
  { label: 'STAGING', value: 'STAGING' },
  { label: 'STORE1', value: 'STORE1' },
  { label: 'STORE2', value: 'STORE2' },
  { label: 'SZBYDA860', value: 'SZBYDA860' },
  { label: 'SZBYDA961', value: 'SZBYDA961' },
  { label: 'SZBYDA963', value: 'SZBYDA963' },
  { label: 'SZBYDA964', value: 'SZBYDA964' },
  { label: 'S7S711', value: 'S7S711' },
])
const officeList = ref<any[]>([
  { label: '深圳创能', value: '深圳创能' },
  { label: '金领导', value: '金领导' },
])

function open(row: any) {
  rowData.value = deepCopy(row)
  visible.value = true
}

function handleSubmit() {
  emits('submit', rowData.value)
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="零件詳情 Part Details" append-to-body class="big" destroy-on-close align-center>
    <el-form :model="rowData" label-position="top" class="all-input-style" :disabled="disabled">
      <el-row>
        <el-col :span="6">
          <el-form-item label="PO編號 PO Number">
            <el-input v-model="rowData.po_number" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="數量 QTY">
            <el-input-number v-model="rowData.qty" controls-position="right" :min="0" :step="1" step-strictly />
          </el-form-item>
          <el-form-item label="子庫存 Sub-Inventory">
            <el-select v-model="rowData.sub_inventory" style="width: 90%" >
              <el-option v-for="item in subInventoryList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="產品名稱 Product Name">
            <el-input v-model="rowData.product_name" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="PO行號 PO Line Number">
            <el-input-number v-model="rowData.po_line_number" controls-position="right" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="零件編號 Part Number">
            <el-input v-model="rowData.part_number" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="單價 Unit Price">
            <el-input-number v-model="rowData.unit_price" controls-position="right" disabled />
          </el-form-item>
          <el-form-item label="TN計畫日期 TN Planned Date">
            <el-date-picker v-model="rowData.tn_planned_date" type="date" format="YYYY/MM/DD" value-format="x" style="width: 90%" />
          </el-form-item>
          <el-form-item label="描述 Description">
            <el-input v-model="rowData.description" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="船號 Ship Number">
            <el-input v-model="rowData.ship_number" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="零件描述 Part Description">
            <el-input v-model="rowData.part_description" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="出貨編號 Shipment Number">
            <el-input v-model="rowData.shipment_number" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="辦公室 To Office">
            <el-select v-model="rowData.office" style="width: 90%" >
              <el-option v-for="item in officeList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="GIT STK">
            <el-input v-model="rowData.git_stk" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="商品檢驗 Commodity Inspection">
            <el-input v-model="rowData.commodity_inspection" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="系統數量 Sys Qty">
            <el-input-number v-model="rowData.sys_qty" controls-position="right" disabled />
          </el-form-item>
          <el-form-item label="合計 Amount">
            <el-input-number v-model="rowData.amount" controls-position="right" disabled />
          </el-form-item>
          <el-form-item label="來源 Origin">
            <el-input v-model="rowData.origin" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item label="來自子庫存 From Sub-Inventory">
            <el-input v-model="rowData.from_sub_inventory" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button v-if="!disabled" type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input-number) {
    width: 90%;
  }
}
</style>
