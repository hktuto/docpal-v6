<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{ taskDetail: any }>()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'completeTask_historical',
  api: async () => {
    if (!processId.value) return { data: [] }
    return await getHistorical(processId.value)
  },
  columns: [
    { field: 'node_type.type', title: 'Node Type' },
    { field: 'task_name', title: 'workflow_jobName', slots: { default: 'task_name' } },
    {
      field: 'start_time',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'updated_at',
      title: 'workflow_completeDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {}
})

async function getHistorical(id: string) {
  const data = await clientApi.instance.get(`/oniflow/api/v1/task/overview/all-tasks?process_id=${id}`).then((r: any) => r.data)
  return {
    data: data.data || []
  }
}

const processId = ref<string>('')

watch(
  () => props.taskDetail,
  (value) => {
    const id = value?.id || value?.process_id
    if (!id) return
    processId.value = id
    reload()
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
        <template #task_name="{ row, index }">
          {{ row.config?.human_task?.form_title ?? '' }}
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
