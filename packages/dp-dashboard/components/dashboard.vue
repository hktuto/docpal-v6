<template>
  <div class="template-container">
    <template v-if="!currentHome"> loading... </template>
    <template v-else>
      <div class="template-container--header">
        <span class="template-container--header__title">
          <DashboardDate class="el-icon--right" v-model="state.dates" />
        </span>
        <div class="template-container--header__buttons">
          <template v-if="!state.editMode">
            <el-button :loading="exportLoading" type="primary" @click="handleExportPdf">{{ $t('dpTool_downloadPDF') }}</el-button>
            <el-button v-if="currentHome.name === 'PERSONAL'" id="Dashboard__Home__Edit" @click="handleEdit" type="primary" :icon="Edit" circle />
          </template>
          <template v-else-if="state.editMode">
            <el-button v-if="currentHome.layout.length > 0" type="danger" @click="handleClear">{{ $t('common_clear') }}</el-button>
            <el-button id="Dashboard__Home__Finish" class="el-icon--right" type="primary" @click="handleFinish">
              {{ $t('dpButtom_finish') }}
            </el-button>
          </template>
        </div>
      </div>
      <DashboardDetail
        class="template-container--main"
        id="Dashboard__Home__Main"
        v-if="currentHome && currentHome.layout"
        ref="DashboardDetailRef"
        v-model:layout="currentHome.layout"
        :dates="state.dates"
        :hideSetting="!state.editMode"
        :resizable="state.editMode"
        :draggable="state.editMode"
        :editMode="state.editMode"
        :dashboardSettingList="dashboardWidgetByType"
        @add="handleAdd"
        @save="handleSave"
        @delete="handleDelete"
        @refreshSetting="handleRefresh"
      ></DashboardDetail>
    </template>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Edit } from '@element-plus/icons-vue'

import { clientApi } from 'api'

import { useDashboardWidgetSetting, getWidgetSetting, getDashboardWidgetByType } from '../composables/useDashborad'

import { onMounted, onUnmounted } from 'vue'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { currentHome, loading, getHomeList } = useHomePage()
const dashboardWidgetSetting = useDashboardWidgetSetting()
let dashboardWidgetByType = getDashboardWidgetByType(dashboardWidgetSetting.value)
const state = reactive<any>({
  editMode: false,
  loading: false,
  dates: [dayjs().startOf('year').format('YYYY-MM-DDT00:00:00'), formatDate(new Date(), 'YYYY-MM-DDT23:59:59')],
  editCount: 0
})

function handleAdd(data: any) {
  if (!currentHome.value.layout) currentHome.value.layout = []
  currentHome.value.layout.push({
    ...data,
    i: new Date().valueOf().toString()
  })
}

function handleEdit() {
  state.editMode = true
  state.editCount = 0
  DashboardDetailRef.value.handleResize()
}

function handleRefresh(layoutSetting: any, id: any) {
  state.editCount++
  const index = currentHome.value.layout.findIndex((item) => item.i === layoutSetting.i)
  currentHome.value.layout[index] = deepCopy(layoutSetting)
}

function handleDelete(i: any) {
  state.editCount++
  const index = currentHome.value.layout.findIndex((item) => item.i === i)
  currentHome.value.layout.splice(index, 1)
}

function handleFinish() {
  state.editMode = false
  DashboardDetailRef.value.handleResize()
  handleSave()
}

async function handleSave() {
  try {
    loading.value = true
    await clientApi.api.putDocpalPersonalLandingSave({
      styleJson: JSON.stringify(currentHome.value.layout)
    })
  } catch (error) {
    console.log('error', error)
  } finally {
    loading.value = false
  }
}

async function handleClear() {
  try {
    const action = await ElMessageBox.confirm(t('tip_cleanMsg', { name: currentHome.value.name }))
    if (action !== 'confirm') return
    currentHome.value.layout = []
    handleSave()
  } catch (error) {
    console.log('error', error)
  } finally {
  }
}
const DashboardDetailRef = ref()
const exportLoading = ref(false)
async function handleExportPdf() {
  try {
    exportLoading.value = true
    await divToPDF('Dashboard__Home__Main', currentHome.value.name)
  } catch (error) {
    console.error('Export PDF error:', error)
    ElMessage.error(t('dpTip.exportPDFFailed'))
  } finally {
    exportLoading.value = false
  }
}
onMounted(async () => {
  routerProvider?.refeshActions.value.push({
    fn: getHomeList,
    params: [true]
  })
})
</script>

<style lang="scss" scoped>
.template-container {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  overflow-y: hidden !important;
  height: 100%;

  &--main {
    overflow: auto;
  }

  :deep(.splitpanes__pane) {
    box-shadow: unset !important;
  }

  &--header {
    padding: var(--app-space-s);
    text-align: left;
    line-height: 30px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-s);
    &__title {
      // height: 100%;
      line-height: 30px;

      title {
        display: flex;
        align-items: center;
        text-align: left;
      }

      svg {
        width: 1rem;
        height: 1rem;
      }
    }
  }
}

.el-dropdown-link {
  cursor: pointer;
  font-size: 1.2rem;
}
.template-container--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  flex-flow: row wrap;
  gap: var(--app-space-s);
}
</style>
