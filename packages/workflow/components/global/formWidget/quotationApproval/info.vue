<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()

type SampleInfoItem = {
  id?: string
  sample_id: string
  brand: string
  part_number: string
  series?: string
  mpq: number
  uom: string
  monthly_quantity: number
  quantity_machine: number
  product_application: string
  old_sales_price_noTax: string
  competitor_name: string
  customer_part_number: string
  cost_currency: string
  price_type: string
  lead_time: string
  unit_cost: number
  unit_price_no_tax: number
  exchange_rate: number
  remarks: string
  status: string
  target_price_list: TargetPriceItem[]
}

type TargetPriceItem = {
  sample_id: string
  tier_number: number
  moq: number
  target_price: number
  unit_price_no_tax: number
  unit_cost: number
  margin: string
  customer_final_price: number
  sales_price: number
  status: 'A' | 'D'
}

const formModel = ref<{
  brand: string
  infoList: SampleInfoItem[]
}>({
  brand: '',
  infoList: [
    {
      sample_id: '',
      brand: 'KOA',
      part_number: '',
      series: '',
      mpq: 100,
      uom: '',
      monthly_quantity: 11,
      quantity_machine: 1,
      product_application: '',
      old_sales_price_noTax: '',
      competitor_name: '',
      customer_part_number: '',
      target_price_list: [],
      cost_currency: 'CNY',
      price_type: 'STD',
      lead_time: '',
      unit_cost: 0,
      unit_price_no_tax: 0,
      exchange_rate: 1,
      status: 'Active',
      remarks: ''
    }
  ]
})
const data = toRef(formModel.value, 'infoList')
const part_numberOptions = ref([])
const showDetails = ref<boolean[]>([])
const costCurrencyOptions = ref([
  { label: 'CNY', value: 'CNY' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'HKD', value: 'HKD' },
  { label: 'USD', value: 'USD' }
])

function handleTargetPriceItemRemove(index: number, targetPriceIndex: number) {
  data.value[index].target_price_list.splice(targetPriceIndex, 1)
}

function init() {
  formModel.value = {
    brand: formData.brand,
    infoList: formData.sample_info_list
  }
}

async function getFormData(needValidation = true) {
  const result = { set_sample_list: formModel.value.infoList }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

watch(
  () => formModel.value.infoList.length,
  (length) => {
    showDetails.value = Array.from({ length }, (_, index) => showDetails.value[index] ?? false)
  },
  { immediate: true }
)

watch(
  () => formData.set_sample_list,
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
  <el-form ref="formRef" label-position="top" :model="formModel" disabled>
    <el-row>
      <el-col :span="8">
        <el-form-item label="品牌 Brand" prop="brand">
          <el-input v-model="formModel.brand" />
        </el-form-item>
      </el-col>
    </el-row>

    <template v-for="(item, index) in formModel.infoList" :key="item.sample_id">
      <div class="info-item-card">
        <div class="info-item-card__header">
          <span class="info-item-card__index">{{ index + 1 }}.</span>
          <div class="info-item-card__actions">
            <el-button type="primary" @click="showDetails[index] = !showDetails[index]" :disabled="false">
              {{ showDetails[index] ? '隱藏詳情' : '更多詳情' }}
            </el-button>
            <!--            <el-button :icon="Delete" type="danger" @click="handleSampleInfoRemove(index)" />-->
          </div>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="型號 Part Number" prop="part_number">
              <div class="">
                Part Number: <el-input v-model="item.part_number" />
                <template v-if="formModel.brand === 'KOA'">
                  系列 Series:
                  <el-select v-model="item.series" class="full-width-input">
                    <el-option
                      v-for="(part_numberItem, part_numberIndex) in part_numberOptions"
                      :key="part_numberIndex"
                      :label="part_numberItem.label"
                      :value="part_numberItem.value"
                    />
                  </el-select>
                </template>
              </div>
            </el-form-item>
            <el-form-item label="備注 Remarks" :required="item.status === 'OnHold'" prop="remarks">
              <el-input v-model="item.remarks" type="textarea" :rows="formModel.brand === 'KOA' ? 4 : 6" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="貨幣 Cost Currency">
              <el-select v-model="item.cost_currency" class="full-width-input">
                <el-option v-for="item in costCurrencyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="實際貨幣 Currency">
              <el-input v-model="formData.currency" />
            </el-form-item>
            <el-form-item label="價格類型 Price Type">
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
            <el-form-item label="成本 Unit Cost">
              <el-input-number v-model="item.unit_cost" controls-position="right" :min="0.00001" :step="0.00001" step-strictly />
            </el-form-item>
            <el-form-item label="單價(未稅) Unit Price(No Tax)">
              <el-input-number v-model="item.unit_price_no_tax" controls-position="right" :min="0.00001" :step="0.00001" step-strictly />
            </el-form-item>
            <el-form-item label="匯率 Exchange Rate">
              <el-input-number v-model="item.exchange_rate" controls-position="right" :min="0.00001" :step="0.00001" step-strictly />
            </el-form-item>
            <!--            <el-form-item label="狀態 Status">-->
            <!--              <el-select v-model="item.status" class="full-width-input">-->
            <!--                <el-option value="Active" label="Active" />-->
            <!--                <el-option value="OnHold" label="OnHold" />-->
            <!--              </el-select>-->
            <!--            </el-form-item>-->
          </el-col>

          <el-col :span="24">
            <div class="targetPrice-item-card">
              <div class="targetPrice-item-card__header">
                <span>設定不同數量檔位的目標價。 Higher MOQ → lower target price.</span>
              </div>
              <el-divider />
              <el-row class="targetPrice-item-card__table-header">
                <el-col :span="2">檔位 Tier</el-col>
                <el-col :span="4">起订量 MOQ</el-col>
                <el-col :span="4">目標價 Target Price</el-col>
                <el-col :span="5">單價(未稅) Unit Price(No Tax)</el-col>
                <el-col :span="4">單位成本 Unit Cost</el-col>
                <el-col :span="3">毛利率(%) Margin(%)</el-col>
                <el-col :span="2">操作 Actions</el-col>
              </el-row>
              <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.target_price_list.length > 5 }">
                <el-row v-for="(targetPriceItem, targetPriceIndex) in item.target_price_list" :key="targetPriceIndex">
                  <template v-if="targetPriceItem.status !== 'D'">
                    <el-col :span="2">第{{ targetPriceIndex + 1 }}檔 / T{{ targetPriceIndex + 1 }}</el-col>
                    <el-col :span="4">
                      <el-input-number style="width: 90%" v-model="targetPriceItem.moq" controls-position="right" :min="1" :step="1" step-strictly />
                    </el-col>
                    <el-col :span="4">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.target_price"
                        controls-position="right"
                        :min="0.00001"
                        :step="0.00001"
                        step-strictly
                      />
                    </el-col>
                    <el-col :span="5">
                      <el-input-number
                        style="width: 90%"
                        v-model="targetPriceItem.unit_price_no_tax"
                        controls-position="right"
                        :min="0.00001"
                        :step="0.00001"
                        step-strictly
                        :disabled="false"
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
                      />
                    </el-col>
                    <el-col :span="3">
                      <el-input style="width: 90%" v-model="targetPriceItem.margin" />
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
