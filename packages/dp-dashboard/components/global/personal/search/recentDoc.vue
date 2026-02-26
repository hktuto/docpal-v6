<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    :title="$t('search.recentDocument')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div v-if="!hideSetting" style="height: 100%; overflow: auto">
      <el-skeleton :rows="5" />
    </div>
    <VxeGrid v-else ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()

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
  api: (pageParams: any) => newClientApi.postLogsRecentDocumentPage(pageParams),
  columns: [
    { field: 'name', title: 'table_fileName', fixed: 'left' },
    {
      field: 'mimeType',
      title: 'search.mimeTypes',
      formatter: ({ cellValue }: any) => {
        return mimeTypeToExtension(cellValue)
      }
    },
    { field: 'documentType', title: 'dpDocument_fileType' },
    { field: 'path', title: 'tableHeader_path' },
    { field: 'contributors', title: 'search.contributors' },
    // { field: 'creatorBy', title: 'role.creator' },
    {
      field: 'modifiedDate',
      title: 'tableHeader_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handlePreview(row)
  }
})

function handlePreview(row: any) {
  routerProvider?.navigateTo(
    createDetailPageParams({
      docName: row.name,
      idOrPath: row.id,
      showHeaderAction: true
    }),
    false
  )
}
const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    query({})
  }
})
async function handleDelete() {
  emits('delete')
}
</script>
<style lang="scss" scoped>
:deep(.vxe-toolbar) {
  display: none;
}
</style>
