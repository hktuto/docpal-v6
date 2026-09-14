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
    http_request: {
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
    }
    input_mapping: any
    output_mapping: any
  }
}>()
const loading = ref(false)
const { getVariablesByDisplayTypes } = useVariablesProvide()
const stringVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['text'], true)
})
const defVariablesOption = computed(() => {
  return getVariablesByDisplayTypes(['text', 'number', 'timestamp', 'date'], true)
})
const listVariablesOption = computed(() => {
  return getVariablesByDisplayTypes(['array', 'object'], true)
})
const storeVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['file'])
})
const allVariablesList = computed(() => {
  return getVariablesByDisplayTypes([], true)
})

const outputOptions = ref([
  { label: 'Word', value: 'word' },
  { label: 'PDF', value: 'pdf' },
  { label: 'HTML', value: 'html' }
])
const outputFileType = ref<string>('word')
const documentTypeList = ref<any[]>([])
const allDocumentTemplates = ref<
  {
    id: string
    name: string
    value: any
    type: string
    variable: string
  }[]
>([])
const formData = ref<{
  http_request: any
}>({
  http_request: {
    body: {
      templateId: '',
      parentPath: '',
      name: '',
      type: 'File',
      creator: '',
      variables: {}
    }
  }
})
const storeValue = ref<string>('')
const variables = ref<any[]>([])
const path = ref<string[]>([])
const parentPathDisplay = ref('')

async function initForm() {
  try {
    outputFileType.value = 'word'
    await getDocumentTemplate()
    formData.value.http_request = config.http_request

    if (formData.value.http_request.body.templateId === '') {
      variables.value = []
      return
    }

    storeValue.value = ''
    const keys = Object.keys(config.output_mapping)
    if (keys.length > 0) {
      storeValue.value = keys[0]
    }

    loading.value = true
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
  if (isWord) {
    const index = variables.value.findIndex((item: any) => item.id === 'system_output_file_type')
    if (index != -1) {
      variables.value[index] = {
        ...variables.value[index],
        value: outputFileType.value
      }
    } else {
      variables.value.push({
        id: 'system_output_file_type',
        name: 'Output File Type',
        type: 'text',
        value: outputFileType.value
      })
    }
  }

  formData.value.http_request.body.variables = variables.value.reduce(
    (acc: Record<string, any>, { id, value }: any) => {
      acc[id] = value
      return acc
    },
    {} as Record<string, any>
  )

  const mapping: any = {}
  if (!!storeValue.value && storeValue.value !== '') {
    mapping[storeValue.value] = '${id}'
  }

  emits('update', {
    name: 'update-document-generation-data',
    config: {
      http_request: formData.value.http_request,
      input_mapping: {},
      output_mapping: mapping
    }
  })
}

const isWord = ref<boolean>(false)
async function getTemplateVariableList() {
  variables.value = []
  const fields: any = formData.value.http_request.body.variables

  const find = allDocumentTemplates.value.find((item: any) => item.id === formData.value.http_request.body.templateId)
  if (!find) return

  isWord.value = false

  if (find.type === 'Word') {
    isWord.value = true

    const variable = JsonSchemaToJsonData(find.variable)
    if (!variable) {
      return
    }
    variable.push({
      id: 'system_output_file_type',
      name: 'Output File Type',
      type: 'text',
      value: ''
    })

    variables.value = variable.map((item: any) => {
      Object.keys(fields).forEach((key: string) => {
        if (item.id === key) {
          item.value = fields[key]
        }
        if (item.id === 'system_output_file_type') {
          outputFileType.value = fields[key]
        }
      })
      return item
    })
    return
  }

  // PDF or Excel
  const templateVariables: any[] = JSON.parse(find.variable as string)
  variables.value = templateVariables.map((item: string) => {
    return {
      id: item,
      name: item,
      value: item in fields ? fields[item] : ''
    }
  })
}

async function getDocumentType() {
  const documentTypeData: any = await newClientApi.getDmsDocpalTypeActive().then((res) => res.data)
  documentTypeList.value = documentTypeData.filter((item: any) => !item.isFolder)
}

async function getDocumentTemplate() {
  const documentData: any = await newAdminApi.getDmsTemplateDocument().then((r: any) => r.data)
  allDocumentTemplates.value = documentData.map((item: any) => {
    return {
      id: item.id,
      name: item.name,
      value: item,
      type: item.fileType,
      variable: item.templateVariable
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
  formData.value.http_request.body.parentPath = path || ''
  updateData()
}

onMounted(async () => {
  await getDocumentType()
})

watch(
  () => config,
  () => {
    if (JSON.stringify(config.http_request) !== JSON.stringify(formData.value.http_request)) {
      initForm()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => formData.value.http_request.body?.parentPath,
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
      <el-select v-model="formData.http_request.body.templateId" :placeholder="t('common_selectedIsRequiredMsg')" @change="handleChangeTemplateId">
        <el-option v-for="item in allDocumentTemplates" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item v-if="isWord" label="Output File Type">
      <el-select v-model="outputFileType" @change="updateData">
        <el-option v-for="item in outputOptions" :key="item.value" :label="item.label" :value="item.value" />
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
      <el-select v-model="storeValue" filterable clearable @change="updateData">
        <el-option v-for="item in storeVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />

    <el-form-item label="Document Type">
      <el-select v-model="formData.http_request.body.type" :placeholder="t('common_selectedIsRequiredMsg')" filterable @change="updateData">
        <el-option v-for="item in documentTypeList" :key="item.name" :label="item.name" :value="item.name" />
      </el-select>
    </el-form-item>
    <el-form-item label="Document Name" prop="name">
      <el-select v-model="formData.http_request.body.name" filterable :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Creator" prop="creator">
      <el-select v-model="formData.http_request.body.creator" filterable :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <div v-if="variables.length > 0">
      <el-divider />
      <p>{{ $t('Template Variable') }}</p>
    </div>

    <template v-loading="loading" v-for="variable in variables" :key="variable.id">
      <el-form-item v-if="variable.id !== 'system_output_file_type'" :label="variable.name">
        <el-select v-if="isWord" v-model="variable.value" @change="updateData" clearable filterable>
          <el-option v-if="variable.type !== 'table'" v-for="item in defVariablesOption" :key="item.id" :label="item.name" :value="item.id" />
          <el-option v-else v-for="item in listVariablesOption" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>

        <el-select v-else v-model="variable.value" @change="updateData" clearable filterable>
          <el-option v-for="item in allVariablesList" :key="item.id" :label="item.name" :value="item.id" />
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
