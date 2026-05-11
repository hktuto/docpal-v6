<script lang="ts" setup>
import type { Node } from '@antv/x6'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { getVariablesByTags, deleteVariableItem } = useVariablesProvide()
const FormDialogRef = ref()
const variables = computed(() => {
  return getVariablesByTags()
})
const FormRef = ref()
const form = ref({
  name: ''
})

function nameChange(val: string) {
  graphProvider?.graph.value?.startBatch('update-name')
  node.setData(
    {
      ...node.data,
      version: (node.data.version || 0) + 1,
      name: val
    },
    { overwrite: true, deep: true, silent: false }
  )
  graphProvider?.graph.value?.stopBatch('update-name')
}

function refreshData() {
  try {
    form.value.name = node.getData()?.name
  } catch (e) {
    throw new Error('Workflow name not found')
  }
}

function checkIsSystemDefVariable(item: any) {
  return !item.id.startsWith('__system__')
}

function handleAdd() {
  FormDialogRef.value.handleOpen()
}

function handleEdit(item: any) {
  if (graphProvider?.readonly.value || !checkIsSystemDefVariable(item)) return
  FormDialogRef.value.handleOpen(item)
}

function handleRemove(item: any) {
  deleteVariableItem(node, item.id)
}

watch(
  () => node,
  async () => {
    if (node) {
      refreshData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  useWorkflowAdditionalContext(refreshData)
})
</script>

<template>
  <el-form ref="FormRef" label-position="top" :model="form" @submit.stop="() => {}" :disabled="graphProvider.readonly.value">
    <el-formItem label="Name" prop="name" :rules="[{ required: true, message: 'Workflow Name is required' }]">
      <el-input v-model="form.name" @change="nameChange" :disabled="graphProvider.readonly.value" placeholder="Name" />
    </el-formItem>
    <el-divider />

    <h4>
      {{ $t('Workflow Variables') }}
      <Icon v-if="!graphProvider.readonly.value" name="lucide:plus" @click="handleAdd" />
    </h4>
    <div v-for="(item, index) in variables" :key="item.id" class="formFieldItem">
      <div class="label" @click="handleEdit(item)">
        {{ item.name }}
      </div>
      <div v-if="!checkIsSystemDefVariable(item)" style="width: 84px">
        <span style="color: #ff0000">System Field</span>
      </div>
      <div v-if="!graphProvider.readonly.value && checkIsSystemDefVariable(item)" class="actions">
        <Icon name="lucide:square-pen" @click="handleEdit(item)" />
      </div>
      <div v-if="!graphProvider.readonly.value && checkIsSystemDefVariable(item)" class="actions">
        <Icon name="lucide:delete" @click="handleRemove(item)" />
      </div>
    </div>
  </el-form>
  <LazyContextVariableEditVariableDialog :node="node" ref="FormDialogRef" />
</template>

<style lang="scss" scoped>
.formFieldItem {
  display: grid;
  grid-template-columns: 1fr min-content min-content;
  justify-content: space-between;
  align-items: center;
  padding-block: var(--app-space-s);
  gap: calc(var(--app-space-s) / 2);
  font-size: var(--app-font-size-m);
  transition: all 0.2s ease-in-out;
}

.formFieldItem + .formFieldItem {
  border-top: 1px solid var(--app-grey-900);
}
</style>
