<script setup lang="ts">
import type { Node } from '@antv/x6'
import { getRoleSelectOption } from '#imports'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('provider not found')
}
graphProvider?.graph.value?.on('history:undo', () => {
  refreshData()
})

const candidateRoles = ref()
const allUserRole = ref([])

function refreshData() {
  const data = node.getData()
  if (data.data['attr_flowable:candidateRoles'] && data.data['attr_flowable:candidateRoles'] !== '') {
    candidateRoles.value = data.data['attr_flowable:candidateRoles'].split(', ').map((item: string) => item).filter((item: string) => item !== '')
  } else {
    candidateRoles.value = ''
  }
}

function candidateRoleChanged(newVal: any) {
  graphProvider?.graph.value?.startBatch('update-user-role-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }
  newData.data['attr_flowable:candidateRoles'] = newVal.join(', ') || ''
  node.setData(newData, { overwrite: true, deep: true, silent: false })

  graphProvider?.graph.value?.stopBatch('update-user-role-data')
}

onMounted(async () => {
  if (!allUserRole.value || allUserRole.value.length == 0) {
    allUserRole.value = await getRoleSelectOption()
  }
})

watch(() => node, () => {
  if (node) {
    refreshData()
  }
}, {
  immediate: true,
  deep: true
})
</script>

<template>
  <div class="itemContainer">
    <ElForm label-position="top" label-width="100px" size="small">
      <ElFormItem label="Candidate Role">
        <ElSelect v-model="candidateRoles" placeholder="Select Role" :disabled="editorProvider.readonly.value"
                  filterable @change="candidateRoleChanged" clearable multiple>
          <ElOption v-for="item in allUserRole" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style scoped lang="scss">

</style>