<script lang="ts" setup>
import { newClientApi } from 'api'

const { curTableId } = defineProps<{
  curTableId: string
}>()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const MasterTableTabRecordsRef = ref()
const clientMasterTableList = ref()
const state = reactive<any>({
  activeName: 'tabels',
  masterTables: [],
  curTable: {},
  permission: {
    read: true,
    create: false,
    edit: false,
    enable: false
  }
})

function handleClick(id: any, permission: any) {
  console.log('handleClick', id, permission)
  initColumns(id)
  state.curTable.id = id
  state.permission = permission
}

async function initColumns(id: string) {
  try {
    state.curTable.columnLoading = true
    const res = await newClientApi.getDmsMasterTableId(id).then((res) => res.data)
    state.curTable = {
      ...state.curTable,
      name: res.name,
      fields: res.fields,
      status: res.status
    }
    console.log('initColumns', res)
    MasterTableTabRecordsRef.value.initTableColumns([...res.fields])
  } catch (error) {
  } finally {
    state.curTable.columnLoading = false
  }
}

async function init() {
  try {
    state.masterTables = await newClientApi.getDmsMasterTableListWithPermission().then((res) => res.data)
    if (!!curTableId && '' !== curTableId) {
      const find = state.masterTables.find((item: any) => item.id === curTableId)
      if (!!find) {
        handleClick(find.id, find)
        clientMasterTableList.value.setActive(find.id)
      }
    } else {
      let permission = state.masterTables[0]
      handleClick(permission.id, permission)
      clientMasterTableList.value.setActive(permission.id)
    }
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  init()
})
</script>
<template>
  <div class="pageContainer--padding">
    <ClientMasterTableList
      ref="clientMasterTableList"
      :list="state.masterTables"
      @click="handleClick"
    />
    <div style="overflow: hidden;">
      <MasterTableRecords
        ref="MasterTableTabRecordsRef"
        :tableId="state.curTable.id"
        :columnLoading="state.columnLoading"
        :permission="state.permission"
      ></MasterTableRecords>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.dp-tabs--auto {
  height: 100%;

  .el-tab-pane {
    height: 100%;
  }
}

.pageContainer--padding {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--app-space-xs);
}
</style>
