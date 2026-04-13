<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError, getGroupsSelectOption, getRoleSelectOption, useWorkflowAdditionalContext, type BaseOption } from '#imports'

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

const allUserRole = ref<BaseOption[]>([])
const allUserGroup = ref<BaseOption[]>([])
async function getSelect() {
  if (allUserRole.value.length == 0) {
    allUserRole.value = await getRoleSelectOption()
  }
  if (allUserGroup.value.length == 0) {
    allUserGroup.value = await getGroupsSelectOption()
  }
}

function handelChanged() {
  graphProvider.graph.value?.startBatch('update-user-task-permissions-data')
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
      candidate_roles: formData.value.candidateRoles,
      candidate_groups: formData.value.candidateGroup
    }
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider.graph.value?.stopBatch('update-user-task-permissions-data')
}

function refreshData() {
  const data = node.getData()
  if (data.config.candidate_roles.length > 0) {
    formData.value.sw = false
    formData.value.candidateRoles = data.config.candidate_roles
  }
  if (data.config.candidate_groups.length > 0) {
    formData.value.sw = true
    formData.value.candidateGroup = data.config.candidate_groups
  }
}

onMounted(async () => {
  await getSelect()
  refreshData()
  // useWorkflowAdditionalContext(refreshData)
})

watch(
  () => node,
  () => {
    if (node) {
      refreshData()
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
    <el-form :disabled="graphProvider.readonly.value" label-position="top">
      <el-switch v-model="formData.sw" size="small" active-text="Group" inactive-text="Roles" @change="handelChanged" />
      <el-form-item v-if="!formData.sw" :label="t('Candidate Role')">
        <el-select size="small" v-model="formData.candidateRoles" placeholder="Select Role" filterable clearable multiple @change="handelChanged">
          <el-option v-for="item in allUserRole" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="Candidate Group">
        <el-select size="small" v-model="formData.candidateGroup" placeholder="Select Group" filterable clearable multiple @change="handelChanged">
          <el-option v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
