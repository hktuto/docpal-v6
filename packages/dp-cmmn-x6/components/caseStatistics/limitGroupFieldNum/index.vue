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
    <div class="chartContainer">
      <div class="mainChartWrapper">

      <div id="myEcharts" ref="chartRef" class="echart"></div>
      </div>
      <el-button type="primary" @click="handleShowAll()">{{ $t('button.showAll') }}</el-button>
    </div>
    <CaseStatisticsTableDialog :setting="setting" :dates="dates" ref="dialogRef"> </CaseStatisticsTableDialog>
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :formJson="formJson"
      :title="title" 
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { clientApi, PostgREST_Decorate } from 'api'
import formJson from './setting.vform.json'
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
const title = $t('dashboard.cmmnCaseLimitGroupFieldNum')
const total = ref(0)
const tabProvider = inject(TabManagerKey)
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}
const option = {
  tooltip: {
    trigger: 'item',
    position: function (pos, params, dom, rect, size) {
      // 自定义 tooltip 的位置,在鼠标下方，如果鼠标在底部，则放在鼠标上方，如果鼠标在偏右，则放在鼠标左侧，如果鼠标在偏左，则放在鼠标右侧
      return {
          top: 10
        }
    }
  },
  legend: {
    bottom: '40px',
    left: 'center'
  },
  series: [
    {
      type: 'pie',
      radius: ['30%', '60%'],
      center: ['50%', '44%'],
      label: {
        show: true,
        formatter: (params) => {
          return handleCompute(params.value)
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: []
    }
  ]
}
const { cardRef, chartRef, settingRef, resize, handleInitCard, loading } = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return option
    }
    option.series[0].label.formatter = (params) => {
      return handleCompute(params.value)
    }
    option.tooltip.valueFormatter = (value) => {
      return handleCompute(value)
    }
    option.series[0].radius = [
      chartSetting.innerRingProportion ? chartSetting.innerRingProportion + '%' : '30%',
      chartSetting.outerRingProportion ? chartSetting.outerRingProportion + '%' : '60%'
    ]
    option.series[0].data = []
    const data = option.series[0].data
    const rpcParams = {
      _table_name: chartSetting.tableName,
      _date_column: 'created_date',
      _top_n: 5,
      _group_column: chartSetting.groupField,
      _tcv_column: chartSetting.sortBy,
      _start_date: props.dates[0],
      _end_date: props.dates[1],
      _filters: {}
    }
    if (chartSetting.filterKey && chartSetting.filterValue) {
      rpcParams._filters[chartSetting.filterKey] = chartSetting.filterValue
    }
    if (chartSetting.relatedField && caseInstanceId) {
      rpcParams._filters[chartSetting.relatedField] = caseInstanceId
    }
    if (chartSetting.currentUserField) {
      rpcParams._filters[chartSetting.currentUserField] = userId
    }
    if (Object.keys(rpcParams._filters).length === 0) {
      delete rpcParams._filters
    }
    const response = await clientApi.api.postPostgrestRpcFunc('top_group_column_with_total', rpcParams)
    response.data.forEach((item) => {
      data.push({
        value: item.total_tcv,
        name: !item.group_value ? '-' : item.group_value,
        id: item.case_id
      })
    })
    return option
  },
  clickAction: (params: any) => {
    console.log(params)
    handleShowAll(params.name)
  }
})

const dialogRef = ref()
const groupDialogRef = ref()
function handleShowAll(groupField: string = '') {
  const sqlParams = [
    {
      key: 'created_date',
      type: 'gt',
      value: props.dates[0]
    },
    {
      key: 'created_date',
      type: 'lt',
      value: props.dates[1]
    },
    // {
    //   type: 'select',
    //   value: `${chartSetting.filterKey}.count()`
    // },
    {
      type: 'order',
      value: `${props.setting.sortBy}.desc`
    }
  ]
  if (props.setting.currentUserField) {
    sqlParams.push({
      key: props.setting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  if (props.setting.filterKey && props.setting.filterValue) {
    if (Array.isArray(props.setting.filterValue)) {
      sqlParams.push({
        key: `${props.setting.filterKey}`,
        type: 'in',
        value: props.setting.filterValue
      })
    } else {
      sqlParams.push({
        key: `${props.setting.filterKey}`,
        type: 'eq',
        value: `${props.setting.filterValue}`
      })
    }
  }
  if (props.setting.relatedField && caseInstanceId) {
    sqlParams.push({
      key: props.setting.relatedField,
      type: 'eq',
      value: caseInstanceId
    })
  }
  if (groupField) {
    if (groupField !== '-') {
      sqlParams.push({
        key: `${props.setting.groupField}`,
        type: 'eq',
        value: `${groupField}`
      })
    } else {
      sqlParams.push({
        key: `${props.setting.groupField}`,
        type: 'isNull'
      })
    }
  }
  dialogRef.value.handleOpen(sqlParams)
}
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
}
function handleCompute(value: number) {
  const prefix = props.setting.prefix || ''
  try {
    if (props.setting.displayMethod === 'count') {
      return prefix + FinancialComputing(value)

    } else if (props.setting.displayMethod === 'fileSize') {
      return prefix + fileSize(value)
    }
  } catch (error) {
    console.error(error)
    return prefix + value
  } 
  return prefix + value
}
defineExpose({ resize })
</script>

<style lang="scss" scoped>
.chartContainer {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: 1fr min-content;
  padding: 0 var(--app-space-s) var(--app-space-s);
  overflow: hidden;
}

.mainChartWrapper{
  flex: 1 0 auto;
  overflow: hidden;
  position: relative;
  height: 100%;;
}
</style>
