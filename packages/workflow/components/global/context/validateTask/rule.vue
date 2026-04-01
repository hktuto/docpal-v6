<script setup lang="ts">
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { t } = useI18n()
const emits = defineEmits(['updateRule', 'deleteRule'])
const { element, index } = defineProps<{
  element: {
    expression: string
    message: string
  }
  index: number
}>()
const form = ref({
  expression: '',
  message: ''
})
const ruleFiletType = ref({
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean'
})

function deleteRule() {
  emits('deleteRule', index)
}

watch(
  () => element,
  () => {
    if (JSON.stringify(element) === JSON.stringify(form.value)) return
    form.value = { ...element }
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  form,
  () => {
    emits('updateRule', { ...form.value })
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="elementContainer">
    <div class="removeConditionContainer">
      <Icon name="lucide:trash" @click="deleteRule" />
    </div>

    <el-form label-position="top">
      <el-form-item :label="t('Expression')">
        <el-input v-model="form.expression" />
      </el-form-item>
      <el-form-item :label="t('Message')">
        <el-input v-model="form.message" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.elementContainer {
  width: 100%;
  position: relative;
}
.removeConditionContainer {
  position: absolute;
  top: var(--app-space-xs);
  right: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-s);
}
</style>
