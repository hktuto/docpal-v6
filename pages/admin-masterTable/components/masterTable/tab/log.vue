<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig">
    <template #toolbar_buttons>
      <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name" inputPlaceHolder="masterTable_detailLogFilter" />
    </template>
  </VxeGrid>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'
import { useI18n } from '#imports'

const props = defineProps(['tableName'])
const emits = defineEmits(['filter-change'])
const { t } = useI18n()
let extraParams: any = {
  eventCategory: 'Master Table'
}
let filtersParams: any = {}
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'masterTable-log',
  api: (pageParams: any) => newAdminApi.postDmsMasterTableLogs({ ...pageParams, ...extraParams, ...filtersParams }),
  columns: [
    { field: 'docPath', title: 'masterTable_masterName', fixed: 'left' },
    { field: 'principalName', title: 'user_username' },
    {
      field: 'eventId',
      title: 'masterTable.eventType',
      formatter({ cellValue }: any) {
        return t('eventId.' + cellValue)
      }
    },
    {
      field: 'eventDate',
      title: 'masterTable.eventDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'comment', title: 'docType_description' }
  ]
})
// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function getFilter() {
  const filters: any = await newAdminApi.postDmsMasterTableLogsPageConditions({ ...extraParams }).then((res) => res.data)
  let data = filters.filter((item: any) => item.key !== 'orderBy' && item.key !== 'isDesc')
  data?.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        // { label: 'docType_description', value: 'comment' },
        { label: 'masterTable.eventDate', value: 'eventDate' },
        { label: 'masterTable.eventType', value: 'eventId' },
        { label: 'masterTable_masterName', value: 'docPath' },
        { label: 'user_username', value: 'principalName' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  )
  nextTick(() => {
    ResponsiveFilterRef.value.init(data)
  })
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  filtersParams = formModel
  reload()
}

// #endregion

onMounted(() => {
  if (!!props.tableName) extraParams.name = props.tableName
  else delete extraParams.name
  getFilter()
})
defineExpose({ reload })
</script>

<style lang="scss" scoped>
.responsive-container {
  width: 70%;
}

:deep(.el-input) {
  width: 200px;
}
</style>
