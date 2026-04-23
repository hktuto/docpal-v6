<script setup lang="ts">
const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
type ruleItemType = {
  id: number
  type: 'is_null' | 'string_validation' | 'numbering_validation' | 'bool_validation'
  field: string
  condition: 'is' | 'eq' | 'gt'
  targetValue: string
}

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

function init() {}

function updateNode() {}

function addNewCondition() {
  const rules = [
    {
      type: 'string_validation',
      val_type: 'string',
      field: '',
      condition: 'contains',
      value: ''
    }
  ]

  form.value.push({
    relation: 'AND',
    rule: rules
  })
  console.log(123, form.value)
}

function deleteCondition() {}

function updateCondition() {}
</script>

<template>
  <div class="labelContainer">
    <div class="title">Graph Label</div>
    <div class="label">
      <div class="labelTitle">Success</div>
      <el-input v-model="conditionLabel.successLabel" placeholder="Success" @change="updateNode" />
    </div>
    <div class="label">
      <div class="labelTitle">Failure</div>
      <el-input v-model="conditionLabel.failureLabel" placeholder="Failure" @change="updateNode" />
    </div>
  </div>
  <div class="listContainer">
    <div class="title">Conditions</div>
    <div class="conditions">
      <div v-for="(element, index) in form" :key="index" class="group">
        <ContextServiceTaskConditionGroup
          :elements="element.rule"
          :index="index"
          @delete="deleteCondition"
          @update="(newVal: any) => updateCondition(newVal, index)"
        />
        <!--        <div v-if="!graphProvider.readonly.value" class="addNewContainer" @click="addNewCondition">-->
        <!--          <Icon name="lucide:circle-plus" />-->
        <!--          <div class="label">And</div>-->
        <!--        </div>-->
      </div>
      <div :class="{ addNewContainer: true, readonly: graphProvider.readonly.value }" @click="addNewCondition">
        <Icon name="lucide:circle-plus" />
        <div class="label">And</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.labelContainer {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  margin-block: var(--app-space-s);
  > * {
    width: 100%;
  }
}

.listContainer {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  width: 100%;
}

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
