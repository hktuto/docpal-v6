<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import { v7 as uuidv7 } from 'uuid'

const isEdit = ref<boolean>(false)
const emits = defineEmits(['create', 'update'])
const dialogVisible = ref(false)

interface DataItemType {
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
  returnOrder: string
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

const defaultRowData: DataItemType = {
  line_id: uuidv7(),
  customerPoLine: 0,
  quantity: 0,
  taxCode: '',
  requestDate: '',
  quantityCancelled: 0,
  customerPo: '',
  uom: '',
  taxAmount: 0,
  promiseDate: '',
  quantityShipped: 0,
  customerItem: '',
  customerUnitPrice: 0,
  leadTime: 0,
  returnOrder: '',
  scheduledShipDate: '',
  scheduledArrivalDate: '',
  orderedItem: '',
  unitPrice: 0,
  description: '',
  subInventory: '',
  references: '',
  piRemark: '',
  remarks: ''
}

const rowData = ref<DataItemType>(defaultRowData)
const partList = ref<any[]>([])
const taxCodeList = ref<any[]>([])
const subInventoryList = ref<any[]>([])

function open(row?: any) {
  isEdit.value = false
  rowData.value = defaultRowData
  if (!!row) {
    rowData.value = row
    isEdit.value = true
  }
  dialogVisible.value = true
}

function handleSubmit() {
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
      brand: item.attribute8
    })

    return acc
  }, [])
}

async function getDbData(tableId: string) {
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
    columns: [
      {
        name: '*'
      }
    ],
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
  <el-dialog v-model="dialogVisible" append-to-body class="big" :title="isEdit ? '編輯商品 Edit Goods' : '添加商品 Add Goods'">
    <el-form label-position="top" class="all-input-style">
      <el-row>
        <el-col :span="6">
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

        <el-col :span="6">
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

        <el-col :span="6">
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
          <el-form-item label="退貨單 Return Order">
            <el-input v-model="rowData.returnOrder" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
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

        <el-col :span="6">
          <el-form-item label="參考 References">
            <el-input v-model="rowData.references" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="PI 備註 PI Remark">
            <el-input v-model="rowData.piRemark" style="width: 95%" />
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
      <el-button type="primary" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
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
