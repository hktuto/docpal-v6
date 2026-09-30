<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{ taskDetail: any }>()
const tableData = ref([])
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'completeTask_historical',
  optionalConfig: {
    rowConfig: {
      useKey: true,
      isCurrent: true
    }
  },
  api: () => {
    return tableData.value
  },
  columns: [
    { field: 'name', title: 'workflow_jobName' },
    {
      field: 'created_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'completed_at',
      title: 'workflow_completeDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'state',
      title: 'dpTable_status'
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {}
})

async function getHistorical(processId: string) {
  try {
    const data = await clientApi.instance.get(`/api/v1/task/overview/all-tasks?process_id=${processId}`).then((r) => r.data)
    console.log(123, data)
    tableData.value = []
    nextTick(() => reload())
  } catch (e) {
    console.log(e)
  }
}

watch(
  () => props.taskDetail,
  (value) => {
    if (!value) return
    console.log(value)
    // getHistorical(value.id)
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="pageContainer--padding">
    <div class="info" v-if="taskDetail">
      <div class="infoContainer">
        <div class="label">{{ $t('workflowEditor.name') }}</div>
        <div class="value">
          {{ taskDetail.name }}
        </div>
      </div>

      <div class="infoContainer">
        <div class="label">{{ $t('workflow_startTime') }}</div>
        <div class="value">
          {{ formatDate(taskDetail.created_at) }}
        </div>
      </div>
      <div class="infoContainer">
        <div class="label">{{ $t('tableHeader_completeDate') }}</div>
        <div class="value">
          {{ formatDate(taskDetail.completed_at) }}
        </div>
      </div>
    </div>

    <el-divider />
    <div style="height: 700px">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <div style="font-size: 20px; color: #1abc9c; font-weight: bold">
            {{ $t('workflow_history') }}
          </div>
        </template>
      </VxeGrid>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.info {
  display: flex;
  flex-flow: column nowrap;
  min-width: 180px;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  @media (max-width: 640px) {
    flex-flow: row wrap;
    gap: calc(var(--app-space-xs) * 2);
    .f-g {
      flex: 1 0 100%;
    }
  }
}

.infoContainer {
  margin-bottom: var(--app-space-xs);
}

.label {
  line-height: 1.5rem;
  font-size: 0.7rem;
  color: var(--app-grey-400);
}

.value {
  font-size: 1rem;
}
</style>
