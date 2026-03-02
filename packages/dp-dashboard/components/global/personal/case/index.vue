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
      <el-dropdown v-if="!setting.isTabView" trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <h4>{{ $t('caseManagement.my') }}
            <template v-if="activeTabName">({{ $t(activeTabName) }})</template>
            </h4>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in list" :key="item.id" :command="item.id" :disabled="activeTab === item.id">
              {{ item.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tabs v-else v-model="activeTab" class="tab-container" @tab-change="handleCommand">
        <el-tab-pane v-for="item in list" :key="item.id" :label="item.name" :name="item.id"></el-tab-pane>
      </el-tabs>
    </template>
    <PersonalCaseTable ref="tableRef" />
    <PersonalCaseSetting ref="settingRef" @delete="handleDelete" @refresh="handleRefresh" />
  </DashboardCard>
</template>
<script lang="ts" setup>
import { ArrowDown } from "@element-plus/icons-vue";
import { newClientApi } from 'api'
const emits = defineEmits(['delete', 'refreshSetting'])
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
const activeTab = ref<string>('')
const activeTabName = ref<string>('')
const list = ref<any>([])
const tableRef = ref();

async function handleDelete() {
  emits('delete')
}
function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}
function handleCommand(command: string | number | object) {
  activeTab.value = command
  activeTabName.value = list.value.find((item) => item.id === command)?.name
  tableRef.value.setCaseId(command);
}
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async(setting: any) => {
    tableRef.value.query({})
  }
})
onMounted(async () => {
  try {
    const res = await newClientApi.postCaseTypesPage({}).then((res) => res.data)
    list.value = res?.entryList
    if (list.value.length > 0) handleCommand(list[0]?.id)
  } catch (error) {
    throw new Error(error)
  }
})
</script>
<style lang="scss" scoped>
.el-dropdown-link {
  display: flex;
  align-items: center;
}
</style>
