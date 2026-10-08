<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { getWorkflowList, workflowResponseHelper, routeWorkflowCompleteInfo } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const emit = defineEmits<{
  select: [row: Record<string, any>]
}>()
const workflowList = await getWorkflowList()
const { t } = useI18n()
const user = useUserState().value
const definition_id = ref<string>('')
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'complete_task',
  optionalConfig: {
    rowConfig: {
      useKey: true,
      isCurrent: true
    }
  },
  optionalEvent: {
    cellClick: ({ row }: { row: Record<string, any> }) => {
      if (!row) return
      tableRef.value?.setCurrentRow?.(row)
      emit('select', row)
    }
  },
  api: async (pageParams: any) => {
    const params = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum,
      groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
      roles: [user.aclUserDetail.roleId],
      definition_id: !!definition_id.value && definition_id.value !== '' ? definition_id.value : '',
      status: ['completed', 'failed', 'terminated'],
      involved_user_id: user.userId
    }
    const data = await clientApi.instance.post(`/oniflow/api/v1/processes/instance/page`, params).then((r: any) => workflowResponseHelper(r))
    return {
      data: data
    }
  },
  columns: [
    { field: 'name', title: 'workflowEditor.name', fixed: 'left', minWidth: 200 },
    // { field: 'alias', title: 'workflow_businessKey' },
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
      field: 'duration',
      title: 'workflow_duration',
      formatter({ cellValue, row }: any) {
        return dayjs(row.completed_at).diff(row.created_at, 'day') + ' ' + t('common_days')
      }
    },
    {
      field: 'state',
      title: 'dpTable_status'
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowCompleteInfo({
      ...row
    }),
    false
  )
}

defineExpose({
  reload,
  clearHighlight: () => tableRef.value?.clearCurrentRow?.()
})
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="el-col el-col-10 is-guttered grid-cell">
          <el-form-item :label="t('workflow_workflowName')" label-position="top">
            <el-select clearable v-model="definition_id" placeholder="All" @change="reload">
              <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
      </template>
      <template #business_key="{ row }">
        <span>{{ row?.execution?.input_variables?.business_key || '' }}</span>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

:deep(.vxe-body--row.row--current) {
  background-color: var(--el-color-primary-light-9) !important;
}
</style>
