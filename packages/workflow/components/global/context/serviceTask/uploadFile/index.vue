<script setup lang="ts">
const { t } = useI18n()
const { getVariablesByType } = useVariablesProvide()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    http_request: {
      implementation: string
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
  return getVariablesByType(['string'], true)
})
const formData = ref<{
  body: any
}>({
  body: {}
})

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
  <el-form label-position="top">
    <el-form-item :label="t('Parent Path')">
      <el-input v-model="formData.body.parentPath" @change="updateData" />
    </el-form-item>
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
    <el-form-item :label="t('File Content Id')">
      <el-select v-model="formData.body.fileContentId" filterable @change="updateData">
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

<style scoped lang="scss"></style>
