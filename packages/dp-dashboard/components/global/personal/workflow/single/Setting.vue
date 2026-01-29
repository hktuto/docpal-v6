<script lang="ts" setup>
import { clientApi, globalApi } from 'api'

const platform = useAppPlatform()
const { t } = useI18n()

const { state, handleSubmit, handleDelete, handleOpen } = useDashboardSetting({
  beforeOpen
})

type Columns = {
  field: string
  title: string
}

const allWorkflow = ref<any[]>([])
const workflowColumns = ref<Columns[]>([])
const avalibleSteps = ref<any[]>([])

async function handleWorkflowhange(newSelectedWorkflow: string) {
  state.setting.columns = []
  state.setting.steps = []
  const selectedWorkflowData = allWorkflow.value.find((item: any) => item.key === newSelectedWorkflow)
  if (!selectedWorkflowData) return
  // get workflow bpmn
  let xml
  if (platform.value === 'admin') {
    const blob = await globalApi.api.getWorkflowVersionBpmnxml(
      {
        draftId: selectedWorkflowData.draftId,
        versionNumber: selectedWorkflowData.versionNumber
      },
      {
        format: 'blob'
      }
    )
    xml = await blob.text()
  } else {
    xml = await clientApi.api.getWorkflowVersionVersionidBpmnxml(selectedWorkflowData.versionId)
  }
  const { json } = bpmnStringToJson(xml)
  // default columns

  const allFormInfo = new Map()
  const allStep: any[] = []
  allFormInfo.set('name', {
    attr_id: 'name',
    attr_name: 'workflow_name'
  })
  // not allow Chained parameters
  allFormInfo.set('businessKey', {
    attr_id: 'businessKey',
    attr_name: 'businessKey'
  })
  allFormInfo.set('createDate', {
    attr_id: 'createDate',
    attr_name: 'Task Start Date'
  })
  // allFormInfo.set('dueDate', {
  //   attr_id: 'dueDate',
  //   attr_name: 'Task Due Date'
  // })
  allFormInfo.set('startUserId', {
    attr_id: 'startUserId',
    attr_name: 'Task Initiator'
  })
  allFormInfo.set('assignee', {
    attr_id: 'assignee',
    attr_name: 'Task Owner'
  })
  // step 1 get all startEvent and userTask
  const allFormStep = [...json.definitions.process.startEvent, ...json.definitions.process.userTask]
  allFormStep.forEach((item) => {
    allStep.push(item)
    let formInfo = item.extensionElements['flowable:formProperty']
    if (formInfo) {
      if (!Array.isArray(formInfo)) formInfo = [formInfo]
      formInfo.forEach((formItem) => {
        allFormInfo.set(formItem.attr_id, formItem)
      })
    }
  })
  workflowColumns.value = Array.from(allFormInfo.values())
  avalibleSteps.value = allStep
}

async function getWorkflow() {
  allWorkflow.value = await clientApi.api.postDsbWorkflowProcessList().then(r => r.data)
}

async function beforeOpen(setting) {
  await getWorkflow()
  if (!setting.columns) setting.columns = []
  if (setting.selectedWorkflow) {
    await handleWorkflowhange(setting.selectedWorkflow)
  }
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false" @close="handleClose">
    <ElForm label-position="top">
      <ElFormItem label="Title">
        <ElInput v-model="state.setting.title" placeholder="Title" />
      </ElFormItem>
      <ElFormItem label="workflow">
        <ElSelect v-model="state.setting.selectedWorkflow" filterable clearable allow-create @change="handleWorkflowhange">
          <ElOption v-for="item in allWorkflow" :key="item.key" :label="item.name" :value="item.key" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Steps">
        <ElSelect v-model="state.setting.steps" filterable clearable allow-create multiple>
          <ElOption v-for="item in avalibleSteps" :key="item.attr_id" :label="item.attr_name" :value="item.attr_id" />
        </ElSelect>
      </ElFormItem>
      <!-- <ElFormItem label="Sort Column">
        <ElSelect v-model="state.setting.sortColumn" filterable clearable >
          <ElOption v-for="item in workflowColumns" :key="item.attr_id" :label="item.attr_name" :value="item.attr_id" />
        </ElSelect>
      </ElFormItem> -->
      <ElFormItem label="Columns">
        <div class="listContainer">
          <div class="row">
            <div>Title</div>
            <div>Field</div>
          </div>
          <div v-for="(row, index) in state.setting.columns" :key="index" class="row">
            <ElInput v-model="row.title" placeholder="Title" />
            <ElSelect v-model="row.field" multiple clearable filterable allow-create>
              <ElOption v-for="item in workflowColumns" :key="item.attr_id" :label="item.attr_name" :value="item.attr_id" />
            </ElSelect>
            <ElButton type="link" text @click="state.setting.columns.splice(index, 1)">remove</ElButton>
          </div>
          <div class="add-row">
            <ElButton type="link" text @click="state.setting.columns.push({ field: '', title: '' })"> Add Column </ElButton>
          </div>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="footer-grid">
        <el-button id="WorkPanel__DetailTask__Delete" type="danger" @click="handleDelete">
          {{ $t('common_delete') }}
        </el-button>
        <el-button id="WorkPanel__DetailTask__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.listContainer {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  width: 100%;
  .row {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 60px;
    grid-column-gap: var(--app-space-xs);
  }
}
.add-row {
  width: 100%;
  display: grid;
  place-items: center;
}
</style>
