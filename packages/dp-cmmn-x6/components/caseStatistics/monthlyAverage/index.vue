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
      <el-date-picker style="width: 6rem" v-model="targetYear" size="small" type="year" format="YYYY" value-format="YYYY" @change="handleChangeYear" />
    </template>
    <div id="myEcharts" ref="chartRef" class="echart"></div>
    <CaseStatisticsTableDialog :setting="setting" :dates="tableDates" ref="dialogRef"> </CaseStatisticsTableDialog>

    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :formJson="formJson"
      :title="title"
      :big="true"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { clientApi, PostgREST_Decorate } from 'api'
import { mergeSetting } from '../settingMergeHelper'
import formJson from '../setting.vform.json'
// import styleJson from './setting.style.vform.json'
import setupJson from './setting.setup.vform.json'
import dayjs from 'dayjs'

const mergedJson = mergeSetting(formJson, setupJson)
console.log('mergedJson', mergedJson)
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
    type?: string
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const userId: string = useUserId().value
const CMDProvider = inject(CaseManagementDashboardKey)
const caseInstanceId = CMDProvider?.instanceId?.value || null
const { t } = useI18n()
const title = $t('dashboard.cmmnCaseMonthlyAverage')
const total = ref(0)
const tableDates = ref([])
const currentYear = dayjs(new Date()).year().toString()
const targetYear = ref(currentYear)
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}
const option = {
  tooltip: {
    trigger: 'axis',
    // axisPointer: {
    //   type: 'cross',
    //   crossStyle: {
    //     color: '#999'
    //   }
    // }
  },
  xAxis: [
    {
      name: 'Month',
      nameLocation: 'middle',
      nameGap: 24,
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisPointer: {
        type: 'shadow'
      }
    }
  ],
  grid: {
    left: '10%', // 调整整个图表左侧的留白，增加偏移
    right: '15%',
    bottom: '15%',
    top: '15%'
  },
  yAxis: [
    {
      type: 'value',
      name: 'Number of Cases',
      nameRotate: 90,
      nameGap: 32,
      nameLocation: 'middle',
      minInterval: 1,
      axisLabel: {
        formatter: function (value) {
          return formatValue(value, props.setting.numDisplayMethod)
        }
      }
    },
    {
      type: 'value',
      name: '',
      nameRotate: 270,
      nameLocation: 'middle',
      axisLabel: {
        formatter: function (value) {
          return formatValue(value, props.setting.averageDisplayMethod)
        }
      },
      splitLine: {
        show: false // 隐藏分隔线
      },
      nameGap: 80
    }
  ],
  series: [
    {
      name: 'Number of Cases',
      type: 'bar',
      tooltip: {
        valueFormatter: function (value) {
          return value
        }
      },
      itemStyle: {},
      data: []
    },
    {
      name: 'Average Duration',
      type: 'line',
      yAxisIndex: 1,
      itemStyle: {},
      tooltip: {
        valueFormatter: function (value) {
          return FinancialComputing(Number(value))
        }
      },
      smooth: true,
      data: []
    }
  ],
  legend: {
    show: false,
    top: '5%',
    data: ['Number of Cases', 'Average Value']
  }
}
const dialogRef = ref()
function formatValue(value, displayMethod) {
  if(!value) return '--'
  if (displayMethod === 'count') {
    return FinancialComputing(Number(value))
  } else if (displayMethod === 'currency') {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('$', '')
  } else if (displayMethod === 'fileSize') {
    return fileSize(Number(value))
  } else {
    return value
  }
}
const { cardRef, chartRef, settingRef, resize, handleInitCard, loading } = useDashboardCard({
  props,
  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return option
    }
    option.yAxis[0].name = props.setting.barTitle

    option.legend.data[0] = props.setting.barLabel || props.setting.barTitle
    option.series[0].name = props.setting.barLabel || props.setting.barTitle
    option.series[0].tooltip.valueFormatter = function (value) {
      const unit = props.setting.barUnit ? ' ' + props.setting.barUnit : ''
      return FinancialComputing(Number(value)) + unit
    }
    option.grid.left = props.setting.leftMargin + '%' || '10%'
    option.grid.right = props.setting.rightMargin + '%' || '10%'
    option.yAxis[0].nameGap = props.setting.barGap || 32
    option.yAxis[1].nameGap = props.setting.averageGap || 32

    option.series[0].itemStyle.color = props.setting.numColor || ''
    option.series[1].itemStyle.color = props.setting.averageColor || ''

    if (props.setting.averageField) {
      option.legend.data[1] = props.setting.averageLabel || props.setting.averageTitle
      option.series[1].name = props.setting.averageLegend || props.setting.averageTitle
      if (props.setting.averageUnit) {
        option.yAxis[1].name = props.setting.averageTitle
        // option.yAxis[1].axisLabel.formatter = '{value} ' + props.setting.averageUnit
        option.series[1].tooltip.valueFormatter = function (value) {
          return FinancialComputing(Number(value)) + ' ' + props.setting.averageUnit
        }
      }
      if (props.setting.averageField) {
        option.series[1].data = await getAverageDuration(chartSetting)
      }
      // option.series[0].data = chartSetting.data.map(item => item.value)
      // option.series[1].data = chartSetting.data.map(item => item.average)
    }
    option.yAxis[0].axisLabel.formatter = function (value) {
      return formatValue(value, props.setting.numDisplayMethod)
    }
    option.yAxis[1].axisLabel.formatter = function (value) {
      return formatValue(value, props.setting.averageDisplayMethod)
    }
    if (props.setting.hideLegend) {
      option.legend.show = false
    } else {
      option.legend.show = true
    }
    option.series[0].data = await getCaseCount(chartSetting)
    return option
  },
  clickAction: (params: any) => {
    let dates: any
    if (!props.dates) {
      dates = [dayjs(new Date()).format('YYYY-MM-DD'), dayjs(new Date()).format('YYYY-MM-DD')]
    } else {
      dates = JSON.parse(JSON.stringify(props.dates))
    }
    const year = dayjs(dates[0]).year()
    const month = params.dataIndex + 1
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD 00:00:00')
    const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD 23:59:59')
    tableDates.value = [startDate, endDate]
    const sortBy = props.setting.sortBy || 'created_date'
    const sqlParams = [
      {
        key: props.setting.dateField,
        type: 'gt',
        value: startDate
      },
      {
        key: props.setting.dateField,
        type: 'lt',
        value: endDate
      },
      {
        type: 'order',
        value: `${sortBy}.desc`
      }
    ]
    if (props.setting.currentUserField) {
      sqlParams.push({
        key: props.setting.currentUserField,
        type: 'eq',
        value: userId
      })
    }
    if (props.setting.relatedField && caseInstanceId) {
      sqlParams.push({
        key: props.setting.relatedField,
        type: 'eq',
        value: caseInstanceId
      })
    }
    if (props.setting.filterKey && props.setting.filterValue) {
      sqlParams.push({
        key: props.setting.filterKey,
        type: 'eq',
        value: props.setting.filterValue
      })
    }
    dialogRef.value.handleOpen(sqlParams)
  }
})
async function getCaseCount(chartSetting) {
  const rpcParams = {
    _table_name: chartSetting.tableName,
    _date_column: chartSetting.dateField, // 合同到期日期字段
    _target_year: Number(targetYear.value),
    _filters: {}
  }
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters[chartSetting.relatedField] = caseInstanceId
  }
  if (chartSetting.filterKey && chartSetting.filterValue) {
    rpcParams._filters[chartSetting.filterKey] = chartSetting.filterValue
  }
  if (props.setting.currentUserField) {
    rpcParams._filters[props.setting.currentUserField] = userId
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const response = await clientApi.api.postPostgrestRpcFunc('count_by_month_generic', rpcParams).then((res) => res.data)
  return response.map((item) => item.count_value)
}
async function getAverageDuration(chartSetting) {
  const rpcParams = {
    _table_name: chartSetting.tableName,
    _date_column: chartSetting.dateField, // 合同到期日期字段
    _target_year: Number(targetYear.value),
    _value_column: chartSetting.averageField,
    _filters: {}
  }
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters = {
      [chartSetting.relatedField]: caseInstanceId
    }
  }
  if (chartSetting.filterKey && chartSetting.filterValue) {
    rpcParams._filters[chartSetting.filterKey] = chartSetting.filterValue
  }
  if (props.setting.currentUserField) {
    rpcParams._filters[props.setting.currentUserField] = userId
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const response = await clientApi.api.postPostgrestRpcFunc('avg_by_month_generic', rpcParams).then((res) => res.data)
  return response.map((item) => item.avg_value)
}
function handleChangeYear(year: string) {
  targetYear.value = year
  handleInitCard()
}
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
}
defineExpose({ resize })
</script>

<style lang="scss" scoped></style>
