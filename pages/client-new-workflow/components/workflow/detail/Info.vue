<script lang="ts" setup>
import { newClientApi } from 'api'

const emits = defineEmits(['change'])
const { taskDetail } = defineProps<{
  taskDetail: any
}>()
const { t } = useI18n()
const userId: string = useUserId().value
const routerProvider = inject(MenuRouterKey)
const loading = ref(false)

const isStartedUser = computed(() => {
  return taskDetail.assignee === userId
})
const isAssigneeUser = computed(() => {
  return taskDetail.assignee === userId
})

async function handleUnclaim() {
  try {
    loading.value = true
    const response = await $api.post(`http://192.168.5.147:8080/api/v1/tasks/instance/${userId}/unclaim`).then((r) => r.data)
    emits('change', response, false)
    taskDetail.assignee = ''
  } catch (error) {
    console.log(error)
  }
  setTimeout(() => {
    loading.value = false
  }, 200)
}

async function handleClaim() {
  try {
    loading.value = true
    const parms = {
      user_id: userId,
      process_id: ''
    }

    await $api.post(`http://192.168.5.147:8080/api/v1/tasks/instance/${taskDetail.process_instance_id}/claim`, parms).then((res) => res.data)

    if (!response.errorCode) {
      emits('change', response, true)
    }
  } catch (error) {
    console.log(error)
  }
  setTimeout(() => {
    loading.value = false
  }, 200)
}

async function handelDelete() {
  try {
    loading.value = true
    await $api.delete(`http://192.168.5.147:8080/api/v1/processes/instance/${taskDetail.process_instance_id}`).then((r) => r.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('common_item') }))
    routerProvider?.back()
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="info" v-if="taskDetail">
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_taskName') }}</div>
      <div class="value">
        {{ taskDetail.node_name }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_assignee') }}</div>
      <div class="value">
        {{ taskDetail.assignee }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_createDate') }}</div>
      <div class="value">
        {{ formatDate(taskDetail.created_at) }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_dueDate') }}</div>
      <div class="value">
        {{ formatDate(taskDetail.updated_at) }}
      </div>
    </div>

    <div class="flex-x-start">
      <el-button id="Workflow__AvailableTask__Detail__JobInfo__UnclaimTask" v-if="isAssigneeUser" type="warning" :loading="loading" @click="handleUnclaim">
        {{ $t('workflow_Unclaim') }}
      </el-button>
      <el-button
        id="Workflow__AvailableTask__Detail__JobInfo__ClaimTask"
        v-else-if="!taskDetail.assignee"
        type="primary"
        :loading="loading"
        @click="handleClaim"
      >
        {{ $t('workflow_claim') }}
      </el-button>
      <el-popconfirm v-if="isStartedUser" class="box-item" :title="t('workflow_delete')" placement="top" @confirm="handelDelete">
        <template #reference>
          <el-button type="danger" id="Workflow__AvailableTask__Detail__JobInfo__Delete">
            {{ $t('common_delete') }}
          </el-button>
        </template>
      </el-popconfirm>
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
