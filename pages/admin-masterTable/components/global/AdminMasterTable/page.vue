<script lang="ts" setup>
import { clientApi } from 'api'
import { MasterTableProviderKey } from '~/utils/masterTableProvider'
import { routeMasterTableDetail, routeMasterTableNew } from '~/utils/routerHelper'
const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const state = reactive<any>({
  activeName: 'tabels',
  tableFilter: {},
  logFilter: {},
  masterTable: {
    name: '',
    fields: []
  }
})
function openNew() {
  const newItem = routeMasterTableNew({
    name: t('adminMenu.masterTable') + '/new'
  })
  console.log('newItem', newItem)
  routerProvider?.navigateTo({ ...newItem })
}
function openDetail(row: any, openInNewTab = false) {
  const newItem = routeMasterTableDetail(row)
  routerProvider?.navigateTo({ ...newItem }, openInNewTab)
}
const logRef = ref()
const MasterTableTabRecordsRef = ref()
function handleTableFilterChange(formModel: any) {
  state.tableFilter = formModel
  MasterTableTabRecordsRef.value.reload()
}
function handleLogFilterChange(formModel: any) {
  state.logFilter = formModel
  logRef.value.refresh()
}
provide(MasterTableProviderKey, {
  GetMasterTablesPageApi: (params: any) => {
    return clientApi.admin.postAdmindmsMasterTablePage({ ...params, ...state.tableFilter })
  },
  DeleteMasterTablesApi: (params: any) => {
    return clientApi.admin.deleteAdmindmsMasterTableId(params)
  },
  GetMasterTablesPageConditionApi: (params: any) => {
    return clientApi.admin.getAdmindmsMasterTablePageConditions(params)
  },
  UpdateMasterTableApi: (params: any) => {
    return clientApi.admin.putAdmindmsMasterTable(params)
  },
  openDetail,
  openNew
})
</script>
<template>
  <div class="pageContainer--padding">
    <el-tabs class="dp-tabs--auto" v-model="state.activeName">
      <el-tab-pane :label="$t('masterTable.Tables')" name="tabels">
        <MasterTableTabTables ref="MasterTableTabRecordsRef" @filter-change="handleTableFilterChange"> </MasterTableTabTables>
      </el-tab-pane>
      <el-tab-pane :label="$t('masterTable.log')" name="log">
        <MasterTableTabLog ref="logRef" @filter-change="handleLogFilterChange"></MasterTableTabLog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<style lang="scss" scoped>
.dp-tabs--auto {
  height: 100%;

  .el-tab-pane {
    height: 100%;
  }
}
</style>
