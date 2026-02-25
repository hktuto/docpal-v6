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
      <el-button :disabled="mode === 'mock'" type="primary" @click="handleShowAll">{{ $t('button.showAll') }}</el-button>
    </div>
    <CaseStatisticsTableDialog name="limitFieldNum" :setting="setting" :dates="dates" ref="dialogRef"> </CaseStatisticsTableDialog>
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :formJson="mergedJson"
      :title="title"
      :big="true"
      componentName="CaseLimitFieldNum"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { newClientApi, PostgREST_Decorate } from 'api'
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
const title = $t('dashboard.cmmnCaseLimitFieldNum')
const total = ref(0)
const tabProvider = inject(TabManagerKey)
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}
const option: any = {
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
      radius: ['20%', '50%'],
      center: ['50%', '30%'],
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: true
      },
      label: {
        show: true,
        formatter: (params) => {
          return `${params.value}`
        }
      },
      data: []
    }
  ]
}
const { cardRef, chartRef, settingRef, resize, handleInitCard, loading, setupOptions, formSlotHandleDisplayMethod } = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    const _option = setupOptions(option)
    if (!chartSetting.tableName) {
      return _option
    }
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
    if (props.mode === 'mock') return
    notiHandleView({ content: { caseInstanceId: params.data.id } }, tabProvider)
  }
})

const dialogRef = ref()
const groupDialogRef = ref()
function handleShowAll() {
  const sortBy = props.setting.sortBy || props.setting.countField || 'created_date'
  const sortOrder = props.setting.sortOrder || 'desc'
  const sqlParams = [
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
  if (props.setting.relatedField && caseInstanceId) {
    sqlParams.push({
      key: props.setting.relatedField,
      type: 'eq',
      value: caseInstanceId
    })
  }
  if (props.setting.filterList.length > 0) {
    props.setting.filterList.forEach((item) => {
      sqlParams.push({
        key: item.filterKey,
        type: 'in',
        value: item.filterValue
      })
    })
  }

  if (props.setting.currentUserField) {
    sqlParams.push({
      key: props.setting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  if (props.setting.groupField) {
    groupDialogRef.value.handleOpen(sqlParams)
  } else {
    dialogRef.value.handleOpen(sqlParams)
  }
}
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
}
async function getData(chartSetting: any) {
  if (props.mode === 'mock') {
    return [
      {
        value: 1888.88,
        name: 'Mock Data',
        id: 'mock-data'
      },
      {
        value: 18888.88,
        name: 'Mock Data 2',
        id: 'mock-data-2'
      },
      {
        value: 188888.88,
        name: 'Mock Data 3',
        id: 'mock-data-3'
      },
      {
        value: 188888.88,
        name: 'Mock Data 4',
        id: 'mock-data-4'
      },
      {
        value: 188888.88,
        name: 'Mock Data 5',
        id: 'mock-data-5'
      }
    ]
  }
  const sqlParams = [
    {
      key: chartSetting.dateField || 'created_date',
      type: 'gte',
      value: props.dates[0]
    },
    {
      key: chartSetting.dateField || 'created_date',
      type: 'lte',
      value: props.dates[1]
    },
    {
      type: 'select',
      value: `${chartSetting.countField},case_id`
    },
    {
      type: 'order',
      value: `${chartSetting.countField}.desc`
    },
    {
      type: 'limit',
      value: 5
    },
    {
      key: `${chartSetting.countField}`,
      type: 'neq',
      value: 0
    }
  ]
  if (chartSetting.groupLabel) {
    const selectedItemIndex = sqlParams.findIndex((item) => item.type === 'select')
    if (selectedItemIndex !== -1) {
      sqlParams[selectedItemIndex].value += `,${chartSetting.groupLabel}`
    } else {
      sqlParams.push({
        key: 'select',
        type: 'select',
        value: `${chartSetting.countField},case_id,${chartSetting.groupLabel}`
      })
    }
  }
  if (chartSetting.currentUserField) {
    sqlParams.push({
      key: chartSetting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  if (chartSetting.relatedField && caseInstanceId) {
    sqlParams.push({
      key: chartSetting.relatedField,
      type: 'eq',
      value: caseInstanceId
    })
  }
  if (chartSetting.filterList.length > 0) {
    chartSetting.filterList.forEach((item) => {
      sqlParams.push({
        key: item.filterKey,
        type: 'in',
        value: item.filterValue
      })
    })
  }
  const data = []
  const sql = PostgREST_Decorate(sqlParams)
  const response: any = await newClientApi.getPostgrestTable(`${chartSetting.tableName}?${sql}`)
  response.data.forEach((item) => {
    data.push({
      value: item[chartSetting.countField],
      name: item[chartSetting.groupLabel] || item.case_id,
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
