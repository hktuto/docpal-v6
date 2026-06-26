<script setup lang="ts">
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
    pm: '',
    packaged: 0,
    sales_admin: '',
    received_date: '',
    vendor_attn: '',
    actual_received_qty: 1
  }
])

function info() {
}

function getFormData() {
  return { list: data.value }
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
            <el-form-item :label="isSeries ? '系列' : '型號'">
              <div class="partNumber-series-change">
                <el-select disabled v-if="isSeries" v-model="item.series">
                  <el-option />
                </el-select>
                <el-select disabled v-else v-model="item.part_number">
                  <el-option />
                </el-select>
              </div>
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

            <el-form-item label="收到供應商樣品時間">
              <el-date-picker v-model="item.received_date" type="date" placeholder="Pick a day" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="供應商聯係人">
              <el-input v-model="item.vendor_attn" disabled />
            </el-form-item>
            <el-form-item label="實際接收數量">
              <el-input-number v-model="item.actual_received_qty" controls-position="right" :min="1" />
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
