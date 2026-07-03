<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

function isSeries(item: any) {
  return item.series !== ''
}

const formRef = ref()
const rules = {
  received_date: [{ required: true, message: '請選擇收到供應商樣品時間', trigger: 'change' }],
  actual_received_qty: [{ required: true, message: '請輸入實際接收數量', trigger: 'change' }]
}

type dataType = {
  line_number: string
  vendor: string
  part_number: string
  series: string
  pm: string
  packaged: number
  sales_admin: string
  received_date: string
  vendor_attn: string
  actual_received_qty: number
}

const formModel = reactive<{ list: dataType[] }>({
  list: [
    {
      line_number: '',
      vendor: '',
      part_number: '',
      series: '',
      pm: '',
      packaged: 0,
      sales_admin: '',
      received_date: '',
      vendor_attn: '',
      actual_received_qty: 1
    }
  ]
})
const data = toRef(formModel, 'list')

function init() {
  if (!!formData.sample_info_list && formData.sample_info_list.length > 0) {
    formModel.list = formData.sample_info_list
  }
}

async function getFormData(needValidation = true) {
  const result = { sample_info_list: formModel.list }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
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
  <el-form label-position="top" ref="formRef" :model="formModel" :rules="rules" :disabled="disabled">
    <template v-for="(item, index) in data" :key="item.line_number ?? index">
      <div class="info-item-card">
        <span class="info-item-card__index">{{ index + 1 }}.</span>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="品牌">
              <el-input disabled v-model="item.vendor" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isSeries(item) ? '系列' : '型號'">
              <el-input disabled v-if="isSeries(item)" v-model="item.series" />
              <el-input disabled v-else v-model="item.part_number" />
            </el-form-item>
          </el-col>
          <el-col :span="8" />

          <el-col :span="8">
            <el-form-item label="產品經理">
              <el-input v-model="item.pm" disabled />
            </el-form-item>
            <el-form-item label="整盤">
              <el-switch v-model="item.packaged" active-text="Yes" :active-value="1" inactive-text="No" :inactive-value="0" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="銷售經理">
              <el-input v-model="item.sales_admin" disabled />
            </el-form-item>

            <el-form-item label="收到供應商樣品時間" required :prop="`list.${index}.received_date`">
              <el-date-picker v-model="item.received_date" type="date" placeholder="Pick a day" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="供應商聯係人">
              <el-input v-model="item.vendor_attn" disabled />
            </el-form-item>
            <el-form-item label="實際接收數量" required :prop="`list.${index}.actual_received_qty`">
              <el-input-number v-model="item.actual_received_qty" controls-position="right" :min="1" :step="1" step-strictly value-on-clear="min" />
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
