<script lang="ts" setup>
import { clientApi } from 'api'
const filter = useAdminListFilter()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'scan-project-list',
  api: async (params: any) => {
    const p = {
      ...params,
      ...filter.value
    }
    return clientApi.api.postCaptureProjPage(p)
  },
  customeToolBar: false,
  saveColumnOrder: false,
  zoom: false,
  refresh: false,
  columns: [
    {
      field: 'name',
      title: 'Project'
    },
    {
      field: '',
      title: 'Number of forms'
    },
    {
      field: 'status',
      title: 'Publish',
      type: 'html',
      formatter: ({ cellValue }: any) => {
        return cellValue === 'A'
          ? `<div class="statusContainer" style="--dot-color: var(--app-primary-color)"><span class="statusDot"></span>Published</div>`
          : `<div class="statusContainer" style="--dot-color: var(--app-info-color)"><span class="statusDot"></span>Draft</div>`
      }
    },
    {
      field: 'createdAt',
      title: 'Created At',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      field: 'updatedAt',
      title: 'Updated At',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row }) => {
    const tab = createScanDetailPageTab(row.id)
    routerProvider?.navigateTo(tab)
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: any) => {
          const tab = createScanDetailPageTab(row.id)
          routerProvider?.navigateTo(tab)
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }) => {
    if (!row)
      return {
        visible: false,
        disabled: false
      }
    return {
      visible: true,
      disabled: false
    }
  }
})
</script>

<template>
  <div class="listContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" width="100%">
      <template #toolbar_buttons>
        <ScanProjectFilter @search="reload" />
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
.listContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
</style>

<style>
.statusContainer {
  display: flex;
  align-items: center;
  gap: 4px;
  /*font-size: var(--app-font-size-m);*/
  color: var(--app-text-color);
  .statusDot {
    display: inline-block;
    width: var(--app-space-m);
    height: var(--app-space-m);
    border-radius: 50%;
    background: var(--dot-color);
  }
}
</style>
