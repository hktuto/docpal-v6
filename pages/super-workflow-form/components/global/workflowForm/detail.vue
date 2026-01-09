<script lang="ts" setup>
import { adminApi, clientApi } from 'api'
import type { ProcessDefinitionDTO } from 'api/src/generate/admin'
import { ArrowDown } from '@element-plus/icons-vue'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { taskId, processKey } = defineProps<{
  taskId: string;
  processKey: string;
}>()

const state = reactive<State>({
  loading: false,
  submitLoading: false,
  activeTaskId: '',
  workflowDetail: {},
  fieldListApi: {}
})
let workflowList: ProcessDefinitionDTO[] | undefined = []

function handleCommand(command: string) {
  init(command)
}

const GetWorkflowDetail = async (_processKey: string) => {
  if (!workflowList || workflowList.length === 0) {
    const res = await adminApi.api.getWorkflowProcessGetprocessdefinitionlist().then(res => res.data)
    res.forEach(item => {
      item.userTasks.push({ id: 'complete', name: 'complete' })
    })
    workflowList = res
  }
  const workflowDetail = workflowList?.find((item: any) => item.key === _processKey)
  state.workflowDetail = workflowDetail
}

async function setJson(_taskId) {
  let json: any = null
  try {
    const taskFormJsons = await clientApi.api.getDmsFormPropertiesQuery({
      processKey: processKey,
      userTaskId: _taskId
    }).then(res => res.data)
    json = JSON.parse(taskFormJsons[0].jsonValue)
  } catch (error) {

  } finally {
    setTimeout(() => {
      FormDesignerRef.value.setFormJson(json)
    }, 100)
  }
}

const FormDesignerRef = ref()

async function init(_taskId: string) {
  try {
    state.activeTaskId = _taskId
    state.loading = true
    await GetWorkflowDetail(processKey)
    // get prop and label list
    let taskDetail = state.workflowDetail.userTasks.find((item: any) => item.id === _taskId)
    state.fieldListApi = {
      labelKey: 'id',
      nameKey: 'id',
      data: taskDetail.formProperties ? taskDetail.formProperties : state.workflowDetail.userTasks[0].formProperties
    }

    await setJson(_taskId)

  } catch (error) {

  } finally {
    state.loading = false
  }
}

async function handleSubmit() {
  const json = FormDesignerRef.value.getFormJson()
  const param = {
    processKey,
    userTaskId: state.activeTaskId,
    jsonValue: JSON.stringify(json)
  }
  state.submitLoading = true
  try {
    const res = await clientApi.api.postDmsFormPropertiesSave(param)
    if (!!res) routerProvider?.message.success(t('msg_successfullyModified'))
  } catch (error) {
  }
  state.submitLoading = false
}

onMounted(async () => {
  init(taskId)
})

</script>
<template>
  <div class="pageContainer--padding">
    <div class="header">
      <el-dropdown trigger="click" @command="handleCommand">
      <span class="el-dropdown-link">
          <div class="ellipsis">{{ state.workflowDetail.name }}</div>
          <el-icon class="el-icon--right"> <ArrowDown /> </el-icon>
      </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :class="{'current': item.id === state.activeTaskId}"
                              v-for="item in state.workflowDetail.userTasks" :command="item.id">
              {{ item.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div style="overflow: hidden;" v-loading="state.loading">
      <FormDesigner ref="FormDesignerRef" :fieldListApi="state.fieldListApi">
        <template #submit>
          <el-button type="text" :loading="state.submitLoading" @click="handleSubmit">{{ $t('submit') }}</el-button>
        </template>
      </FormDesigner>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.el-dropdown-link {
  display: flex;

  .ellipsis {
    max-width: 30vw;
  }
}

:deep(.current) {
  background-color: var(--el-dropdown-menuItem-hover-fill);
  color: var(--el-dropdown-menuItem-hover-color);
}

.pageContainer--padding {
  display: grid;
  grid-template-rows: min-content 1fr;

  .header {
    background-color: var(--app-grey-800);
    padding: var(--app-space-s);
    border-radius: 3px;
  }
}
</style>
