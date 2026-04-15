<script setup lang="ts">
import { newAdminApi, newClientApi } from 'api'
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
const storeVariablesList = computed(() => {
  return getVariablesByType(['string'])
})

const documentTypeList = ref<any[]>([])
const allDocumentTemplates = ref<{ id: string; name: string; value: any }[]>([])
const formData = ref<{
  body: any
  output_mapping: any
}>({
  body: {},
  output_mapping: {}
})
const storeValue = ref('')
const variables = ref<any[]>([])
const path = ref<string[]>([])
const parentPathDisplay = ref('')

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

async function updateParentPathDisplay(pathId: string) {
  if (!pathId || pathId === '') return ''
  try {
    const newVar = await newClientApi.getDmsDocument({ idOrPath: pathId }).then((r) => r.data)
    if (!newVar) return pathId

    parentPathDisplay.value = newVar?.path || ''
  } catch (e) {
    console.log(e)
    return pathId
  }
}

function updateData() {
  formData.value.body.variables = variables.value.reduce(
    (acc: Record<string, any>, { id, value }: any) => {
      acc[id] = value
      return acc
    },
    {} as Record<string, any>
  )

  const mapping = {}
  mapping[storeValue.value] = '${generateDocumentId}'
  formData.value.output_mapping = mapping

  emits('update', {
    name: 'update-document-generation-data',
    config: formData.value
  })
}

async function getTemplateVariableList() {
  variables.value = []
  const fields: any = formData.value.body.variables

  const data = await newAdminApi.getDmsTemplateDocumentId(formData.value.body.templateId).then((r: any) => r.data)
  if (data.fileType === 'Word') {
    const variable = JsonSchemaToJsonData(data.templateVariable)
    if (!variable) {
      return
    }
    variables.value = variable
    return
  }

  // PDF or Excel
  const templateVariables: any[] = JSON.parse(data.templateVariable as string)
  variables.value = templateVariables.map((item: string) => {
    return {
      id: item,
      name: item,
      value: item in fields ? fields[item] : ''
    }
  })
}

async function getConfig() {
  const documentTypeData: any = await newClientApi.getDmsDocpalTypeActive().then((res) => res.data)
  documentTypeList.value = documentTypeData.filter((item: any) => !item.isFolder)

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
  loading.value = true
  try {
    await getTemplateVariableList()
    updateData()
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

function setPath(path: string) {
  formData.value.body.parentPath = path || ''
  updateData()
}

onMounted(async () => {
  await getConfig()
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

watch(
  () => formData.value.body?.parentPath,
  async (newPath) => {
    await updateParentPathDisplay(newPath || '')
  },
  {
    immediate: true
  }
)
</script>

<template>
  <el-form label-position="top" :model="formData">
    <el-form-item :label="t('Document Template')" prop="templateId">
      <el-select v-model="formData.body.templateId" :placeholder="t('common_selectedIsRequiredMsg')" @change="handleChangeTemplateId">
        <el-option v-for="item in allDocumentTemplates" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item label="Parent Path" prop="parentPath">
      <div class="parent-path-row">
        <el-input :model-value="parentPathDisplay" disabled />
        <el-popover placement="right" trigger="click">
          <template #reference>
            <el-button>Set Path</el-button>
          </template>
          <BrowsePathSelect v-model="path" @id="setPath" />
        </el-popover>
      </div>
    </el-form-item>
    <el-form-item label="Store Value" prop="storeValue">
      <el-select v-model="storeValue" @change="updateData">
        <el-option v-for="item in storeVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Document Type">
      <el-select v-model="formData.body.type" :placeholder="t('common_selectedIsRequiredMsg')" filterable @change="updateData">
        <el-option v-for="item in documentTypeList" :key="item.name" :label="item.name" :value="item.name" />
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

    <div v-if="variables.length > 0">
      <el-divider />
      <p>{{ $t('Template Variable') }}</p>
    </div>

    <template v-loading="loading" v-for="variable in variables" :key="variable.id">
      <el-form-item :label="variable.name">
        <el-select v-model="variable.value" @change="updateData">
          <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss">
.parent-path-row {
  display: flex;
  width: 100%;
  align-items: center;
}
</style>
