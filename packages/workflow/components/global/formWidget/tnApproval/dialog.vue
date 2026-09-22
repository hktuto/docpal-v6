<script setup lang="ts">
import dayjs from 'dayjs'

const emits = defineEmits(['submit'])
const { t } = useI18n()

const { subInventoryOption, officeOption } = defineProps<{
  subInventoryOption: any[]
  officeOption: any[]
}>()

const formRef = ref()
const visible = ref(false)
const rowData = reactive<any>({
  po_number: '',
  qty: 0,
  sub_inventory: '',
  product_name: '',
  po_line_number: 0,
  part_number: '',
  unit_price: 0,
  tn_planned_date: '',
  description: '',
  shipment_num: '',
  part_description: '',
  shipment_number: '',
  office: '',
  git_stk: '',
  commodity_inspection: '',
  sys_qty: 0,
  amount: 0,
  origin: '',
  from_sub_inventory: '',
  status: ''
})

function isShipmentNumberRequired(row: any) {
  return row?.git_stk === 'Y' && String(row?.part_number ?? '').includes('ICHAUS')
}

const shipmentNumberRequiredMessage = t('render.hint.fieldRequired', { name: t('transferNoteApproval.shipmentNumber') })
function getShipmentNumberRules(row: any) {
  return {
    shipment_number: [
      {
        validator: (_rule: any, value: string, callback: any) => {
          if (!isShipmentNumberRequired(row)) {
            callback()
            return
          }
          if (!String(value ?? '').trim()) {
            callback(new Error(shipmentNumberRequiredMessage))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }
}

function open(row: any) {
  Object.assign(rowData, deepCopy(row))
  visible.value = true
}

function handleAmount(row: any) {
  const { qty, unit_price } = row
  const amount = new Decimal(qty || 0).mul(unit_price || 0).toNumber()
  row.amount = amount
  return amount
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emits('submit', rowData)
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="t('transferNoteApproval.partDetails')" append-to-body class="big" destroy-on-close align-center>
    <el-form ref="formRef" :model="rowData" label-position="top" class="all-input-style">
      <el-row>
        <el-col :span="6">
          <el-form-item :label="t('transferNoteApproval.poNumber')">
            <el-input v-model="rowData.po_number" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.qty')">
            <el-input-number
              v-model="rowData.qty"
              controls-position="right"
              :min="1"
              :max="rowData.sys_qty"
              :step="1"
              step-strictly
              :value-on-clear="rowData.sys_qty"
              @change="handleAmount(rowData)"
            />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.toSubInventory')">
            <el-select v-model="rowData.sub_inventory" style="width: 90%">
              <el-option v-for="item in subInventoryOption" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.productName')">
            <el-input v-model="rowData.product_name" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.poLineNumber')">
            <el-input-number v-model="rowData.po_line_number" controls-position="right" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('transferNoteApproval.partNumber')">
            <el-input v-model="rowData.part_number" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.unitPrice')">
            <el-input-number v-model="rowData.unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.tnPlannedDate')">
            <el-date-picker
              v-model="rowData.tn_planned_date"
              type="date"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              :clearable="false"
              :value-on-clear="dayjs().format('YYYY-MM-DD')"
              style="width: 90%"
            />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.description')">
            <el-input v-model="rowData.description" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.shipmentNum')">
            <el-input v-model="rowData.shipment_num" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('transferNoteApproval.partDescription')">
            <el-input v-model="rowData.part_description" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.shipmentNumber')" prop="shipment_number" :rules="getShipmentNumberRules(rowData)">
            <el-input v-model="rowData.shipment_number" style="width: 90%" />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.toOffice')">
            <el-select v-model="rowData.office" style="width: 90%">
              <el-option v-for="item in officeOption" :key="item.office_name" :label="item.office_name" :value="item.office_name" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.gitStk')">
            <el-input v-model="rowData.git_stk" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.commodityInspection')">
            <el-input v-model="rowData.commodity_inspection" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('transferNoteApproval.sysQty')">
            <el-input-number v-model="rowData.sys_qty" controls-position="right" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.amount')">
            <el-input-number v-model="rowData.amount" controls-position="right" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.origin')">
            <el-input v-model="rowData.origin" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.fromSubInventory')">
            <el-input v-model="rowData.from_sub_inventory" style="width: 90%" disabled />
          </el-form-item>
          <el-form-item :label="t('transferNoteApproval.status')">
            <el-input v-model="rowData.status" style="width: 90%" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="handleSubmit">
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
