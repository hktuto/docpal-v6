<script setup lang="ts">
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { rule, index } = defineProps<{
  rule: any[]
  index: number
}>()
const emits = defineEmits(['delete', 'update'])

function addNewElement() {
  rule.push({
    type: 'string_validation',
    val_type: 'string',
    field: '',
    condition: 'contains',
    value: ''
  })
  emits('update', rule)
}

function updateItem(newVal: any, ruleIndex: number) {
  rule[ruleIndex] = newVal
  emits('update')
}

function deleteItem(ruleIndex: number) {
  rule.splice(ruleIndex, 1)
  if (rule.length === 0) {
    emits('delete', index)
  } else {
    emits('update')
  }
}
</script>

<template>
  <div class="conditionContainer">
    <div v-for="(ruleItem, ruleIndex) in rule" :key="ruleIndex" class="elementsContainer">
      <ContextConditionElement :element="ruleItem" @delete="deleteItem(ruleIndex)" @update="(newVal: any) => updateItem(newVal, ruleIndex)" />
      <div v-if="ruleIndex === rule.length - 1" :class="{ moreButtonContainer: true, readonly: graphProvider.readonly.value }" @click="addNewElement">
        <Icon name="lucide:plus" />
        <div class="label">OR</div>
      </div>
      <ElDivider v-else />
    </div>
  </div>
</template>

<style scoped lang="scss">
.conditionContainer {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  overflow: auto;
  padding: var(--app-space-s);
  border: 1px solid var(--app-grey-700);
  border-radius: var(--app-border-radius-m);
  position: relative;
}

.elementsContainer {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  position: relative;
}

.moreButtonContainer {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-s);
  position: relative;
  &.readonly {
    cursor: not-allowed;
    &:hover {
      color: initial;
    }
  }
  &:hover {
    color: var(--app-main-color);
  }
  &:before {
    content: '';
    width: 40%;
    height: 1px;
    background: var(--app-grey-800);
    display: block;
    position: absolute;
    top: 50%;
    left: 0;
  }
  &:after {
    content: '';
    width: 40%;
    height: 1px;
    background: var(--app-grey-800);
    display: block;
    position: absolute;
    top: 50%;
    right: 0;
  }
}

:deep(.el-divider--horizontal) {
  margin-block: var(--app-space-xxs);
}
</style>
