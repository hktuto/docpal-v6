<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

function isSeries(item: any) {
  return item.series !== ''
}

const data = ref<any[]>([
  {
    line_number: '',
    vendor: '',
    purpose: '',
    series: '',
    part_number: '',
    fcst_qty: 1,
    request_qty: 1,
    run_rate: 1,
    packaged: 0,
    competitor_name: '',
    car_use: 'Y',
    competitor_pn: '',
    cust_selected_parts: 'Introduced by Sales',
    competitor_unit_price: 1,
    remarks: '',
    tracking_number: '',
    tracking_date: '',
    email_alert: 'Y'
  }
])

function checkPurpose(vendor: string) {
  return ['MMC', 'COPAL', 'OKAYA'].includes(vendor.toUpperCase())
}

function init() {
  if (!!formData.sample_info_list && formData.sample_info_list.length > 0) {
    data.value = formData.sample_info_list
  }
}

function getFormData() {
  return { sample_info_list: data.value }
}

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
  <el-form label-position="top" :disabled="formData.disabled">
    <template v-for="(item, index) in data">
      <div class="info-item-card">
        <span class="info-item-card__index">{{ index + 1 }}.</span>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="品牌">
              <el-input v-model="item.vendor" disabled />
            </el-form-item>
            <el-form-item label="單機用量">
              <el-input-number v-model="item.pcs_unit" controls-position="right" :min="1" disabled />
            </el-form-item>
            <el-form-item v-if="checkPurpose(item.vendor)" label="目的">
              <el-select v-model="item.purpose" disabled>
                <el-option value="New Design" label="New Design" />
                <el-option value="Replacement" label="Replacement" />
                <el-option value="Others" label="Others" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isSeries(item) ? '系列' : '型號'">
              <el-input disabled v-if="isSeries(item)" v-model="item.series" />
              <el-input disabled v-else v-model="item.part_number" />
            </el-form-item>

            <el-form-item label="月用量(K/M)">
              <el-input-number v-model="item.fcst_qty" controls-position="right" :min="1" disabled :step="1" step-strictly>
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="申請數量">
              <el-input-number v-model="item.request_qty" controls-position="right" :min="1" disabled :step="1" step-strictly />
            </el-form-item>
            <el-form-item label="客戶月用量(K/M)">
              <el-input-number v-model="item.run_rate" controls-position="right" :min="1" disabled :step="1" step-strictly>
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="整盤">
              <el-switch v-model="item.packaged" active-text="Yes" :active-value="1" inactive-text="No" :inactive-value="0" disabled />
            </el-form-item>
            <el-form-item label="競爭者名稱" prop="competitor_name">
              <el-input v-model="item.competitor_name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否用於汽車">
              <el-switch v-model="item.car_use" active-text="Yes" active-value="Yes" inactive-text="No" inactive-value="No" disabled />
            </el-form-item>
            <el-form-item label="競爭者型號" prop="competitor_pn">
              <el-input v-model="item.competitor_pn" disabled />
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
                disabled
              />
            </el-form-item>
            <el-form-item label="競爭者價格">
              <el-input-number v-model="item.competitor_unit_price" controls-position="right" :min="1" disabled :step="1" step-strictly />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="備注" :required="item.purpose === 'Others'">
              <el-input v-model="item.remarks" :autosize="{ minRows: 2, maxRows: 6 }" type="textarea" placeholder="Please input" disabled />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="快遞單號">
              <el-input v-model="item.tracking_number" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="快遞日期">
              <el-date-picker v-model="item.tracking_date" type="date" placeholder="Pick a day" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="送樣通知">
              <el-switch v-model="item.email_alert" active-text="Yes" active-value="YES" inactive-text="No" inactive-value="NO" />
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
</style>
