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
      <div class="quantity-total">{{ setting.prefix }}{{ handleCompute(total) }}</div>
    </div>
    <!-- <div id="myEcharts" ref="chartRef" class="echart"></div> -->
    <CaseStatisticsTableDialog :setting="setting" :dates="dates" ref="dialogRef" />
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :after-open="handleAfterOpen"
      :title="title"
      :formJson="formJson"
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
const title = $t('dashboard.cmmnCaseFieldTotal')
const total = ref(0)
const emits = defineEmits(['refreshSetting', 'delete'])
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleDelete() {
  emits('delete')
}

const { cardRef, settingRef, resize, handleInitCard, loading } = useDashboardCard({
  props,

  getOptions: async (chartSetting) => {
    if (!chartSetting.tableName) {
      return {
        total: 0
      }
    }
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
        value: `${chartSetting.filterKey}.sum()`
      }
    ]
    if (chartSetting.relatedField && caseInstanceId) {
      sqlParams.push({
        key: chartSetting.relatedField,
        type: 'eq',
        value: caseInstanceId
      })
    }
    if(chartSetting.additionalFilterKey && chartSetting.additionalFilterValue){
      sqlParams.push({
        key: chartSetting.additionalFilterKey,
        type: 'eq',
        value: chartSetting.additionalFilterValue
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
    total.value = response.data[0].sum
    return {
      total: total.value
    }
  }
})

const dialogRef = ref()
function handleDrillDown() {
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
      type: 'order',
      value: `${props.setting.filterKey}.desc`
    }
  ]
  if (props.setting.currentUserField) {
    sqlParams.push({
      key: props.setting.currentUserField,
      type: 'eq',
      value: userId
    })
  }
  if(props.setting.additionalFilterKey && props.setting.additionalFilterValue){
    sqlParams.push({
      key: props.setting.additionalFilterKey,
      type: 'eq',
      value: props.setting.additionalFilterValue
    })
  }
  if (props.setting.relatedField && caseInstanceId) {
    sqlParams.push({
      key: props.setting.relatedField,
      type: 'eq',
      value: caseInstanceId
    })
  }
  dialogRef.value.handleOpen(sqlParams)
}
function handleCompute(value: number) {
  try {
    if (props.setting.displayMethod === 'FinancialComputing') {
      return FinancialComputing(value)
    } else if (props.setting.displayMethod === 'fileSize') {
      return fileSize(value)
    }
  } catch (error) {
    return value
  }
  return value
}
function handleAfterOpen(formRendererRef: any) {
  if (props.type === 'caseManagement') {
    displaySettingFields(['relatedField'], formRendererRef)
  }
}
defineExpose({ resize })
</script>

<style lang="scss" scoped>
.quantity-container {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  height: 100%;
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
    color: var(--app-primary-color);
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
  @container (min-width: 1024px) and (min-height: 300px){
    --title-font-size: calc(var(--app-font-size-l) * 2.5);
    --total-font-size: calc(var(--app-font-size-xl) * 2.5);
  }
}
</style>
