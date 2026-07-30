<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import type { FormInstance, FormRules } from 'element-plus'
import { v7 as uuidv7 } from 'uuid'

const { isApproval, customerPo } = defineProps<{
  isApproval: boolean
  customerPo: string
}>()

const isEdit = ref<boolean>(false)
const emits = defineEmits(['create', 'update'])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

interface DataItemType {
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

function createDefaultRowData(): DataItemType {
  return {
    line_id: uuidv7(),
    customer_po_line: 0,
    quantity: 0,
    tax_code: '',
    request_date: Date.now(),
    quantity_cancelled: 0,
    customer_po: customerPo,
    uom: '',
    tax_amount: 0,
    promise_date: '',
    quantity_shipped: 0,
    customer_item: '',
    customer_unit_price: 0,
    lead_time: 0,
    scheduled_ship_date: '',
    schedule_arrival_date: '',
    ordered_item: '',
    unit_price: 0,
    description: '',
    sub_inventory: '',
    references: '',
    pi_remark: '',
    remarks: '',
    status: 'create'
  }
}

const rowData = ref<DataItemType>(createDefaultRowData())
const partList = ref<any[]>([])
const tax_codeList = ref<any[]>([
  { label: 'NET PRICE', value: 'NET PRICE' },
  { label: 'VAT13', value: 'VAT13' },
  { label: 'VAT16', value: 'VAT16' },
  { label: 'VAT7', value: 'VAT7' }
])
const sub_inventoryList = ref<any[]>([
  { label: 'CHECKING', value: 'CHECKING' },
  { label: 'DUMMY', value: 'DUMMY' },
  { label: 'ICHAUS', value: 'ICHAUS' },
  { label: 'OSWF', value: 'OSWF' },
  { label: 'STORE1', value: 'STORE1' },
  { label: 'SZBYDA860', value: 'SZBYDA860' },
  { label: 'SZBYDA961', value: 'SZBYDA961' },
  { label: 'SZBYDA963', value: 'SZBYDA963' },
  { label: 'SZBYDA964', value: 'SZBYDA964' },
  { label: 'SZBYDA965', value: 'SZBYDA965' },
  { label: 'SZBYDA966', value: 'SZBYDA966' },
  { label: 'SZBYDH141', value: 'SZBYDH141' },
  { label: 'SZBYDHZ25', value: 'SZBYDHZ25' },
  { label: 'SZDAMAGE', value: 'SZDAMAGE' },
  { label: 'SZHK2', value: 'SZHK2' },
  { label: 'SZSH', value: 'SZSH' },
  { label: 'SZSZ1', value: 'SZSZ1' },
  { label: 'SZVMAX', value: 'SZVMAX' },
  { label: 'SZXM1', value: 'SZXM1' },
  { label: 'SZZHK', value: 'SZZHK' }
])

const rules: FormRules<DataItemType> = {
  ordered_item: [{ required: true, message: '請選擇訂單商品編號 Ordered Item', trigger: 'change' }],
  quantity: [{ required: true, message: '請填寫數量 Quantity', trigger: 'change' }],
  tax_code: [{ required: true, message: '請選擇稅碼 Tax Code', trigger: 'change' }],
  request_date: [{ required: true, message: '請選擇申請日期 Request Date', trigger: 'change' }],
  unit_price: [{ required: true, message: '請填寫單價 Unit Price', trigger: 'change' }],
  sub_inventory: [{ required: true, message: '請選擇子庫存 Sub-Inventory', trigger: 'change' }]
}

function open(row?: any) {
  isEdit.value = false
  rowData.value = createDefaultRowData()
  if (!!row) {
    rowData.value = { ...row }
    isEdit.value = true
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

async function handleSubmit() {
  if (isApproval) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (isEdit.value) {
    emits('update', rowData.value)
  } else {
    emits('create', rowData.value)
  }
  dialogVisible.value = false
}

async function getPartList() {
  const list = await getDbData('12ba8480-6936-11f1-922e-adee4ecc74b2')
  const seen = new Set<any>()

  partList.value = list.reduce((acc: any[], item: any) => {
    const value = item.segment1

    if (seen.has(value)) return acc
    seen.add(value)

    acc.push({
      id: item.inventory_item_id,
      label: item.segment1,
      value: item.segment1,
      brand: item.attribute8,
      description: item.description,
      uom: item.primary_uom_code
    })
    return acc
  }, [])
}

function handlePartNumberChange() {
  const find = partList.value.find((item: any) => item.value === rowData.value.ordered_item)
  rowData.value.description = !!find ? find.description : ''
  rowData.value.uom = !!find ? find.uom : ''
}

async function getDbData(tableId: string, conditions?: any) {
  // Get Filed Mapping
  const filedData: any = await newClientApi
    .getDocpalMasterTableUserConfig({
      tableId: tableId,
      userId: 'master',
      type: 'detail'
    })
    .then((res) => res.data)
  const filedMapping: any = {}
  filedData.tableFields.forEach((item: any) => {
    filedMapping[item.field_name as string] = item.validation_rules.title
  })

  const param = {
    tableId: tableId,
    conditions,
    columns: [{ name: 'f_7969_c576d886' }, { name: 'f_7965_9760c235' }, { name: 'f_8100_c3428722' }],
    pagination: {
      pageSize: 1000,
      pageNum: 0
    }
  }

  // Get BD Data
  const dbData = await clientApi.instance.post('/apis/v1/dynamic-actions', param).then((res: any) => res.data.data)

  // 匹配數據
  return dbData.map((row: any) => {
    const out = {}
    for (const [fromKey, toKey] of Object.entries(filedMapping)) {
      if (fromKey in row) out[toKey] = row[fromKey]
    }
    return out
  })
}

onMounted(() => {
  getPartList()
})

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    append-to-body
    class="big"
    :title="isApproval ? '零件明細 Part Detail' : isEdit ? '編輯零件 Edit Parts' : '添加零件 Add Parts'"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form ref="formRef" :model="rowData" :rules="rules" label-position="top" class="all-input-style" :disabled="isApproval">
      <el-row>
        <el-col :span="6">
          <el-form-item label="客戶採購訂單行 Customer PO Line">
            <el-input-number v-model="rowData.customer_po_line" controls-position="right" :min="1" :step="1" step-strictly />
          </el-form-item>
          <el-form-item label="數量 Quantity" prop="quantity">
            <el-input-number v-model="rowData.quantity" controls-position="right" :min="1" :step="1" step-strictly />
          </el-form-item>
          <el-form-item label="稅碼 Tax Code" prop="tax_code">
            <el-select v-model="rowData.tax_code">
              <el-option v-for="part in tax_codeList" :key="part.id" :label="part.label" :value="part.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="申請日期 Request Date" prop="request_date">
            <el-date-picker v-model="rowData.request_date" type="date" />
          </el-form-item>
          <el-form-item label="取消數量 Quantity Cancelled">
            <el-input v-model="rowData.quantity_cancelled" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="客戶訂單 Customer PO">
            <el-input v-model="rowData.customer_po" disabled />
          </el-form-item>
          <el-form-item label="計量單位 UOM">
            <el-input v-model="rowData.uom" disabled />
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

        <el-col :span="6">
          <el-form-item label="客戶商品編號 Customer Item">
            <el-input v-model="rowData.customer_item" />
          </el-form-item>
          <el-form-item label="客戶單價 Customer Unit Price">
            <el-input-number v-model="rowData.customer_unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
          </el-form-item>
          <el-form-item label="交貨週期（天）Lead Time(Days)">
            <el-input-number v-model="rowData.lead_time" controls-position="right" :min="0" :step="1" step-strictly />
          </el-form-item>
          <el-form-item label="預定出貨日期 Scheduled Ship Date">
            <el-date-picker v-model="rowData.scheduled_ship_date" type="date" />
          </el-form-item>
          <el-form-item label="參考 References">
            <el-input v-model="rowData.references" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="訂單商品編號 Ordered Item" prop="ordered_item">
            <el-select v-model="rowData.ordered_item" filterable @change="handlePartNumberChange">
              <el-option v-for="part in partList" :key="part.id" :label="part.label" :value="part.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="單價 Unit Price" prop="unit_price">
            <el-input-number v-model="rowData.unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
          </el-form-item>
          <el-form-item label="描述 Description">
            <el-input v-model="rowData.description" disabled type="textarea" :rows="1" :autosize="{ minRows: 1, maxRows: 4 }" />
          </el-form-item>
          <el-form-item label="預定抵達日期 Scheduled Arrival Date">
            <el-date-picker v-model="rowData.schedule_arrival_date" type="date" disabled />
          </el-form-item>
          <el-form-item label="子庫存 Sub-Inventory" prop="sub_inventory">
            <el-select v-model="rowData.sub_inventory">
              <el-option v-for="part in sub_inventoryList" :key="part.id" :label="part.label" :value="part.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="PI 備註 PI Remark">
            <el-input v-model="rowData.pi_remark" style="width: 95%" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="備註 Remarks">
            <el-input v-model="rowData.remarks" style="width: 95%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button v-if="!isApproval" type="primary" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input) {
    width: 90%;
  }
  ::v-deep(.el-textarea) {
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
