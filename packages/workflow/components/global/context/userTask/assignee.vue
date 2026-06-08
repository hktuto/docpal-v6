<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { getUserSelectOption, getGroupsSelectOption, getRoleSelectOption, type BaseOption } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { getVariablesByDisplayTypes } = useVariablesProvide()
const assignFieldList = ref<any[]>([])
const checkedTypes = ref<string[]>(['User'])
const allUserRole = ref<BaseOption[]>([])
const allUserGroup = ref<BaseOption[]>([])
const candidateUsers = ref<string>('')
const candidateGroups = ref<string[]>([])
const candidateRoles = ref<string[]>([])

const typeOptions = [
  { label: 'User', value: 'User' },
  { label: 'Groups', value: 'Groups' },
  { label: 'Roles', value: 'Roles' }
]

function initData() {
  const data = node.getData()
  const humanTask = data.config?.human_task || {}

  if (!!humanTask.assignee) {
    candidateUsers.value = humanTask.assignee
  } else {
    candidateUsers.value = '${__system__user_creator_id}'
  }

  candidateGroups.value = humanTask.candidate_groups || []
  candidateRoles.value = humanTask.candidate_roles || []

  const types: string[] = []
  if (candidateUsers.value.length > 0 || humanTask.assignee) {
    types.push('User')
  }
  if (candidateGroups.value.length > 0) {
    types.push('Groups')
  }
  if (candidateRoles.value.length > 0) {
    types.push('Roles')
  }
  checkedTypes.value = types.length > 0 ? types : ['User']
}

function updateNodeData() {
  graphProvider?.graph.value?.startBatch('update-form-assignee-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      human_task: {
        ...nodeData.config.human_task,
        assignee: checkedTypes.value.includes('User') ? candidateUsers.value : '${__system__user_creator_id}',
        candidate_groups: checkedTypes.value.includes('Groups') ? candidateGroups.value : [],
        candidate_roles: checkedTypes.value.includes('Roles') ? candidateRoles.value : []
      }
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-form-assignee-data')
}

function handleCheckboxChange(val: string[]) {
  if (val.length === 0) {
    checkedTypes.value = ['User']
  }
  updateNodeData()
}

async function getAssignFieldList() {
  const stringVariables = getVariablesByDisplayTypes(['text'], true)
  const userList = await getUserSelectOption()

  assignFieldList.value = [
    {
      label: 'Variables',
      options: stringVariables
    },
    {
      label: 'User',
      options: userList.map((item: any) => ({
        id: item.value,
        name: item.label
      }))
    }
  ]
}

async function getSelect() {
  await getAssignFieldList()
  allUserRole.value = await getRoleSelectOption()
  allUserGroup.value = await getGroupsSelectOption()
}

onMounted(async () => {
  await getSelect()
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
    <el-form-item label="Assignee Type">
      <el-checkbox-group v-model="checkedTypes" @change="handleCheckboxChange">
        <el-checkbox v-for="item in typeOptions" :key="item.value" :label="item.value">
          {{ item.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <template v-if="checkedTypes.includes('User')">
      <el-form-item label="Candidate Users" :required="checkedTypes.length == 1">
        <el-select v-model="candidateUsers" placeholder="Select Field" filterable clearable @change="updateNodeData">
          <el-option-group v-for="group in assignFieldList" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
          </el-option-group>
        </el-select>
      </el-form-item>
    </template>

    <template v-if="checkedTypes.includes('Groups')">
      <el-form-item label="Candidate Groups">
        <el-select v-model="candidateGroups" placeholder="Select Groups" filterable clearable multiple @change="updateNodeData">
          <el-option v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>

    <template v-if="checkedTypes.includes('Roles')">
      <el-form-item label="Candidate Roles">
        <el-select v-model="candidateRoles" placeholder="Select Roles" filterable clearable multiple @change="updateNodeData">
          <el-option v-for="item in allUserRole" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
  <el-divider />
</template>

<style lang="scss" scoped></style>
