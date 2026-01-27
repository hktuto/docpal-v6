<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { clientApi } from 'api'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('provider not found')
}

const allUserGroup = ref<any[]>([])
const candidateGroup = ref<string>('')

function candidateGroupChanged(newVal: string) {
  const data = node.getData()
  const group = allUserGroup.value.find((item) => item.id === newVal)
  if (group) {
    data.data['attr_flowable:candidateGroups'] = group.id
  } else {
    delete data.data['attr_flowable:candidateGroups']
  }
  node.setData({
    ...data,
    version: node.data.version + 1 || 0
  }, {
    overwrite: true,
    deep: true
  })
  console.log('candidateGroupChanged', data)
}

async function getUserGroup() {
  const data = await clientApi.api.postUcenterGroups().then(r => r.data)
  if (data.data) {
    allUserGroup.value = data.data.sort((a: any, b: any) => a.name.localeCompare(b.name))
  } else {
    allUserGroup.value = []
  }
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
  // get candidateGroup
  const data = node.getData()

  candidateGroup.value = data.data['attr_flowable:candidateGroups'] || ''

}

onMounted(async () => {
  await getUserGroup()
  refreshData()
  setUpListener()
})

</script>

<template>
  <div class="itemContainer">
    <ElForm label-position="top" label-width="100px" size="small">
      <ElFormItem label="Start Candidate Group">
        <ElSelect v-model="candidateGroup" placeholder="Select Group" :disabled="editorProvider.readonly.value"
                  filterable clearable @change="candidateGroupChanged">
          <ElOption v-for="item in allUserGroup" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </div>
</template>