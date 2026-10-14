<script setup lang="ts">
import { Delete, Plus, Switch } from '@element-plus/icons-vue'
import { v7 as uuidv7 } from 'uuid'
import { clientApi } from 'api'
import { ElMessageBox } from 'element-plus'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
const formRef = ref()
const seriesModeByLine = reactive<Record<string, boolean>>({})
const loading = ref(false)
const brandOptions = ref<any[]>([])
type dataType = {
  line_id?: string
  line_number: number
  vendor: string
  part_number: string
  series: string
  purpose: string
  pcs_unit: number
  fcst_qty: number
  request_qty: number
  run_rate: number
  packaged: number
  car_use: string
  cust_selected_parts: 'Introduced by Sales' | 'Selected by Customer'
  competitor_name: string
  competitor_pn: string
  competitor_unit_price: number
  remarks: string
  actual_received_qty: number
  status: number
}

const formModel = reactive<{ brand: string; list: dataType[] }>({
  brand: '',
  list: []
})
const data = toRef(formModel, 'list')
const partList = ref<any[]>([])
const seriesList = ref<any[]>([])
const rules = {
  brand: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.brand') }), trigger: 'change' }],
  purpose: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.purpose') }), trigger: 'change' }],
  series: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.series') }), trigger: 'change' }],
  part_number: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.partNumber') }), trigger: 'change' }],
  remarks: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.remarks') }), trigger: 'change' }],
  car_use: [{ required: true, message: t('render.hint.fieldRequired', { name: t('sampleRequest.carUse') }), trigger: 'change' }],
  fcst_qty: [{ required: true, type: 'number', message: t('render.hint.fieldRequired', { name: t('sampleRequest.monthlyUsage') }), trigger: 'change' }],
  request_qty: [{ required: true, type: 'number', message: t('render.hint.fieldRequired', { name: t('sampleRequest.requestQty') }), trigger: 'change' }],
  pcs_unit: [{ required: true, type: 'number', message: t('render.hint.fieldRequired', { name: t('sampleRequest.pcsUnit') }), trigger: 'change' }]
}

function handleAdd(index?: number) {
  const newValue = {
    line_id: uuidv7(),
    line_number: data.value.length + 1,
    vendor: '',
    part_number: '',
    series: '',
    purpose: '',
    pcs_unit: 1,
    fcst_qty: 1,
    request_qty: 1,
    run_rate: 1,
    packaged: 0,
    car_use: 'N',
    cust_selected_parts: 'Introduced by Sales',
    competitor_name: '',
    competitor_pn: '',
    competitor_unit_price: 1,
    remarks: '',
    actual_received_qty: 0,
    status: 1
  } as dataType

  if (!!index) {
    data.value.splice(index, 0, newValue)
  } else {
    data.value.push(newValue)
  }
}

async function getBrand() {
  brandOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
}

function seriesKey(item: dataType) {
  return item.line_id || String(item.line_number)
}

function isSeries(item: dataType) {
  return !!seriesModeByLine[seriesKey(item)]
}

function syncSeriesMode(list: dataType[]) {
  list.forEach((item) => {
    const key = seriesKey(item)
    if (Object.prototype.hasOwnProperty.call(seriesModeByLine, key)) return
    seriesModeByLine[key] = item.series !== '' && !item.part_number
  })
}

function changePartNumberAndSeries(item: dataType, index: number) {
  item.vendor = ''
  item.part_number = ''
  item.series = ''
  const key = seriesKey(item)
  seriesModeByLine[key] = !seriesModeByLine[key]
  nextTick(() => {
    formRef.value?.clearValidate([`list.${index}.series`, `list.${index}.part_number`])
  })
}

function handleRemove(index: number) {
  data.value.splice(index, 1)
}

function checkPurpose(vendor: string) {
  return ['MMC', 'COPAL', 'OKAYA'].includes(vendor.toUpperCase())
}

