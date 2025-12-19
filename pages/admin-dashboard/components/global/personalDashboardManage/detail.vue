<script lang="ts" setup>
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DashboardWidgetSetting, DashboardWidget } from '#imports'
import { dashboardWidgetSetting, getNormalizeSetting, getWidgetSetting, getDashboardWidgetByType } from '#imports'
import { adminApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { id } = defineProps<{
  id: number
}>()
const { t } = useI18n()
const state = reactive({
  info: {
    name: ''
  } as any,
  layout: [] as DashboardWidgetSetting[],
  loading: false,
  saveLoading: false,
  dates: [dayjs().startOf('year').format('YYYY-MM-DDT00:00:00'), dayjs(new Date()).format('YYYY-MM-DDT23:59:59')]
})
let dashboardWidgetByType = getDashboardWidgetByType(dashboardWidgetSetting)
function handleRefresh(layoutSetting: any) {
  const index = state.layout.findIndex((item) => item.i === layoutSetting.i)
  state.layout[index] = deepCopy(layoutSetting)
  handleSave()
}

function handleAdd(data: any) {
  state.layout.push({
    x: (state.layout.length * 2) % 4,
    y: state.layout.length + 4, // puts it at the bottom
    i: new Date().valueOf().toString(),
    ...data
  })
  handleSave()
}

function handleDelete(i: string) {
  const index = state.layout.findIndex((item) => item.i === i)
  state.layout.splice(index, 1)
  handleSave()
}
async function handleClear() {
  try {
    const action = await ElMessageBox.confirm(t('tip_cleanMsg', { name: state.info.name }))
    if (action !== 'confirm') return
    state.layout = []
    handleSave()
  } catch (error) {
    console.log('error', error)
  } finally {
  }
}
async function handleSave() {
  try {
    state.saveLoading = true
    await adminApi.api.putPersonalDashboardUpdate({
      ...state.info,
      styleJson: JSON.stringify(state.layout)
    })
    // routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    state.saveLoading = false
  }
}

const DashboardDialogRef = ref()

function handleEdit() {
  DashboardDialogRef.value.handleOpen(state.info)
}

async function getInfo() {
  state.info = await adminApi.api.getPersonalDashboardId(id).then((res) => res.data)
  if (!state.info || !state.info.styleJson) {
    return
  }
  const temLayout = JSON.parse(state.info.styleJson)
  if (Array.isArray(temLayout)) {
    state.layout = temLayout.map((item) => {
      return Object.assign(item, getNormalizeSetting(item.component))
    })
    handleDataMigration()
  } else {
    // dashboard is new, set layout to empty array
    state.layout = []
  }
}
function handleDataMigration() {
  state.layout.forEach((item) => {
    if (item.type !== 'caseCount') return
    if (!item.setting.dataSource) {
      item.setting.dataSource = ['case', item.setting.caseId]
    }
    if (!item.setting.drilldownTitle) {
      item.setting.drilldownTitle = item.setting.dialogSettingTitle
    }
    switch (item.component) {
      case 'CaseLimitFieldNum':
        countField(item)
        break
      case 'CaseLimitGroupFieldNum':
        countField(item)
        filterList(item)
        break
      case 'CaseMonthlyAverage':
        filterList(item)
        if (!item.setting.barYAxisTitle) item.setting.barYAxisTitle = item.setting.barLabel || item.setting.barTitle
        if (!item.setting.barLegendTitle) item.setting.barLegendTitle = item.setting.barTitle
        if (!item.setting.barColor) item.setting.barColor = item.setting.numColor
        if (!item.setting.barDisplayMethod) item.setting.barDisplayMethod = item.setting.numDisplayMethod
        if (!item.setting.barChartSuffix) item.setting.barChartSuffix = item.setting.barChartSuffix
        if (!item.setting.lineYAxisTitle) item.setting.lineYAxisTitle = item.setting.averageTitle
        if (!item.setting.lineDataField) item.setting.lineDataField = item.setting.averageField
        if (!item.setting.lineLegendTitle) item.setting.lineLegendTitle = item.setting.averageTitle
        if (!item.setting.lineColor) item.setting.lineColor = item.setting.averageColor
        if (!item.setting.lineDisplayMethod) item.setting.lineDisplayMethod = item.setting.averageDisplayMethod
        if (!item.setting.lineChartSuffix) item.setting.lineChartSuffix = item.setting.averageUnit
        break
      case 'CaseFieldTotal':
        if (!item.setting.countField) item.setting.countField = item.setting.filterKey
        if (!item.setting.filterList && item.setting.additionalFilterKey) {
          item.setting.filterList = [
            {
              filterKey: item.setting.additionalFilterKey,
              filterValue: Array.isArray(item.setting.additionalFilterValue) ? item.setting.additionalFilterValue : [item.setting.additionalFilterValue]
            }
          ]
        }
        break
      default:
        break
    }
  })
  function countField(dataItem: any) {
    if (!dataItem.setting.countField) {
      dataItem.setting.countField = dataItem.setting.sortBy
    }
  }
  function filterList(dataItem: any) {
    if (!dataItem.setting.filterList && dataItem.setting.filterKey) {
      dataItem.setting.filterList = [
        {
          filterKey: dataItem.setting.filterKey,
          filterValue: Array.isArray(dataItem.setting.filterValue) ? dataItem.setting.filterValue : [dataItem.setting.filterValue]
        }
      ]
    }
  }
}
onMounted(() => {
  getInfo()
})
</script>
<template>
  <div class="pageContainer--padding template-container">
    <div class="flex-x-between">
      <div class="flex-x-between">
        <span class="template-title"> {{ state.info.name }} </span>
        <Icon id="WorkPanel__Detail__Edit" name="material-symbols:edit-square" class="normal cursor-pointer" @click="handleEdit"></Icon>
      </div>
      <el-button v-if="state.layout.length > 0" type="danger" size="small" @click="handleClear">{{ $t('common_clear') }}</el-button>
    </div>
    <div class="template-main-container">
      <DashboardDetail
        ref="DashboardDetailRef"
        v-model:layout="state.layout"
        :resizable="true"
        :draggable="true"
        :dates="state.dates"
        :dashboardSettingList="dashboardWidgetByType"
        :editMode="true"
        @add="handleAdd"
        @save="handleSave"
        @delete="handleDelete"
        @refreshSetting="handleRefresh"
      ></DashboardDetail>
    </div>
    <PersonalDashboardDialog ref="DashboardDialogRef" @refresh="getInfo()" />
  </div>
</template>
<style lang="scss" scoped>
.template-container {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  overflow: hidden;
}

.template-main-container {
  overflow: auto;

  > div {
    min-width: 1280px;
  }
}

.template-interact-drawer {
  height: 100%;
  overflow: hidden;
  box-shadow: unset;
  border-left: 1px solid #ddd;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);
  padding-bottom: 0;

  .formContainer {
    overflow: auto;
  }
}

.template-title {
  font-size: var(--app-font-size-l);
  font-weight: bold;
  line-height: 1.2;
  letter-spacing: 0px;
  color: var(--app-grey-300);
  padding-left: var(--app-space-xs);
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
}
</style>
