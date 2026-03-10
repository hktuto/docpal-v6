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
  id: 'HKHS-DailySummary',
  api: async () => {
    const rpcParams = {
      p_start_date: formData.value.date[0],
      p_end_date: formData.value.date[1],
      p_distinct_flag: 2,
      default_schema: true
    }
    const list = await newClientApi.postPostgrestRpcFunc('get_daily_export_summary', JSON.stringify(rpcParams))
    const element: any = list.data[list.data.length - 1]
    list.data.splice(list.data.length - 1, 1)
    footerData.value[0].no_of_application = element.no_of_application
    footerData.value[0].status = element.status
    return list
  },
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
    { field: 'status', title: 'Status' },
    { field: 'remark', title: 'Remark' }
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
    console.log('excel')
  } else if (command === 'pdf') {
    console.log('pdf')
  }
}

function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  query()
  reload()
  refresh()
}
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

.container {
  display: flex;
  align-items: center;
}
.circle {
  width: 2px; /* 圓的直徑 */
  height: 2px; /* 圓的直徑 */
  border-radius: 50%; /* 使其呈圓形 */
  margin-right: 2px; /* 圓與文本之間的間距 */
}
.yes {
  background-color: #1abc9c; /* Yes 的顏色 */
}
.no {
  background-color: #e74c3c; /* No 的顏色 */
}
.text {
  font-size: 16px; /* 字體大小 */
  color: #333; /* 字體顏色 */
}
</style>
