<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import { Plus, Delete, Switch } from '@element-plus/icons-vue'
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const isSeries = ref<boolean>(false)
const data = ref<any[]>([
  {
    line_number: 1,
    vendor: '',
    part_number: '',
    series: '',
    purpose: '',
    pcs_unit: 1,
    fcst_qty: 1,
    request_qty: 1,
    run_rate: 1,
    packaged: 'N',
    car_use: 'N',
    cust_selected_parts: 'Introduced by Sales',
    competitor_name: '',
    competitor_pn: '',
    competitor_unit_price: '',
    remarks: ''
  }
])
const partList = ref<any[]>([])

function handleAdd(index?: number) {
  const newValue = {
    line_number: data.value.length + 1,
    vendor: '',
    part_number: '',
    series: '',
    purpose: '',
    pcs_unit: 1,
    fcst_qty: 1,
    request_qty: 1,
    run_rate: 1,
    packaged: 'N',
    car_use: 'N',
    cust_selected_parts: 'Introduced by Sales',
    competitor_name: '',
    competitor_pn: '',
    competitor_unit_price: '',
    remarks: ''
  }

  if (!!index) {
    data.value.splice(index, 0, newValue)
  } else {
    data.value.push(newValue)
  }
}

function changePartNumberAndSeries(item: any) {
  item.vendor = ''
  item.part_number = ''
  item.series = ''
  isSeries.value = !isSeries.value
}

function handleRemove(index: number) {
  data.value.splice(index, 1)
}

function checkPurpose(vendor: string) {
  return ['MMC', 'COPAL', 'OKAYA'].includes(vendor.toUpperCase())
}

function getFormData() {
  return { sample_info_list: data.value }
}

async function getPartList() {
  const list = await getDbData('12ba8480-6936-11f1-922e-adee4ecc74b2')
  partList.value = list.map((item: any) => ({
    id: item.inventory_item_id,
    label: item.segment1,
    value: item.segment1,
    brand: item.attribute8
  }))
}

async function getDbData(tableId: string) {
  // Get Filed Mapping
  const filedData = await newClientApi
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

function changePartNumber(item: any) {
  const find = partList.value.find((part) => part.value === item.part_number)
  item.vendor = find?.brand || ''
}

onMounted(async () => {
  await getPartList()
})

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top" :disabled="formData.disabledInfo">
    <el-button v-if="data.length === 0" type="primary" @click="handleAdd">Add Sample Info</el-button>
    <template v-for="(item, index) in data">
      <div class="info-item-card">
        <div class="info-item-card__header">
          <span class="info-item-card__index">{{ index + 1 }}.</span>
          <div class="info-item-card__actions">
            <el-button :icon="Plus" @click="handleAdd(index + 1)" />
            <el-button :icon="Delete" type="danger" @click="handleRemove(index)" />
          </div>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="品牌">
              <el-input v-model="item.vendor" disabled />
            </el-form-item>
            <el-form-item label="單機用量">
              <el-input-number v-model="item.pcs_unit" controls-position="right" :min="1" />
            </el-form-item>
            <el-form-item v-if="checkPurpose(item.vendor)" label="目的" prop="purpose" required>
              <el-select v-model="item.purpose">
                <el-option value="New Design" label="New Design" />
                <el-option value="Replacement" label="Replacement" />
                <el-option value="Others" label="Others" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="isSeries ? '系列' : '型號'">
              <div class="partNumber-series-change">
                <el-select v-if="isSeries" v-model="item.series">
                  <el-option />
                </el-select>
                <el-select v-else v-model="item.part_number" @change="changePartNumber(item)">
                  <el-option v-for="part in partList" :key="part.id" :label="part.label" :value="part.value" />
                </el-select>
                <el-button :icon="Switch" type="primary" @click="changePartNumberAndSeries(item)" />
              </div>
            </el-form-item>

            <el-form-item label="月用量(K/M)">
              <el-input-number v-model="item.fcst_qty" controls-position="right" :min="1">
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="申請數量">
              <el-input-number v-model="item.request_qty" controls-position="right" :min="1" />
            </el-form-item>
            <el-form-item label="客戶月用量(K/M)">
              <el-input-number v-model="item.run_rate" controls-position="right" :min="1">
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="整盤">
              <el-switch v-model="item.packaged" active-text="Yes" active-value="Y" inactive-text="No" inactive-value="N" />
            </el-form-item>
            <el-form-item label="競爭者名稱" prop="competitor_name">
              <el-input v-model="item.competitor_name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否用於汽車" :required="['MMC', 'NCC'].includes(item.vendor.toUpperCase())" prop="car_use">
              <el-switch v-model="item.car_use" active-text="Yes" active-value="Yes" inactive-text="No" inactive-value="No" />
            </el-form-item>
            <el-form-item label="競爭者型號" prop="competitor_pn">
              <el-input v-model="item.competitor_pn" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客戶選擇或銷售推薦">
              <el-switch
                v-model="item.cust_selected_parts"
                active-text="客户选择"
                active-value="Selected by Customer"
                inactive-text="销售推荐"
                inactive-value="Introduced by Sales"
              />
            </el-form-item>
            <el-form-item label="競爭者價格">
              <el-input-number v-model="item.competitor_unit_price" controls-position="right" :min="1" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="備注" :required="item.purpose === 'Others'">
              <el-input v-model="item.remarks" :autosize="{ minRows: 2, maxRows: 6 }" type="textarea" placeholder="Please input" />
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

.partNumber-series-change {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
