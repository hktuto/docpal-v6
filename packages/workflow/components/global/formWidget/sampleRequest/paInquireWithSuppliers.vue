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

const data = ref<dataType[]>([
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
])

function info() {
  if (!!formData.sample_info_list && formData.sample_info_list.length > 0) {
    data.value = formData.sample_info_list
    console.log(123, formData.sample_info_list)
  }
}

function getFormData() {
  return { sample_info_list: data.value }
}

onMounted(() => {
  info()
})

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top">
    <template v-for="(item, index) in data">
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
            <el-form-item label="供應商預計發貨時間">
              <el-date-picker v-model="item.etd" type="date" placeholder="Pick a day" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="供應商聯係人">
              <el-input v-model="item.vendor_attn" />
            </el-form-item>
            <el-form-item label="供應商樣品預計到達時間">
              <el-date-picker v-model="item.eta" type="date" placeholder="Pick a day" />
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
