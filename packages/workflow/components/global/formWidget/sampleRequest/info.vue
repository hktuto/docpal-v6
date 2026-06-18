<script setup lang="ts">
import { Plus, Delete, Switch } from '@element-plus/icons-vue'
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const isSeries = ref<boolean>(false)

const data = ref<any[]>([
  {
    line_number: '',
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
    actual_received_qty: '',
    competitor_name: '',
    competitor_pn: '',
    competitor_unit_price: '',
    remarks: ''
  }
])

function handleAdd(index?: number) {
  const newValue = {
    line_number: `${formData.proj_owner}-${formData.cust_num}-${Date.now()}`,
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
    actual_received_qty: '',
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

</script>

<template>
  <el-form label-position="top" :disabled="formData.disabled">
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
              <el-input v-model="item.vendor" />
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
                <el-select v-else v-model="item.part_number">
                  <el-option />
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
              <el-switch v-model="item.car_use" active-text="Yes" active-value="Y" inactive-text="No" inactive-value="N" />
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
