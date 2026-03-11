<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'

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
const appPlatform = useAppPlatform()
const showDeleteIcon = computed(() => {
  return appPlatform.value === 'admin'
})
const formData = ref({
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  includeDuplicate: 2
})

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-DailyReportTable',
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
    { field: 'complete', title: '(7)Complete' },
    { field: 'cancelled', title: '(8)Cancelled' }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {},
  optionalConfig: {
    //   pagerConfig: {
    //     enabled: false
    //   }
  }
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
const hideSetting = ref()
const setting = ref()
const name = ref('SCS-100 - Summary of Application Forms Processed')

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
    console.log('excel')
  } else if (command === 'pdf') {
    console.log('pdf')
  }
}

const IncludeDuplicateOption = ref([
  { label: 'Yes', value: 2 },
  { label: 'No', value: 1 }
])

async function getData() {
  const rpcParams = {
    p_start_date: formData.value.date[0],
    p_end_date: formData.value.date[1],
    p_distinct_flag: formData.value.includeDuplicate,
    default_schema: true //默认值必须传
  }
  let list = await newClientApi.postPostgrestRpcFunc('get_doc_processing_daily_report', JSON.stringify(rpcParams))
  handleTotal(list.data)
  tableRef.value.loadData(list.data)
}

onMounted(async () => {
  await getData()
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
    :show-delete-icon="showDeleteIcon"
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
          <div class="toolbar-form-row">
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
            Include Duplicate:
            <el-select class="toolbar-select toolbar-select--duplicate" v-model="formData.includeDuplicate">
              <el-option v-for="(item, index) in IncludeDuplicateOption" :label="item.label" :value="item.value" @change="query" />
            </el-select>
          </div>
        </template>
      </VxeGrid>
    </div>
  </DashboardCard>
</template>

<style scoped lang="scss">
.title-suffix-name {
  font-size: 35px;
  line-height: 35px;
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

.toolbar-date {
  width: 260px;
}
</style>
