<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { type BaseOption, getGroupsSelectOption, getRoleSelectOption, getUserSelectOption } from '#imports'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { getVariablesByDisplayTypes } = useVariablesProvide()
const radio = ref<string>('user')
const allUser = ref<BaseOption[]>([])
const allUserRole = ref<BaseOption[]>([])
const allUserGroup = ref<BaseOption[]>([])

async function getSelect() {
  allUser.value = await getUserSelectOption()
  allUserRole.value = await getRoleSelectOption()
  allUserGroup.value = await getGroupsSelectOption()
}

const assignFieldList = computed(() => {
  const stringVariables = getVariablesByDisplayTypes(['text'], true)

  return [
    {
      label: 'Variables',
      options: stringVariables
    },
    {
      label: 'User',
      options: allUser.value.map((item: any) => ({
        id: item.value,
        name: item.label
      }))
    }
  ]
})

const formData = ref({
  assignee: '',
  candidateRoles: [],
  candidateGroup: []
})

function handelRadio() {
  switch (radio.value) {
    case 'user':
      formData.value.assignee = '${__system__user_creator_id}'
      formData.value.candidateRoles = []
      formData.value.candidateGroup = []
      break
    case 'roles':
      formData.value.assignee = ''
      formData.value.candidateGroup = []
      break
    case 'groups':
      formData.value.assignee = ''
      formData.value.candidateRoles = []
      break
    default:
  }
  updateData()
}

function initData() {
  const data = node.getData()
  radio.value = 'user'
  if (data.config?.human_task?.assignee) {
    formData.value.assignee = data.config?.human_task?.assignee
  } else {
    formData.value.assignee = '${__system__user_creator_id}'
  }

  if (data.config?.human_task?.candidate_roles?.length > 0) {
    radio.value = 'roles'
    formData.value.candidateRoles = data.config?.human_task?.candidate_roles
    return
  }
  if (data.config?.human_task?.candidate_groups?.length > 0) {
    radio.value = 'groups'
    formData.value.candidateGroup = data.config?.human_task?.candidate_groups
  }
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-form-assignee-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      human_task: {
        ...nodeData.config.human_task,
        assignee: formData.value.assignee,
        candidate_roles: formData.value.candidateRoles,
        candidate_groups: formData.value.candidateGroup
      }
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-form-assignee-data')
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
  <el-form label-position="top" label-width="100px" size="small" :disabled="graphProvider.readonly.value">
    <el-form-item label="Auto Assignee">
      <el-radio-group v-model="radio" @change="handelRadio">
        <el-radio value="user">User</el-radio>
        <el-radio value="roles">Roles</el-radio>
        <el-radio value="groups">Groups</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item v-if="radio === 'user'" label="User">
      <el-select v-model="formData.assignee" placeholder="Select Field" filterable @change="updateData">
        <el-option-group v-for="group in assignFieldList" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-form-item v-if="radio === 'roles'" :label="t('Candidate Role')">
      <el-select v-model="formData.candidateRoles" placeholder="Select Role" filterable multiple
                 @change="updateData">
        <el-option v-for="item in allUserRole" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="radio === 'groups'" label="Candidate Group">
      <el-select v-model="formData.candidateGroup" placeholder="Select Group" filterable multiple
                 @change="updateData">
        <el-option v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped></style>
