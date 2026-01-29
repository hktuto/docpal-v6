<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    :title="$t('search.Subscribed')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div v-if="!hideSetting" style="height: 100%; overflow: auto">
      <el-card class="detail">
        <el-skeleton :rows="4" />
      </el-card>
    </div>
    <VxeGrid v-else ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { MenuRouterKey } from '#imports'
import { clientApi } from 'api'
const routerProvider = inject(MenuRouterKey)
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

const emits = defineEmits(['delete'])
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'subscribed',
  zoom: false,
  saveColumnOrder: false,
  virtualScroll: true,
  api: async (pageParams: any) => {
    return await clientApi.api.getNotificationSubscriberSubscriberFoldersList(useUserId().value, pageParams).then(r => r.data)
  },
  columns: [
    { field: 'name', title: 'tableHeader.folderName', fixed: 'left' },
    { field: 'documentType', title: 'dpDocument_fileType' },
    { field: 'path', title: 'tableHeader_path' },
    { field: 'contributors', title: 'search.contributors' },
    // { field: 'creatorBy', title: 'role.creator' },
    {
      field: 'fileModifiedDate',
      title: 'tableHeader_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})
const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    query({})
  }
})
function handleDblclick(row: any) {
  routerProvider?.navigateTo(createBrowseListPageParams({ idOrPath: row.id }), false)
}
async function handleDelete() {
  emits('delete')
}
</script>
<style lang="scss" scoped>
:deep(.vxe-toolbar) {
  display: none;
}
</style>
