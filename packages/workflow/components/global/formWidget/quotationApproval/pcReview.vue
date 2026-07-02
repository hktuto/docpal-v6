<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()

type SampleInfoItem = {
  id?: string
  line_number: string
  brand: string
  part_number: string
  mpq: number
  uom: string
  monthly_quantity: number
  quantity_machine: number
  product_application: string
  old_sales_price_noTax: string
  competitor_name: string
  customer_part_number: string
  targetPrice_list: TargetPriceItem[]
}

type TargetPriceItem = {
  tier_number: number
  moq: number
  target_price: number
  unit_cost: number
  price: number
  customer_final_price: number
  sales_price: number
}

const formModel = ref<{
  brand: string
  infoList: SampleInfoItem[]
}>({
  brand: '',
  infoList: []
})
const data = toRef(formModel.value, 'infoList')
const brandOptions = ref([])
const part_numberOptions = ref([])
const customerPartNumberOptions = ref([])

function handleSampleInfoAdd(index?: number) {
  const newValue = {
    line_number: '',
    brand: formModel.value.brand,
    part_number: '',
    mpq: 1,
    uom: '',
    monthly_quantity: 1,
    quantity_machine: 1,
    product_application: '',
    old_sales_price_noTax: '',
    competitor_name: '',
    customer_part_number: '',
    targetPrice_list: [
      {
        tier_number: 1,
        moq: 1000,
        target_price: 0.01,
        unit_cost: 0,
        price: 0,
        customer_final_price: 0,
        sales_price: 0
      }
    ] as TargetPriceItem[]
  } as SampleInfoItem

  if (!!index) {
    data.value.splice(index, 0, newValue)
  } else {
    data.value.push(newValue)
  }
}

function handleSampleInfoRemove(index: number) {
  data.value.splice(index, 1)
}

function handleTargetPriceItemAdd(index: number) {
  const length = data.value[index].targetPrice_list?.length || 0
  const defaultMoq: number = 1000 - length * 100
  const defaultTargetPrice: number = (length + 1) * 0.01

  data.value[index].targetPrice_list.push({ tier: '', moq: defaultMoq, targetPrice: defaultTargetPrice })
}

function handleTargetPriceItemRemove(index: number, targetPriceIndex: number) {
  data.value[index].targetPrice_list.splice(targetPriceIndex, 1)
}

async function getFormData(needValidation = true) {
  const result = { sample_info_list: formModel.list }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}
defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" label-position="top" :model="formModel">
    <el-row>
      <el-col :span="8">
        <el-form-item label="品牌 Brand" prop="brand">
          <el-select v-model="formModel.brand" class="full-width-input" clearable :disabled="data.length > 0">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-button v-if="data.length === 0" type="primary" @click="handleSampleInfoAdd">Add Sample Info</el-button>
    <template v-for="(item, index) in formModel.infoList" :key="item.line_number">
      <div class="info-item-card">
        <div class="info-item-card__header">
          <span class="info-item-card__index">{{ index + 1 }}.</span>
          <div class="info-item-card__actions">
            <el-button :icon="Plus" @click="handleSampleInfoAdd(index + 1)" />
            <el-button :icon="Delete" type="danger" @click="handleSampleInfoRemove(index)" />
          </div>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="型號 Part Number" prop="part_number">
              <el-select v-model="item.part_number" class="full-width-input" clearable>
                <el-option
                  v-for="(part_numberItem, part_numberIndex) in part_numberOptions"
                  :key="part_numberIndex"
                  :label="part_numberItem.label"
                  :value="part_numberItem.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="單機用量 Quantity Machine" prop="quantity_machine">
              <el-input-number v-model="item.quantity_machine" controls-position="right" :min="1" :step="1" step-strictly />
            </el-form-item>
            <el-form-item label="原銷售價格（不含稅） Old Sales Price(NoTax)" prop="old_sales_price_noTax">
              <el-input-number v-model="item.old_sales_price_noTax" controls-position="right" :min="1" :step="1" step-strictly />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="產品應用 Product Application" prop="product_application">
              <el-input v-model="item.product_application" clearable />
            </el-form-item>
            <el-form-item label="最小包裝數 MPQ " prop="mpq">
              <el-input v-model="item.mpq" disabled clearable />
            </el-form-item>
            <el-form-item label="競爭對手名稱 Competitor Name" prop="competitor_name">
              <el-input v-model="item.competitor_name" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="月用量 Monthly Quantity" prop="monthly_quantity">
              <el-input-number v-model="item.monthly_quantity" controls-position="right" :min="1" :step="1" step-strictly />
            </el-form-item>
            <el-form-item label="单位 UOM" prop="uom">
              <el-input v-model="item.uom" disabled />
            </el-form-item>
            <el-form-item label="客戶零件編號 Customer Part Number" prop="customer_part_number">
              <el-input v-model="item.customer_part_number" clearable />
              <el-select v-model="item.customer_part_number" class="full-width-input" clearable>
                <el-option
                  v-for="(customerPartNumberItem, customerPartNumberIndex) in customerPartNumberOptions"
                  :key="customerPartNumberIndex"
                  :label="customerPartNumberItem.label"
                  :value="customerPartNumberItem.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <div class="targetPrice-item-card">
              <div class="targetPrice-item-card__header">
                <span>設定不同數量檔位的目標價。 Higher MOQ → lower target price.</span>
                <el-button :icon="Plus" :disabled="item.targetPrice_list.length === 10" @click="handleTargetPriceItemAdd(index)" />
              </div>
              <el-divider />
              <el-row class="targetPrice-item-card__table-header">
                <el-col :span="2">檔位 Tier</el-col>
                <el-col :span="10">起订量 MOQ (階梯遞減 Step decrease)</el-col>
                <el-col :span="10">目標價 Target Price</el-col>
                <el-col :span="2">操作 Actions</el-col>
              </el-row>
              <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.targetPrice_list.length > 5 }">
                <el-row v-for="(targetPriceItem, targetPriceIndex) in item.targetPrice_list" :key="targetPriceIndex">
                  <el-col :span="2">第{{ targetPriceIndex + 1 }}檔 / T{{ targetPriceIndex + 1 }}</el-col>
                  <el-col :span="10">
                    <el-input-number style="width: 90%" v-model="targetPriceItem.moq" controls-position="right" :min="1" :step="1" step-strictly />
                  </el-col>
                  <el-col :span="10">
                    <el-input-number
                      style="width: 90%"
                      v-model="targetPriceItem.target_price"
                      controls-position="right"
                      :min="0.000001"
                      :step="0.000001"
                      step-strictly
                    />
                  </el-col>
                  <el-col :span="2">
                    <div class="targetPrice-item-card__actions">
                      <el-button :icon="Delete" type="danger" @click="handleTargetPriceItemRemove(index, targetPriceIndex)" />
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-col>
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
