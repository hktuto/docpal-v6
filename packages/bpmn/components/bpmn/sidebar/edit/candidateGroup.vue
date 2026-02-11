<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { getGroupsSelectOption } from '#imports'

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


function refreshData() {
  // get candidateGroup
  const data = node.getData()
  candidateGroup.value = data.data['attr_flowable:candidateGroups'] || ''
}

function candidateGroupChanged(newVal: string) {
  const data = node.getData()
  let groupKey = ''
  Object.keys(data.data.extensionElements).forEach((key) => {
    if (key.includes('modeler:group-info-name-')) {
      groupKey = key
    }
  })
  if (groupKey) {
    delete data.data.extensionElements[groupKey]
  }
  // newVal is string, get gorup object from allUserGroup
  const group = allUserGroup.value.find((item) => item.id === newVal)
  if (group) {
    data.data.extensionElements['modeler:group-info-name-' + group.id] = {
      __cdata: group.id,
      ['attr_xmlns:modeler']: 'http://flowable.org/modeler'
    }
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
}

async function getUserGroup() {
  if (!allUserGroup.value || allUserGroup.value.length == 0) {
    const list = await getGroupsSelectOption()
    allUserGroup.value = list.sort((a: any, b: any) => a.label.localeCompare(b.label))
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

onMounted(async () => {
  await getUserGroup()
  refreshData()
  setUpListener()
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
      <ElFormItem label="Candidate Group">
        <ElSelect v-model="candidateGroup" placeholder="Select Group" :disabled="editorProvider.readonly.value"
                  filterable clearable @change="candidateGroupChanged">
          <ElOption v-for="item in allUserGroup" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </div>
</template>
