<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'
import dayjs from 'dayjs'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const dueDate = ref<string>('')
const priority = ref<number>(5)

function initData() {
  const data = node.getData()
  dueDate.value = data.config?.human_task?.due_date || ''
  priority.value = data.config?.human_task?.priority || 5
}

function update() {
  graphProvider?.graph.value?.startBatch('update-user-task-additional-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      human_task: {
        ...nodeData.config.human_task,
        priority: priority.value
      }
    },
    version: (nodeData.version || 0) + 1
  }

  if (!!dueDate.value && dueDate.value !== '') {
    newData.config.human_task.due_date = dayjs(dueDate.value).format()
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-user-task-additional-data')
}

watch(
  () => node,
  () => {
    initData()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top" size="small">
    <el-form-item :label="t('Due Date')">
      <el-date-picker style="width: 100%" v-model="dueDate" type="datetime" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" @change="update" />
    </el-form-item>
    <el-form-item :label="t('Priority')">
      <el-input-number style="width: 100%" v-model="priority" :min="1" :max="5" @change="update" />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
