<script setup lang="ts">
import { newAdminApi } from 'api'
import type { Node } from '@antv/x6'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { getVariablesByType } = useVariablesProvide()
const variableList = computed(() => {
  return getVariablesByType(['string'])
})
const allDocumentTemplates = ref<{ id: string; name: string; value: any }[]>([])
const form = ref({
  templateId: '',
  parentPath: '',
  name: '',
  type: 'File',
  creator: '',
  variables: {
  }
})
const rules = {
  templateId: [
    { required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }
  ],
  parentPath: [
    { required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }
  ],
  name: [
    { required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }
  ],
  creator: [
    { required: true, message: t('common_selectedIsRequiredMsg'), trigger: 'change' }
  ]
}

async function getDocList() {
  const documentData: any = await newAdminApi.getDmsTemplateDocument().then((r) => r.data)
  allDocumentTemplates.value = documentData.map((item: any): { id: string; name: string; value: any } => {
    return {
      id: item.id,
      name: item.name,
      value: item
    }
  })
}

onMounted(async () => {
  await getDocList()
})
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top" :model="form" :rules="rules">
    <el-form-item :label="t('Document Template')" prop="templateId">
      <el-select v-model="form.templateId" :placeholder="t('common_selectedIsRequiredMsg')" >
        <el-option v-for="item in allDocumentTemplates" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Store Value" prop="parentPath">
      <el-select v-model="form.parentPath" :placeholder="t('common_selectedIsRequiredMsg')">
        <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Document Name" prop="name">
      <el-select v-model="form.name" :placeholder="t('common_selectedIsRequiredMsg')">
        <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Creator" prop="creator">
      <el-select v-model="form.creator" :placeholder="t('common_selectedIsRequiredMsg')">
        <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

  </el-form>
</template>

<style scoped lang="scss"></style>
