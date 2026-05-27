<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'

const workflowList = await getWorkflowList()
const { t } = useI18n()
const emits = defineEmits(['delete', 'refreshSetting'])
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: {
      title: string
      isTabView: boolean
      selectedTable: string
      workflowIdList: string[]
    }
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const tableRef = ref()
const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: (setting: any) => {
    tableRef.value.query({})
  }
})
const activeTab = ref('activeTask')
const activeTabName = ref('workflow_joinTask')
const pagelist = ref([
  { name: 'workflow_myTask', key: 'myTask' },
  { name: 'workflow_joinTask', key: 'activeTask' },
  { name: 'Available Task', key: 'allTask' }
])

function getSelectedTableName(key: string) {
  const name = pagelist.value.find((item: any) => item.key == key)?.name || ''
  return t(name)
}

function handleCommand(command: string) {
  activeTab.value = command
  activeTabName.value = pagelist.value.find((item: any) => item.key === command)?.name
}

async function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
</script>

<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    title=""
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <template #title_suffix>
      <h4 v-if="setting.title || setting.selectedTable">
        {{ setting.title ? setting.title : getSelectedTableName(setting.selectedTable) }}
      </h4>
      <el-dropdown v-if="!setting.isTabView && !setting.selectedTable" trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <span style="font-size: 20px">
            {{ $t(activeTabName) }}
          </span>
          <el-icon class="el-icon--right">
            <arrow-down />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in pagelist" :key="item.key" :command="item.key" :disabled="activeTab === item.key">
              {{ $t(item.name) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tabs v-else-if="!setting.selectedTable" v-model="activeTab" class="tab-container" @tab-change="handleCommand">
        <el-tab-pane v-for="item in pagelist" :key="item.key" :label="$t(item.name)" :name="item.key" />
      </el-tabs>
    </template>

    <PersonalWorkflowPageMy
      ref="tableRef"
      v-if="setting.selectedTable === 'myTask' || (!setting.selectedTable && activeTab === 'myTask')"
      :id-list="props.setting.workflowIdList"
    />
    <PersonalWorkflowPageActive
      ref="tableRef"
      v-else-if="setting.selectedTable === 'activeTask' || (!setting.selectedTable && activeTab === 'activeTask')"
      :id-list="props.setting.workflowIdList"
    />
    <PersonalWorkflowPageAvalible ref="tableRef" v-else :id-list="props.setting.workflowIdList" />
  </DashboardCard>

  <PersonalWorkflowPageSetting ref="settingRef" :workflow-list="workflowList" @refresh="handleRefresh" />
</template>

<style lang="scss" scoped>
.el-dropdown-link {
  display: flex;
  align-items: center;
}
</style>
