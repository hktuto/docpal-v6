<script lang="ts" setup>
const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="formSetupContainer">
    <div class="setupHeader">
      <h3>Form Setup</h3>
      <p>Define sections, fields, and extraction rules for this form</p>
    </div>
    <div class="setupContent">
      <div class="placeholder">
        <Icon name="lucide:file-cog" class="placeholderIcon" />
        <span>Form setup tools will be implemented here</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.formSetupContainer {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  padding: var(--app-space-m);
}

.setupHeader {
  margin-bottom: var(--app-space-m);

  h3 {
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    color: var(--app-text-color-secondary);
    margin: 0;
  }
}

.setupContent {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);

  .placeholderIcon {
    font-size: 64px;
    opacity: 0.5;
  }
}
</style>
