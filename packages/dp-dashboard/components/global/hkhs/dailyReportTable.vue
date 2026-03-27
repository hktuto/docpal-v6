<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { exportReportToExcel } from '~/utils/excelHelper'
import { exportReportToPDF, type ReportHeader } from '~/utils/pdfHelper'

// SCS-100 - Summary of Application Forms Processed
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
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  includeDuplicate: 2
})
const projectList = ref([])
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-DailyReportTable',
  api: () => getData(),
  virtualScroll: true,
  columns: [
    {
      field: 'transaction_date',
      title: 'Transaction Date',
      fixed: 'left',
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('DD/MM/YYYY')
      }
    },
    { field: 'uploaded', title: '(1)Uploaded' },
    { field: 'failed_to_process', title: '(2)Failed to Process' },
    { field: 'processed', title: '(3)Processed' },
    { field: 'verified', title: '(4)Verified' },
    { field: 'failed_to_export', title: '(5)Failed to Export' },
    { field: 'exported', title: '(6)Exported' },
    { field: 'downloaded', title: '(7)Complete' },
    { field: 'cancelled', title: '(8)Cancelled' }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

const footerData = ref([
  {
    transaction_date: 'Total',
    uploaded: '-',
    failed_to_process: '-',
    processed: '-',
    verified: '-',
    failed_to_export: '-',
    exported: '-',
    complete: '-',
    cancelled: '-'
  }
])
function handleTotal(list: any[]) {
  const totals = list.reduce(
    (acc, item) => {
      acc.uploaded += item.uploaded || 0
      acc.processed += item.processed || 0
      acc.failed_to_process += item.failed_to_process || 0
      acc.verified += item.verified || 0
      acc.exported += item.exported || 0
      acc.failed_to_export += item.failed_to_export || 0
      acc.downloaded += item.downloaded || 0
      acc.cancelled += item.cancelled || 0
      return acc
    },
    {
      uploaded: 0,
      processed: 0,
      failed_to_process: 0,
      verified: 0,
      exported: 0,
      failed_to_export: 0,
      downloaded: 0,
      cancelled: 0
    }
  )
  totals.transaction_date = 'Total'
  footerData.value[0] = totals
}

const emits = defineEmits(['delete', 'refreshSetting'])

function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  query()
  reload()
  refresh()
}

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    handleDownloadExcel()
  } else if (command === 'pdf') {
    handleDownloadPDF()
  }
}

function getReportHeader(): ReportHeader {
  const projectName = formData.value.project ? projectList.value.find((p) => p.id === formData.value.project)?.name || 'SSF2026' : 'SSF2026'

  const includeDup = formData.value.includeDuplicate === 2 ? 'Yes' : 'No'

  return {
    reportId: 'SCS-100',
    compiledBy: 'HONG KONG HOUSING SOCIETY',
    project: projectName,
    inputProject: projectName,
    inputFrom: formData.value.date[0] || 'NULL',
    inputTo: formData.value.date[1] || 'NULL',
    inputIncluded: includeDup,
    title: 'SUBSIDISED SALE FLATS PROJECTS 2026',
    subtitle: 'Summary of Application Forms Processed',
    dateRange: `From ${formatDate(formData.value.date[0])} to ${formatDate(formData.value.date[1])}`
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'NULL'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

async function handleDownloadExcel() {
  // Format data with proper date formatting
  const formattedData = dataList.value.map((row) => ({
    ...row,
    transaction_date: row.transaction_date ? dayjs(row.transaction_date).format('DD/MM/YYYY') : ''
  }))
  await exportReportToExcel(getReportHeader(), columnsRef.value, formattedData, footerData.value)
}

function handleDownloadPDF() {
  // Format data with proper date formatting for PDF
  const formattedData = dataList.value.map((row) => ({
    ...row,
    transaction_date: row.transaction_date ? dayjs(row.transaction_date).format('DD/MM/YYYY') : ''
  }))
  exportReportToPDF(
    getReportHeader(),
    columnsRef.value.map((col) => ({ field: col.field, title: col.title })),
    formattedData
  )
}

const IncludeDuplicateOption = ref([
  { label: 'Yes', value: 2 },
  { label: 'No', value: 1 }
])

const dataList = ref([])
async function getData() {
  const rpcParams = {
    p_project_id: formData.value.project,
    p_start_date: formData.value.date[0],
    p_end_date: formData.value.date[1],
    p_distinct_flag: formData.value.includeDuplicate,
    default_schema: true //默认值必须传
  }
  let data = await newClientApi.postPostgrestRpcFunc('get_doc_processing_daily_report', JSON.stringify(rpcParams)).then((r) => r.data)

  // 篩除所有數據為0的item
  const filteredList = data.filter((item: any) => {
    return columnsRef.value.some((col: any) => {
      const num = Number(item?.[col.field] ?? 0)
      return !Number.isNaN(num) && num !== 0
    })
  })
  handleTotal(filteredList)

  dataList.value = filteredList
  return filteredList
}

const columnsRef = ref([
  { field: 'transaction_date', title: 'Transaction Date' },
  { field: 'uploaded', title: '(1)Uploaded' },
  { field: 'failed_to_process', title: '(2)Failed to Process' },
  { field: 'processed', title: '(3)Processed' },
  { field: 'verified', title: '(4)Verified' },
  { field: 'failed_to_export', title: '(5)Failed to Export' },
  { field: 'exported', title: '(6)Exported' },
  { field: 'downloaded', title: '(7)Complete' },
  { field: 'cancelled', title: '(8)Cancelled' }
])
const orderBy = ref(true)
const sortingField = ref(columnsRef.value[0].field)
const sortingName = computed(() => {
  let find = columnsRef.value.find((item: any) => item.field === sortingField.value)
  return find ? find.title : columnsRef.value[0].title
})

function HandleSorting(command: string) {
  sortingField.value = command
  const compareString = (a: string, b: string) => {
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
  }
  const compareNumber = (a: number, b: number) => {
    return a - b
  }
  const factor = orderBy.value ? -1 : 1
  const comparator = (a, b) => {
    const na = a[sortingField.value]
    const nb = b[sortingField.value]
    if (command === 'transaction_date') {
      return compareString(na, nb) * factor
    } else {
      return compareNumber(na, nb) * factor
    }
  }
  tableRef.value.loadData(dataList.value.sort(comparator))
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}


function refreshSetting(setting: any) {
  emits('refreshSetting', setting)
  formData.value.project = setting.project
}
onMounted(async () => {
  projectList.value = await newClientApi.postCaptureProjPage({}).then((r) => r.data)
  formData.value.project = props.setting?.project ? props.setting?.project : projectList.value[0].id || ''
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
      <span class="title-suffix-name">{{ setting.name }}</span>
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
              <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" @change="query">
                <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
              </el-select>
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
              Include Duplicate:
              <el-select class="toolbar-select toolbar-select--duplicate" v-model="formData.includeDuplicate" @change="query">
                <el-option v-for="(item, index) in IncludeDuplicateOption" :label="item.label" :value="item.value" />
              </el-select>
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
    <HkhsSetting ref="settingRef" :setting="setting" @submit="refreshSetting" />
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

.toolbar-date {
  width: 260px;
}
</style>
