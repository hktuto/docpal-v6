<script lang="ts" setup>
const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="splitPageContainer">
    <div class="splitHeader">
      <h3>Page Split Configuration</h3>
      <p>Configure how pages are split and organized within this form</p>
    </div>
    <div class="splitContent">
      <div class="placeholder">
        <Icon name="lucide:scissors" class="placeholderIcon" />
        <span>Page split tools will be implemented here</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.splitPageContainer {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  padding: var(--app-space-m);
}

.splitHeader {
  margin-bottom: var(--app-space-m);

  h3 {
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    color: var(--app-text-color-secondary);
    margin: 0;
  }
}

.splitContent {
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
