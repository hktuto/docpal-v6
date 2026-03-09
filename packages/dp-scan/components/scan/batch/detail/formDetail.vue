<script lang="ts" setup>
import { useBatchDetailContext } from '#imports'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const { documentLoading, selectedDocDetail } = context
</script>

<template>
  <div v-loading="documentLoading" class="formDetailContainer">
    <ScanBatchDetailSection
      v-for="section in selectedDocDetail?.setting?.fieldsSetting?.section"
      :key="section.section_id"
      :section="section"
    />
  </div>
</template>

<style lang="scss" scoped>
.formDetailContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  overflow-y: auto;
}
</style>
