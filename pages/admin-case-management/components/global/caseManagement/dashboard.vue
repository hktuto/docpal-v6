<template>
  <div class="pageContainer">
    <div class="dashboard-page">
      <div class="dashboard-page--header">
        <el-button type="danger" @click="handleClear">
          {{ $t('common_clear') }}
        </el-button>
        <el-button
          id="CaseManagement__Detail__CaseDashboardView__ViewLayout__Save"
          class="el-icon--right"
          type="primary"
          :loading="state.saveLoading"
          @click="handleSave"
        >
          {{ $t('common_save') }}
        </el-button>
      </div>
      <div class="dashboard-page--main">
        <!-- {{ CmmnDashboardWidgetSetting }} -->
        <DashboardDetail
          ref="DashboardDetailRef"
          v-model:layout="state.layout"
          :dates="state.dates"
          :componentMap="CmmnWidgetComponent"
          :resizable="true"
          :draggable="true"
          :editMode="true"
          :dashboardSettingList="dashboardWidgetByType"
          type="caseManagement"
          @delete="handleDelete"
          @refreshSetting="handleRefresh"
        ></DashboardDetail>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import dayjs from 'dayjs'

const { t } = useI18n()
const props = defineProps<{
  id: string
  caseTypeId: string
  name: string
}>()
const { caseTypeId, name } = toRefs(props)
const routerProvider = inject(MenuRouterKey)
const state = reactive({
  info: {
    name: ''
  } as any,
  layout: [] as DashboardWidgetSetting[],
  saveLoading: false,
  detail: {},
  dates: [dayjs().startOf('year').format('YYYY-MM-DDT00:00:00'), formatDate(new Date(), 'YYYY-MM-DDT23:59:59')]
})
let dashboardWidgetByType = getDashboardWidgetByType(CmmnDashboardWidgetSetting)

function createDashboard(command: CmmnDashboardWidget) {
  const item = getCmmnWidgetSetting(command)
  state.layout.push({
    x: (state.layout.length * 2) % 4,
    y: state.layout.length + 4, // puts it at the bottom
    i: new Date().valueOf().toString(),
    ...item
  })
}

function handleRefresh(layoutSetting: any) {
  console.log('handleRefresh', layoutSetting)
  const index = state.layout.findIndex((item) => item.i === layoutSetting.i)
  state.layout[index] = deepCopy(layoutSetting)
}

function handleDelete(i) {
  const index = state.layout.findIndex((item) => item.i === i)
  state.layout.splice(index, 1)
}

function handleClear() {
  state.layout = []
  handleSave()
}

async function handleSave() {
  try {
    state.saveLoading = true
    await newAdminApi.postCaseDashboardSaveStyle({
      id: props.id,
      styleJson: JSON.stringify(state.layout)
    }).then((r) => r.data)
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    state.saveLoading = false
  }
}

const versionId = ref()

async function init() {
  try {
    const data = await newAdminApi.getCaseDashboardId(props.id).then((r) => r.data)
    versionId.value = data.cmmnVersionId
    state.detail = data
    name.value = data.label
    routerProvider?.updateTabName(data.label)
    const temLayout = JSON.parse(data.styleJson)
    if (Array.isArray(temLayout)) {
      state.layout = temLayout.map((item) => {
        return Object.assign(item, getCmmnNormalizeSetting(item.component))
      })
    } else {
      state.layout = []
    }
  } catch {
    state.layout = []
  }
}

onMounted(() => {
  init()
})

provide(CaseManagementDashboardKey, {
  caseTypeId,
  versionId,
  name
})
</script>
<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dashboard-page {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  padding: var(--app-space-xs);
  gap: var(--app-space-xs);

  &--header {
    text-align: right;
  }

  &--main {
    overflow: auto;
  }
}

:deep(.responsive-container) {
  margin-bottom: 10px;
}
</style>
