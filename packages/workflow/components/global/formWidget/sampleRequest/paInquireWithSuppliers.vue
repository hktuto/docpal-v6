<script setup lang="ts">
import { clientApi, newClientApi } from 'api'

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

async function info() {
  if (!formData.sample_request_id || formData.sample_request_id === '') return

  const data = await getDbData('a38fddb0-6a18-11f1-bb31-59e406a19732', formData.sample_request_id)
  data.map((item: any) => ({
    id: '',
    line_number: item.line_number,
    vendor: item.vendor,
    part_number: item.part_number,
    series: item.series,
    pm: '',
    vendor_coo: '',
    sales_admin: '',
    etd: '',
    vendor_attn: '',
    eta: ''
  }))
}

async function getDbData(tableId: string, sampleRequestId: string) {
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
    conditions: [
      {
        type: 'EQ',
        column: 'f_6437_37ef7432',
        value: sampleRequestId
      }
    ],
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

function getFormData() {
  return { pa_with_suppliers_list: data.value }
}

onMounted(async () => {
  await info()
})

watch(
  () => formData.sampleRequestId,
  (value, oldValue) => {
    if (!!value && value !== '') {
      info()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

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
              <div class="partNumber-series-change">
                <el-select disabled v-if="isSeries(item)" v-model="item.series">
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

.partNumber-series-change {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
