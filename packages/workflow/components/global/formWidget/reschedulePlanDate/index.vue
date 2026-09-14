<script setup lang="ts">
import draggable from 'vuedraggable'
import { v7 as uuidv7 } from 'uuid'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { clientApi } from 'api'

dayjs.extend(customParseFormat)

const { disabled, formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

type LineItem = {
  id: string
  pi_invoice: string
  old_plan_date: string
  new_plan_date: string
  brand_code: string
  remark: string
}

const lineFormRef = ref()
const csvUploadRef = ref<UploadInstance>()
const formModel = reactive({
  customer_number: '',
  customer_name: '',
  customerName: '',
  customer_english_name: '',
  customerEnglishName: '',
  org: '',
  list: [] as LineItem[]
})
const CSV_COLUMNS = ['pi_invoice', 'new_plan_date', 'remark'] as const

type CsvLineItem = {
  pi_invoice: string
  old_plan_date: string
  new_plan_date: string
  brand_code: string
  remark: string
}

const lineRules = {
  pi_invoice: [
    { required: true, message: '請輸入PI發票', trigger: 'blur' },
    {
      validator: async (rule: any, value: string, callback: any) => {
        const index = Number(String(rule.field).match(/^list\.(\d+)\.pi_invoice$/)?.[1])
        const item = formModel.list[index]
        const data = await checkingPiNumber(value)
        if (!data) {
          if (item?.pi_invoice === value) {
            item.old_plan_date = ''
            item.brand_code = ''
          }
          callback(new Error('Customer Number 与 PI Invoice 不一致'))
          return
        }
        if (item?.pi_invoice === value) {
          item.old_plan_date = parsePlanDate(String(data.old_plan_date ?? ''))
          item.brand_code = data.brand ?? ''
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  new_plan_date: [{ required: true, message: '請選擇新計劃日期', trigger: 'change' }]
}

function createEmptyLine(): LineItem {
  return {
    id: uuidv7(),
    pi_invoice: '',
    old_plan_date: '',
    new_plan_date: '',
    brand_code: '',
    remark: ''
  }
}

function handleAdd(index?: number) {
  const newItem = createEmptyLine()
  if (index === undefined) {
    formModel.list.push(newItem)
    return
  }
  formModel.list.splice(index + 1, 0, newItem)
}

function handleRemove(index: number) {
  formModel.list.splice(index, 1)
}

async function handleImportCSV(uploadFile: UploadFile) {
  const file = uploadFile.raw
  csvUploadRef.value?.clearFiles()
  if (!file) return

  const name = file.name.toLowerCase()

  if (!(name.endsWith('.csv') || file.type === 'text/csv')) {
    ElMessage.error('Please select a CSV file')
    return
  }
  const list = await csvTextToLineItems(await file.text())
  if (!list.length) {
    ElMessage.error('No valid data found in CSV')
    return
  }
  formModel.list = list.map((item) => ({ ...createEmptyLine(), ...item }))
  ElMessage.success(`Imported ${list.length} row(s)`)
  if (formModel.list.length > 0) {
    await setCustomerNumber(formModel.list[0])
    await lineFormRef.value?.validate()
  }
}

function normalizeHeader(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/#/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  result.push(current.trim())
  return result
}

function parsePlanDate(value: string): string {
  if (!value) return ''
  const parsed = dayjs(value.trim(), ['YYYYMMDD', 'YYYY-MMM-DD', 'YYYY-MM-DD', 'YYYY/MM/DD'], 'en', true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

async function csvTextToLineItems(text: string): Promise<CsvLineItem[]> {
  const rows = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .map(parseCsvLine)
    .filter((row) => row.some((cell) => cell !== ''))
  if (!rows.length) return []

  const header = rows[0].map(normalizeHeader)
  const hasHeader = header.some((col) => CSV_COLUMNS.includes(col as (typeof CSV_COLUMNS)[number]))
  const columns = hasHeader ? header : [...CSV_COLUMNS]
  const dataRows = hasHeader ? rows.slice(1) : rows

  const set = new Set()

  const csvData: CsvLineItem[] = dataRows.map((row) => {
    const record: Record<string, string> = {}
    columns.forEach((col, i) => {
      record[col] = row[i] ?? ''
    })
    set.add(record.pi_invoice)

    return {
      id: uuidv7(),
      pi_invoice: record.pi_invoice ?? '',
      old_plan_date: '',
      new_plan_date: parsePlanDate(record.new_plan_date ?? ''),
      brand_code: '',
      remark: record.remark ?? ''
    }
  })
  // Cell Api Get Data
  // const data = await $api.post(`/api/pi-invoices`, { list: [...set] }).then((r: any) => r.data)
  // fillCsvData(data, csvData)
  return csvData
}

function fillCsvData(data: any[], csvData: any[]) {
  const indexByInvoice = new Map(data.map((row) => [row.pi_invoice_number, { old_plan_date: row.old_plan_date, brand: row.brand }]))

  csvData.forEach((item: any) => {
    const key = item.pi_invoice
    const match = indexByInvoice.get(key)
    if (match) {
      item.old_plan_date = match.old_plan_date ?? ''
      item.brand_code = match.brand ?? ''
    }
  })

  return csvData
}

const customerNumberOptions = ref<{ label: string; value: string }[]>([])
const customerNameOptions = ref<{ label: string; value: string }[]>([])
const customerEnglishNameOptions = ref<{ label: string; value: string }[]>([])

async function searchName(query?: string) {
  const data: any[] = await clientApi.instance.get(`/apis/v1/ms/oracle/customers?q=${query}&limit=${5000}`).then((r: any) => r.data?.items)

  if (data.length === 0) return

  const numberOptions: any[] = []
  const nameOptions: any[] = []
  const englishNameOptions: any[] = []

  data.forEach((item: any) => {
    numberOptions.push({
      label: item.account_number,
      value: item.account_number
    })
    nameOptions.push({
      label: item.customer_name,
      value: item.account_number
    })
    englishNameOptions.push({
      label: item.customer_eng_name,
      value: item.account_number
    })
  })

  customerNumberOptions.value = numberOptions
  customerNameOptions.value = nameOptions
  customerEnglishNameOptions.value = englishNameOptions
}

function numberChange(value: string) {
  if (!value || value === '') {
    formModel.customer_name = ''
    formModel.customer_english_name = ''
    formModel.org = ''
    return
  }

  formModel.customer_number = value
  formModel.customer_name = value
  formModel.customer_english_name = value

  formModel.customerName = customerNameOptions.value.find((item: any) => item.value === value).label
}

async function checkingPiNumber(value: string) {
  const customer_number = !!formModel.customer_number && formModel.customer_number !== '' ? `customer_number=${formModel.customer_number}&` : ''
  return clientApi.instance.get(`/api/pi-invoices?${customer_number}pi_invoice_number=${value}`).then((r: any) => r.data.data)
}

async function setCustomerNumber(item: any) {
  if (item.pi_invoice === '' || formModel.customer_number !== '') return
  const data = await checkingPiNumber(item.pi_invoice)
  if (!!data) {
    formModel.customer_number = data.customer_number
    formModel.customer_name = data.customer_number
    formModel.customer_english_name = data.customer_number
    formModel.org = data.org_id
    formModel.customerName = data.customer_name
    formModel.customerEnglishName = data.customer_name
    await searchName(data.customer_number)
  }
}

async function getFormData(needValidation = true) {
  let lineList = formModel.list.map((item: any) => ({
    pi_invoice_number: item.pi_invoice,
    new_plan_date: item.new_plan_date
  }))

  const result = {
    customer_number: formModel.customer_number,
    customer_name: formModel.customer_name,
    customerName: formModel.customerName,
    customer_english_name: formModel.customer_english_name,
    customerEnglishName: formModel.customerEnglishName,
    org: formModel.org,
    line_list: lineList,
    email_list: formModel.list.map(({ id: _id, ...item }) => item)
  }
  if (!needValidation) return result
  await lineFormRef.value?.validate()
  return result
}

onMounted(() => {
  if (formData?.line_list?.length) {
    formModel.list = formData.line_list.map((item: LineItem) => ({
      ...createEmptyLine(),
      ...item
    }))
    return
  }
  handleAdd()
})

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top">
    <el-row>
      <el-col :span="6">
        <el-form-item label="客戶編號 Customer Number" prop="customer_number">
          <el-select-v2
            v-model="formModel.customer_number"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            placeholder="One of the options must be selected."
            @change="numberChange"
            style="width: 90%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶名稱 Customer Name">
          <el-select-v2
            v-model="formModel.customer_name"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNameOptions"
            placeholder="One of the options must be selected."
            @change="numberChange"
            style="width: 90%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶英文名 Customer Eng Name" prop="customerEnglishName">
          <el-select-v2
            v-model="formModel.customer_english_name"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerEnglishNameOptions"
            placeholder="One of the options must be selected."
            @change="numberChange"
            style="width: 90%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="ORG">
          <el-input v-model="formModel.org" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <el-upload ref="csvUploadRef" accept=".csv" :auto-upload="false" :show-file-list="false" :disabled="disabled" :on-change="handleImportCSV">
    <el-button type="primary" :disabled="disabled">Import CSV</el-button>
  </el-upload>

  <el-divider content-position="left">計劃明細 Line Items</el-divider>

  <div style="max-height: 40vh; overflow: auto">
    <el-form ref="lineFormRef" label-position="top" class="line-form all-input-style" :model="formModel" :disabled="disabled">
      <el-button v-if="formModel.list.length === 0 && !disabled" type="primary" @click="handleAdd">Add</el-button>
      <draggable v-model="formModel.list" item-key="id" handle=".drag-handle" :animation="200" ghost-class="line-row-ghost" :disabled="disabled">
        <template #item="{ element, index }">
          <div class="line-row">
            <span class="line-row__index">#{{ index + 1 }}</span>
            <el-form-item class="line-row__field line-row__field--pi" label="PI編號 PI Number" :prop="`list.${index}.pi_invoice`" :rules="lineRules.pi_invoice">
              <el-input v-model="element.pi_invoice" clearable />
            </el-form-item>
            <el-form-item class="line-row__field line-row__field--date" label="舊計劃日期 Old Plan Date">
              <el-date-picker v-model="element.old_plan_date" disabled format="YYYY-MMM-DD" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item
              class="line-row__field line-row__field--date"
              label="新計劃日期 New Plan Date"
              :prop="`list.${index}.new_plan_date`"
              :rules="lineRules.new_plan_date"
            >
              <el-date-picker v-model="element.new_plan_date" type="date" format="YYYY-MMM-DD" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item class="line-row__field line-row__field--brand" label="品牌 Brand">
              <el-input v-model="element.brand_code" disabled />
            </el-form-item>
            <el-form-item class="line-row__field line-row__field--remark" label="備注 Remark">
              <el-input v-model="element.remark" />
            </el-form-item>
            <div v-if="!disabled" class="line-row__actions">
              <el-button type="primary" text size="small" @click="handleAdd(index)">Add</el-button>
              <el-button type="danger" text size="small" @click="handleRemove(index)">Remove</el-button>
              <span class="drag-handle" role="button" tabindex="0" aria-label="Drag to reorder row">⋮⋮</span>
            </div>
          </div>
        </template>
      </draggable>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.all-input-style {
  :deep(.el-select),
  :deep(.el-input),
  :deep(.el-date-editor) {
    width: 100%;
  }
}

.line-form {
  margin-top: var(--app-space-s);
}

.line-row {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  gap: var(--app-space-s);
  padding-bottom: var(--app-space-s);
  s & + & {
    margin-top: var(--app-space-xs);
  }

  &__index {
    flex: 0 0 2rem;
    padding-bottom: 8px;
    color: var(--app-text-regular);
    text-align: right;
    line-height: 32px;
  }

  &__field {
    margin-bottom: 0;

    &--pi {
      flex: 0 0 180px;
    }

    &--date {
      flex: 0 0 200px;
    }

    &--brand {
      flex: 0 0 160px;
    }

    &--remark {
      flex: 1 1 240px;
      min-width: 160px;
    }
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0;
    padding-bottom: 4px;
  }
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 32px;
  margin-inline-start: 4px;
  color: var(--app-text-placeholder);
  cursor: grab;
  letter-spacing: -2px;
}

.drag-handle:focus {
  outline: 1px dashed var(--app-primary-color);
  outline-offset: 2px;
}

.line-row-ghost {
  opacity: 0.5;
}
</style>
