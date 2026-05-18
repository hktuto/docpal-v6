<script setup lang="ts">
import { newClientApi } from 'api'

const { t } = useI18n()
const { getVariablesByDisplayTypes } = useVariablesProvide()
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
        parentPath: string
        name: string
        type: string
        fileContentId: string
        creator: string
        properties: any
      }
    }
    input_mapping: any
    output_mapping: any
  }
}>()
const stringVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['text'], true)
})
const fileVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['file'], true)
})
const formData = ref<{
  body: any
}>({
  body: {}
})
const parentPathDisplay = ref('')

function initForm() {
  formData.value = config.http_request
}

function updateData() {
  emits('update', {
    name: 'update-upload-file-data',
    config: {
      http_request: formData.value,
      input_mapping: {},
      output_mapping: {}
    }
  })
}

function setPath(path: string) {
  formData.value.body.parentPath = path || ''
  updateData()
}

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
  <el-form label-position="top">
    <el-form-item label="Parent Path" prop="parentPath">
      <div class="parent-path-row">
        <el-input :model-value="parentPathDisplay" disabled />
        <el-popover placement="right" trigger="click">
          <template #reference>
            <el-button>Set Path</el-button>
          </template>
          <BrowsePathSelect v-model="formData.body.parentPath" @id="setPath" />
        </el-popover>
      </div>
    </el-form-item>
    <el-form-item :label="t('File')">
      <el-select v-model="formData.body.fileContentId" filterable @change="updateData">
        <el-option v-for="item in fileVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />

    <el-form-item :label="t('Document Name')">
      <el-select v-model="formData.body.name" filterable @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('Document Type')">
      <el-select v-model="formData.body.type" filterable @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('Creator')">
      <el-select v-model="formData.body.creator" filterable @change="updateData">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.parent-path-row {
  display: flex;
  width: 100%;
  align-items: center;
}
</style>
