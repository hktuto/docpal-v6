<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import { v7 as uuidv7 } from 'uuid'
import ModificationFormFields, { type DataItemType } from './modificationFormFields.vue'

const { isApproval } = defineProps<{
  isApproval: boolean
}>()

const isEdit = ref<boolean>(false)
const isNewItem = ref<boolean>(false)
const dialogVisible = ref<boolean>(false)
const emits = defineEmits(['create', 'update'])

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
  scheduledShipDate: '',
  scheduleArrivalDate: '',
  orderedItem: '',
  unitPrice: 0,
  description: '',
  subInventory: '',
  references: '',
  piRemark: '',
  remarks: ''
}

const oldRowData = ref<DataItemType>()
const rowData = ref<DataItemType>()
const partList = ref<any[]>([])
const taxCodeList = ref<any[]>([
  { label: 'VAT13', value: 'VAT13' },
  { label: 'VAT16', value: 'VAT16' },
  { label: 'VAT7', value: 'VAT7' }
])
const subInventoryList = ref<any[]>([
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

function open(newItem: boolean, row?: DataItemType, oldData?: DataItemType) {
  isEdit.value = false
  isNewItem.value = newItem
  rowData.value = deepCopy(defaultRowData)
  if (!newItem && !!oldData) {
    oldRowData.value = oldData
  }

  if (!!row) {
    rowData.value = { ...row }
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

  const dbData = await clientApi.instance.post('/apis/v1/dynamic-actions', param).then((res: any) => res.data.data)

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
  <el-dialog v-model="dialogVisible" append-to-body class="big" :title="isEdit ? '編輯零件 Edit Parts' : '添加零件 Add Parts'">
    <el-row :gutter="16">
      <el-col v-if="!isNewItem" :span="12">
        <div class="panel-title">舊數據 Old</div>
        <ModificationFormFields
          v-model="oldRowData"
          disabled
          :columns="2"
          :part-list="partList"
          :tax-code-list="taxCodeList"
          :sub-inventory-list="subInventoryList"
        />
      </el-col>

      <el-col :span="!isNewItem ? 12 : 24" :class="{ 'panel-divider': !isNewItem }">
        <div v-if="!isNewItem" class="panel-title">新數據 New</div>
        <ModificationFormFields
          v-model="rowData"
          :disabled="isApproval"
          :columns="!isNewItem ? 2 : 4"
          :part-list="partList"
          :tax-code-list="taxCodeList"
          :sub-inventory-list="subInventoryList"
        />
      </el-col>
    </el-row>

    <template #footer>
      <el-button type="primary" :disabled="isApproval" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.panel-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.panel-divider {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    background-color: var(--el-border-color);
    margin-left: -5px;
    transform: translateX(-8px);
  }
}
</style>
