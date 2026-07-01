<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { newAdminApi, newClientApi } from 'api'

const dialogVisible = ref(false)

const workflowList = ref<any>([])
const workflowInfoOptions = ref<any>([])

const { list } = defineProps<{
  list: any
}>()

const emits = defineEmits(['create'])

async function getAllWorkflows() {
  workflowList.value = await newClientApi.postDsbWorkflowProcessList({}).then((res) => res.data || [])
}

const form = reactive<any>({
  workflowName: '',
  infoToImport: []
})

async function open() {
  await getAllWorkflows()
  dialogVisible.value = true
}

async function resetInfo() {
  form.infoToImport = []
  if (form.workflowName) {
    const workflow = workflowList.value.find((item) => item.id === form.workflowName)
    const blob = await newAdminApi.getDocpalWorkflowVersionBpmnxml(
      {
        draftId: workflow.draftId,
        versionNumber: workflow.versionNumber
      },
      {
        format: 'blob',
        timeout: 0
      }
    )
    const xml = await blob.text()
    const { json } = bpmnStringToJson(xml)
    // get all form item
    const allFormInfo = new Map()
    // step 1 get all startEvent and userTask
    const allFormStep = [...json.definitions.process.startEvent, ...json.definitions.process.userTask]
    allFormStep.forEach((item) => {
      let formInfo = item.extensionElements['flowable:formProperty']
      if (formInfo) {
        if (!Array.isArray(formInfo)) formInfo = [formInfo]
        formInfo.forEach((formItem) => {
          allFormInfo.set(formItem.attr_id, formItem)
        })
      }
    })
    workflowInfoOptions.value = Array.from(allFormInfo.values())
    form.infoToImport = workflowInfoOptions.value.map((item) => item.attr_id)
  }
}

function close() {
  form.workflowName = ''
  form.infoToImport = []
  dialogVisible.value = false
}

function submit() {
  // check if workflowName is null or infoToImport is empty;
  // if workflowName is null, show error message
  // if infoToImport is empty, show error message
  // if both are not empty, submit.

  // deduplicate of form.infoToImport and list
  const addList = form.infoToImport.filter((item) => !list.find((l) => l.name.toLowerCase() === item.toLowerCase() || l.id.toLowerCase() === item.toLowerCase()))
  const result = addList.map((addItem) => {
    const item = workflowInfoOptions.value.find((t) => t.attr_id === addItem)
    const type = makeType(item.attr_type)
    return {
      name: item.attr_name,
      displayField: '',
      documentType: '',
      filterList: '',
      masterTable: '',
      id: item.attr_id,
      type: type,
      vocabulary: ''
    }
  })
  if (result.length > 0) {
    emits('create', result)
    close()
  } else {
    ElMessage.warning('No new field to add')
  }
}

function makeType(type: string) {
  switch (type) {
    case 'string':
      return 'short_text'
    case 'boolean':
      return 'boolean'
    case 'nubmer':
      return 'interger'
    case 'date':
      return 'date'
    default:
      return 'short_text'
  }
}

defineExpose({ open })
</script>

<template>
  <ElDialog v-model="dialogVisible" @close="close">
    <ElForm :model="form" label-position="top">
      <ElFormItem :label="$t('workflowEditor.name')">
        <ElSelect v-model="form.workflowName" :placeholder="$t('common_selectOccupancyContent')" filterable clearable @change="resetInfo">
          <ElOption v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('Workflow.fields')">
        <ElSelect v-model="form.infoToImport" :placeholder="$t('common_selectOccupancyContent')" filterable multiple clearable>
          <ElOption v-for="item in workflowInfoOptions" :key="item.attr_id" :label="item.attr_name" :value="item.attr_id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton id="CaseManagement__Detail__Information__ImportFromWorkflow__Submit" type="primary" @click="submit">
        {{ $t('common_submit') }}
      </ElButton>
    </template>
    <p>{{ $t('workflowEditor.workflowInfoIgnored') }}</p>
  </ElDialog>
</template>
