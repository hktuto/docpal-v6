<template>
  <DashboardCard
    v-loading="loading"
    ref="cardRef"
    :title="setting.title"
    :hideSetting="hideSetting"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="handleInitCard"
  >
    <template #action_prefix>
      <el-button v-if="showFilterButton" :disabled="mode === 'mock'" type="primary" size="small" @click="handleOpenDialog">{{ $t('common_filter') }} {{ displayFilter }}</el-button>
    </template>
    <div id="myEcharts" ref="chartRef" class="echart"></div>
    <CaseStatisticsTableDialog :setting="setting" :dates="tableDates" ref="dialogRef"> </CaseStatisticsTableDialog>

    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :title="title"
      :big="true"
      componentName="CaseFieldLifecycle"
      :formJson="mergedJson"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
    <CaseStatisticsFieldLifecycleDialog :setting="setting" ref="filterDialogRef" @filter="handleFilter"> </CaseStatisticsFieldLifecycleDialog>
  </DashboardCard>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from '../setting.vform.json'
import setupJson from './setting.setup.vform.json'
import { mergeSetting } from '../settingMergeHelper'
const mergedJson = mergeSetting(formJson, setupJson, null, { addFilterArray: false, addLegend: true, addMargin: true })
import dayjs from 'dayjs'
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
    type?: string
    mode?: 'mock' | 'real'
  }>(),
  {
    setting: {},
    hideSetting: false,
    mode: 'real'
  }
)
const userId: string = useUserId().value
const CMDProvider = inject(CaseManagementDashboardKey)
const caseInstanceId = CMDProvider?.instanceId?.value || null
const { t } = useI18n()
const title = $t('dashboard.cmmnCaseFieldLifecycle')
const total = ref(0)
const tableDates = ref([])
const filterParams = ref([])
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}
const showFilterButton = computed(() => {
  if (!props.setting.filterDialogList) return false
  return props.setting.filterDialogList.filter((item) => item.filterDialogField).length > 0
})
const displayFilter = computed(
  () => {
    if (filterParams.value.length > 0) {
      return `(${filterParams.value.map((item) => item.value).join(', ')})`
    }
    return ''
  },
  {
    deep: true,
    immediate: true
  }
)
const seriesConfig = {
  type: 'bar',
  itemStyle: {},
  tooltip: {
    valueFormatter: function (value) {
      return Math.round(value)
    }
  }
}
const option = {
  tooltip: {
    trigger: 'axis'
    // axisPointer: {
    //   type: 'cross',
    //   crossStyle: {
    //     color: '#999'
    //   }
    // }
  },
  grid: {
    left: '10%', // 调整整个图表左侧的留白，增加偏移
    right: '0%',
    bottom: '12%',
    top: '10%'
  },
  xAxis: [
    {
      type: 'category',
      data: [],
      axisPointer: {
        type: 'shadow'
      },
      name: 'Days',
      nameGap: 20,
      nameLocation: 'middle'
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: 'Number of Cases',
      nameRotate: 90,
      nameGap: 16,
      nameLocation: 'middle',
      minInterval: 1,
      axisLabel: {
        formatter: '{value}'
      }
    }
  ],
  series: []
}
const dialogRef = ref()

