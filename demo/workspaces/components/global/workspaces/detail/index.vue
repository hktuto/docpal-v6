<script lang="ts" setup>
import { ElSplitter } from 'element-plus'
import { useSingleWorkspace } from '../../../../composables/useSingleWorkspace'
import type { ImportReport } from '../../../../composables/useImportQueue'

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'table' | 'view' | 'dashboard'
}>()
const { workspace, menuActionsRef, getWorkspaceById, workspaceRouteParams } = useSingleWorkspace()

const importReportDialogRef = ref()

function handleViewImportReport(report: ImportReport) {
  importReportDialogRef.value?.open(report)
}

const detailComponent = computed(() => {
  switch (workspaceRouteParams.value.detailType) {
    case 'root':
      return 'LazyWorkspacesDetailRoot'
    case 'folder':
      return 'LazyWorkspacesDetailFolder'
    case 'table':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailTableSetting'
      }
      return 'LazyWorkspacesDetailTable'
    case 'view':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailViewSetting'
      }
      return 'LazyWorkspacesDetailView'
    case 'dashboard':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailDashboardSetting'
      }
      return 'LazyWorkspacessDetailDashboard'
    default:
      return 'LazyWorkspaceDetailRoot'
  }
})

watch(
  props,
  async () => {
    await getWorkspaceById(props.id)
    if (props.detailId) {
      workspaceRouteParams.value.detailId = props.detailId
      workspaceRouteParams.value.detailType = props.detailType
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="pageContainer">
    <template v-if="!workspace">
      <NuxtLoadingIndicator />
    </template>
    <template v-else>
      <ElSplitter>
        <ElSplitterPanel :min="120" size="220px">
          <div class="sideBarContainer">
            <WorkspacesMenuHeader />
            <WorkspacesMenu :workspace-id="workspace?.id" :initialMenu="[]" :is-admin="true"> </WorkspacesMenu>
          </div>
        </ElSplitterPanel>
        <ElSplitterPanel>
          <div class="detailContainer">
            <WorkspacesDetailHeader />
            <component :is="detailComponent" :is-admin="true" />
          </div>
        </ElSplitterPanel>
      </ElSplitter>
      <WorkspacesMenuActions ref="menuActionsRef" />

      <!-- Import Progress Indicator (bottom-left) -->
      <WorkspacesTableImportProgressIndicator @view-report="handleViewImportReport" />

      <!-- Import Report Dialog -->
      <WorkspacesTableImportReportDialog ref="importReportDialogRef" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.sideBarContainer {
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;
  overflow: hidden;
}
.detailContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--app-paper);
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;
}
.pageContainer {
  height: 100%;
  width: 100%;
  --app-header-height: 60px;
}
:deep(.actionIcon) {
  font-size: var(--app-font-size-m);
  cursor: pointer;
  color: var(--app-grey-600);
  line-height: 0;
  &:hover {
    color: var(--app-grey-300);
  }
}
</style>
