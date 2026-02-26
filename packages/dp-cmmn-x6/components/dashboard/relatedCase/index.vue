<script lang="ts" setup>
import { newClientApi } from 'api'
import formJson from './setting.vform.json'
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
const tableRef = ref()

const state = reactive<any>({
  detail: {}
})
function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}
async function handleDelete() {
  emits('delete')
}
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    tableRef.value.query({})
  }
})

async function getCaseDetail(caseId: string) {
  try {
    return  await newClientApi.getCaseTypesCasetypeid(caseId).then((res) => res.data)
  } catch (error) {
    console.log('get cast type error', error)
    return {}
  }
}
// #region module: tableRef
function handleShowColumn() {
  tableRef.value.reorderColumn(props.setting.displayColumns)
}
function handleRefreshTable() {
  tableRef.value.reload()
}
// #endregion

watch(
  () => props.setting,
  async () => {
    if (!props.setting || !props.setting.caseId) return
    state.detail = await getCaseDetail(props.setting.caseId)
    handleShowColumn()
    handleRefreshTable()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>
<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    :title="props.setting.caseLabel"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div class="table-container">
      <DashboardRelatedCaseTable ref="tableRef" :relatedField="setting.relatedField" :id="setting.caseId" :detail="state.detail" :label="setting.caseLabel">
        <template #table_right>
          <el-button v-if="props.setting.caseId && props.setting.showAdd" type="primary" @click="handleAddCaseDialog">
            {{ $t(props.setting.newButtonLabel) }}
          </el-button>
        </template>
      </DashboardRelatedCaseTable>
    </div>
    <DashboardSetting
      v-if="!hideSetting"
      ref="settingRef"
      :title="title"
      :formJson="formJson"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
  </DashboardCard>
</template>
<style lang="scss" scoped>
.table-container {
  :deep(.vxe-toolbar) {
    display: flex;
  }
}
</style>
