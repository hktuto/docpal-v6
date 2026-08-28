<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import { clientApi, newClientApi } from 'api'
import { v7 as uuidv7 } from 'uuid'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const eFormData = computed(() => {
  return formData
})
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
  status: 'A' | 'D'
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
const brandOptions = ref<string[]>([])
const part_numberOptions = ref([])
const rules = {
  part_number: [{ required: true, message: 'Please select Part number', trigger: 'change' }],
  product_application: [{ required: true, message: 'Please input product application', trigger: 'blur' }],
  monthly_quantity: [{ required: true, type: 'number', message: 'Please input monthly quantity', trigger: 'change' }],
  old_sales_price_noTax: [{ required: true, message: 'Please input Old Sales Price(NoTax)', trigger: 'blur' }]
}

function getMoqRules(itemIndex: number, tierIndex: number) {
  return [
    { required: true, type: 'number', message: 'Please input MOQ', trigger: 'change' },
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (tierIndex === 0) {
          callback()
          return
        }
        const prevMoq = formModel.value.infoList[itemIndex]?.target_price_list[tierIndex - 1]?.moq
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

function getTargetPriceRules(itemIndex: number, tierIndex: number) {
  return [
    { required: true, type: 'number', message: 'Please input target price', trigger: 'change' },
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (tierIndex === 0) {
          callback()
          return
        }
        const prevPrice = formModel.value.infoList[itemIndex]?.target_price_list[tierIndex - 1]?.target_price
        if (prevPrice != null && new Decimal(value).gte(prevPrice)) {
          callback(new Error('Target price must be lower than the previous tier'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

function handleMoqChange(itemIndex: number, tierIndex: number) {
  const list = formModel.value.infoList[itemIndex]?.target_price_list
  if (!list) return

  const fields = [`infoList.${itemIndex}.target_price_list.${tierIndex}.moq`]
  if (tierIndex + 1 < list.length) {
    fields.push(`infoList.${itemIndex}.target_price_list.${tierIndex + 1}.moq`)
  }

  nextTick(() => {
    formRef.value?.validateField(fields)
  })
}

function handleTargetPriceChange(itemIndex: number, tierIndex: number) {
  const list = formModel.value.infoList[itemIndex]?.target_price_list
  if (!list) return

  const fields = [`infoList.${itemIndex}.target_price_list.${tierIndex}.target_price`]
  if (tierIndex + 1 < list.length) {
    fields.push(`infoList.${itemIndex}.target_price_list.${tierIndex + 1}.target_price`)
  }

  nextTick(() => {
    formRef.value?.validateField(fields)
  })
}

function handleSampleInfoAdd(index?: number) {
  const uuid = uuidv7()
  const newValue = {
    sample_id: uuid,
    quotation_number: '',
    brand: formModel.value.brand,
    part_number: '',
    series: '',
    product_application: '',
    monthly_quantity: 1,
    quantity_machine: 0,
    mpq: 1,
    uom: '',
    competitor_name: '',
    customer_part_number: '',
    old_sales_price_noTax: 0,
    remarks: '',
    status: 'A',
    target_price_list: [
      {
        sample_id: uuid,
        tier_number: 1,
        moq: 1000,
        cost_currency: formData.currency,
        target_price: 1,
        unit_cost: 0,
        status: 'A'
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
  const length = data.value[index].target_price_list?.length || 0
  const defaultMoq: number = 1000 + length * 100
  const defaultTargetPrice: number = new Decimal(1).minus(new Decimal(length).times('0.01')).toNumber()

  const newVar = {
    sample_id: data.value[index].sample_id,
    tier_number: length + 1,
    moq: defaultMoq,
    target_price: defaultTargetPrice,
    unit_cost: 0,
    status: 'A'
  } as TargetPriceItem

  data.value[index].target_price_list.push(newVar)
}

function handleTargetPriceItemRemove(index: number, targetPriceIndex: number) {
  data.value[index].target_price_list.splice(targetPriceIndex, 1)
}

async function init() {
  brandOptions.value = await $api.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
}

async function getFormData(needValidation = true) {
  const result = {
    brand: formModel.value.brand,
    sample_info_list: formModel.value.infoList
  }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

async function getPartList(part_number?: string) {
  try {
    const data = await $api
      .get(`/apis/v1/ms/oracle/wcl-item-nos?q=${part_number}&&brand=${formModel.value.brand}&pageNum=1&pageSize=100`)
      .then((r: any) => r.data.items)
    if (data.length === 0) return

    part_numberOptions.value = data.map((item: any) => ({
      id: item.inventory_item_id,
      label: item.wcl_item_no,
      value: item.wcl_item_no,
      brand: item.brand,
      moq: item.moq,
      uom: item.uom
    }))
  } catch (e) {
    console.log(e)
  }
}

async function handleChangeBrand() {
  if (!formModel.value.brand || formModel.value.brand === '') return

  part_numberOptions.value = []
  handleSampleInfoAdd()
  await getPartList('')
}

function handlePartNumberChange(item: any) {
  const find = part_numberOptions.value.find((part_numberItem: any) => part_numberItem.value === item.part_number)
  if (!!find) {
    item.mpq = find.mpq
    item.uom = find.uom
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
  filedData.tableFields.forEach((item: any) => {
    filedMapping[item.field_name as string] = item.field_name_alias
  })

  const param = {
    tableId: tableId,
    conditions,
    columns: [{ name: 'f_7969_c576d886' }, { name: 'f_7965_9760c235' }, { name: 'f_8110_037ef712' }, { name: 'f_8100_c3428722' }],
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

function handleChangeCurrency(currency) {
  if (formModel.value.infoList.length > 0) {
    formModel.value.infoList.forEach((item: any) => {
      item.target_price_list.forEach((priceItem: any) => {
        priceItem.cost_currency = currency
      })
    })
  }
}

onMounted(() => {
  init()
})

watch(
  () => formData.currency,
  (value, oldValue) => {
    if (value === oldValue) return

    handleChangeCurrency(value)
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" label-position="top" :model="formModel">
    <el-row>
      <el-col :span="8">
        <el-form-item label="品牌 Brand" prop="brand" required>
          <el-select v-model="formModel.brand" class="full-width-input" clearable filterable :disabled="data.length > 0" @change="handleChangeBrand">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.lable" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-button v-if="!!formModel.brand && data.length === 0" type="primary" @click="handleSampleInfoAdd">Add Sample Info</el-button>
    <template v-for="(item, index) in formModel.infoList" :key="item.sample_id">
      <div class="info-item-card">
        <div class="info-item-card__header">
          <span class="info-item-card__index">{{ index + 1 }}.</span>
          <div class="info-item-card__actions">
            <el-button :icon="Plus" type="primary" @click="handleSampleInfoAdd(index + 1)" />
            <el-button :icon="Delete" type="danger" @click="handleSampleInfoRemove(index)" />
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="型號 Part Number" :prop="`infoList.${index}.part_number`" required>
              <el-select-v2
                v-model="item.part_number"
                filterable
                remote
                :remote-method="getPartList"
                remote-show-suffix
                clearable
                :options="part_numberOptions"
                placeholder="Please enter a keyword"
                @change="handlePartNumberChange(item)"
              />
            </el-form-item>
            <el-form-item label="單機用量 Quantity Machine" prop="quantity_machine">
              <el-input-number v-model="item.quantity_machine" controls-position="right" :min="0" :step="1" step-strictly />
            </el-form-item>
            <el-form-item label="競爭對手名稱 Competitor Name" prop="competitor_name">
              <el-input v-model="item.competitor_name" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="產品應用 Product Application" :prop="`infoList.${index}.product_application`" :rules="rules.product_application" required>
              <el-input v-model="item.product_application" />
            </el-form-item>
            <el-form-item label="最小包裝數 MPQ " prop="mpq">
              <el-input-number v-model="item.mpq" disabled />
            </el-form-item>

            <el-form-item label="客戶零件編號 Customer Part Number" prop="customer_part_number">
              <el-input v-model="item.customer_part_number" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="月用量 Monthly Quantity" :prop="`infoList.${index}.monthly_quantity`" :rules="rules.monthly_quantity" required>
              <el-input-number v-model="item.monthly_quantity" controls-position="right" :min="1" :step="1" step-strictly />
            </el-form-item>
            <el-form-item label="单位 UOM" prop="uom">
              <el-input v-model="item.uom" disabled />
            </el-form-item>

            <el-form-item
              v-if="eFormData.quotation_reason === 'Discount Request'"
              label="原銷售價格(不含稅) Old Sales Price(NoTax)"
              :prop="`infoList.${index}.old_sales_price_noTax`"
              :rules="rules.old_sales_price_noTax"
              required
            >
              <el-input-number v-model="item.old_sales_price_noTax" controls-position="right" :min="1" :step="1" step-strictly />
            </el-form-item>
          </el-col>

          <el-divider />
          <el-col :span="24">
            <el-form-item label="詢價列表 Target Price List">
              <div class="targetPrice-item-card">
                <div class="targetPrice-item-card__header">
                  <span>設定不同數量檔位的目標價。 Higher MOQ → lower target price.</span>
                  <el-button :icon="Plus" type="primary" :disabled="item.target_price_list.length === 10" @click="handleTargetPriceItemAdd(index)" />
                </div>
                <el-divider />
                <el-row class="targetPrice-item-card__table-header">
                  <el-col :span="1">檔位 Tier</el-col>
                  <el-col :span="10">起订量 MOQ (階梯遞增加 Step decrease)</el-col>
                  <el-col :span="10">目標價 Target Price</el-col>
                  <el-col :span="2">操作 Actions</el-col>
                </el-row>
                <div class="targetPrice-item-card__body" :class="{ 'targetPrice-item-card__body--scrollable': item.target_price_list.length > 5 }">
                  <el-row v-for="(targetPriceItem, targetPriceIndex) in item.target_price_list" :key="targetPriceIndex">
                    <el-col :span="1" class="targetPrice-item-card__tier-col">T{{ targetPriceIndex + 1 }}</el-col>
                    <el-col :span="10">
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
                          @change="handleMoqChange(index, targetPriceIndex)"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="10">
                      <el-form-item
                        :prop="`infoList.${index}.target_price_list.${targetPriceIndex}.target_price`"
                        :rules="getTargetPriceRules(index, targetPriceIndex)"
                        class="target-price-form-item"
                      >
                        <el-input-number
                          style="width: 90%"
                          v-model="targetPriceItem.target_price"
                          controls-position="right"
                          :min="0.000001"
                          :step="0.000001"
                          step-strictly
                          @change="handleTargetPriceChange(index, targetPriceIndex)"
                        >
                          <template #suffix>
                            <span>{{ targetPriceItem.cost_currency }}</span>
                          </template>
                        </el-input-number>
                      </el-form-item>
                    </el-col>
                    <el-col :span="2">
                      <div class="targetPrice-item-card__actions" v-if="targetPriceIndex !== 0">
                        <el-button :icon="Delete" type="danger" @click="handleTargetPriceItemRemove(index, targetPriceIndex)" />
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-form-item>
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
