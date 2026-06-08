<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { getGroupsSelectOption } from '#imports'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}

const allUserGroup = ref<any[]>([])
const candidateGroup = ref<string>('')

function candidateGroupChanged(newVal: string) {
  const data = node.getData()
  const group = allUserGroup.value.find((item) => item.value === newVal)
  if (group) {
    data.config.candidateGroups = group.value
  } else {
    delete data.config.candidateGroups
  }
  node.setData(
    {
      ...data,
      version: (data.version || 0) + 1
    },
    {
      overwrite: true,
      deep: true
    }
  )
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}

function refreshData() {
  const data = node.getData()
  candidateGroup.value = data.config.candidateGroups || ''
}

onMounted(async () => {
  if (!allUserGroup.value || allUserGroup.value.length == 0) {
    allUserGroup.value = await getGroupsSelectOption()
  }
  refreshData()
  setUpListener()
})
</script>

<template>
  <div class="itemContainer">
    <el-form label-position="top" label-width="100px" size="small" :disabled="graphProvider.readonly.value">
      <el-form-item label="Start Candidate Group">
        <el-select v-model="candidateGroup" placeholder="Select Group" filterable clearable @change="candidateGroupChanged">
          <el-option v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
