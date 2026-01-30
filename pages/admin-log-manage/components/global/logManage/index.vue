<template>
  <div class="pageContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #configuredLevel="{ row }">
        <el-select
          v-model="row.configuredLevel"
          style="width: 250px"
          filterable
          default-first-option
          :disabled="row.loading"
          @change="(value) => handleLevelChange(value, row)"
        >
          <el-option v-for="level in row.levels" :key="level" :value="level" :label="$t(level)"></el-option>
        </el-select>
        <el-button type="text" :loading="row.loading"></el-button>
      </template>
    </VxeGrid>
  </div>
</template>

<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { clientApi } from 'api'

const { t } = useI18n()
const logKey = 'ROOT'
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'admin-log-manage',
  saveColumnOrder: false,
  api: async (params: any) => {
    const data = await clientApi.admin.getAdmindocpalManagementLoggers().then(r => r.data) as any
    console.log('api', data)
    return Object.keys(data).reduce((prev, key) => {
      prev.push({
        service: key,
        levels: data[key].levels,
        effectiveLevel: data[key].loggers[logKey].effectiveLevel,
        configuredLevel: data[key].loggers[logKey].configuredLevel,
        loading: false
      })
      return prev
    }, [] as any)
  },
  virtualScroll: true,
  columns: [
    { title: 'service', field: 'service' },
    { title: 'effectiveLevel', field: 'effectiveLevel' },
    { title: 'configuredLevel', field: 'configuredLevel', slots: { default: 'configuredLevel' }, showOverflow: false }
  ]
})
// #region module: page

// #endregion
async function handleLevelChange(level: any, row: any) {
  row.loading = true
  try {
    await adminApi.api.postManagementLoggers({
      service: row.service,
      level
    })
    await reload()
  } catch (error) {
    console.log(error)
  }
  row.loading = false
}

// async function handleSubmit (shareInfo) {
// }
onMounted(async () => {
  reload()
})
</script>

<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
