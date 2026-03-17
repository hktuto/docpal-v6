<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { statusToGroupStatus } from '#imports'
import { exportSingleSheet, formatDate } from '~/utils/excelHelper'
import { exportTableToPDF } from '~/utils/pdfHelper'

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
    datetime: 'Total',
    batch_no: 0,
    form_application_number: '-',
    to_application_number: '-',
    no: '-',
    form_type: '-',
    source: '-',
    user_id: '-',
    is_overwrite: '-',
    status: '-',
    remark: '-'
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

function handleDownloadExcel() {
  exportSingleSheet(columnsRef.value, dataList.value, 'SCS-103_Daily_Summary', footerData.value)
}

function handleDownloadPDF() {
  exportTableToPDF({
    title: 'SCS-103 - Daily Summary of the applications from Verified to Completed',
    columns: columnsRef.value.map(col => ({ field: col.field, title: col.title })),
    data: dataList.value,
    footerData: footerData.value,
    fileName: 'SCS-103_Daily_Summary',
    orientation: 'landscape'
  })
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
    p_start_date: formData.value.date[0],
    p_end_date: formData.value.date[1],
    p_distinct_flag: 2,
    default_schema: true
  }
  const data = await newClientApi.postPostgrestRpcFunc('get_daily_export_summary', JSON.stringify(rpcParams)).then((r) => r.data)
  const element: any = data[data.length - 1]
  data.splice(data.length - 1, 1)
  footerData.value[0].no_of_application = element.no_of_application
  footerData.value[0].status = element.status

  dataList.value = data
  return data
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
              <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" @change="query">
                <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
              </el-select>
              <el-select class="toolbar-select toolbar-select--type">
                <el-option @change="query" />
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
    <HkhsSetting ref="settingRef" :setting="setting" @submit="(setting) => $emit('refreshSetting', setting)"/>
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
