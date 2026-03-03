<script lang="ts" setup>
import { clientApi } from 'api'

const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'scan-project-list',
  api: async (params: any) => {
    cleanSelectedRows()
    const p = {
      ...params
    }
    return clientApi.api.postCaptureProjPage(p)
  },
  columns: [
    {
      field: 'name',
      title: 'Project'
    }
  ]
})
</script>

<template>
  <div class="listContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" width="100%">
      <template #toolbar_buttons> </template>
    </VxeGrid>
  </div>
</template>
