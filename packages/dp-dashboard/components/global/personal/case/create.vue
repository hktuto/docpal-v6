<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    :title="$t('dashboard.PersonalCaseCreate')"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div class="workflow-create-content">
      <el-button v-for="item in state.caseList" type="primary" :key="item.id" @click="handleClick(item)">
        {{ item.name }}
      </el-button>
    </div>
    <PersonalCaseCreateDialog ref="settingRef" :caseList="state.caseList" :caseAList="state.caseAList" @delete="handleDelete" @refresh="handleRefresh" />
    <LazyCaseAddCaseDialog ref="dialogRef" />
  </DashboardCard>
</template>
<script lang="ts" setup>
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
const state = reactive<any>({
  caseList: [],
  caseAList: []
})

async function handleDelete() {
  emits('delete')
}

const dialogRef = ref()

function handleClick(item: any) {
  if(!dialogRef.value.handleOpen) return
  try {
    dialogRef.value.handleOpen(item.id, item)
  } catch (error: any) {
    console.error(error)
  }
}

function handleRefresh(chartSetting: any, caseList: any) {
  state.caseList = caseList
  emits('refreshSetting', chartSetting)
}

async function getList() {
  try {
    const res = await newClientApi.postCaseTypesPage({}).then((res) => res.data)
    return res?.entryList
  } catch (error) {
    return []
  }
}

async function getCaseList() {
  state.caseAList = await getList()
  if (props.setting.caseKeys && props.setting.caseKeys.length > 0) {
    state.caseList = props.setting.caseKeys.reduce((prev: any, id: any) => {
      const caseItem = state.caseAList?.find((cases: any) => cases.id === id)
      prev.push({ ...caseItem })
      return prev
    }, [])
  }
}
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async(setting: any) => {
    await getCaseList()
  }
})
onMounted(async () => {
  getCaseList()
})
</script>
<style lang="scss" scoped>
.workflow-create-content {
  .el-button {
    width: 100%;
    margin: 0;
    margin-bottom: var(--app-space-xs);
  }
}
</style>
