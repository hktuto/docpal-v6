<template>
  <div class="info" v-if="taskDetail && taskDetail.taskInstance">
    <!--  <h4>{{ $t('workflow_info') }}</h4>-->
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_jobName') }}</div>
      <div class="value">
        {{ taskDetail.taskInstance.businessKey || taskDetail.taskInstance.processDefinitionName }}
      </div>
    </div>
    <!--  <h4 class="mg-t">{{ $t('workflow_taskInfo') }}</h4>-->
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_taskName') }}</div>
      <div class="value">
        {{ taskDetail.name }}
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
        {{ formatDate(taskDetail.createDate) }}
      </div>
    </div>
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_dueDate') }}</div>
      <div class="value">
        {{ formatDate(taskDetail.dueDate) }}
      </div>
    </div>
    <div class="flex-x-start">
      <el-button
        id="Workflow__AvailableTask__Detail__JobInfo__UnclaimTask"
        class="f-g"
        v-if="isAssigneeUser"
        type="primary"
        :loading="state.loading"
        @click="handleUnclaim"
      >
        {{ $t('workflow_Unclaim') }}
      </el-button>
      <el-button
        id="Workflow__AvailableTask__Detail__JobInfo__ClaimTask"
        class="f-g"
        v-else-if="!props.taskDetail.assignee"
        type="primary"
        :loading="state.loading"
        @click="handleClaim"
      >
        {{ $t('workflow_claim') }}
      </el-button>
      <el-popover v-if="isStartedUser" ref="deletePopoverRef" trigger="click" placement="top" :width="200">
        <p>{{ $t('workflow_delete') }}</p>
        <div class="flex-x-end" style="text-align: right; margin: 0">
          <el-button size="small" text @click="handleDeletePopoverHide">
            {{ $t('cancelText') }}
          </el-button>
          <el-button size="small" type="warning" :loading="state.loading" @click="handelDelete">
            {{ $t('common_confirmDelete') }}
          </el-button>
        </div>
        <template #reference>
          <el-button id="Workflow__AvailableTask__Detail__JobInfo__Delete">
            {{ $t('common_delete') }}
          </el-button>
        </template>
      </el-popover>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const emits = defineEmits(['change'])
const props = defineProps<{
  taskDetail: any
  id: string
}>()
const { t } = useI18n()
const userId: string = useUserId().value
const routerProvider = inject(MenuRouterKey)
const state = reactive({
  loading: false
})

const isStartedUser = computed(() => {
  const id = props.taskDetail.taskInstance.startUserId
  return id === userId
})
const isAssigneeUser = computed(() => {
  const id = props.taskDetail.assignee
  return id === userId
})

async function handleUnclaim() {
  try {
    state.loading = true
    const response = await newClientApi.postWorkflowTaskUnclaim({ taskId: props.id })
    // emits('change', response, false)
    props.taskDetail.assignee = ''
  } catch (error) {
    console.log(error)
  }
  setTimeout(() => {
    state.loading = false
  }, 200)
}

async function handleClaim() {
  try {
    state.loading = true
    const response: any = await newClientApi.postWorkflowTaskClaim({
      taskId: props.id,
      userId
    }).then((res) => res.data)
    if (!response.errorCode) {
      emits('change', response, true)
    }
  } catch (error) {
    console.log(error)
  }
  setTimeout(() => {
    state.loading = false
  }, 200)
}

async function handelDelete() {
  try {
    state.loading = true
    const processInstanceId = props.taskDetail.taskInstance.processInstanceId
    // TODO: 缺少新API
    const response = await newClientApi.deleteWorkflowProcessDeleteprocessinstancebycreator({
      processInstanceId,
      userId
    })
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('common_item') }))
    routerProvider?.back()
  } catch(e) {
    console.log(e)
  } finally {
    state.loading = false
    deletePopoverRef.value.hide()
  }
}

const deletePopoverRef = ref()

function handleDeletePopoverHide() {
  deletePopoverRef.value.hide()
}
</script>
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

  //h4 {
  //    padding: unset;
  //    margin: unset;
  //    margin-bottom: calc(var(--app-space-xs) / 3);
  //}
  //.mg-t {
  //    margin-top: calc(var(--app-space-xs) * 3);
  //}
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
