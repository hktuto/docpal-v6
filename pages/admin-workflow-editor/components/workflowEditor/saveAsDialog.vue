<script lang="ts" setup>
import { clientApi } from 'api'
import { ElDialog } from 'element-plus'

const { data, copyVersion } = defineProps<{
  data: any
  copyVersion: string
}>()

const emits = defineEmits(['close', 'created'])
const form = reactive({
  name: '',
  copyVersion: 'V1'
})

const rules = {
  name: [
    { required: true, message: '$t("workflowEditor.nameRequired")', trigger: 'blur' },
    { min: 2, max: 50, message: '$t("workflowEditor.nameLengthLimit")', trigger: 'blur' },
    { validator: validateName, trigger: 'blur' }
  ]
}

function validateName(rule: any, value: string, callback: any) {
  if (value === '') return callback(new Error('$t("workflowEditor.nameRequired")'))
  if (value.length < 2) return callback(new Error('$t("workflowEditor.nameLengthLimit")'))
  callback()
}

const opened = ref(false)
const loading = ref(false)

function close() {
  opened.value = false
  emits('close')
}

async function save() {
  try {
    loading.value = true
    const selectedItem = versionList.find(item => item.id === form.copyVersion || item.versionNumber === form.copyVersion)
    console.log('selectedItem', selectedItem, versionList, form.copyVersion)
    const blob = await clientApi.admin.getAdmindocpalWorkflowVersionBpmnxml({
      draftId: data.id,
      versionNumber: selectedItem.versionNumber
    }, {
      format: 'blob'
    })
    let { data: json } = await clientApi.admin.getAdmindocpalWorkflowVersionJson({
      draftId: data.id,
      versionNumber: selectedItem.versionNumber
    }, {})
    const timestamp = new Date().getTime()

    const newForm: any = new FormData()
    const newName = data.name + '_copy'
    const nameToId = newName.toLowerCase().replaceAll(' ', '_') + '_' + timestamp
    const text = await blob.text()
    const bpmnFile = text.replaceAll(data.key, nameToId).replaceAll(data.name, form.name)
    const newBlob = new Blob([bpmnFile], { type: 'text/xml;charset=utf-8' })
    newForm.append('name', form.name)
    newForm.append('attr_id', nameToId)
    newForm.append('versionId', 'V1')
    newForm.append('jsonValue', json || '')
    newForm.append('file', newBlob, 'workflow.bpmn.xml')
    newForm.append('isDraft', true)
    const { data: newVersionData } = await clientApi.api.postAdmindocpalWorkflowProcessDefinitionUpload({ requestDTO: {} }, newForm) as any
    if (!newVersionData) {
      throw new Error('newVersionData not found')

    }
    const forms = await getAllFormFromXML(bpmnFile, data.key, selectedItem.id)
    await batchSaveForm(forms, nameToId, newVersionData.latestVersionId)
    console.log('newVersionData', newVersionData)
    emits('created', newVersionData)
    loading.value = false
    opened.value = false
    // setTimeout(() => {
    //     emits('close')

    // }, 500);
  } catch (err) {
    console.log('save as error', err)
    emits('close')
  } finally {
    loading.value = false
    opened.value = false
  }
}

let versionList: any[] = []

async function getVersionList() {
  if (!data || !data.id) {
    throw new Error('data or data.id not found')
  }
  // get version list
  const response = await clientApi.admin.postAdmindocpalWorkflowVersionPage({
    pageNum: 0,
    pageSize: 100,
    draftId: data.id || data.draftId
  })
  versionList = response.data?.entryList || []
}

async function open() {
  await getVersionList()
  // 因為 props 有可能未更新，所以在 nextTick 中再次設置 form 的值
  nextTick(() => {
    form.name = data.name
    form.copyVersion = copyVersion
    opened.value = true
  })
}

defineExpose({ open })
</script>

<template>
  <ElDialog v-model="opened" :title="$t('workflow_editorNewWorkflow')" append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-position="top" class="demo-ruleForm"
             status-icon>
      <el-form-item :label="$t('workflowEditor.name')" prop="name">
        <el-input v-model="form.name" :placeholder="$t('workflowEditor.name')" />
      </el-form-item>
      <el-form-item :label="$t('workflowEditor.copyVersion')" prop="copyVersion">
        <el-select v-model="form.copyVersion" placeholder="Select">
          <el-option v-for="item in versionList" :key="item.versionNumber" :label="item.versionNumber"
                     :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="WorkflowEditor__SaveAsNewWorkflow__Cancel" @click="close">{{ $t('cancelText') }}</el-button>
      <el-button id="WorkflowEditor__SaveAsNewWorkflow__Save" type="primary" @click="save">
        {{ $t('common_save') }}
      </el-button>
    </template>
  </ElDialog>
</template>