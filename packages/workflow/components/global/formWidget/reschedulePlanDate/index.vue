<script setup lang="ts">
import draggable from 'vuedraggable'
import { v7 as uuidv7 } from 'uuid'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import dayjs from 'dayjs'

const { disabled, formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

type LineItem = {
  id: string
  pi_invoice: string
  old_plan_date: string
  new_plan_date: number | string
  brand_code: string
  remark: string
}

const lineFormRef = ref()
const csvUploadRef = ref<UploadInstance>()
const formModel = reactive({
  customer: '',
  customer_name: '',
  org: '',
  list: [] as LineItem[]
})
const CSV_COLUMNS = ['index', 'pi_invoice', 'old_plan_date', 'new_plan_date', 'brand_code', 'remark'] as const

export type CsvLineItem = {
  pi_invoice: string
  old_plan_date: string
  new_plan_date: number | string
  brand_code: string
  remark: string
}

const lineRules = {
  pi_invoice: [{ required: true, message: 'Please input PI Invoice', trigger: 'blur' }],
  new_plan_date: [{ required: true, message: 'Please select New Plan Date', trigger: 'change' }]
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
  const list = csvTextToLineItems(await file.text())
  if (!list.length) {
    ElMessage.error('No valid data found in CSV')
    return
  }
  formModel.list = list.map((item) => ({ ...createEmptyLine(), ...item }))
  ElMessage.success(`Imported ${list.length} row(s)`)
}

function normalizeHeader(name: string) {
  return name.trim().toLowerCase().replace(/#/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
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

function parsePlanDate(value: string): number | string {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^\d{13}$/.test(trimmed)) return Number(trimmed)
  if (/^\d{10}$/.test(trimmed)) return Number(trimmed) * 1000
  const parsed = dayjs(trimmed.replace(/[./]/g, '-'))
  return parsed.isValid() ? parsed.valueOf() : ''
}

function csvTextToLineItems(text: string): CsvLineItem[] {
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

  return dataRows.map((row) => {
    const record: Record<string, string> = {}
    columns.forEach((col, i) => {
      record[col] = row[i] ?? ''
    })
    return {
      pi_invoice: record.pi_invoice ?? '',
      old_plan_date: record.old_plan_date ?? '',
      new_plan_date: parsePlanDate(record.new_plan_date ?? ''),
      brand_code: record.brand_code ?? '',
      remark: record.remark ?? ''
    }
  })
}

async function getFormData(needValidation = true) {
  const result = {
    customer: formModel.customer,
    customer_name: formModel.customer_name,
    org: formModel.org,
    line_list: formModel.list.map(({ id: _id, ...item }) => item)
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
  <el-form label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="6">
        <el-form-item label="客戶編號 Customer Number">
          <el-input v-model="formModel.customer" style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶名稱 Customer Name">
          <el-input v-model="formModel.customer_name" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="ORG">
          <el-input v-model="formModel.org" style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6"> </el-col>
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
              <el-input v-model="element.pi_invoice" />
            </el-form-item>
            <el-form-item class="line-row__field line-row__field--date" label="舊計劃日期 Old Plan Date">
              <el-date-picker v-model="element.old_plan_date" disabled format="YYYY/MM/DD" value-format="x" />
            </el-form-item>
            <el-form-item
              class="line-row__field line-row__field--date"
              label="新計劃日期 New Plan Date"
              :prop="`list.${index}.new_plan_date`"
              :rules="lineRules.new_plan_date"
            >
              <el-date-picker v-model="element.new_plan_date" type="date" format="YYYY/MM/DD" value-format="x" />
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
