<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { exportReportToExcel } from '~/utils/excelHelper'
import { exportReportToPDF, type ReportHeader } from '~/utils/pdfHelper'

const emits = defineEmits(['delete', 'refreshSetting'])
const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: true
  }
)

const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props
})

const formData = ref({
  project: null,
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
})

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-ApplicationsVerified',
  virtualScroll: true,
  api: () => getData(),
  columns: [
    { field: 'batch_no', title: 'Batch No.', fixed: 'left' },
    { field: 'application_no', title: 'Application No.' },
    {
      field: 'form_type',
      title: 'Form Type',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'before',
      title: 'Before',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'after',
      title: 'After',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'modified',
      title: 'Modified',
      minWidth: 120,
      type: 'html',
      formatter: ({ cellValue, row }) => {
        if (cellValue.toLowerCase() === 'y') {
          return `<div class="container"><div class="circle yes"></div><div class="text">${cellValue}</div></div>`
        }
        if (cellValue.toLowerCase() === 'n') {
          return `<div class="container"><div class="circle no"></div><div class="text">${cellValue}</div></div>`
        }
        return cellValue
      }
    },
    {
      field: 'verified_by',
      title: 'Verified By',
      formatter: ({ cellValue, row }: any) => {
        return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
      }
    },
    {
      field: 'completed_on',
      title: 'Completed on',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

const footerData = ref([
  {
    batch_no: 'Total',
    application_no: 0,
    form_type: '-',
    before: '-',
    after: '-',
    modified: '-',
    verified_by: '-',
    completed_on: '-'
  }
])

const name = ref('SCS-102 - List of the Applications Verified')

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    handleDownloadExcel()
  } else if (command === 'pdf') {
    handleDownloadPDF()
  }
}

function getReportHeader(): ReportHeader {
  const projectName = formData.value.project ? projectList.value.find((p) => p.id === formData.value.project)?.name || 'SSF2026' : 'SSF2026'

  const totalCount = dataList.value.length

  return {
    reportId: 'SCS-102',
    compiledBy: 'HONG KONG HOUSING SOCIETY',
    project: projectName,
    inputProject: projectName,
    inputFrom: formData.value.date[0] || 'NULL',
    inputTo: formData.value.date[1] || 'NULL',
    title: 'SUBSIDISED SALE FLATS PROJECTS 2026',
    subtitle: 'List of the applications verified',
    dateRange: `From ${formatDate_1(formData.value.date[0])} to ${formatDate_1(formData.value.date[1])}`,
    remark: 'Remark: Before/After data format - <appln no>&<form type>&<ahkid>&<hkic1>&<hkic2>&<hkic3>&<hkicx>&<PaymentReference>&<family class>',
    totalLabel: 'Total number of application:',
    totalValue: totalCount
  }
}

function formatDate_1(dateStr: string): string {
  if (!dateStr) return 'NULL'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

async function handleDownloadExcel() {
  // Use columns directly as they no longer have HTML formatting (except modified)
  const exportColumns = columnsRef.value.map((col) => ({ field: col.field, title: col.title }))

  // Clean modified value for export (strip HTML)
  const exportData = dataList.value.map((row) => ({
    ...row,
    modified: getModifiedExportValue(row)
  }))

  await exportReportToExcel(getReportHeader(), exportColumns, exportData)
}

function getModifiedExportValue(row: any): string {
  const value = row.modified || ''
  if (typeof value === 'string' && value.includes('<')) {
    // Extract just the text content from HTML
    const div = document.createElement('div')
    div.innerHTML = value
    return div.textContent || div.innerText || value
  }
  return value
}

function handleDownloadPDF() {
  // Use columns directly as they no longer have HTML formatting (except modified)
  const exportColumns = columnsRef.value.map((col) => ({ field: col.field, title: col.title }))

  // Clean modified value for export (strip HTML)
  const exportData = dataList.value.map((row) => ({
    ...row,
    modified: getModifiedExportValue(row)
  }))

  exportReportToPDF(getReportHeader(), exportColumns, exportData)
}

function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  query()
  reload()
  refresh()
}

const dataList = ref([])

async function getData() {
  const rpcParams = {
    p_project_id: formData.value.project,
    p_start_date: formData.value.date[0],
    p_end_date: formData.value.date[1],
    p_distinct_flag: 2,
    default_schema: true
  }
  const data: any[] = await newClientApi.postPostgrestRpcFunc('get_user_verification_list', JSON.stringify(rpcParams)).then((res: any) => res.data)
  const element: any = data[data.length - 1]
  data.splice(data.length - 1, 1)
  footerData.value[0].application_no = element.total_number_of_application

  data.forEach((item: any) => {
    item.compare = handleCompare(item.before, item.after)
  })
  dataList.value = data
  return data
}

function handleCompare(oldStr: string, newStr: string): string[] {
  // 將字符串根據 '&' 分隔到數組中並去除空格
  const oldParts = oldStr.split('&').map((part) => part.trim())
  const newParts = newStr.split('&').map((part) => part.trim())

  return oldParts.map((oldValue, i) => {
    const newValue = newParts[i] || ''
    return oldValue !== newValue ? `${oldValue} - ${newValue}` : `<div style="background: #c1c1c1">${oldValue}</div>`
  })
}

