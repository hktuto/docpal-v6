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
      <el-button type="primary" @click="handleShowAll">{{ $t('button.showAll') }}</el-button>
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
      radius: ['20%', '50%'],
      center: ['50%', '44%'],

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
    const sqlParams = [
      {
        key: 'created_date',
        type: 'gte',
        value: props.dates[0]
      },
      {
        key: 'created_date',
        type: 'lte',
        value: props.dates[1]
      },
      {
        type: 'select',
        value: `${chartSetting.sortBy},case_id`
      },
      {
        type: 'order',
        value: `${chartSetting.sortBy}.desc`
      },
      {
        type: 'limit',
        value: 5
      },
      {
        key: `${chartSetting.sortBy}`,
        type: 'neq',
        value: 0
      }
    ]
    if(chartSetting.groupLabel) {
      const selectedItemIndex = sqlParams.findIndex(item => item.type === 'select')
      if(selectedItemIndex !== -1) {
        sqlParams[selectedItemIndex].value += `,${chartSetting.groupLabel}`
      } else {
        sqlParams.push({
          key: 'select',
          type: 'select',
          value: `${chartSetting.sortBy},case_id,${chartSetting.groupLabel}`
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
    // if (chartSetting.filterKey && chartSetting.filterValue) {
    //   sqlParams.push({
    //     key: chartSetting.filterKey,
    //     type: 'in',
    //     value: chartSetting.filterValue
    //   })
    // }
    const sql = PostgREST_Decorate(sqlParams)
    const response = await clientApi.api.getPostgrestTable(`${chartSetting.tableName}?${sql}`)
    response.data.forEach((item) => {
      data.push({
        value: item[chartSetting.sortBy],
        name: item[chartSetting.groupLabel] || item.case_id,
        id: item.case_id
      })
    })
    return option
  },
  clickAction: (params: any) => {
    console.log(params)
    notiHandleView({ content: { caseInstanceId: params.data.id } }, tabProvider)
  }
})

const dialogRef = ref()
const groupDialogRef = ref()
function handleShowAll() {
  const sqlParams = [
    {
      key: 'created_date',
      type: 'gte',
      value: props.dates[0]
    },
    {
      key: 'created_date',
      type: 'lte',
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
