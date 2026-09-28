<script setup lang="ts">
import { clientApi, newClientApi } from 'api'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()

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
  etd: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.etd') }), trigger: 'change' }],
  eta: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.eta') }), trigger: 'change' }]
}

async function init() {
  if (!!formData.sample_info_list && formData.sample_info_list.length > 0) {
    const conditions = [
      {
        value: [{ column: 'f_14878_b8992035', type: 'EQ', value: formData.sample_request_id }],
        type: 'AND'
      }
    ]
    const dbData: any = await getDbData('a38fddb0-6a18-11f1-bb31-59e406a19732', conditions)

    formModel.list = formData.sample_info_list.map((item: any) => {
      const find = dbData.find((db: any) => db.line_id === item.line_id)

      return {
        ...item,
        id: !!find ? find.id : ''
      }
    })
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
    columns: [{ name: 'id' }, { name: 'f_8574_48965b6a' }],
    pagination: {
      pageSize: 1000,
      pageNum: 0
    }
  }

  // Get BD Data
  const dbData = await clientApi.instance.post('/apis/v1/dynamic-actions', param).then((res: any) => res.data.data)

  // 匹配數據
  return dbData.map((row: any) => {
    const out = {
      id: ''
    }
    out.id = row['id']
    for (const [fromKey, toKey] of Object.entries(filedMapping)) {
      if (fromKey in row) out[toKey] = row[fromKey]
    }
    return out
  })
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
  <el-form label-position="top" ref="formRef" :model="formModel" :disabled="disabled">
    <template v-for="(item, index) in data" :key="item.line_number ?? index">
      <div class="info-item-card">
        <span class="info-item-card__index">{{ index + 1 }}.</span>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.brand')">
              <el-input disabled v-model="item.vendor" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isSeries(item) ? t('sampleRequest.series') : t('sampleRequest.partNumber')">
              <el-input disabled v-if="isSeries(item)" v-model="item.series" />
              <el-input disabled v-else v-model="item.part_number" />
            </el-form-item>
          </el-col>
          <el-col :span="8" />

          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.productManager')">
              <el-input v-model="item.pm" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.vendorCoo')">
              <el-input v-model="item.vendor_coo" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.salesAdmin')">
              <el-input v-model="item.sales_admin" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.etd')" :prop="`list.${index}.etd`" :rules="rules.etd">
              <el-date-picker v-model="item.etd" type="date" placeholder="Pick a day" :clearable="false" format="YYYY/MM/DD" value-format="x" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.vendorAttn')">
              <el-input v-model="item.vendor_attn" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.eta')" :prop="`list.${index}.eta`" :rules="rules.eta">
              <el-date-picker v-model="item.eta" type="date" placeholder="Pick a day" :clearable="false" format="YYYY/MM/DD" value-format="x" />
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