const columnsRef = ref([
  { field: 'batch_no', title: 'Batch No.' },
  {
    field: 'application_no',
    title: 'Application No.',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'form_type',
    title: 'Form Type',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'before',
    title: 'Before',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'after',
    title: 'After',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'modified',
    title: 'Modified',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'verified_by',
    title: 'Verified By',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  },
  {
    field: 'completed_on',
    title: 'Completed on',
    formatter: ({ cellValue, row }: any) => {
      return !!cellValue && cellValue !== '' ? cellValue : 'N/A'
    }
  }
])
const orderBy = ref(true)
const sortingField = ref(columnsRef.value[0].field)
const sortingName = computed(() => {
  let find = columnsRef.value.find((item: any) => item.field === sortingField.value)
  return find ? find.title : columnsRef.value[0].title
})

function HandleSorting(command: string) {
  sortingField.value = command
  const sort = dataList.value.sort((a, b) => {
    if (orderBy.value) {
      return String(b[sortingField.value]).localeCompare(String(a[sortingField.value]), undefined, { sensitivity: 'base' })
    } else {
      return String(a[sortingField.value]).localeCompare(String(b[sortingField.value]), undefined, { sensitivity: 'base' })
    }
  })
  tableRef.value.loadData(sort)
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}

const projectList = ref([])

// const statusMapRef = ref('')
// const statusList = ref([
//   {
//     label: 'Processing',
//     value: 'processing',
//     status: ['processing', 'uploaded', 'classification', 'page-split', 'ratio-resize', 'ocr', 'exporting', 'combine-document']
//   },
//   { label: 'Verification', value: 'verification', status: ['draft', 'processed', 'verifying', 'verified'] },
//   { label: 'Export Ready', value: 'exportReady', status: ['exportReady', 'export-ready'] },
//   { label: 'Completed', value: 'completed', status: ['completed'] },
//   { label: 'Failed', value: 'failed', status: ['failed-to-process', 'failed-to-export', 'upload-fail'] },
//   { label: 'Cancelled', value: 'cancelled', status: ['cancelled'] }
// ])

// function handleStatusMap() {
//   const find = statusList.value.find((item: any) => item.value == statusMapRef.value)
//   const filter = dataList.value.filter((item: any) => find.status.includes(item.status))
//   tableRef.value.loadData(filter)
// }

onMounted(async () => {
  projectList.value = await newClientApi.postCaptureProjPage({}).then((r) => r.data)
})
</script>

<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :settingRef="settingRef"
    :hideSetting="hideSetting"
    :setting="setting"
    :show-refresh-icon="false"
    :show-fullscreen-icon="false"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <template #title_suffix>
      <span class="title-suffix-name">{{ name }}</span>
    </template>
    <template #action_prefix>
      <el-dropdown trigger="click" @command="handleDownloadCommand">
        <el-button type="primary">
          Download &nbsp;<el-icon><ArrowDownBold /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="excel">Download Excel</el-dropdown-item>
            <el-dropdown-item command="pdf">Download PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <div class="pageContainer--padding">
      <VxeGrid show-footer ref="tableRef" v-bind="tableConfig" v-on="tableEvent" :footer-data="footerData">
        <template #toolbar_buttons>
          <div class="toolbar-wrap">
            <div class="toolbar-form-row">
              <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" clearable @change="query">
                <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
              </el-select>
              <!--              <el-select class="toolbar-select toolbar-select&#45;&#45;type" v-model="statusMapRef" @change="handleStatusMap">-->
              <!--                <el-option v-for="(item, index) in statusList" :label="item.label" :value="item.value" />-->
              <!--              </el-select>-->
              <el-date-picker
                class="toolbar-date"
                v-model="formData.date"
                type="daterange"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                range-separator="~"
                start-placeholder="Start month"
                end-placeholder="End month"
                unlink-panels
                :clearable="false"
                @change="query"
              />
            </div>

            <div class="toolbar-sorting-wrap">
              <el-dropdown trigger="click" @command="HandleSorting">
                <el-button text>
                  {{ sortingName }} &nbsp;
                  <el-icon><ArrowDownBold /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="(item, index) in columnsRef" :command="item.field">{{ item.title }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <Icon :name="orderBy ? 'mdi:sort-descending' : 'mdi:sort-ascending'" style="background-color: #1abc9c" @click="handleOrderBy" />
            </div>
          </div>
        </template>
      </VxeGrid>
    </div>
    <HkhsSetting ref="settingRef" :setting="setting" @submit="(setting) => $emit('refreshSetting', setting)" />
  </DashboardCard>
</template>

<style scoped lang="scss">
.title-suffix-name {
  font-size: var(--app-font-size-xxl);
}

.toolbar-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toolbar-form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.toolbar-sorting-wrap {
  display: flex;
  align-items: center;
}

.toolbar-select {
  width: 180px;
}

:deep(.table) {
  width: 100%;
  border-collapse: collapse;
}
:deep(th, td) {
  padding: 8px;
  text-align: left;
  border: none;
}

:deep(.container) {
  display: flex;
  align-items: center;
}

:deep(.circle) {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
}

:deep(.yes) {
  background-color: #1abc9c;
}

:deep(.no) {
  background-color: #e74c3c;
}

:deep(.text) {
  font-size: 16px;
  color: #333;
}
</style>
