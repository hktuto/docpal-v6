<script setup lang="ts">
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
  id?: string
  sample_id: string
  tier_number: number
  moq: number
  target_price: number | undefined
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
const showDetails = ref<boolean[]>([])

function handleUnitPriceNoTaxChange(item: TargetPriceItem) {
  calculateMargin(item)
}

// (unit_price_no_tax - unit_cost × exchange_rate × markup_rate) / ( unit_cost × exchange_rate × markup_rate) × 100
function calculateMargin(item: TargetPriceItem) {
  const exchange_rate = new Decimal(item.exchange_rate)
  const unitPriceNoTax = new Decimal(Number(item.unit_price_no_tax))
  const unitCost = new Decimal(Number(item.unit_cost))
  // TODO: 需要管理層去確認的數據來源。Hank 反饋的暫時寫死
  const markup_rate = new Decimal(1.05)

  if (!Number(item.unit_price_no_tax) || !Number(item.unit_cost)) {
    item.profit = 0
    return
  }

  const totalCost = unitCost.times(exchange_rate).times(markup_rate)
  item.profit = Number(unitPriceNoTax.minus(totalCost).dividedBy(totalCost).times(100).toFixed(4))
}

async function init() {
  formModel.value = {
    brand: formData.brand,
    infoList: formData.sample_info_list
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

onMounted(async () => {})

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
              <el-input v-model="item.series" class="full-width-input" disabled />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="價格類型 Price Type">
              <el-input v-model="item.price_type" class="full-width-input" disabled />
            </el-form-item>
            <el-form-item label="交貨時間 Lead Time">
              <el-date-picker v-model="item.lead_time" type="date" placeholder="請選擇交貨時間" disabled />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="交易幣種 Currency">
              <el-input v-model="formData.currency" disabled />
            </el-form-item>
            <el-form-item label="備注 Remarks" prop="remarks">
              <el-input v-model="item.remarks" type="textarea" autosize disabled />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <div class="targetPrice-item-card">
              <el-row class="targetPrice-item-card__table-header">
                <el-col :span="1">檔位 Tier</el-col>
                <el-col :span="2">幣種 Currency</el-col>
                <el-col :span="3">匯率 Exchange Rate</el-col>
                <el-col :span="3">起订量 MOQ</el-col>
                <el-col :span="3">目標價 Target Price</el-col>
                <el-col :span="4">單位成本 Unit Cost</el-col>
                <el-col :span="4">單價(未稅) Unit Price(No Tax)</el-col>
                <el-col :span="3">毛利率(%) Profit(%)</el-col>
              </el-row>
              <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.target_price_list?.length > 5 }">
                <el-row v-for="(targetPriceItem, targetPriceIndex) in item.target_price_list" :key="targetPriceIndex">
                  <template v-if="targetPriceItem.status !== 'D'">
                    <el-col :span="1" class="targetPrice-item-card__tier-col"> T{{ targetPriceIndex + 1 }} </el-col>
                    <el-col :span="2">
                      <el-input v-model="targetPriceItem.cost_currency" class="full-width-input" disabled style="width: 90%" />
                    </el-col>
                    <el-col :span="3">
                      <el-input-number v-model="targetPriceItem.exchange_rate" disabled style="width: 90%" />
                    </el-col>
                    <el-col :span="3">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.moq" disabled />
                    </el-col>
                    <el-col :span="3">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.target_price" disabled />
                    </el-col>
                    <el-col :span="4">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.unit_cost" disabled />
                    </el-col>
                    <el-col :span="4">
                      <el-form-item class="target-price-form-item">
                        <el-input-number
                          style="width: 90%"
                          v-model="targetPriceItem.unit_price_no_tax"
                          controls-position="right"
                          :min="0.000001"
                          :step="0.000001"
                          @change="handleUnitPriceNoTaxChange(targetPriceItem)"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="3">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.profit" disabled>
                        <template #suffix>
                          <span>%</span>
                        </template>
                      </el-input-number>
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