async function getFormData(needValidation = true, buttonName: string) {
  const part_number_list: string[] = []
  const email_part_list: any[] = []
  let pm_comment = ''
  let assignGroup = {}

  if (!!buttonName) {
    if (buttonName === 'pm_approval') {
      const { value } = await ElMessageBox.prompt(t('sampleRequest.pmComment'), {
        confirmButtonText: t('common_submit')
      })
      pm_comment = value
    } else if (buttonName === 'is_cancel') {
      await ElMessageBox.alert(t('sampleRequest.cancelConfirmEms'), {
        confirmButtonText: t('common_submit')
      })
    }
  } else {
    assignGroup = {
      pm_group: `SampleRequest_-_Approver_-_ProductManager_-_${formModel.brand}_-_${formData.branch_office}`,
      pa_group: `SampleRequest_-_Actor_-_ProductAssistant_-_${formData.branch_office}`
    }
  }

  formModel.list.forEach((item: any) => {
    part_number_list.push(item.part_number)
    email_part_list.push({
      part_number: item.part_number,
      series: item.series
    })
  })

  const result = {
    sample_info_list: formModel.list,
    part_number_list: part_number_list.join(','),
    email_part_list: email_part_list,
    pm_comment: pm_comment,
    ...assignGroup
  }

  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

async function searchPartList(partNumber?: string) {
  if (!partNumber || partNumber === '') return
  await getPartList(partNumber)
}

async function getPartList(partNumber?: string) {
  const data = await clientApi.instance
    .get(`/apis/v1/ms/oracle/wcl-item-nos?brand=${formModel.brand}&q=${partNumber}&pageNum=1&pageSize=200&includeCustomer=false`)
    .then((r) => r.data.items)

  partList.value = data.map((item: any) => ({
    id: item.inventory_item_id,
    label: item.wcl_item_no,
    value: item.wcl_item_no,
    brand: item.brand
  }))
}

async function searchSeriesList(series?: string) {
  if (!series || series === '') return
  await getSeriesList(series)
}

async function getSeriesList(series?: string) {
  const s = series ? `q=${series}&` : ''
  const data = await clientApi.instance.get(`/apis/v1/ms/oracle/series?brand=${formModel.brand}&${s}pageNum=1&pageSize=200`).then((r) => r.data.items)
  seriesList.value = data.map((item: any) => ({
    label: item.displayName,
    value: item.value,
    brand: item.brand
  }))
}

async function handleChangeBrand(brand: string) {
  handleAdd()
  await getPartList('')
  if (brand === 'KOA') {
    await getSeriesList()
  }
}

async function init() {
  if (!!formData.sample_info_list && formData.sample_info_list.length > 0) {
    if (formData.sample_info_list.every((x) => typeof x === 'string')) return
    data.value = formData.sample_info_list
    syncSeriesMode(data.value)
  }
}

function changePartNumber(item: any) {
  const find = partList.value.find((part) => part.value === item.part_number)
  item.vendor = find?.brand || ''
}
function changeSeries(item: any) {
  const find = seriesList.value.find((series: any) => series.value === item.series)
  item.vendor = find?.brand || ''
}

onMounted(async () => {
  try {
    await getBrand()
  } catch (e) {
    console.log(e)
  }
})

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
  <el-form label-position="top" :disabled="formData.disabledInfo" ref="formRef" :model="formModel">
    <el-row v-if="data.length === 0" :gutter="12" class="brand-row">
      <el-col :span="8">
        <el-form-item class="brand-row__item" :label="t('quotationApproval.brand')" prop="brand" :rules="rules.brand" required>
          <el-select v-model="formModel.brand" class="full-width-input" clearable filterable :disabled="data.length > 0" @change="handleChangeBrand">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8" class="brand-row__action">
        <el-button v-if="!!formModel.brand && formModel.brand != ''" type="primary" @click="handleAdd">{{ t('sampleRequest.addSampleInfo') }}</el-button>
      </el-col>
    </el-row>

    <template v-for="(item, index) in data" :key="item.line_number">
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
            <el-form-item :label="t('sampleRequest.brand')">
              <el-input v-model="item.vendor" disabled />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.pcsUnit')" :prop="`list.${index}.pcs_unit`" :rules="rules.pcs_unit" required>
              <el-input-number v-model="item.pcs_unit" controls-position="right" :min="1" :step="1" step-strictly :value-on-clear="null" />
            </el-form-item>
            <el-form-item v-if="checkPurpose(item.vendor)" :label="t('sampleRequest.purpose')" :prop="`list.${index}.purpose`" :rules="rules.purpose" required>
              <el-select v-model="item.purpose">
                <el-option value="New Design" label="New Design" />
                <el-option value="Replacement" label="Replacement" />
                <el-option value="Others" label="Others" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item
              :label="isSeries(item) ? t('sampleRequest.series') : t('sampleRequest.partNumber')"
              required
              :prop="`list.${index}.${isSeries(item) ? 'series' : 'part_number'}`"
              :rules="isSeries(item) ? rules.series : rules.part_number"
            >
              <div class="partNumber-series-change">
                <el-select-v2
                  v-if="!isSeries(item)"
                  v-model="item.part_number"
                  filterable
                  remote
                  :remote-method="searchPartList"
                  remote-show-suffix
                  clearable
                  :options="partList"
                  :loading="loading"
                  :placeholder="$t('quotationApproval.enterKeyword')"
                  @change="changePartNumber(item)"
                />
                <el-select-v2
                  v-else
                  v-model="item.series"
                  filterable
                  remote
                  :remote-method="searchSeriesList"
                  remote-show-suffix
                  clearable
                  :options="seriesList"
                  :loading="loading"
                  :placeholder="$t('quotationApproval.enterKeyword')"
                  @change="changeSeries(item)"
                />
                <el-button :icon="Switch" type="primary" @click="changePartNumberAndSeries(item, index)" />
              </div>
            </el-form-item>

            <el-form-item :label="t('sampleRequest.monthlyUsage')" :prop="`list.${index}.fcst_qty`" :rules="rules.fcst_qty" required>
              <el-input-number v-model="item.fcst_qty" controls-position="right" :min="1" :step="1" step-strictly :value-on-clear="null">
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.requestQty')" :prop="`list.${index}.request_qty`" :rules="rules.request_qty" required>
              <el-input-number v-model="item.request_qty" controls-position="right" :min="1" :step="1" step-strictly :value-on-clear="null" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.customerMonthlyUsage')">
              <el-input-number v-model="item.run_rate" controls-position="right" :min="1" :step="1" step-strictly>
                <template #suffix>
                  <span>K/M</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.packaged')">
              <el-switch v-model="item.packaged" active-text="Yes" :active-value="1" inactive-text="No" :inactive-value="0" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.competitorName')" prop="competitor_name">
              <el-input v-model="item.competitor_name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.carUse')" :required="['MMC', 'NCC'].includes(item.vendor.toUpperCase())" :prop="`list.${index}.car_use`">
              <el-switch v-model="item.car_use" active-text="Yes" active-value="Yes" inactive-text="No" inactive-value="No" />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.competitorPn')" prop="competitor_pn">
              <el-input v-model="item.competitor_pn" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="t('sampleRequest.custSelectedParts')">
              <el-switch
                v-model="item.cust_selected_parts"
                :active-text="t('sampleRequest.selectedByCustomer')"
                active-value="Selected by Customer"
                :inactive-text="t('sampleRequest.introducedBySales')"
                inactive-value="Introduced by Sales"
              />
            </el-form-item>
            <el-form-item :label="t('sampleRequest.competitorUnitPrice')">
              <el-input-number v-model="item.competitor_unit_price" controls-position="right" :min="0.000001" :step="0.000001" step-strictly />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="t('sampleRequest.remarks')" :required="item.purpose === 'Others'" prop="remarks">
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

.brand-row {
  &__item {
    margin-bottom: 0;
  }

  &__action {
    display: flex;
    align-items: flex-end;
  }
}

.partNumber-series-change {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  width: 100%;

  .el-select {
    flex: 1;
  }
}
</style>
