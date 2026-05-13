<script setup lang="ts">
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    processDefinitionId: string
  }
}>()
const workflowList = await getWorkflowList()
const processDefinitionId = ref<string>('')

function initForm() {
  processDefinitionId.value = config.processDefinitionId
}

function updateData() {
  emits('update', {
    name: 'update-sub-process-data',
    config: {
      processDefinitionId: processDefinitionId.value
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
    <el-form-item :label="t('Process Definition')">
      <el-select v-model="processDefinitionId" :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
