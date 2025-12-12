<template>
  <DashboardCard
    v-loading="loading"
    ref="cardRef"
    :hideSetting="hideSetting"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="handleInitCard"
  >
    <div class="quantity-container" @click="handleDrillDown">
      <div class="quantity-title">{{ setting.title }}</div>
      <div :style="`--preset-color: ${setting.barColor ? setting.barColor : 'var(--app-primary-color)'}`" class="quantity-total">
        {{ handleCompute(total) }}
      </div>
    </div>
    <!-- <div id="myEcharts" ref="chartRef" class="echart"></div> -->
    <CaseStatisticsTableDialog :setting="setting" :dates="dates" ref="dialogRef" />
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :title="title"
      :big="true"
      :formJson="mergedJson"
      componentName="CaseFieldNum"
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

const mergedJson = mergeSetting(formJson, setupJson, styleJson, {})
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
    type?: string
    mode?: string
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
const title = $t('dashboard.cmmnCaseFieldNum')
const total = ref(0)
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}
const { cardRef, settingRef, resize, handleInitCard, loading, formSlotHandleDisplayMethod } = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return {
        total: 0
      }
    }
    if (props.mode === 'mock') {
      total.value = 18
      return {
        total: total.value
      }
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
        value: `${chartSetting.filterKey}.count()`
      },
      {
        key: `${chartSetting.filterKey}`,
        type: 'eq',
        value: `${chartSetting.filterValue}`
      }
    ]
    if (chartSetting.relatedField && caseInstanceId) {
      sqlParams.push({
        key: chartSetting.relatedField,
        type: 'eq',
        value: caseInstanceId
      })
    }
    if (chartSetting.currentUserField) {
      sqlParams.push({
        key: chartSetting.currentUserField,
        type: 'eq',
        value: userId
      })
    }
    const sql = PostgREST_Decorate(sqlParams)
    const response = await clientApi.api.getPostgrestTable(`${chartSetting.tableName}?${sql}`)
    const data = response.data[0]
    total.value = data.count
    return {
      total: total.value
    }
  }
})

const dialogRef = ref()
function handleDrillDown() {
  const sortBy = props.setting.sortBy || 'created_date'
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
      key: `${props.setting.filterKey}`,
      type: 'eq',
      value: `${props.setting.filterValue}`
    },
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
  if (props.setting.currentUserField) {
    sqlParams.push({
      key: props.setting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  dialogRef.value.handleOpen(sqlParams)
}
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
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
.quantity-container {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  // height: 100%;
  padding-bottom: 2rem;
  --title-font-size: var(--app-font-size-l);
  --total-font-size: var(--app-font-size-xl);
  .quantity-title {
    font-size: var(--title-font-size);
    font-weight: bold;
  }
  .quantity-total {
    padding-top: var(--app-space-xs);
    font-size: var(--total-font-size);
    font-weight: bolder;
    color: var(--preset-color);
  }
  @container (max-width: 320px ) {
    --title-font-size: var(--app-font-size-l);
    --total-font-size: var(--app-font-size-xl);
  }
  @container (min-width: 320px) and (max-width: 640px) {
    --title-font-size: calc(var(--app-font-size-l) * 1.5);
    --total-font-size: calc(var(--app-font-size-xl) * 1.5);
  }
  @container (min-width: 640px) and (max-width: 1024px) {
    --title-font-size: calc(var(--app-font-size-l) * 2);
    --total-font-size: calc(var(--app-font-size-xl) * 2);
  }
  @container (min-width: 1024px) and (min-height: 300px) {
    --title-font-size: calc(var(--app-font-size-l) * 2.5);
    --total-font-size: calc(var(--app-font-size-xl) * 2.5);
  }
}
</style>
