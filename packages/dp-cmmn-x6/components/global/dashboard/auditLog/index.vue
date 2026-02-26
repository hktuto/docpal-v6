<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { newClientApi } from 'api'

dayjs.extend(utc)
dayjs.extend(timezone)
const platform = useAppPlatform()
const CMDProvider = inject(CaseManagementDashboardKey)
const caseId = CMDProvider?.instanceId?.value || null
const caseTypeId = CMDProvider?.caseTypeId?.value || null

const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {
      layout: [],
      defaultValue: {},
      label: {}
    },
    hideSetting: false
  }
)

const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    await queryLog()
  }
})
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['delete', 'refreshSetting'])

async function handleDelete() {
  emits('delete')
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: `dashboardAuditLogTable${caseId}`,
  refresh: false,
  virtualScroll: true,
  columns: [],
  zoom: false,
  saveColumnOrder: false
})

async function queryLog() {
  if (platform.value === 'admin') {
    return
  }

  const params = {
    pageNum: 0,
    pageSize: 10000,
    stream: 'workflow',
    request: {
      category: props.setting.category,
      uniqueIdentifier: ''
    },
    userId: '',
    startTime: '2025-01-01T00:00:00',
    endTime: dayjs().format('YYYY-MM-DDTHH:mm:ss')
  }

  try {
    if (props.setting.category == 'masterTable') {
      if (props.setting.uniqueIdentifier == '') {
        routerProvider?.message.error('Please select Master Table.')
        return
      } else {
        params.request.uniqueIdentifier = props.setting.uniqueIdentifier
      }
    } else if (props.setting.category == 'case') {
      if (!caseTypeId) {
        routerProvider?.message.error('Case Type ID is empty')
        return
      } else {
        params.request.uniqueIdentifier = caseTypeId
        params.request.id = caseId
      }
    }
    // params.orderBy = 'logDate'
    params.isDesc = true
    const data = await newClientApi.postDocpalAuditLogWorkflowPage(params).then(r => r.data)
    tableConfig.data = data.entryList.map((item: any) => {
      return {
        date: item.logDate,
        activities: item.request.activities,
        status: item.request.status,
        user: item.userId
      }
    })
  } catch (e) {
    console.log('queryLog', e)
  }
}

async function handleRefreshSetting(data: any) {
  emits('refreshSetting', data)
}

async function init() {
  if (!!props.setting && props.setting.columns) {
    tableConfig.columns = props.setting.columns.map((item: any) => {
      let filed = {
        field: item.id,
        title: item.label || item.id,
        width: item.width
      }

      if (item.id.includes('date')) {
        filed = {
          ...filed,
          formatter: ({ cellValue }) => {
            const utcTime = dayjs.utc(`${cellValue}.000Z`)
            return utcTime.tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
          }
        }
      }
      return filed
    })
  }

  await queryLog()
}

function handleExport() {
  tableRef.value?.exportData({
      type: 'xlsx'
    })
}

onMounted(async () => {
  await init()
})

</script>

<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('Audit Log')"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" >
      <template #toolbar_buttons>
        <VxeButton type="primary" @click="handleExport">
          {{ $t('Export') }}
        </VxeButton>
      </template>
    </VxeGrid>
    <DashboardAuditLogSetting v-if="!hideSetting" ref="settingRef" @refresh="handleRefreshSetting" />
  </DashboardCard>
</template>

<style scoped lang="scss">

</style>
