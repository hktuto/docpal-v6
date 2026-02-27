<template>
  <DashboardCard
    v-loading="loading"
    ref="cardRef"
    :title="setting.title"
    :hideSetting="hideSetting"
    :setting="setting"
    :settingRef="settingRef"
    :mode="mode"
    @delete="handleDelete"
    @refresh="handleInitCard"
  >
    <div class="chartContainer">
      <div class="mainChartWrapper">
        <div id="myEcharts" ref="chartRef" class="echart"></div>
      </div>
      <el-button :disabled="mode === 'mock'" type="primary" @click="handleShowAll()">{{ $t('button.showAll') }}</el-button>
    </div>
    <CaseStatisticsTableDialog name="limitGroupFieldNum" :setting="setting" :dates="dates" ref="dialogRef"> </CaseStatisticsTableDialog>
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :formJson="mergedJson"
      :title="title"
      :big="true"
      componentName="CaseLimitGroupFieldNum"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { clientApi, PostgREST_Decorate } from 'api'
import formJson from '../setting.vform.json'
import styleJson from './setting.style.vform.json'
import setupJson from './setting.setup.vform.json'
import { mergeSetting } from '../settingMergeHelper'
const mergedJson = mergeSetting(formJson, setupJson, styleJson, { addFilterArray: true, addLegend: true })
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
const {
  cardRef,
  chartRef,
  settingRef,
  resize,
  handleInitCard,
  loading,
  setupOptions,
  setSqlParamsByFilterList,
  setRpcParamsByFilterList,
  formSlotHandleDisplayMethod
} = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return option
    }
    const _option = setupOptions(option)
    _option.series[0].label.formatter = (params) => {
      return handleCompute(params.value)
    }
    _option.tooltip.valueFormatter = (value) => {
      return handleCompute(value)
    }
    _option.series[0].radius = [
      chartSetting.innerRingProportion ? chartSetting.innerRingProportion + '%' : '30%',
      chartSetting.outerRingProportion ? chartSetting.outerRingProportion + '%' : '60%'
    ]
    _option.series[0].data = await getData(chartSetting)
    console.log(_option)
    return _option
  },
  clickAction: (params: any) => {
    console.log(params)
    if (props.mode === 'mock') return
    handleShowAll(params.name)
  }
})

const dialogRef = ref()
const groupDialogRef = ref()
function handleShowAll(groupField: string = '') {
  const sortBy = props.setting.sortBy || props.setting.countField || 'created_date'
  const sortOrder = props.setting.sortOrder || 'desc'
  const sqlParams: any[] = [
    {
      key: props.setting.dateField || 'created_date',
      type: 'gte',
      value: props.dates[0]
    },
    {
      key: props.setting.dateField || 'created_date',
      type: 'lte',
      value: props.dates[1]
    },
    // {
    //   type: 'select',
    //   value: `${chartSetting.filterKey}.count()`
    // },
    {
      type: 'order',
      value: `${sortBy}.${sortOrder}`
    }
  ]
  if (props.setting.currentUserField) {
    sqlParams.push({
      key: props.setting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  setSqlParamsByFilterList(props.setting.filterList, sqlParams)

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
async function getData(chartSetting: any) {
  if (props.mode === 'mock') {
    const data = []
    for (let i = 0; i < 5; i++) {
      const value = Math.floor(Math.random() * 1000) + 88.88
      data.push({
        value,
        name: `Mock Data ${i + 1}`,
        id: `mock-data-${i + 1}`
      })
    }
    return data
  }
  const rpcParams = {
    _table_name: chartSetting.tableName,
    _date_column: chartSetting.dateField || 'created_date',
    _top_n: 5,
    _group_column: chartSetting.groupField,
    _tcv_column: chartSetting.countField,
    _start_date: props.dates[0],
    _end_date: props.dates[1],
    _filters: {}
  }
  setRpcParamsByFilterList(chartSetting.filterList, rpcParams._filters)
  if (chartSetting.relatedField && caseInstanceId) {
    rpcParams._filters[chartSetting.relatedField] = caseInstanceId
  }
  if (chartSetting.currentUserField) {
    rpcParams._filters[chartSetting.currentUserField] = userId
  }
  if (Object.keys(rpcParams._filters).length === 0) {
    delete rpcParams._filters
  }
  const data = []
  const response: any = await clientApi.api.postPostgrestRpcFunc('top_group_column_with_total', rpcParams)
  response.data.forEach((item) => {
    data.push({
      value: item.total_tcv,
      name: !item.group_value ? '-' : item.group_value,
      id: item.case_id
    })
  })
  return data
}
function handleCompute(value: number) {
  return formSlotHandleDisplayMethod(
    {
      displayMethod: props.setting.displayMethod,
      prefix: props.setting.prefix
    },
    value
  )
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

.mainChartWrapper {
  flex: 1 0 auto;
  overflow: hidden;
  position: relative;
  height: 100%;
}
</style>
