<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import { Delete } from '@element-plus/icons-vue'
import { v7 as uuidv7 } from 'uuid'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()

type SampleInfoItem = {
  id?: string
  sample_id: string
  quotation_number: string
  brand: string
  part_number: string
  series: string
  product_application: string
  monthly_quantity: number
  quantity_machine: number
  mpq: number
  uom: string
  competitor_name: string
  customer_part_number: string
  old_sales_price_noTax?: number
  remarks: string
  target_price_list: TargetPriceItem[]
}

type TargetPriceItem = {
  sample_id: string
  tier_number: number
  moq: number
  target_price: number
  unit_cost: number
  unit_price_no_tax: number
  cost_currency: string
  exchange_rate: number
  profit: number
  status: 'A' | 'D'
}

const formModel = ref<{
  brand: string
  infoList: SampleInfoItem[]
}>({
  brand: '',
  infoList: []
})
const data = toRef(formModel.value, 'infoList')
const seriesList = ref<any[]>([])
const showDetails = ref<boolean[]>([])
const costCurrencyOptions = ref([
  { label: 'CNY', value: 'CNY' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'HKD', value: 'HKD' },
  { label: 'USD', value: 'USD' }
])
const exchangeRateList = ref<any[]>([])
const rules = {
  cost_currency: [{ required: true, message: 'Please select Cost Currency', trigger: 'change' }],
  price_type: [{ required: true, message: 'Please select Price Type', trigger: 'change' }]
}

async function getExchangeRateList() {
  exchangeRateList.value = await getDbData('aca40000-75dc-11f1-850d-35881bc838c2')
}

async function getSeriesList() {
  const list = await getDbData('c13ccf90-7101-11f1-a5ba-a73b7858cef3')
  const seen = new Set<any>()

  seriesList.value = list.reduce((acc: any[], item: any) => {
    const value = item.mfg_part_num
    if (seen.has(value)) return acc
    seen.add(value)

    acc.push({
      id: item.id,
      label: item.mfg_part_num,
      value: value,
      brand: ''
    })
    return acc
  }, [])
}

