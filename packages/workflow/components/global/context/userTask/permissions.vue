<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError, getUserSelectOption, getGroupsSelectOption, getRoleSelectOption, type BaseOption } from '#imports'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const formData = ref({
  sw: true,
  candidateRoles: [],
  candidateGroup: []
})

const allUser = ref<BaseOption[]>([])
const allUserRole = ref<BaseOption[]>([])
const allUserGroup = ref<BaseOption[]>([])
async function getSelect() {
  allUser.value = await getUserSelectOption()
  allUserRole.value = await getRoleSelectOption()
  allUserGroup.value = await getGroupsSelectOption()
}

function initData() {
  const data = node.getData()
  formData.value.sw = true
  formData.value.candidateRoles = []
  formData.value.candidateGroup = []

  if (data.config?.human_task?.candidate_roles?.length > 0) {
    formData.value.sw = false
    formData.value.candidateRoles = data.config?.human_task?.candidate_roles
  }
  if (data.config?.human_task?.candidate_groups?.length > 0) {
    formData.value.sw = true
    formData.value.candidateGroup = data.config?.human_task?.candidate_groups
  }
}

function handelChanged() {
  graphProvider?.graph.value?.startBatch('update-user-task-permissions-data')
  if (formData.value.sw) {
    formData.value.candidateRoles = []
  } else {
    formData.value.candidateGroup = []
  }

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      human_task: {
        ...nodeData.config.human_task,
        candidate_roles: formData.value.candidateRoles,
        candidate_groups: formData.value.candidateGroup
      }
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-user-task-permissions-data')
}

onMounted(async () => {
  await getSelect()
  // useWorkflowAdditionalContext(initData)
})

watch(
  () => node,
  () => {
    if (node) {
      initData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div>
    <el-form :disabled="graphProvider.readonly.value" label-position="top" size="small">
      <el-switch v-model="formData.sw" active-text="Group" inactive-text="Roles" @change="handelChanged" />
      <el-form-item v-if="!formData.sw" :label="t('Candidate Role')">
        <el-select v-model="formData.candidateRoles" placeholder="Select Role" filterable clearable multiple @change="handelChanged">
          <el-option v-for="item in allUserRole" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="Candidate Group">
        <el-select v-model="formData.candidateGroup" placeholder="Select Group" filterable clearable multiple @change="handelChanged">
          <el-option v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
