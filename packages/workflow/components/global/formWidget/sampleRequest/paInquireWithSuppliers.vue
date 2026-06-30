<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

function isSeries(item: any) {
  return item.series !== ''
}

type dataType = {
  id: string
  line_number: number
  vendor: string
  part_number: string
  series: string
  received_date: string
  pm: string
  vendor_coo: string
  sales_admin: string
  etd: string
  vendor_attn: string
  eta: string
}

const formModel = reactive<{ list: dataType[] }>({
  list: [
    {
      id: '',
      line_number: 0,
      vendor: '',
      part_number: '',
      series: '',
      received_date: '',
      pm: '',
      vendor_coo: '',
      sales_admin: '',
      etd: '',
      vendor_attn: '',
      eta: ''
    }
  ]
})
const data = toRef(formModel, 'list')

const formRef = ref()
const rules = {
  etd: [{ required: true, message: '請選擇供應商預計發貨時間', trigger: 'change' }],
  eta: [{ required: true, message: '請選擇供應商樣品預計到達時間', trigger: 'change' }]
}

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
  <el-form label-position="top" ref="formRef" :model="formModel">
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
              <el-input v-model="item.pm" />
            </el-form-item>
            <el-form-item label="供應商產地">
              <el-input v-model="item.vendor_coo" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="銷售經理">
              <el-input v-model="item.sales_admin" />
            </el-form-item>
            <el-form-item label="供應商預計發貨時間" required :prop="`list.${index}.etd`" :rules="rules.etd">
              <el-date-picker v-model="item.etd" type="date" placeholder="Pick a day" :clearable="false" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="供應商聯係人">
              <el-input v-model="item.vendor_attn" />
            </el-form-item>
            <el-form-item label="供應商樣品預計到達時間" required :prop="`list.${index}.eta`" :rules="rules.eta">
              <el-date-picker v-model="item.eta" type="date" placeholder="Pick a day" :clearable="false" />
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
