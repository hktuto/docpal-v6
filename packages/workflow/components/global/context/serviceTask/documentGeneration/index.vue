<script setup lang="ts">
import { newAdminApi } from 'api'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    implementation: string
    method: string
    url: string
    headers: any
    body: {
      templateId: string
      parentPath: string
      name: string
      type: string
      creator: string
      variables: {}
    }
    input_mapping: any
    output_mapping: any
  }
}>()
const loading = ref(false)
const { getVariablesByType } = useVariablesProvide()
const stringVariablesList = computed(() => {
  return getVariablesByType(['string'], true)
})
const allVariablesList = computed(() => {
  return getVariablesByType([], true)
})
const allDocumentTemplates = ref<{ id: string; name: string; value: any }[]>([])
const formData = ref<{
  body: any
}>({
  body: {}
})
const rules = {
  templateId: [{ required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }],
  parentPath: [{ required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }],
  name: [{ required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }],
  creator: [{ required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }]
}

const variables = ref<any>([])

async function initForm() {
  formData.value = config

  if (formData.value.body.templateId === '') {
    variables.value = []
    return
  }

  loading.value = true
  try {
    await getTemplateVariableList()
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

function updateData() {
  emits('update', {
    name: 'update-document-generation-data',
    config: formData.value
  })
}

async function getTemplateVariableList() {
  variables.value = []
  const fields: any = formData.value.body.variables

  const data = await newAdminApi.getDmsTemplateDocumentId(formData.body.templateId).then((r: any) => r.data)
  if (data.fileType === 'Word') {
    const variable = await JsonSchemaToJsonData(data.templateVariable)
    if (!variable) {
      return
    }
    variables.value = variable
    return
  }

  // PDF or Excel
  const templateVariables = JSON.parse(data.templateVariable as any)
  variables.value = templateVariables.map((item: string) => {
    return {
      id: item,
      name: item,
      value: item in fields ? fields[item] : ''
    }
  })
}

async function getDocList() {
  const documentData: any = await newAdminApi.getDmsTemplateDocument().then((r: any) => r.data)
  allDocumentTemplates.value = documentData.map((item: any): { id: string; name: string; value: any } => {
    return {
      id: item.id,
      name: item.name,
      value: item
    }
  })
}

async function handleChangeTemplateId() {
  updateData()
  loading.value = true
  try {
    await getTemplateVariableList()
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await getDocList()
})

watch(
  () => config,
  () => {
    initForm()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top" :model="formData" :rules="rules">
    <el-form-item :label="t('Document Template')" prop="templateId">
      <el-select v-model="formData.body.templateId" :placeholder="t('common_selectedIsRequiredMsg')" @change="handleChangeTemplateId">
        <el-option v-for="item in allDocumentTemplates" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Store Value" prop="parentPath">
      <el-select v-model="formData.body.parentPath" :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Document Name" prop="name">
      <el-select v-model="formData.body.name" :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Creator" prop="creator">
      <el-select v-model="formData.body.creator" :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <template v-loading="loading" v-for="variable in variables" :key="item.id">
      <el-form-item :label="variable.name">
        <el-select v-model="variable.value" @change="updateData">
          <el-option v-for="item in allVariablesList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
