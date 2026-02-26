<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('dashboard.cmmnProcess')"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div class="card-main">
      <el-card class="process-item" v-for="item in state.layout">
        <div class="title">
          <SvgIcon :style="`--icon-color: ${getIconColor(item.state)}`"
                   :src="`/icons/status/${getIcon(item.state)}.svg`"></SvgIcon>
          {{ item.name }}
        </div>
        <el-progress :percentage="getPercent(item)" />
        <el-divider />
        <div>
          <div class="process-item--sub" v-for="sItem in item.subItems">
            <SvgIcon :style="`--icon-color: ${getIconColor(sItem.state)}`"
                     :src="`/icons/status/${getIcon(sItem.state)}.svg`"></SvgIcon>
            {{ sItem.name }}
          </div>
        </div>
      </el-card>
    </div>
    <DashboardProcessSetting ref="settingRef" :allList="state.allList" @delete="handleDelete"
                             @refresh="handleRefresh" />
  </DashboardCard>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const emits = defineEmits(['refreshSetting', 'delete'])
const state = reactive<any>({
  allList: [],
  layout: []
})

function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}

// #endregion

function getIcon(state: any) {
  switch (state) {
    case 'active':
      return 'pendding'
    case 'completed':
      return 'finish'
    default:
      return 'pendding'
  }
}

function getIconColor(state: any) {
  switch (state) {
    case 'completed':
      return '#266CD6'
    default:
      return '#000'
  }
}

function getPercent(process: any) {
  if (process.subItems && process.subItems.length > 0) {
    let finish = 0,
      total = 0
    process.subItems.forEach((element: any) => {
      if (element.state === 'completed') finish++
      total++
    })
    return ((finish / total) * 100).toFixed(0)
  } else {
    return process.state === 'completed' ? 100 : 0
  }
}

const CMDProvider = inject(CaseManagementDashboardKey)

async function getCDProcess() {
  try {
    if (state.allList.length > 0) return state.allList
    const id = CMDProvider?.instanceId?.value || null
    const versionId = CMDProvider?.versionId?.value || null
    if (id) {
      state.allList = await newClientApi.getCaseDashboardInstanceCaseidStages(id).then(r => r.data)
    } else if (versionId) {
      state.allList = await newClientApi.getCaseDashboardVersionVersionidStages(versionId).then(r => r.data)
    }
  } catch (error) {
    state.allList = []
  } finally {
    console.log(state.allList)
    return state.allList
  }
}

const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleInitCardAction: async (setting: any) => {
    const list = await getCDProcess()
    state.layout = setting.layout.reduce((prev: any, item: any) => {
      const _item = list.find((d: any) => d.planItemDefinitionId === item.planItemDefinitionId)
      if (_item) {
        _item.state = _item.state ? _item.state : 'NULL'
        prev.push(_item)
      }
      return prev
    }, [])
  }
})
</script>
<style lang="scss" scoped>
.card-main {
  display: flex;
  gap: var(--app-space-xs);
  flex-wrap: warp;
  --icon-size: 18px;
}

.process-item {
  min-width: 200px;

  .title {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--app-space-xs);
  }

  .el-progress {
    margin-top: var(--app-space-xs);
  }

  .el-divider--horizontal {
    margin: 12px 0;
  }

  padding: var(--app-space-xs);
  border-radius: 5px;

  &--sub {
    display: flex;
    gap: var(--app-space-xs);
  }

  &:last-child {
    flex: 1;
  }
}

.o-auto > .el-card__body {
  overflow: auto;
}
</style>
