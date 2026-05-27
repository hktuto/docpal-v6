<script lang="ts" setup>
import { clientApi } from 'api'
import { workflowResponseHelper } from '@packages/workflow/utils/jsonConversion'

const emits = defineEmits(['change'])
const { taskDetail } = defineProps<{
  taskDetail: any
}>()
const { t } = useI18n()
const userId: string = useUserId().value
const routerProvider = inject(MenuRouterKey)
const loading = ref(false)

const isAssigneeUser = computed(() => {
  return taskDetail.config?.human_task?.assignee === userId
})

async function handleUnclaim() {
  try {
    loading.value = true
    const response = await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${taskDetail.db_id}/unclaim`).then((r: any) => workflowResponseHelper(r))
    emits('change', false)
  } catch (error) {
    routerProvider?.message.error('Unclaim Task Fail')
    console.log(error)
  }
  setTimeout(() => {
    loading.value = false
  }, 200)
}

async function handleClaim() {
  if (taskDetail.status.type !== 'waiting') {
    routerProvider?.message?.error('Unable to claim this task')
    return
  }
  try {
    loading.value = true
    const parms = {
      user_id: userId
    }
    const response = await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${taskDetail.db_id}/claim`, parms).then((r: any) => workflowResponseHelper(r))
    emits('change', true)
  } catch (error) {
    routerProvider?.message.error('Claim Task Fail')
    console.log(error)
  }
  setTimeout(() => {
    loading.value = false
  }, 200)
}
</script>

<template>
  <div class="info" v-if="taskDetail">
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_taskName') }}</div>
      <div class="value">
        {{ taskDetail.name }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_assignee') }}</div>
      <div class="value">
        {{ taskDetail.config?.human_task?.assignee }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_createDate') }}</div>
      <div class="value">
        {{ formatDate(taskDetail?.execution?.started_at) }}
      </div>
    </div>
    <!--    <div class="infoContainer">-->
    <!--      <div class="label">{{ $t('workflow_dueDate') }}</div>-->
    <!--      <div class="value">-->
    <!--        {{ formatDate(taskDetail.updated_at) }}-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="flex-x-start">
      <el-button id="Workflow__AvailableTask__Detail__JobInfo__UnclaimTask" v-if="isAssigneeUser" type="warning"
                 :loading="loading" @click="handleUnclaim">
        {{ $t('workflow_Unclaim') }}
      </el-button>
      <el-button id="Workflow__AvailableTask__Detail__JobInfo__ClaimTask" v-else-if="!isAssigneeUser" type="primary"
                 :loading="loading" @click="handleClaim">
        {{ $t('workflow_claim') }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.info {
  display: flex;
  flex-flow: column nowrap;
  min-width: 180px;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;

  h4 {
    margin: 0;
  }

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