async function getDbData(tableId: string, conditions?: any[]) {
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
    filedMapping[item.field_name as string] = item.field_name_alias
  })

  const param = {
    tableId: tableId,
    conditions,
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

function handleSampleInfoRemove(index: number) {
  data.value.splice(index, 1)
}

const historyPriceRef = ref()
function openDialog(index: number, item: any) {
  item.index = index
  item.currency = formData.currency
  item.org_id = 1
  historyPriceRef.value.open(item)
}

function handelCostCurrency(item: any) {
  const cost_currency = item.cost_currency
  const currency = formData.currency
  if (!cost_currency || !currency) return

  const find = exchangeRateList.value.find((item: any) => item.base_currency === cost_currency && item.target_currency === currency)
  item.exchange_rate = find.exchange_rate
}

function handleHistoryPriceSubmit(data: any) {
  const item = formModel.value.infoList[data.index]
  const list: any = data.list || []
  const sa_id = item.item

  let newTarget_price_list: any[] = []

  if (list.length >= item.target_price_list?.length) {
    newTarget_price_list = list.map((newItem: any, index: number) => {
      const priceItem = item.target_price_list[index]
      let newPriceItem
      if (!!priceItem) {
        newPriceItem = {
          ...priceItem,
          moq: newItem.moq,
          unit_cost: newItem.unit_cost
        }
      } else {
        newPriceItem = {
          sample_id: uuidv7(),
          tier_number: index + 1,
          moq: newItem.moq,
          target_price: newItem.target_price,
          unit_cost: newItem.unit_cost,
          customer_final_price: 0,
          sales_price: 0,
          status: 'A',
          unit_price_no_tax: newItem.unit_price_no_tax,
          margin: ''
        } as TargetPriceItem
      }
      calculateMargin(item.exchange_rate, newPriceItem)
      return newPriceItem
    })
  } else {
  }

  console.log(123, newTarget_price_list)
}

function handleTargetPriceItemRemove(index: number, targetPriceIndex: number) {
  data.value[index].target_price_list.splice(targetPriceIndex, 1)
}

// (target_price - unit_cost × exchange_rate × markup_rate) / ( unit_cost × exchange_rate × markup_rate) × 100
function calculateMargin(item: TargetPriceItem) {
  const exchange_rate = 1
  const targetPrice = Number(item.target_price)
  const unitPriceNoTax = Number(item.unit_price_no_tax)
  const unitCost = Number(item.unit_cost)
  // TODO: 需要管理層去確認的數據來源。Hank 反饋的暫時寫死
  const markup_rate = 1.05

  if (!unitPriceNoTax || !unitCost) {
    item.profit = 0
    return
  }
  item.profit = ((targetPrice - unitCost * exchange_rate * markup_rate) / (unitCost * exchange_rate * markup_rate)) * 100
}

function init() {
  formModel.value = {
    brand: formData.brand,
    infoList: formData.sample_info_list
  }
}

async function getFormData(needValidation = true) {
  const result = { sample_info_list: formModel.value.infoList }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

onMounted(async () => {
  await getSeriesList()
  await getExchangeRateList()
})

watch(
  () => formModel.value?.infoList?.length,
  (length) => {
    showDetails.value = Array.from({ length }, (_, index) => showDetails.value[index] ?? false)
  },
  { immediate: true }
)

watch(
  () => formData.sample_info_list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" label-position="top" :model="formModel">
    <el-row>
      <el-col :span="8">
        <el-form-item label="品牌 Brand" prop="brand">
          <el-input v-model="formModel.brand" disabled />
        </el-form-item>
      </el-col>
    </el-row>

    <template v-for="(item, index) in formModel.infoList" :key="item.sample_id">
      <div class="info-item-card">
        <div class="info-item-card__header">
          <span class="info-item-card__index">{{ index + 1 }}.</span>
          <div class="info-item-card__actions">
            <el-button type="primary" @click="showDetails[index] = !showDetails[index]">
              {{ showDetails[index] ? '隱藏詳情' : '更多詳情' }}
            </el-button>
          </div>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="型號 Part Number" prop="part_number">
              <el-input v-model="item.part_number" disabled />
            </el-form-item>
            <el-form-item label="系列 Series" v-if="formModel.brand === 'KOA'">
              <el-select v-model="item.series" class="full-width-input" clearable>
                <el-option v-for="part in seriesList" :key="part.id" :label="part.label" :value="part.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="價格類型 Price Type" :prop="`infoList.${index}.price_type`" required :rules="rules.price_type">
              <el-select v-model="item.price_type" class="full-width-input">
                <el-option value="STD" label="STD" />
                <el-option value="SP" label="SP" />
              </el-select>
            </el-form-item>
            <el-form-item label="交貨時間 Lead Time">
              <el-date-picker v-model="item.lead_time" type="date" placeholder="請選擇交貨時間" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="交易幣種 Currency">
              <el-input v-model="formData.currency" disabled />
            </el-form-item>
            <el-form-item label="備注 Remarks" prop="remarks">
              <el-input v-model="item.remarks" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <div class="targetPrice-item-card">
              <div class="targetPrice-item-card__header">
                <span>設定不同數量檔位的目標價。 Higher MOQ → lower target price.</span>
                <el-button type="primary" @click="openDialog(index, item)">檢索歷史價格 Retrieve historical prices</el-button>
              </div>
              <el-divider />
              <el-row class="targetPrice-item-card__table-header">
                <el-col :span="2">檔位 Tier</el-col>
                <el-col :span="2">幣種 Currency</el-col>
                <el-col :span="2">匯率 Exchange Rate</el-col>
                <el-col :span="2">起订量 MOQ</el-col>
                <el-col :span="3">目標價 Target Price</el-col>
                <el-col :span="4">單價(未稅) Unit Price(No Tax)</el-col>
                <el-col :span="4">單位成本 Unit Cost</el-col>
                <el-col :span="3">毛利率(%) Margin(%)</el-col>
                <el-col :span="2">操作 Actions</el-col>
              </el-row>
              <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.target_price_list?.length > 5 }">
                <el-row v-for="(targetPriceItem, targetPriceIndex) in item.target_price_list" :key="targetPriceIndex">
                  <template v-if="targetPriceItem.status !== 'D'">
                    <el-col :span="2">第{{ targetPriceIndex + 1 }}檔 / T{{ targetPriceIndex + 1 }}</el-col>
                    <el-col :span="2">
                      <el-select
                        v-model="targetPriceItem.cost_currency"
                        class="full-width-input"
                        @change="handelCostCurrency(targetPriceItem)"
                        style="width: 90%"
                      >
                        <el-option v-for="item in costCurrencyOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-col>
                    <el-col :span="2">
                      <el-input v-model="targetPriceItem.exchange_rate" disabled style="width: 90%" />
                    </el-col>
                    <el-col :span="2">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.moq"
                        controls-position="right"
                        :min="1"
                        :step="1"
                        step-strictly
                        @change="calculateMargin(targetPriceItem)"
                      />
                    </el-col>
                    <el-col :span="3">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.target_price"
                        controls-position="right"
                        :min="0.00001"
                        :step="0.00001"
                        step-strictly
                        disabled
                        @change="calculateMargin(targetPriceItem)"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.unit_price_no_tax"
                        controls-position="right"
                        :min="0.00001"
                        :step="0.00001"
                        step-strictly
                        @change="calculateMargin(targetPriceItem)"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.unit_cost"
                        controls-position="right"
                        :min="0.00001"
                        :step="0.00001"
                        step-strictly
                        @change="calculateMargin(targetPriceItem)"
                      />
                    </el-col>
                    <el-col :span="3">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.profit" disabled>
                        <template #suffix>
                          <span>%</span>
                        </template>
                      </el-input-number>
                    </el-col>
                    <el-col :span="2">
                      <div class="targetPrice-item-card__actions" v-if="targetPriceIndex !== 0">
                        <el-button :icon="Delete" type="danger" @click="handleTargetPriceItemRemove(index, targetPriceIndex)" />
                      </div>
                    </el-col>
                  </template>
                </el-row>
              </div>
            </div>
          </el-col>

          <template v-if="showDetails[index]">
            <el-divider />
            <el-col :span="6">
              <el-form-item label="月用量 Monthly Quantity" prop="monthly_quantity">
                <el-input-number v-model="item.monthly_quantity" controls-position="right" :min="1" :step="1" step-strictly disabled />
              </el-form-item>
              <el-form-item label="最小包裝數 MPQ " prop="mpq">
                <el-input v-model="item.mpq" disabled />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="單機用量 Quantity Machine" prop="quantity_machine">
                <el-input-number v-model="item.quantity_machine" controls-position="right" :min="1" :step="1" step-strictly disabled />
              </el-form-item>
              <el-form-item label="单位 UOM" prop="uom">
                <el-input v-model="item.uom" disabled />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="競爭對手名稱 Competitor Name" prop="competitor_name">
                <el-input v-model="item.competitor_name" disabled />
              </el-form-item>
              <el-form-item label="產品應用 Product Application" prop="product_application">
                <el-input v-model="item.product_application" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="客戶零件編號 Customer Part Number" prop="customer_part_number">
                <el-input v-model="item.customer_part_number" disabled />
              </el-form-item>
              <el-form-item label="原銷售價格（不含稅） Old Sales Price(NoTax)" prop="old_sales_price_noTax">
                <el-input-number v-model="item.old_sales_price_noTax" controls-position="right" :min="1" :step="1" step-strictly disabled />
              </el-form-item>
            </el-col>
          </template>
        </el-row>
      </div>
    </template>
  </el-form>

  <LazyFormWidgetQuotationApprovalHistoricalPriceDialog ref="historyPriceRef" @submit="handleHistoryPriceSubmit" />
</template>

<style scoped lang="scss">
.info-item-card {
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-s);
  margin-top: var(--app-space-s);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--app-space-xs);
  }

  &__index {
    color: #5dc282;
    font-size: 20px;
  }

  &__actions {
    display: flex;
  }
}

.targetPrice-item-card {
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-s);
  margin-top: var(--app-space-s);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--app-space-xs);
  }

  &__table-header {
    margin-bottom: var(--app-space-xs);
    font-weight: 500;
  }

  &__body {
    --target-price-row-height: 48px;

    &--scrollable {
      max-height: calc(var(--target-price-row-height) * 5);
      overflow-y: auto;
      padding-right: var(--app-space-xs);
      scrollbar-gutter: stable;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: var(--app-grey-600);
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
    }

    .el-row + .el-row {
      margin-top: var(--app-space-xs);
    }
  }
}
</style>
