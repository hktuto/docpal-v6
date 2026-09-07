<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import { Delete } from '@element-plus/icons-vue'
import { MenuRouterKey } from '@packages/base/utils/menuType'
import { v7 as uuidv7 } from 'uuid'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
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
  price_type: string
  lead_time: number
  target_price_list: TargetPriceItem[]
}

type TargetPriceItem = {
  id?: string
  sample_id: string
  tier_number: number
  moq: number
  target_price: number | undefined
  data_source?: string
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
const exchangeRateList = ref<{ from_currency: string; to_currency: string; conversion_rate: number }[]>([])
const rules = {
  cost_currency: [{ required: true, message: 'Please select Cost Currency', trigger: 'change' }],
  price_type: [{ required: true, message: 'Please select Price Type', trigger: 'change' }]
}

type DescendingPriceField = 'unit_price_no_tax' | 'unit_cost'

const descendingPriceFieldLabels: Record<DescendingPriceField, string> = {
  unit_price_no_tax: 'unit price',
  unit_cost: 'unit cost'
}

function getPrevActiveTierIndex(list: TargetPriceItem[], tierIndex: number): number | null {
  for (let i = tierIndex - 1; i >= 0; i--) {
    if (list[i]?.status !== 'D') return i
  }
  return null
}

function getNextActiveTierIndex(list: TargetPriceItem[], tierIndex: number): number | null {
  for (let i = tierIndex + 1; i < list.length; i++) {
    if (list[i]?.status !== 'D') return i
  }
  return null
}

function getMoqRules(itemIndex: number, tierIndex: number) {
  return [
    { required: true, type: 'number', message: 'Please input MOQ', trigger: 'change' },
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        const list = formModel.value.infoList[itemIndex]?.target_price_list
        if (!list || list[tierIndex]?.status === 'D') {
          callback()
          return
        }
        const prevIndex = getPrevActiveTierIndex(list, tierIndex)
        if (prevIndex === null) {
          callback()
          return
        }
        const prevMoq = list[prevIndex]?.moq
        if (prevMoq != null && value <= prevMoq) {
          callback(new Error('MOQ must be greater than the previous tier'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

function getDescendingPriceRules(itemIndex: number, tierIndex: number, field: DescendingPriceField, message: string) {
  return [
    { required: true, type: 'number', message: `Please input ${descendingPriceFieldLabels[field]}`, trigger: 'change' }
    // {
    //   validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
    //     const list = formModel.value.infoList[itemIndex]?.target_price_list
    //     if (!list || list[tierIndex]?.status === 'D') {
    //       callback()
    //       return
    //     }
    //     const prevIndex = getPrevActiveTierIndex(list, tierIndex)
    //     if (prevIndex === null) {
    //       callback()
    //       return
    //     }
    //     const prevValue = list[prevIndex]?.[field]
    //     if (prevValue != null && new Decimal(value).gte(prevValue)) {
    //       callback(new Error(message))
    //       return
    //     }
    //     callback()
    //   },
    //   trigger: 'change'
    // }
  ]
}

function handleTierFieldChange(itemIndex: number, tierIndex: number, field: 'moq' | DescendingPriceField) {
  const list = formModel.value.infoList[itemIndex]?.target_price_list
  if (!list) return

  const fields = [`infoList.${itemIndex}.target_price_list.${tierIndex}.${field}`]
  const nextIndex = getNextActiveTierIndex(list, tierIndex)
  if (nextIndex !== null) {
    fields.push(`infoList.${itemIndex}.target_price_list.${nextIndex}.${field}`)
  }

  nextTick(() => {
    formRef.value?.validateField(fields)
  })
}

function handleUnitPriceNoTaxChange(itemIndex: number, tierIndex: number, item: TargetPriceItem) {
  calculateProfit(item)
  handleTierFieldChange(itemIndex, tierIndex, 'unit_price_no_tax')
}

function handleUnitCostChange(itemIndex: number, tierIndex: number, item: TargetPriceItem) {
  calculateProfit(item)
  handleTierFieldChange(itemIndex, tierIndex, 'unit_cost')
}

async function getExchangeRateList() {
  try {
    exchangeRateList.value = await clientApi.instance.get('/apis/v1/ms/oracle/conversion-rate?limit=500').then((r: any) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

async function getSeriesList(seriesNumber?: string) {
  try {
    const q = !!seriesNumber && seriesNumber !== '' ? `q=${seriesNumber}&` : ''
    const data = await clientApi.instance.get(`/apis/v1/ms/oracle/series?${q}pageNum=1&pageSize=50`).then((r: any) => r.data.items)

    seriesList.value = data.map((item: any) => ({
      label: item.displayName,
      value: item.value
    }))
  } catch (e) {
    console.log(e)
  }
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
  if (!filedData.tableFields) return

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

const historyPriceRef = ref()
function openDialog(index: number, item: any) {
  item.index = index
  item.currency = formData.currency
  item.org_id = formData.org_id
  historyPriceRef.value.open(item)
}

function handelCostCurrency(item: any) {
  const cost_currency = item.cost_currency
  const currency = formData.currency
  if (!cost_currency || !currency) return

  const find: any = exchangeRateList.value.find((item: any) => item.from_currency === cost_currency && item.to_currency === currency)
  item.exchange_rate = find.conversion_rate as number
  return item.exchange_rate
}

function handleHistoryPriceSubmit(data: any) {
  try {
    const item = formModel.value.infoList[data.index]
    const list = data.list || []
    const oldList = item.target_price_list || []

    const newList = list.map((newItem: any, index: number) => {
      let priceItem: TargetPriceItem
      if (!!oldList[index]) {
        priceItem = {
          ...oldList[index],
          unit_cost: Number(new Decimal(newItem.cost).times(new Decimal(newItem.exchangeRate)).toFixed(6)),
          unit_price_no_tax: Number(new Decimal(newItem.cost).times(new Decimal(newItem.exchangeRate)).toFixed(6)),
          exchange_rate: newItem.exchangeRate,
          data_source: newItem.type,
          profit: 1
        }
      } else {
        priceItem = {
          id: uuidv7(),
          sample_id: item.sample_id,
          tier_number: index,
          moq: 0,
          target_price: 0,
          data_source: newItem.type,
          unit_cost: Number(new Decimal(newItem.cost).times(new Decimal(newItem.exchangeRate)).toFixed(6)),
          unit_price_no_tax: Number(new Decimal(newItem.cost).times(new Decimal(newItem.exchangeRate)).toFixed(6)),
          cost_currency: formData.currency,
          exchange_rate: newItem.exchangeRate,
          profit: 1,
          status: 'A'
        }
      }
      calculateProfit(priceItem)
      return priceItem
    })

    if (item.target_price_list.length > newList.length) {
      item.target_price_list.splice(0, newList.length, ...newList)
    } else {
      item.target_price_list = newList
    }
  } catch (e) {
    console.log(e)
  }
}

function handleTargetPriceItemRemove(index: number, targetPriceIndex: number) {
  formModel.value.infoList[index].target_price_list[targetPriceIndex].status = 'D'
}

// (unit_price_no_tax - unit_cost × exchange_rate × markup_rate) / ( unit_cost × exchange_rate × markup_rate) × 100
function calculateProfit(item: TargetPriceItem) {
  if (!item.exchange_rate || !item.unit_cost || !item.unit_price_no_tax) return

  const exchange_rate = new Decimal(item.exchange_rate)
  const unitPriceNoTax = new Decimal(Number(item.unit_price_no_tax))
  const unitCost = new Decimal(Number(item.unit_cost))
  // TODO: 需要管理層去確認的數據來源。Hank 反饋的暫時寫死
  const markup_rate = new Decimal(1.05)

  if (!Number(item.unit_price_no_tax) || !Number(item.unit_cost)) {
    item.profit = 0
    return
  }

  const totalCost = unitCost.times(markup_rate)
  // const totalCost = unitCost.times(exchange_rate).times(markup_rate)
  item.profit = Number(unitPriceNoTax.minus(totalCost).dividedBy(totalCost).times(100).toFixed(6))
}

async function init() {
  if (!formData.quotation_number || formData.quotation_number === '') {
    routerProvider?.message.error('未找到報價編號')
    return
  }

  const data = await newClientApi.getQuotationFormQuotationnumber(formData.quotation_number).then((r: any) => r.data)
  if (!data.lines || data.lines.length === 0) {
    routerProvider?.message.error('未找到對應的零件信息!')
    return
  }
  const infoList = data.lines.map((item: any) => {
    const target_price_list = item.pricing_list.map((priceItem: any) => ({
      cost_currency: formData.currency,
      moq: priceItem.moq,
      sample_id: uuidv7(),
      status: 'A',
      target_price: priceItem.target_price,
      tier_number: priceItem.tier_number,
      unit_cost: '0.000001'
    }))

    return {
      brand: item.brand,
      competitor_name: item.competitor_name,
      customer_part_number: item.cust_part_number,
      monthly_quantity: item.monthly_quantity,
      mpq: item.moq,
      old_sales_price_noTax: item.old_sales_price,
      part_number: item.part_number,
      product_application: item.product_application,
      quantity_machine: 0,
      quotation_number: formData.quotation_number,
      remarks: '',
      sample_id: item.line_id,
      series: '',
      status: 'A',
      lead_time: '',
      price_type: 'STD',
      target_price_list: target_price_list,
      uom: item.uom
    }
  })

  formModel.value = {
    brand: formData.brand,
    infoList: infoList
  }
}

async function getFormData(needValidation = true) {
  const newTargetPriceList: any[] = []
  const newSetSampleList = formModel.value.infoList.map((item) => {
    newTargetPriceList.push(...item.target_price_list)
    const newItem = deepCopy(item)
    delete newItem.target_price_list
    return newItem
  })

  const result = {
    sample_info_list: formModel.value.infoList,
    set_sample_list: newSetSampleList,
    target_price_list: newTargetPriceList
  }
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
  () => formData.quotation_number,
  (value) => {
    if (!value) {
      return
    }
    init()
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
              <el-select-v2
                v-model="item.series"
                filterable
                remote
                :remote-method="getSeriesList"
                remote-show-suffix
                clearable
                :options="seriesList"
                placeholder="Please enter a keyword"
              />
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
              <el-date-picker v-model="item.lead_time" type="date" placeholder="請選擇交貨時間" format="YYYY/MM/DD" value-format="x" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="交易幣種 Currency">
              <el-input v-model="formData.currency" disabled />
            </el-form-item>
            <el-form-item label="備注 Remarks" prop="remarks">
              <el-input v-model="item.remarks" type="textarea" autosize />
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
                <el-col :span="1">檔位 Tier</el-col>
                <!--                <el-col :span="2">幣種 Currency</el-col>-->
                <el-col :span="3">匯率 Exchange Rate</el-col>
                <el-col :span="3">起订量 MOQ</el-col>
                <el-col :span="3">目標價 Target Price</el-col>
                <el-col :span="3">數據源 Data Source</el-col>
                <el-col :span="4">單位成本 Unit Cost</el-col>
                <el-col :span="4">單價(未稅) Unit Price(No Tax)</el-col>
                <el-col :span="3">毛利率(%) Profit(%)</el-col>
                <!--                <el-col :span="2">操作 Actions</el-col>-->
              </el-row>
              <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.target_price_list?.length > 5 }">
                <el-row v-for="(targetPriceItem, targetPriceIndex) in item.target_price_list" :key="targetPriceIndex">
                  <!--                  <template v-if="targetPriceItem.status !== 'D'">-->
                  <el-col :span="1" class="targetPrice-item-card__tier-col"> T{{ targetPriceIndex + 1 }} </el-col>
                  <!--                  <el-col :span="2">-->
                  <!--                    <el-input v-model="targetPriceItem.cost_currency" style="width: 90%" disabled />-->
                  <!--                  </el-col>-->
                  <el-col :span="3">
                    <el-input-number v-model="targetPriceItem.exchange_rate" disabled style="width: 90%" />
                  </el-col>
                  <el-col :span="3">
                    <el-form-item
                      :prop="`infoList.${index}.target_price_list.${targetPriceIndex}.moq`"
                      :rules="getMoqRules(index, targetPriceIndex)"
                      class="target-price-form-item"
                    >
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.moq"
                        controls-position="right"
                        :min="1"
                        :step="1"
                        step-strictly
                        @change="handleTierFieldChange(index, targetPriceIndex, 'moq')"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-input-number style="width: 90%" v-model="targetPriceItem.target_price" disabled>
                      <template #suffix>
                        <span>{{ targetPriceItem.cost_currency }}</span>
                      </template>
                    </el-input-number>
                  </el-col>
                  <el-col :span="3">
                    <el-input v-model="targetPriceItem.data_source" disabled style="width: 90%" />
                  </el-col>
                  <el-col :span="4">
                    <el-form-item
                      :prop="`infoList.${index}.target_price_list.${targetPriceIndex}.unit_cost`"
                      :rules="getDescendingPriceRules(index, targetPriceIndex, 'unit_cost', 'Unit cost must be lower than the previous tier')"
                      class="target-price-form-item"
                    >
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.unit_cost"
                        controls-position="right"
                        :min="0.000001"
                        :step="0.000001"
                        step-strictly
                        @change="handleUnitCostChange(index, targetPriceIndex, targetPriceItem)"
                      >
                        <template #suffix>
                          <span>{{ targetPriceItem.cost_currency }}</span>
                        </template>
                      </el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item
                      :prop="`infoList.${index}.target_price_list.${targetPriceIndex}.unit_price_no_tax`"
                      :rules="getDescendingPriceRules(index, targetPriceIndex, 'unit_price_no_tax', 'Unit price must be lower than the previous tier')"
                      class="target-price-form-item"
                    >
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.unit_price_no_tax"
                        controls-position="right"
                        :min="targetPriceItem.unit_cost"
                        :step="0.000001"
                        step-strictly
                        @change="handleUnitPriceNoTaxChange(index, targetPriceIndex, targetPriceItem)"
                      >
                        <template #suffix>
                          <span>{{ targetPriceItem.cost_currency }}</span>
                        </template>
                      </el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-input-number style="width: 90%" v-model="targetPriceItem.profit" disabled>
                      <template #suffix>
                        <span>%</span>
                      </template>
                    </el-input-number>
                  </el-col>
                  <!--                    <el-col :span="2">-->
                  <!--                      <div class="targetPrice-item-card__actions" v-if="targetPriceIndex !== 0">-->
                  <!--                        <el-button :icon="Delete" type="danger" @click="handleTargetPriceItemRemove(index, targetPriceIndex)" />-->
                  <!--                      </div>-->
                  <!--                    </el-col>-->
                  <!--                  </template>-->
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
              <el-form-item label="原銷售價格(不含稅) Old Sales Price(NoTax)" prop="old_sales_price_noTax">
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

  &__tier-col {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  &__body {
    --target-price-row-height: 48px;

    .target-price-form-item {
      margin-bottom: 0;
    }

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
