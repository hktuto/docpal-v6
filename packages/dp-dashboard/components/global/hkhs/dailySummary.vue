<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { statusToGroupStatus } from '#imports'
import { exportReportToExcel } from '~/utils/excelHelper'
import { exportReportToPDF, type ReportHeader } from '~/utils/pdfHelper'

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
const emits = defineEmits(['refreshSetting', 'delete'])

const formData = ref({
  project: '',
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  includeDuplicate: 2
})

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-DailySummary',
  virtualScroll: true,
  api: () => getData(),
  columns: [
    { field: 'datetime', title: 'Date Time', fixed: 'left' },
    { field: 'batch_no', title: 'Batch No.' },
    { field: 'form_application_number', title: 'From' },
    { field: 'to_application_number', title: 'To' },
    { field: 'no_of_application', title: 'No. of Application' },
    { field: 'form_type', title: 'Form Type' },
    { field: 'source', title: 'Source' },
    { field: 'user_id', title: 'User ID' },
    { field: 'is_overwrite', title: 'Insert/Replace' },
    {
      field: 'status',
      title: 'Status',
      minWidth: 120,
      type: 'html',
      formatter({ cellValue }: any) {
        if (!cellValue) return ''
        const groupStatus = statusToGroupStatus(cellValue)
        if (!groupStatus) return cellValue
        return `<div class="table-status" style="--status-color: ${groupStatus.color}"><div class="status-dot"></div>${cellValue}</div>`
      }
    },
    { field: 'remark', title: 'Remark' }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

const footerData = ref([
  {
    datetime: 'Summary',
    no_of_application: ''
  }
])

const name = ref('SCS-103 - Daily Summary of the applications from Verified to Completed')

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    handleDownloadExcel()
  } else if (command === 'pdf') {
    handleDownloadPDF()
  }
}

function getReportHeader(): ReportHeader {
  const projectName = formData.value.project ? projectList.value.find((p) => p.id === formData.value.project)?.name || 'SSF2026' : 'SSF2026'

  return {
    reportId: 'SCS-103',
    compiledBy: 'HONG KONG HOUSING SOCIETY',
    project: projectName,
    inputProject: projectName,
    inputFrom: formData.value.date[0] || 'NULL',
    inputTo: formData.value.date[1] || 'NULL',
    stage: '(5) Verified (6) Failed to Export (7) Export-Ready (8) Completed',
    title: 'SUBSIDISED SALE FLATS PROJECTS 2026',
    subtitle: 'Daily Summary of the applications from Verified to Completed',
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

function handleDownloadExcel() {
  exportReportToExcel(getReportHeader(), columnsRef.value, dataList.value, footerData.value)
}

function handleDownloadPDF() {
  exportReportToPDF(
    getReportHeader(),
    columnsRef.value.map((col) => ({ field: col.field, title: col.title })),
    dataList.value
  )
}

function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  reload()
  refresh()
}

const dataList = ref([])
const tableData = ref<any[]>([])
async function getData() {
  const rpcParams = {
    p_start_date: formData.value.date[0],
    p_end_date: formData.value.date[1],
    p_distinct_flag: 2,
    default_schema: true
  }
  const data = await newClientApi.postPostgrestRpcFunc('get_daily_export_summary', JSON.stringify(rpcParams)).then((r) => r.data)

  const filtered = data.filter((item: any) => item.row_type !== 'empty' && item.row_type !== 'title' && item.row_type !== 'summary')
  const summaryList = data.filter((item: any) => item.row_type == 'summary')

  const tableList: any[] = []
  summaryList.forEach((item: any) => {
    tableList.push({
      stage: item.remark,
      batchesSuccess: 0,
      batchesFail: 0,
      applicationsSuccess: 0,
      applicationsFail: 0
    })
  })
  tableData.value = tableList

  dataList.value = filtered
  return filtered
}

const columnsRef = ref([
  { field: 'datetime', title: 'Date Time' },
  { field: 'batch_no', title: 'Batch No.' },
  { field: 'form_application_number', title: 'From' },
  { field: 'to_application_number', title: 'To' },
  { field: 'no_of_application', title: 'No. of Application' },
  { field: 'form_type', title: 'Form Type' },
  { field: 'source', title: 'Source' },
  { field: 'user_id', title: 'User ID' },
  { field: 'is_overwrite', title: 'Insert/Replace' },
  { field: 'status', title: 'Status' },
  { field: 'remark', title: 'Remark' }
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
      return b[sortingField.value].localeCompare(a[sortingField.value], undefined, { sensitivity: 'base' })
    } else {
      return a[sortingField.value].localeCompare(b[sortingField.value], undefined, { sensitivity: 'base' })
    }
  })
  tableRef.value.loadData(sort)
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}

const projectList = ref([])

const statusMapRef = ref('')
const statusList = ref([
  {
    label: 'Processing',
    value: 'processing',
    status: ['processing', 'uploaded', 'classification', 'page-split', 'ratio-resize', 'ocr', 'exporting', 'combine-document']
  },
  { label: 'Verification', value: 'verification', status: ['draft', 'processed', 'verifying', 'verified'] },
  { label: 'Export Ready', value: 'exportReady', status: ['exportReady', 'export-ready'] },
  { label: 'Completed', value: 'completed', status: ['completed'] },
  { label: 'Failed', value: 'failed', status: ['failed-to-process', 'failed-to-export', 'upload-fail'] },
  { label: 'Cancelled', value: 'cancelled', status: ['cancelled'] }
])

function handleStatusMap() {
  const find = statusList.value.find((item: any) => item.value == statusMapRef.value)
  const filter = dataList.value.filter((item: any) => find.status.includes(item.status))
  tableRef.value.loadData(filter)
}

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

    <div class="table-wrap">
      <div class="pageContainer--padding">
        <VxeGrid show-footer ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <div class="toolbar-wrap">
              <div class="toolbar-form-row">
                <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" @change="query">
                  <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
                </el-select>
                <el-select class="toolbar-select toolbar-select--type" v-model="statusMapRef" @change="handleStatusMap">
                  <el-option v-for="(item, index) in statusList" :label="item.label" :value="item.value" />
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

      <el-divider />

      <div style="margin-top: 20px">
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="stage" label="Stage" />
          <el-table-column align="center" label="No.of Batches">
            <el-table-column align="center" prop="batchesSuccess" label="Success" />
            <el-table-column align="center" prop="batchesFail" label="Fail" />
          </el-table-column>
          <el-table-column align="center" label="No.of Applications">
            <el-table-column align="center" prop="applicationsSuccess" label="Success" />
            <el-table-column align="center" prop="applicationsFail" label="Fail" />
          </el-table-column>
        </el-table>
      </div>
    </div>

    <HkhsSetting ref="settingRef" :setting="setting" @submit="(setting) => $emit('refreshSetting', setting)" />
  </DashboardCard>
</template>

<style scoped lang="scss">
.table-wrap {
  height: 100%;
  overflow-y: auto;
}

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

.toolbar-select {
  width: 180px;
}

.toolbar-sorting-wrap {
  display: flex;
  align-items: center;
}

:deep(.table-status) {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
:deep(.status-dot) {
  width: var(--app-space-s);
  height: var(--app-space-s);
  border-radius: 50%;
  background-color: var(--status-color);
}
</style>
