<script setup lang="ts">
import type { Node } from '@antv/x6'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()

type ruleItemType = {
  type: 'is_null' | 'string_validation' | 'numbering_validation' | 'bool_validation'
  val_type: 'text' | 'number' | 'boolean'
  field: string
  condition: 'contains' | 'is' | 'eq' | 'gt'
  value: string
}
const form = ref([])

function init() {
  const data = node.getData()
  form.value = data.config.condition.conditions || []
}

function update() {
  graphProvider?.graph.value?.startBatch('update-condition-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      condition: {
        ...nodeData.config.condition,
        conditions: form.value
      },
      input_mapping: {},
      output_mapping: {}
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-condition-data')
}

function addNewCondition() {
  const rules = [
    {
      type: 'string_validation',
      val_type: 'text',
      field: '',
      condition: 'contains',
      value: ''
    } as ruleItemType
  ]

  form.value.push({
    relation: 'OR',
    rule: rules
  })
  update()
}

function deleteCondition(index: number) {
  form.value.splice(index, 1)
}

function updateCondition() {
  update()
}

watch(
  () => node,
  () => {
    if (!!node) {
      init()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <SidebarLabel :node="node" />
  <p>Conditions</p>
  <div class="conditions">
    <div v-for="(conditionsElement, index) in form" :key="index">
      <ContextConditionGroup :rule="conditionsElement.rule" :index="index" @delete="deleteCondition" @update="updateCondition" />
    </div>
    <div :class="{ addNewContainer: true, readonly: graphProvider.readonly.value }" @click="addNewCondition">
      <Icon name="lucide:circle-plus" />
      <div class="label">AND</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.conditions {
  min-height: var(--app-space-s);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  height: 100%;
  overflow: auto;
  > * {
    width: 100%;
    flex: 0 0 auto;
  }
}

.addNewContainer {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-m);
  margin-block: var(--app-space-xs);
  &:hover {
    color: var(--app-main-color);
  }
  &.readonly {
    cursor: not-allowed;
    &:hover {
      color: initial;
    }
  }
}
</style>
