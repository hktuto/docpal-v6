<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { DashboardWidgetSetting } from '../../../../../packages/dp-dashboard/utils/dashboardWidgetHelper'
import { CmmnWidgetComponent } from '../../../../../packages/dp-cmmn-x6/utils/dashboardHelper'
import { onMounted } from 'vue'
import { newClientApi } from 'api'
import { MenuRouterKey } from '#imports'
import dayjs from 'dayjs'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  instanceId: string
  versionId: string
}>()
const { instanceId, versionId } = toRefs(props)
const caseTypeId = ref('')
const caseDefinitionKey = ref('')
const state = reactive<any>({
  loading: false,
  layout: [] as DashboardWidgetSetting[],
  dashboardList: [],
  selectedDashboard: {},
  time: 3,
  dates: [dayjs().startOf('year').format('YYYY-MM-DDT00:00:00'), formatDate(new Date(), 'YYYY-MM-DDT23:59:59')]
})
const { t } = useI18n()
const showDateWidget = computed(() => {
  return state.layout.some((item) => item && item.setting && 'dateField' in item.setting)
})
async function getDashboardList() {
  try {
    state.dashboardList = await newClientApi.getCaseDashboardVersionCmmnversionidPermission(versionId.value).then((res) => res.data)
    const dashboardId = sessionStorage.getItem('case-dashboard-id')
    let index = state.dashboardList.findIndex((item) => item.id === dashboardId)
    if (!index || index < 0) index = 0
    await getLayout(state.dashboardList[index].id, state.dashboardList[index])
  } catch (error) {
    console.log('error', error)
    ElMessage({
      message: `${t('caseManagement.dashboardNotSet')}`,
      onClose: () => goBack()
    })
  }
}

function goBack() {
  // TODO: add fallback to case list
  routerProvider?.back()
}

async function getLayout(layoutId: string, row: any) {
  // layoutId = '4ddd2f48-f1b3-4659-88c7-42f515bf7ee4' // company
  // layoutId = '30bda628-a371-44dd-bd79-996aa6c54993' // case
  caseTypeId.value = row.caseTypeId
  caseDefinitionKey.value = row.caseDefinitionKey

  try {
    state.loading = true
    state.selectedDashboard = row
    if (row.layout) {
      state.layout = row.layout
      return
    }
    sessionStorage.setItem('case-dashboard-id', layoutId)
    const detail = await newClientApi.getCaseDashboardId(layoutId).then((res) => res.data)
    if (!detail?.styleJson) throw new Error('')
    state.layout = JSON.parse(detail?.styleJson)
    row.layout = state.layout
  } catch (error) {
    console.log('error', error)
    state.layout = []
    row.layout = []
  } finally {
    setTimeout(() => {
      state.loading = false
    }, 200)
  }
}
const exportLoading = ref(false)
async function handleExportPdf() {
  try {
    exportLoading.value = true
    await divToPDF('CaseDashboard__Main', state.selectedDashboard.label)
  } catch (error) {
    console.error('Export PDF error:', error)
    ElMessage.error(t('dpTip.exportPDFFailed'))
  } finally {
    exportLoading.value = false
  }
}
provide(CaseManagementDashboardKey, {
  instanceId: instanceId,
  caseTypeId,
  caseDefinitionKey,
  versionId
})
onMounted(() => {
  getDashboardList()
})
</script>
<template>
  <div class="pageContainer--padding case-dashboard">
    <div class="case-dashboard-header">
      <div style="display: flex; align-items: center; gap: var(--app-space-s)">
        <el-dropdown trigger="click">
          <span class="el-dropdown-link">
            <div class="ellipsis">{{ state.selectedDashboard.label }}</div>
            <el-icon class="el-icon--right" v-if="state.dashboardList.length > 1">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu v-if="state.dashboardList.length > 1">
              <el-dropdown-item
                v-for="item in state.dashboardList"
                :command="item.id"
                :disabled="item.id === state.selectedDashboard.id"
                @click="getLayout(item.id, item)"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <DashboardDate v-if="showDateWidget" v-model="state.dates" />
      </div>
      <!-- TODO : comment now, wait Sales and Marketing to confirm -->
      <!-- <el-button :loading="exportLoading" type="primary" @click="handleExportPdf">{{ $t('dpTool_downloadPDF') }}</el-button> -->
    </div>
    <div class="case-dashboard-main" v-loading="state.loading">
      <DashboardDetail
        v-if="!state.loading"
        id="CaseDashboard__Main"
        ref="DashboardDetailRef"
        v-model:layout="state.layout"
        :dates="state.dates"
        :componentMap="CmmnWidgetComponent"
        :hideSetting="true"
        :resizable="false"
        :draggable="false"
        @refresh="getDashboardList"
      ></DashboardDetail>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.case-dashboard {
  display: grid;
  grid-template-rows: min-content 1fr;

  &-main {
    overflow: auto;
  }
}
:deep(.el-dropdown-link) {
  display: flex;
  padding-bottom: var(--app-space-xs);
  font-size: var(--app-font-size-l);
  font-weight: bold;
}
.case-dashboard-main {
  :deep(.el-card) {
    height: 100%;
    overflow: auto;
  }
}
.case-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
