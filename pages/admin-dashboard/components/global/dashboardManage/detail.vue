<script lang="ts" setup>
import dayjs from 'dayjs'
import type { DashboardWidget, DashboardWidgetSetting } from '#imports'
import { dashboardWidgetSetting, getNormalizeSetting, getWidgetSetting } from '#imports'
import { newClientApi } from 'api'

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
  dates: [
    dayjs().startOf('year').format('YYYY-MM-DD'),
    dayjs(new Date()).format('YYYY-MM-DD')
  ]
})

function handleRefresh(layoutSetting: any) {
  const index = state.layout.findIndex((item) => item.i === layoutSetting.i)
  state.layout[index] = deepCopy(layoutSetting)
}

function handleAdd(command: DashboardWidget) {
  const item = getWidgetSetting(command)
  state.layout.push({
    x: (state.layout.length * 2) % 4,
    y: state.layout.length + 4, // puts it at the bottom
    i: new Date().valueOf().toString(),
    ...item
  })
}

function handleDelete(i: string) {
  const index = state.layout.findIndex((item) => item.i === i)
  state.layout.splice(index, 1)
}

async function handleSave() {
  try {
    state.saveLoading = true
    await newClientApi.putDsbUserDashboards({
      ...state.info,
      styleJson: JSON.stringify(state.layout)
    })
    routerProvider?.message.success(t('dpMsg_success'))
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
  state.info = await newClientApi.getDsbUserDashboardsId(id).then((res) => res.data)
  if (!state.info || !state.info.styleJson) return
  const temLayout = JSON.parse(state.info.styleJson)
  if (Array.isArray(temLayout)) {
    state.layout = temLayout.map((item) => {
      return Object.assign(item, getNormalizeSetting(item.component))
    })
  } else {
    // dashboard is new, set layout to empty array
    state.layout = []
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
        <Icon id="Dashboard__EditDashboardContent__Edit" name="material-symbols:edit-square"
              class="normal cursor-pointer" @click="handleEdit"></Icon>
      </div>
      <div>
        <el-dropdown id="Dashboard__EditDashboardContent__Add" trigger="click" @command="handleAdd">
          <el-button type="primary">
            {{ $t('common_add') }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <template v-for="(item, key) in dashboardWidgetSetting" :key="key">
                <!-- || item.feature === 'personal' -->
                <el-dropdown-item
                  v-if="(!item.feature || checkLicenseFeatures(item.feature)) && item.type !== 'personal'"
                  :command="key"
                  :divided="item.divided"
                >
                  {{ $t(`dashboard.${item.label}`) }}
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button id="Dashboard__EditDashboardContent__Save" class="el-icon--right" type="primary"
                   :loading="state.saveLoading" @click="handleSave"
        >{{ $t('common_save') }}
        </el-button>
      </div>
    </div>
    <div class="template-main-container">
      <DashboardDetail
        ref="DashboardDetailRef"
        v-model:layout="state.layout"
        :resizable="true"
        :draggable="true"
        :dates="state.dates"
        @delete="handleDelete"
        @refreshSetting="handleRefresh"
      ></DashboardDetail>
    </div>
    <DashboardDialog ref="DashboardDialogRef" @refresh="getInfo()" />
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
  color: #606266;
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
}
</style>
