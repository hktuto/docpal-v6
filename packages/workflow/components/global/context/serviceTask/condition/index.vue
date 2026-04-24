<script setup lang="ts">
const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
type ruleItemType = {
  type: 'is_null' | 'string_validation' | 'numbering_validation' | 'bool_validation'
  val_type: 'string' | 'number' | 'boolean'
  field: string
  condition: 'contains' | 'is' | 'eq' | 'gt'
  value: string
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    relation: 'AND' | 'OR'
    conditions: any[]
  }
}>()
const conditionLabel = ref({
  successLabel: '',
  failureLabel: ''
})

const form = ref([])

function init() {
  form.value = config.conditions || []
}

function updateNode() {
  if (form.value === config.conditions) return
  const data = {
    ...config,
    conditions: form.value
  }
  emits('update', { name: 'update-condition-data', config: data })
}

function addNewCondition() {
  const rules = [
    {
      type: 'string_validation',
      val_type: 'string',
      field: '',
      condition: 'contains',
      value: ''
    } as ruleItemType
  ]

  form.value.push({
    relation: 'OR',
    rule: rules
  })
  updateNode()
}

function deleteCondition(index: number) {
  form.value.splice(index, 1)
}

function updateCondition() {
  updateNode()
}

watch(
  () => config,
  async () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <p>Graph Label</p>
  <el-form label-position="top">
    <el-form-item label="Success">
      <el-input size="small" v-model="conditionLabel.successLabel" placeholder="Success" @change="updateNode" />
    </el-form-item>
    <el-form-item label="Failure">
      <el-input size="small" v-model="conditionLabel.failureLabel" placeholder="Failure" @change="updateNode" />
    </el-form-item>
  </el-form>

  <p>Conditions</p>
  <div class="conditions">
    <div v-for="(conditionsElement, index) in form" :key="index">
      <ContextServiceTaskConditionGroup :rule="conditionsElement.rule" :index="index" @delete="deleteCondition" @update="updateCondition" />
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
