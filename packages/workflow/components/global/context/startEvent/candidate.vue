<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { getGroupsSelectOption } from '#imports'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider ) {
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
  node.setData({
    ...data,
    version: node.data.version + 1 || 0
  }, {
    overwrite: true,
    deep: true
  })
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
    <ElForm label-position="top" label-width="100px" size="small">
      <ElFormItem label="Start Candidate Group">
        <ElSelect v-model="candidateGroup" placeholder="Select Group" :disabled="graphProvider.readonly.value"
                  filterable clearable @change="candidateGroupChanged">
          <ElOption v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </div>
</template>