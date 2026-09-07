<script setup lang="ts">
import * as XLSX from 'xlsx'
import { Search, Download, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import dayjs from 'dayjs'
import { clientApi } from 'api'

const { formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

type tableDataType = {
  endCustomer: string
  priceGroup: string
  supplierPartNumber: string
  currency: string
  originalUnitPrice: number
  newUnitPrice: number
  adjustmentRate: number
  approvalRemark: string
}

const selectList = ref<tableDataType[]>([])
const search = ref<string>('')
const tableData = ref<tableDataType[]>([])
const isApproval = ref<boolean>(false)
const isReview = ref<boolean>(false)
const templateUrl = new URL('./PriceAnnouncement_Upload_Template.xlsx', import.meta.url).href
const brandOptions = ref<any[]>([])
const IMPORT_FIELDS = ['endCustomer', 'priceGroup', 'supplierPartNumber', 'currency', 'originalUnitPrice', 'newUnitPrice'] as const
const currencyOptions = ref([
  { label: 'CNY', value: 'CNY' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'HKD', value: 'HKD' },
  { label: 'USD', value: 'USD' }
])
const seriesOptions = ref<any[]>([])
const partNumberOptions = ref<any[]>([])
const formModel = reactive({
  priceAnnouncementNumber: '',
  brand: 'ABBYY',
  effectiveDate: dayjs(Date.now()).format('YYYY-MM-DD'),
  submittedBy: '',
  dateSubmitted: 0,
  listLength: 0
})
const formRef = ref()
const headerFormRef = ref()
const rules = {
  brand: [{ required: true, message: '请选择品牌', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  listLength: [
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) < 1) {
          callback(new Error(''))
          ElMessage.error('请选择需要公告的零件')
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

watch(
  tableData,
  (list) => {
    formModel.listLength = list.length
  },
  { immediate: true }
)

function getColumns() {
  const checkboxCol = { type: 'checkbox', width: 60, align: 'center', fixed: 'left' }
  const approvalRemark = { field: 'approvalRemark', title: '审批备注 Approval Remark', minWidth: 240, slots: { default: 'approvalRemark' } }

  const defList: any[] = [
    {
      field: 'index',
      title: '序号 Index',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'endCustomer',
      title: '最终客户/项目 End Customer/Project',
      minWidth: 240,
      slots: { default: 'endCustomer' }
    },
    {
      field: 'priceGroup',
      title: '价格组 Price Group',
      minWidth: 240,
      slots: { default: 'priceGroup' }
    },
    {
      field: 'supplierPartNumber',
      title: '供应商零件编号 Supplier Part Number',
      minWidth: 240,
      slots: { default: 'supplierPartNumber' }
    },
    {
      field: 'currency',
      title: '货币 Currency',
      minWidth: 240,
      slots: { default: 'currency' }
    },
    {
      field: 'originalUnitPrice',
      title: '原单价 Original Unit Price',
      minWidth: 240,
      slots: { default: 'originalUnitPrice' }
    },
    {
      field: 'newUnitPrice',
      title: '新单价 New Unit Price',
      minWidth: 240,
      slots: { default: 'newUnitPrice' }
    },
    {
      field: 'adjustmentRate',
      title: '调整率 Adjustment Rate',
      minWidth: 240,
      slots: { default: 'adjustmentRate' }
    }
  ]

  if (!isApproval.value) {
    defList.unshift(checkboxCol)
  }

  if (isApproval.value || isReview.value) {
    defList.push(approvalRemark)
  }

  return defList
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'ModificationSalesOrderTableSetting',
  api: (pageParams: any) => {
    return tableData.value
  },
  columns: getColumns(),
  zoom: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  dblClickAction: ({ row, column, event }) => {},
  bodyActions: [
    [
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: { row: any }) => {
          handleDelete(row)
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    if (code === 'delete') {
      return {
        visible: !isApproval.value,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    selectList.value = [...selectedRows]
  },
  optionalConfig: {}
})

function handleAddRow() {
  tableData.value.push({
    endCustomer: '',
    priceGroup: '',
    supplierPartNumber: '',
    currency: '',
    originalUnitPrice: 0,
    newUnitPrice: 0,
    adjustmentRate: 0,
    approvalRemark: ''
  })
  reload()
}

function handleDelete(row: tableDataType) {
  tableData.value = tableData.value.filter((item: tableDataType) => item !== row)
  reload()
}

function handleDeleteSelected() {
  tableData.value = tableData.value.filter((item: tableDataType) => !selectList.value.includes(item))
  selectList.value = []
  reload()
}

function handleSearch(searchValue: string) {
  const keyword = searchValue.trim().toLowerCase()
  if (!keyword || keyword == '') {
    tableRef.value?.loadData(tableData.value)
    return
  }

  const searchList = tableData.value.filter((item: tableDataType) =>
    [item.endCustomer, item.priceGroup, item.supplierPartNumber].some((fieldValue) => String(fieldValue).toLowerCase().includes(keyword))
  )

  tableRef.value?.loadData(searchList)
}

function handleDownloadTemplate() {
  const link = document.createElement('a')
  link.href = templateUrl
  link.download = 'PriceAnnouncement_Upload_Template.xlsx'
  link.click()
}

async function handleGetSeries(brandName: string) {
  if (brandName !== 'KOA') return
  await getSeries()
}

async function getSeries(series?: string) {
  try {
    const q = !!series && series !== '' ? `q=${series}&` : ''
    const data = await clientApi.instance.get(`/apis/v1/ms/oracle/series?${q}brand=KOA&pageNum=1&pageSize=100`).then((r: any) => r.data.items)
    if (!data?.length) return

    seriesOptions.value = data.map((item: any) => ({
      label: item.displayName,
      value: item.value
    }))
  } catch (e) {
    console.log(e)
  }
}

async function getPartNumber(series?: string, partNumber?: string) {
  try {
    const b = formModel.brand ? `brand=${formModel.brand}&` : ''
    const s = series ? `series=${series}&` : ''
    const q = partNumber ? `q=${partNumber}&` : ''

    const data = await clientApi.instance
      .get(`/apis/v1/ms/oracle/wcl-item-nos?${b}${s}${q}pageNum=1&pageSize=50&includeCustomer=false`)
      .then((r: any) => r.data.items)
    if (!data?.length) return

    partNumberOptions.value = data.map((item: any) => ({
      label: item.vendor_item_no,
      value: item.vendor_item_no
    }))
  } catch (e) {
    console.log(e)
  }
}

function changePrice(row: tableDataType) {
  row.adjustmentRate = formatAdjustmentRate(row.newUnitPrice, row.originalUnitPrice)
}

// Adjustment Rate = New Price / Original Price * 100%
function formatAdjustmentRate(newUnitPrice: number, originalUnitPrice: number) {
  if (!newUnitPrice || !originalUnitPrice) {
    return ''
  }

  return new Decimal(newUnitPrice).div(new Decimal(originalUnitPrice)).mul(100).toFixed(2)
}

function normalizeHeader(value: unknown) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function parseNumber(value: unknown) {
  if (value === '') return 0
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function parseEffectiveDate(value: unknown) {
  const dateValue = String(value ?? '').trim()
  if (!/^\d{8}$/.test(dateValue)) return ''

  const parsedDate = dayjs(`${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`)
  const day = parsedDate.isValid() && parsedDate.format('YYYYMMDD') === dateValue ? parsedDate : dayjs(Date.now())
  return day.format('YYYY-MM-DD')
}

async function handleExcelFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return

  tableConfig.loading = true
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    const headers = (rows[2] ?? []).map(normalizeHeader)
    const fieldIndexes = IMPORT_FIELDS.map((field) => headers.findIndex((header) => header.includes(normalizeHeader(field))))

    if (fieldIndexes.some((index) => index === -1)) {
      ElMessage.error('The Excel file format does not match the template.')
      return
    }

    const effectiveDateField: any[] = (rows[0] ?? []).slice(0, 2)
    if (effectiveDateField.length < 2) {
      formModel.effectiveDate = ''
      ElMessage.error('无法获取生效日期.')
    } else {
      formModel.effectiveDate = parseEffectiveDate(effectiveDateField[1])
    }

    tableData.value = rows
      .slice(3)
      .filter((row: any) => fieldIndexes.some((index) => row[index] !== ''))
      .map((row: any) => {
        return {
          endCustomer: row[fieldIndexes[0]],
          priceGroup: formModel.brand === 'KOA' ? row[fieldIndexes[1]] : '',
          supplierPartNumber: row[fieldIndexes[2]],
          currency: row[fieldIndexes[3]],
          originalUnitPrice: parseNumber(row[fieldIndexes[4]]),
          newUnitPrice: parseNumber(row[fieldIndexes[5]]),
          adjustmentRate: formatAdjustmentRate(parseNumber(row[fieldIndexes[5]]), parseNumber(row[fieldIndexes[4]]))
        }
      }) as tableDataType[]

    reload()
    selectList.value = []
    ElMessage.success(`${tableData.value.length} rows imported.`)
  } catch {
    ElMessage.error('Unable to read the Excel file.')
  } finally {
    tableConfig.loading = false
  }
}

watch(
  () => formModel.brand,
  (newValue, oldValue) => {
    if (newValue === oldValue) return

    if (newValue !== 'KOA' && tableData.value.length > 0) {
      tableData.value = tableData.value.map((item: any) => ({
        endCustomer: item.endCustomer,
        priceGroup: '',
        supplierPartNumber: item.supplierPartNumber,
        currency: item.currency,
        originalUnitPrice: item.originalUnitPrice,
        newUnitPrice: item.newUnitPrice,
        adjustmentRate: formatAdjustmentRate(item.newUnitPrice, item.originalUnitPrice),
        approvalRemark: item.approvalRemark ?? ''
      }))
      reload()
    }
  },
  { immediate: true, deep: true }
)

function init() {
  isApproval.value = formData.is_approval
  isReview.value = formData.is_review
  tableConfig.columns = getColumns()
  tableData.value = formData.list.map((item: any) => ({
    endCustomer: item.endCustomerProject,
    priceGroup: item.priceGroup,
    supplierPartNumber: item.supplierPartNumber,
    currency: item.currency,
    originalUnitPrice: item.originalUnitPrice,
    newUnitPrice: item.newUnitPrice,
    adjustmentRate: item.adjustmentRate,
    approvalRemark: item.approverRemark
  }))
  formModel.priceAnnouncementNumber = formData.priceAnnouncementNumber
  formModel.brand = formData.brand
  formModel.effectiveDate = formData.effective_date
  formModel.submittedBy = formData.submittedBy
  formModel.dateSubmitted = formData.date_submitted

  nextTick(() => {
    reload()
  })
}

watch(
  () => formData.list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

async function getBrandOptions() {
  brandOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
}

onMounted(() => {
  getBrandOptions()
})

async function getFormData(needValidation = true) {
  const { list, document_data_list } = tableData.value.reduce(
    (acc, item: tableDataType, index: number) => {
      const lineNo = index + 1

      acc.list.push({
        lineNo,
        endCustomerProject: item.endCustomer,
        priceGroup: item.priceGroup,
        supplierPartNumber: item.supplierPartNumber,
        currency: item.currency,
        originalUnitPrice: item.originalUnitPrice,
        newUnitPrice: item.newUnitPrice,
        adjustmentRate: item.adjustmentRate,
        approverRemark: item.approvalRemark ?? ''
      })

      acc.document_data_list.push({
        line: lineNo,
        endCustomer: item.endCustomer,
        priceGroup: item.priceGroup,
        supplierPartNumber: item.supplierPartNumber,
        approverRemark: item.approvalRemark ?? ''
      })

      return acc
    },
    { list: [] as any[], document_data_list: [] as any[] }
  )

  const result = !isApproval.value
    ? {
        brand: formModel.brand,
        effective_date: formModel.effectiveDate,
        list,
        document_data_list
      }
    : {
        list,
        document_data_list
      }

  if (!needValidation) return result
  await Promise.all([headerFormRef.value?.validate(), formRef.value?.validate()])
  return result
}

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="headerFormRef" :model="formModel" :rules="rules" label-position="top">
    <el-row>
      <el-col v-if="isApproval" :span="5">
        <el-form-item label="PA編號 PA Number">
          <el-input v-model="formModel.priceAnnouncementNumber" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="!isApproval ? 6 : 4">
        <el-form-item label="品牌 Brand" prop="brand" required>
          <el-select v-model="formModel.brand" filterable placeholder="Select an option" :disabled="isApproval" style="width: 90%" @change="handleGetSeries">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="!isApproval ? 6 : 5">
        <el-form-item label="生效日期 Effective Date" prop="effectiveDate" required>
          <el-date-picker
            v-model="formModel.effectiveDate"
            type="date"
            format="YYYY/MMM/DD"
            value-format="YYYY-MM-DD"
            style="width: 90%"
            :disabled="isApproval"
            :clearable="false"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="isApproval" :span="5">
        <el-form-item label="提交人 Submitter">
          <el-input v-model="formModel.submittedBy" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col v-if="isApproval" :span="5">
        <el-form-item label="提交日期 Date Submitted">
          <el-date-picker v-model="formModel.dateSubmitted" type="date" format="YYYY/MMM/DD" value-format="x" style="width: 90%" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div style="height: 75vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="toolbar-actions">
          <div class="toolbar-actions__left">
            <el-upload v-if="!isApproval" :auto-upload="false" :show-file-list="false" accept=".xlsx" :on-change="handleExcelFileChange">
              <el-button type="primary" :icon="Download" style="margin-right: 10px">Import Excel</el-button>
            </el-upload>
            <el-button v-if="!isApproval" @click="handleDownloadTemplate">Download Excel Template</el-button>
            <el-input
              v-model="search"
              clearable
              :prefix-icon="Search"
              style="width: 300px; margin-left: 10px"
              placeholder="Search across all columns"
              @change="handleSearch"
            />
          </div>
          <el-form v-if="!isApproval" ref="formRef" class="toolbar-actions__form" :model="formModel" :rules="rules" label-position="left" inline>
            <div class="toolbar-actions__right">
              <el-form-item label="數量 Quantity" prop="listLength">
                <el-input v-model="formModel.listLength" disabled style="width: 100px; margin-right: 10px" />
                <el-button v-if="selectList.length === 0" type="primary" :icon="Plus" @click="handleAddRow">Add Row</el-button>
                <el-button v-else :icon="Delete" type="danger" @click="handleDeleteSelected">Delete Selected {{ selectList.length }}</el-button>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </template>
      <template #endCustomer="{ row, index }">
        <el-input v-model="row.endCustomer" :disabled="isApproval" />
      </template>
      <template #priceGroup="{ row, index }">
        <el-input v-model="row.priceGroup" v-if="isApproval" disabled />
        <el-select-v2
          v-model="row.priceGroup"
          v-else
          :disabled="formModel.brand !== 'KOA'"
          filterable
          allow-create
          remote
          :remote-method="getSeries"
          remote-show-suffix
          clearable
          :options="seriesOptions"
          placeholder="Select an option"
          @change="getPartNumber"
        />
      </template>
      <template #supplierPartNumber="{ row, index }">
        <el-input v-model="row.supplierPartNumber" v-if="isApproval" disabled />
        <el-select-v2
          v-else
          v-model="row.supplierPartNumber"
          :disabled="isApproval"
          filterable
          allow-create
          remote
          :remote-method="(value: string) => getPartNumber(row.priceGroup, value)"
          remote-show-suffix
          clearable
          :options="partNumberOptions"
          placeholder="Select an option"
        />
      </template>
      <template #currency="{ row, index }">
        <el-select v-model="row.currency" :disabled="isApproval">
          <el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </template>
      <template #originalUnitPrice="{ row, index }">
        <el-input-number
          style="width: 100%"
          v-model="row.originalUnitPrice"
          controls-position="right"
          :min="0.000001"
          :step="0.000001"
          :disabled="isApproval"
          @change="changePrice(row)"
        />
      </template>
      <template #newUnitPrice="{ row, index }">
        <el-input-number
          style="width: 100%"
          v-model="row.newUnitPrice"
          controls-position="right"
          :min="0.000001"
          :step="0.000001"
          :disabled="isApproval"
          @change="changePrice(row)"
        />
      </template>
      <template #adjustmentRate="{ row, index }">
        <el-input v-model="row.adjustmentRate" class="adjustment-rate-input" disabled>
          <template #suffix>
            <span>%</span>
          </template>
        </el-input>
      </template>
      <template #approvalRemark="{ row, index }">
        <el-input v-model="row.approvalRemark" :disabled="!isApproval" />
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toolbar-actions__left {
  display: flex;
  align-items: center;
}

.toolbar-actions__right {
  display: flex;
  align-items: center;
}

.toolbar-actions__form {
  display: flex;
  align-items: center;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }
}

.adjustment-rate-input {
  :deep(.el-input__inner) {
    text-align: center;
  }
}
</style>
