<template>
  <el-dialog
    v-model="state.visible"
    class="big caseStatistics-table-dialog"
    :title="setting.drilldownTitle || $t('dashboard.drillDown')"
    :append-to-body="appendToBody"
    :close-on-click-modal="false"
    @close="state.visible = false"
  >
    <slot>
      <CaseStatisticsTable ref="tableRef" :name="name" :sql="state.sql" :setting="setting" :dates="dates" @close="state.visible = false" />
    </slot>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { PostgREST_Decorate } from 'api'
const { setting, dates, name } = defineProps<{
  setting: any
  dates: any
  name: string
}>()
const state = reactive({
  visible: false,
  sql: ''
})
const appendToBody = ref(true)
const tableRef = ref()
function handleOpen(sqlParams: any) {
  console.log('setting', setting)
  if (!setting.fields) return
  if (sqlParams) {
    appendToBody.value = document.fullscreenElement ? false : true
    const _sqlParams = JSON.parse(JSON.stringify(sqlParams))
    const displayColumns = setting.displayColumns.map((item: any) => item.value || item)
    if (!displayColumns.includes('case_id')) {
      displayColumns.unshift('case_id')
    }
    if (setting.groupField && !displayColumns.includes(setting.groupField)) {
      displayColumns.unshift(setting.groupField)
    }
    const columns = displayColumns.join(',')
    const selectSql = _sqlParams.find((item) => item.type === 'select')
    if (!selectSql) {
      _sqlParams.push({
        type: 'select',
        value: columns
      })
    } else {
      selectSql.value += `,${columns}`
    }
    state.sql = PostgREST_Decorate(_sqlParams)
    setTimeout(() => {
      tableRef.value.reload()
    }, 300)
  }
  state.visible = true
}

defineExpose({ handleOpen })
</script>
<style lang="scss">
.caseStatistics-table-dialog {
  height: 70vh;
  .el-dialog__body {
    height: calc(100% - 2rem);
    overflow: hidden;
  }
}
</style>
