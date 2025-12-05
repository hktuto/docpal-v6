<script setup lang="ts">
import { adminApi } from 'api'

const props = defineProps<{
  workflowList: any[]
}>()

function handleEditWorkflow(item: any) {
  console.log('item', item)
}

type workflowItem = {
  oldId: string,
  newId: string,
  oldKey: string,
  newKey: string
}

const workflowList = ref<workflowItem[]>([])

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function handleCreateWorkflow(caseResult: any, masterTableResult: any, documentTemplateResult: any, emailTemplateResult: any, idGeneratorResult: any) {
  console.log('workflowList', props.workflowList)

  for (const item of Object.values(props.workflowList)) {
    const nameToId = item.name.toLowerCase().replaceAll(' ', '_') + '_' + Date.now()

    // replaceAll
    let bpmnFile = item.xml.replaceAll(item.key, nameToId).replaceAll(item.name, item.name)
    if (caseResult.length > 0) {
      caseResult.forEach((caseItem: any) => {
        bpmnFile = bpmnFile.replaceAll(caseItem.oldCaseTypeId, caseItem.caseTypeId)
      })
    }

    if (masterTableResult.length > 0) {
      masterTableResult.forEach((masterTableItem: any) => {
        bpmnFile = bpmnFile.replaceAll(masterTableItem.oldId, masterTableItem.newId)
      })
    }

    if (documentTemplateResult.length > 0) {
      documentTemplateResult.forEach((documentTemplateItem: any) => {
        bpmnFile = bpmnFile.replaceAll(documentTemplateItem.oldId, documentTemplateItem.newId)
      })
    }

    if (emailTemplateResult.length > 0) {
      emailTemplateResult.forEach((emailTemplateItem: any) => {
        bpmnFile = bpmnFile.replaceAll(emailTemplateItem.oldId, emailTemplateItem.newId)
      })
    }

    if (idGeneratorResult.length > 0) {
      idGeneratorResult.forEach((idGeneratorItem: any) => {
        bpmnFile = bpmnFile.replaceAll(idGeneratorItem.oldId, idGeneratorItem.newId)
      })
    }

    const blob = new Blob([bpmnFile], { type: 'text/xml;charset=utf-8' })
    const formJson = typeof item.styleJson.data === 'string' ? item.styleJson.data : JSON.stringify(item.styleJson.data)
    const form: any = new FormData()
    form.append('name', item.name)
    form.append('attr_id', nameToId)
    form.append('versionId', 'V1')
    form.append('jsonValue', formJson)
    form.append('file', blob, 'workflow.bpmn.xml')
    form.append('isDraft', true)
    const data = await adminApi.api.postWorkflowProcessDefinitionUpload({ requestDTO: {} }, form).then((res) => res.data)
    console.log("data", item.styleJson.data)
    if (!data || !data?.latestVersionId) {
      return
    }

    const draftId = data?.draftId
    
    // update field
    const params: any = {
      versionDraftId: data?.latestVersionId,
      version: '1',
      nodeName: 'global',
      draftId: draftId,
      validationRules: item.fields
    }
    await adminApi.api.postValidationRules(params)

    // update e-form
    for (const formItem of item.form) {
      await adminApi.api.postRelationSave({
        userTaskId: formItem.formId,
        processKey: nameToId,
        versionId: data?.latestVersionId,
        jsonValue: formItem.json
      }).then(r => r.data)
    }

    workflowList.value.push({
      oldId: item.id,
      newId: data.id,
      oldKey: item.key,
      newKey: nameToId
    })
  }
  return workflowList.value
}

defineExpose({
  handleCreateWorkflow
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.workflowList" :key="item.key">
      <el-col :span="4">
        <el-card style="max-height: 100px;">
          <div class="card-header" @dblclick="handleEditWorkflow(item)">
            <h4>{{ item.name }}</h4>
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}
</style>
