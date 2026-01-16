<script lang="ts" setup>
import { ElDialog } from 'element-plus'
import { clientApi } from 'api'
import formJson from './copy.vform.json'

const opened = ref(false)
const loading = ref(false)
const emits = defineEmits(['close'])

const { data, copyVersion } = defineProps<{
  data: any
  copyVersion: string
}>()

const form = reactive({
  name: '',
  copyVersion: 'V1'
})

function close() {
  opened.value = false
  emits('close')
}

const FormRendererRef = ref()

let versionList: any[] = []

async function getVersionList() {
  // get version list
  const response = await clientApi.api.postCaseTypesVersionPage({
    pageNum: 0,
    pageSize: 1000,
    caseTypeId: data.id || data.draftId
  }).then(r => r.data)
  versionList = response.entryList || []
  const copy = FormRendererRef.value.vFormRenderRef.getWidgetRef('copyVersion')
  copy.loadOptions(
    versionList.map((item) => ({
      label: item.versionNumber,
      value: item.versionNumber
    }))
  )
  const defaultValue = {
    name: data.name + '_copy',
    copyVersion: data.latestVersion
  }
  FormRendererRef.value.vFormRenderRef.setFormData(defaultValue)
}

async function open() {
  opened.value = true
  nextTick(() => {
    getVersionList()
  })
}

async function save() {
  // TODO : handle save as logic
  try {
    let formData = await FormRendererRef.value.getFormData()
    const versionId = versionList.find((item) => item.versionNumber === formData.copyVersion).id
    const params = {
      caseIdPrefix: formData.caseIdPrefix,
      caseIdDigit: formData.caseIdDigit,
      startNumber: formData.startNumber,
      name: formData.name,
      versionId: versionId
    }

    const copyRes: any = await clientApi.api.postCaseTypesIdCopy(data.id, params).then((res) => res.data)
    // get case detail

    const blob = (await clientApi.api.getCaseTypesIdDownloadXml(
      data.id,
      { versionNumber: formData.copyVersion },
      {
        format: 'blob'
      }
    )) as any
    const cmmnString = await blob.text()
    const v = cmmnToJson(cmmnString)
    const humanTasks = v.definitions.case.casePlanModel.humanTask || []

    // const {data} = await clientApi.api.postCaseTypesVersionVersionidNew(props.caseTypeId)
    //TODO : get all form in case and save as to new version
    // Step 1 : get all form in case
    // const allFrom = await xmlRef.value.getAllForm()
    for (let i = 0; i < humanTasks.length; i++) {
      const task = humanTasks[i] as any
      const response = await clientApi.api.getDmsFormPropertiesQuery({
        processKey: data.name,
        userTaskId: task.attr_id,
        versionId: versionId
      }).then(r => r.data)
      if (response && response.length > 0 && response[0].jsonValue && JSON.parse(response[0].jsonValue)) {
        const params: any = {
          processKey: copyRes?.name,
          userTaskId: task.attr_id,
          versionId: copyRes?.latestVersionId
        }
        params.jsonValue = response[0].jsonValue
        await clientApi.api.postDmsFormPropertiesSave(params).then(r => r.data)
      }
    }
    // TODO : copy form data
    opened.value = false
    emits('close')
  } catch (error: any) {
    console.error(error)
  }
}

defineExpose({ open })
</script>

<template>
  <ElDialog v-model="opened" append-to-body>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button @click="close">{{ $t('cancelText') }}</el-button>
      <el-button type="primary" @click="save">{{ $t('common_save') }}</el-button>
    </template>
  </ElDialog>
</template>
