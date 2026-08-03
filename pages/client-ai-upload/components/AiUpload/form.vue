<script lang="ts" setup>
const props = defineProps<{
  selectedDoc: any
  repearNameIdList?: string[]
}>()

const emit = defineEmits<{
  formChange: [payload: { fieldName: string; formModel: any; newValue: any; oldValue: any }]
}>()

const MetaFormRef = ref()

function handleFormChange(payload: any) {
  emit('formChange', payload)
}

defineExpose({
  init: (...args: any[]) => MetaFormRef.value?.init(...args),
  setData: (data: any) => MetaFormRef.value?.setData(data)
})
</script>

<template>
  <div class="panel-center">
    <div class="flex-x-between" v-show="props.selectedDoc" style="padding: var(--app-space-xs)">
      {{ props.selectedDoc?.name }}
    </div>
    <div
      :class="[
        'vformRender',
        { 'vform-dp-docName_color__danger': props.repearNameIdList?.includes(props.selectedDoc?.id) }
      ]"
      style="padding-top: var(--app-space-xs)"
    >
      <MetaRenderForm2
        ref="MetaFormRef"
        :showOcrLanguage="props.selectedDoc?.canOcr"
        :mode="allowFeature('AI_CLASSIFICATION') ? 'ai' : 'upload'"
        @formChange="handleFormChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel-center {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  padding: var(--app-space-xs) calc(var(--app-space-xs) * 2);

  .vformRender {
    min-height: 0;
    overflow: auto;
  }
}

.vform-dp-docName_color__danger {
  :deep(#vform-dp-docName .el-form-item__label) {
    color: #f56c6c;
  }
}

:deep(.formContainer) {
  margin: 0 var(--app-space-xs);
}
</style>
