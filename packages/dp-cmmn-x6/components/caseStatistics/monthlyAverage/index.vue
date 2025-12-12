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
      v-if="!hideSetting && mode === 'real'"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :formJson="mergedJson"
      :title="title"
      :big="true"
      componentName="CaseMonthlyAverage"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { clientApi, PostgREST_Decorate } from 'api'
import dayjs from 'dayjs'

import formJson from '../setting.vform.json'
import styleJson from './setting.style.vform.json'
import setupJson from './setting.setup.vform.json'
import { mergeSetting } from '../settingMergeHelper'

const mergedJson = mergeSetting(formJson, setupJson, styleJson)
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
    type?: string
    mode: 'mock' | 'real'
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
    trigger: 'axis'
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
          return formatValue(value, props.setting.barDisplayMethod)
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
          return formatValue(value, props.setting.lineDisplayMethod)
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
function mockCompletedOption(option: any) {
  const _opts = JSON.parse(JSON.stringify(option))
  _opts.series[0].data = [10, 20, 30, 0, 0, 600, 70, 80, 9, 10, 110, 120]
  _opts.series[1].data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]
  return _opts
}
const dialogRef = ref()

const { cardRef, chartRef, settingRef, resize, refresh, handleInitCard, loading, setupOptions, setSqlParamsByFilterList, setRpcParamsByFilterList, formSlotHandleDisplayMethod } = useDashboardCard({
  props,
  getOptions: async (chartSetting) => {
    const _option = setupOptions(option)
    if (!chartSetting.tableName) {
      return _option
    }
    _option.legend.data[0] = props.setting.barLegendTitle || props.setting.barYAxisTitle
    _option.yAxis[0].name = props.setting.barYAxisTitle
    _option.yAxis[0].nameGap = props.setting.barGap || 32
    _option.yAxis[0].axisLabel.formatter = function (value) {
      return formSlotHandleDisplayMethod({
        displayMethod: props.setting.barDisplayMethod,
      }, value)
    }
    _option.series[0].name = props.setting.barLegendTitle || props.setting.barYAxisTitle
    _option.series[0].itemStyle.color = props.setting.barColor || ''
    _option.series[0].tooltip.valueFormatter = function (value) {
      const unit = props.setting.barChartSuffix ? ' ' + props.setting.barChartSuffix : ''
      return formSlotHandleDisplayMethod({
        displayMethod: props.setting.barDisplayMethod,
        suffix: unit
      }, value)
    }
    _option.series[0].data = await getCaseCount(chartSetting)

    if (props.setting.lineDataField) {
      _option.legend.data[1] = props.setting.lineLegendTitle || props.setting.lineYAxisTitle
      _option.yAxis[1].name = props.setting.lineYAxisTitle
      _option.yAxis[1].nameGap = props.setting.lineGap || 32
      _option.yAxis[1].axisLabel.formatter = function (value) {
        return formSlotHandleDisplayMethod({
          displayMethod: props.setting.lineDisplayMethod,
        }, value)
      }
      _option.series[1].name = props.setting.lineLegendTitle || props.setting.lineYAxisTitle
      _option.series[1].itemStyle.color = props.setting.lineColor || ''
      _option.series[1].tooltip.valueFormatter = function (value) {
        const unit = props.setting.lineChartSuffix ? ' ' + props.setting.lineChartSuffix : ''
        return formSlotHandleDisplayMethod({
          displayMethod: props.setting.lineDisplayMethod,
          suffix: unit
        }, value)
      }
      _option.series[1].data = await getAverageDuration(chartSetting)
    }
    return _option
  },
  clickAction: (params: any) => {
    if (props.mode === 'mock') {
      return
    }
    let dates: any
    if (!props.dates) {
      dates = [dayjs(new Date()).format('YYYY-MM-DD'), dayjs(new Date()).format('YYYY-MM-DD')]
    } else {
      dates = JSON.parse(JSON.stringify(props.dates))
    }
    const year = targetYear.value
    const month = params.dataIndex + 1
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD 00:00:00')
    const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD 23:59:59')
    tableDates.value = [startDate, endDate]
    const sortBy = props.setting.sortBy || 'created_date'
    const sqlParams = [
      {
        key: props.setting.dateField || 'created_date',
        type: 'gte',
        value: startDate
      },
      {
        key: props.setting.dateField || 'created_date',
        type: 'lte',
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
    setSqlParamsByFilterList(props.setting.filterList, sqlParams)
    // if (props.setting.filterKey && props.setting.filterValue) {
    //   sqlParams.push({
    //     key: props.setting.filterKey,
    //     type: 'eq',
    //     value: props.setting.filterValue
    //   })
    // }
    dialogRef.value.handleOpen(sqlParams)
  }
})
async function getCaseCount(chartSetting) {
  if (props.mode === 'mock') {
    const data = []
    for(let i = 0; i < 12; i++) {
      const count = Math.floor(Math.random() * 10) + i
      data.push(count)
    }
    return data
  }
  const rpcParams: any = {
    _table_name: chartSetting.tableName,
    _date_column: chartSetting.dateField, // 合同到期日期字段
    _target_year: Number(targetYear.value),
    _filters: {}
  }
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters[chartSetting.relatedField] = caseInstanceId
  }
  setRpcParamsByFilterList(props.setting.filterList, rpcParams._filters)
  if (props.setting.currentUserField) {
    rpcParams._filters[props.setting.currentUserField] = userId
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const response: any = await clientApi.api.postPostgrestRpcFunc('count_by_month_generic', rpcParams).then((res) => res.data)
  return response.map((item) => item.count_value)
}
async function getAverageDuration(chartSetting) {
  if (props.mode === 'mock') {
    const data = []
    for(let i = 0; i < 12; i++) {
      const count = Math.floor(Math.random() * 10) + i
      data.push(count)
    }
    return data
  }
  const rpcParams: any = {
    _table_name: chartSetting.tableName,
    _date_column: chartSetting.dateField, // 合同到期日期字段
    _target_year: Number(targetYear.value),
    _value_column: chartSetting.lineDataField,
    _filters: {}
  }
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters = {
      [chartSetting.relatedField]: caseInstanceId
    }
  }
  setRpcParamsByFilterList(props.setting.filterList, rpcParams._filters)
  if (props.setting.currentUserField) {
    rpcParams._filters[props.setting.currentUserField] = userId
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const response: any = await clientApi.api.postPostgrestRpcFunc('avg_by_month_generic', rpcParams).then((res) => res.data)
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
defineExpose({ resize, refresh })
</script>

<style lang="scss" scoped></style>
