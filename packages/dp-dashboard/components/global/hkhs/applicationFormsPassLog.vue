<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { newClientApi } from 'api'
import { exportSCS101ToExcel, type ReportHeader } from '~/utils/excelHelper'
import { exportSCS101ToPDF, type PDFColumn } from '~/utils/pdfHelper'

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

const emits = defineEmits(['delete', 'refreshSetting'])
const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props
})
function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  refresh()
  fetchAllData()
}

const tableComponent = ref([
  { field: 'uploaded', title: '(1)Uploaded' },
  { field: 'failedToProcess', title: '(2)Failed to Process' },
  { field: 'processed', title: '(3)Processed' },
  { field: 'verified', title: '(4)Verified' },
  { field: 'failedToExport', title: '(5)Failed to Export' },
  { field: 'exportReady', title: '(6)Export-Ready' },
  { field: 'completed', title: '(7)Completed' },
  { field: 'cancelled', title: '(8)Cancelled' }
])

const formData = ref({
  project: null,
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
})
const name = ref('SCS-101 - Activity Log of Application Forms Processed')
const hkhsTableRef = ref()
const columnsRef = ref([
  { field: 'datetime', title: 'Date Time', fixed: 'left' },
  { field: 'batch_no', title: 'Batch No.' },
  { field: 'from_application_number', title: 'Form' },
  { field: 'to_application_number', title: 'To' },
  { field: 'no_of_application', title: 'No of Applications' },
  { field: 'form_type', title: 'Form Type' },
  { field: 'user_id', title: 'User ID' },
  { field: 'insert_replace', title: 'Insert/Replace' },
  { field: 'remark', title: 'Remark' }
])
const sortingField = ref(columnsRef.value[0].field)
const orderBy = ref(true)
const projectList = ref<any[]>([])
const sortingName = computed(() => {
  let find = columnsRef.value.find((item: any) => item.field === sortingField.value)
  return find ? find.title : columnsRef.value[0].title
})

// Store data for all tables
const tablesData = ref<Record<string, any[]>>({})

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    handleDownloadExcel()
  } else if (command === 'pdf') {
    handleDownloadPDF()
  }
}

async function fetchAllData() {
  // Fetch data for all stages
  for (const item of tableComponent.value) {
    await fetchStageData(item.field)
  }
}

async function fetchStageData(stage: string) {
  try {
    const rpcParams = {
      p_start_date: formData.value.date[0],
      p_end_date: formData.value.date[1],
      p_stage: stage,
      p_distinct_flag: 2,
      default_schema: true
    }
    const data: any[] = await newClientApi.postPostgrestRpcFunc('get_batch_stage_detail_report', JSON.stringify(rpcParams)).then((res: any) => res.data)
    tablesData.value[stage] = data || []
  } catch (error) {
    console.error(`Failed to fetch data for stage ${stage}:`, error)
    tablesData.value[stage] = []
  }
}

function getReportHeader(): ReportHeader {
  const projectName = formData.value.project ? projectList.value.find((p) => p.id === formData.value.project)?.name || 'SSF2026' : 'SSF2026'

  return {
    reportId: 'SCS-101',
    compiledBy: 'HONG KONG HOUSING SOCIETY',
    project: projectName,
    inputProject: projectName,
    inputFrom: formData.value.date[0] || 'NULL',
    inputTo: formData.value.date[1] || 'NULL',
    title: 'SUBSIDISED SALE FLATS PROJECTS 2026',
    subtitle: 'Activity Log of Application Forms Processed',
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
  const tables = tableComponent.value.map((item) => ({
    name: item.title,
    columns: columnsRef.value.map((col) => ({ field: col.field, title: col.title })),
    data: tablesData.value[item.field] || []
  }))

  await exportSCS101ToExcel(getReportHeader(), tables)
}

function handleDownloadPDF() {
  const tables = tableComponent.value.map((item) => ({
    title: item.title,
    columns: columnsRef.value.map((col) => ({ field: col.field, title: col.title })) as PDFColumn[],
    data: tablesData.value[item.field] || []
  }))

  exportSCS101ToPDF(getReportHeader(), tables)
}

function query() {
  const refs = hkhsTableRef.value
  if (Array.isArray(refs)) {
    refs.forEach((inst: any) => inst?.query?.())
  } else if (refs?.query) {
    refs.query()
  }
  // Also fetch data for export
  fetchAllData()
}

function HandleSorting(command: string) {
  sortingField.value = command
  const refs = hkhsTableRef.value
  if (Array.isArray(refs)) {
    refs.forEach((inst: any) => inst?.HandleSorting?.())
  } else if (refs?.HandleSorting) {
    refs.HandleSorting()
  }
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}

onMounted(async () => {
  projectList.value = (await newClientApi.postCaptureProjPage({}).then((r) => r.data)) as any[]
  // Fetch data for export after a short delay to allow child components to load
  setTimeout(fetchAllData, 1000)
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
    <div class="toolbar-wrap">
      <div class="toolbar-form-row">
        <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" clearable @change="query">
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
      </div>

      <div class="toolbar-sorting-wrap">
        <el-dropdown trigger="click" @command="HandleSorting">
          <el-button text>
            {{ sortingName }} &nbsp;
            <el-icon><ArrowDownBold /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="(item, index) in columnsRef" :command="item.field">
                {{ item.title }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <Icon :name="orderBy ? 'mdi:sort-descending' : 'mdi:sort-ascending'" style="background-color: #1abc9c" @click="handleOrderBy" />
      </div>
    </div>

    <div class="table-list-scroll">
      <template v-for="(item, index) in tableComponent" :key="item.field">
        <div class="table-block">
          <HkhsTable
            ref="hkhsTableRef"
            :name="item.title"
            :stage="item.field"
            :project="formData.project"
            :startDate="formData.date[0]"
            :endDate="formData.date[1]"
            :sortingField="sortingField"
            :orderBy="orderBy"
          />
        </div>
      </template>
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

.toolbar-wrap-1 {
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

.table-list-scroll {
  overflow-y: auto;
  height: calc(100% - 60px);
}

.table-block {
  height: 600px;
}
</style>
