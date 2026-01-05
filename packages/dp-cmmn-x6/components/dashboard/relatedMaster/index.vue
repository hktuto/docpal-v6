<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './setting.vform.json'
import Cards from './cards.vue'
import { formSlotOrderDisplayColumns } from '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/reorderColumn'

const tabProvider = inject(TabManagerKey)
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
const cardsRef = ref()
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
    console.log('handleRefreshAction', tableRef)
    tableRef.value.query({})
  }
})

async function getMasterTableDetail(id: string) {
  try {
    return  await clientApi.api.getDmsMasterTableId(id).then((res) => res.data)
  } catch (error) {
    console.log('get cast type error', error)
    return {}
  }
}
// #region module: tableRef
async function handleShowColumn() {
  const _columns = await formSlotOrderDisplayColumns(props.setting.displayColumns, tabProvider)
  setTimeout(() => {
    if(tableRef.value) {
      tableRef.value.reorderColumn(_columns)
    }
    if(cardsRef.value) {
      cardsRef.value.reorderColumn(_columns)
    }
    handleRefreshTable()
  }, 100)
}
function handleRefreshTable() {
  if(tableRef.value) {
    tableRef.value.reload()
  }
  if(cardsRef.value) {
    cardsRef.value.reload()
  }
}
// #endregion

watch(
  () => props.setting,
  async () => {
    if (!props.setting || !props.setting.masterTableId) return
    state.detail = await getMasterTableDetail(props.setting.masterTableId)
    handleShowColumn()
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
    :title="props.setting.label"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div v-if="setting.view === 'table'" class="table-container">
      <DashboardRelatedMasterTable ref="tableRef" :relatedField="setting.relatedField" :name="setting.name" :detail="state.detail">
      </DashboardRelatedMasterTable>
    </div>
    <div v-if="setting.view === 'card'" class="cards-container">
      <Cards ref="cardsRef" :name="setting.name" :detail="state.detail" :relatedField="setting.relatedField"></Cards>
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
.cards-container{
  height: 100%;
  overflow: auto;
}
</style>