const { cardRef, chartRef, settingRef, resize, setupOptions, handleInitCard, loading } = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return option
    }
    const _option = setupOptions(option)
    _option.series = []
    _option.legend = {
      data: [],
      top: '0%'
    }

    chartSetting.filterList.forEach((item) => {
      _option.series.push({
        ...seriesConfig,
        name: item.filterValue,
        data: [],
        itemStyle: {
          color: item.color || ''
        }
      })
      _option.legend.data.push(item.filterValue)
    })
    const data = await getData(chartSetting)
    formatData(data, _option)
    return _option
  },
  clickAction: (params: any) => {
    const daysRange = params.name.split('-')
    const currentDate = dayjs(new Date()).format('YYYY-MM-DD 00:00:00')
    const startDate = daysRange[1] ? dayjs(currentDate).subtract(daysRange[1], 'day').format('YYYY-MM-DD 00:00:00') : ''
    const endDate = dayjs(currentDate).subtract(daysRange[0], 'day').format('YYYY-MM-DD 23:59:59')

    const sortBy = props.setting.sortBy || 'created_date'
    const sortOrder = props.setting.sortOrder || 'desc'
    let sqlParams = [
      {
        key: `${props.setting.dateField}`,
        type: 'lte',
        value: `${endDate}`
      },
      {
        key: `${props.setting.filterKey}`,
        type: 'eq',
        value: `${params.seriesName}`
      },
      {
        type: 'order',
        value: `${sortBy}.${sortOrder}`
      }
    ]
    if (startDate) {
      sqlParams.push({
        key: props.setting.dateField || 'created_date',
        type: 'gte',
        value: `${startDate}`
      })
    }
    if (props.setting.relatedField && caseInstanceId) {
      sqlParams.push({
        key: props.setting.relatedField,
        type: 'eq',
        value: caseInstanceId
      })
    }
    if (props.setting.currentUserField) {
      sqlParams.push({
        key: props.setting.currentUserField,
        type: 'eq',
        value: userId
      })
    }
    if (filterParams.value && filterParams.value.length > 0) {
      sqlParams = [...sqlParams, ...filterParams.value]
    }
    dialogRef.value.handleOpen(sqlParams)
  }
})
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
}
async function getData(chartSetting: any) {
  if (props.mode === 'mock') {
    const dayRanges = ['0-30', '31-60', '61-90', '91-120', '121-150', '151-180', '181-210', '211-240', '241-270', '271-300', '301-330', '331-365', '365+']
    const data = []
    dayRanges.forEach((dayRange, dayRangeIndex) => {
      const statusCounts = {}
      chartSetting.filterList.forEach((item, index) => {
        if (item.filterValue) {
          const count = Math.floor(Math.random() * 10) + dayRangeIndex + index
          statusCounts[item.filterValue] = count
        }
      })
      data.push({
        day_range: dayRange,
        status_counts: statusCounts
      })
    })
    return data
  }
  const rpcParams: any = {
    _table_name: chartSetting.tableName,
    _create_date_column: chartSetting.dateField,
    // _target_date_column: chartSetting.dateField,
    _status_column: chartSetting.filterKey,
    _status_list: chartSetting.filterList.map((item) => item.filterValue),
    _target_year: dayjs(props.dates[0]).year(),
    _filters: {}
  }
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters[chartSetting.relatedField] = caseInstanceId
  }
  if (chartSetting.currentUserField) {
    rpcParams._filters[chartSetting.currentUserField] = userId
  }
  if (filterParams.value && filterParams.value.length > 0) {
    filterParams.value.forEach((item) => {
      rpcParams._filters[item.key] = item.value
    })
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const response = await clientApi.api.postPostgrestRpcFunc('case_status_lifecycle_stats', rpcParams)
  return response.data
}
function formatData(data: any, _option: any) {
  _option.xAxis[0].data = data.map((item) => item.day_range.replace('天', ''))
  data.forEach((item) => {
    Object.keys(item.status_counts).forEach((status) => {
      const sIndex = _option.series.findIndex((s) => s.name === status)
      if (sIndex !== -1) {
        _option.series[sIndex].data.push(item.status_counts[status])
      }
    })
  })
}
const filterDialogRef = ref()
function handleOpenDialog() {
  filterDialogRef.value.handleOpen(JSON.parse(JSON.stringify(filterParams.value)))
}
function handleFilter(params: any) {
  filterParams.value = params
  handleInitCard()
}
defineExpose({ resize })
</script>

<style lang="scss" scoped>
.echart {
  padding: var(--app-space-xs);
}
</style>
