<script lang="ts" setup>
import { useBatchDetailContext } from '#imports'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const { 
  documentLoading, 
  sectionsWithValues, 
  updateFieldValue, 
  addTableRow,
  saveDraft,
  confirm,
  currentSelectedDoc
} = context

const routerProvider = inject(MenuRouterKey)

// Loading states for buttons
const savingDraft = ref(false)
const confirming = ref(false)

// Update field value handler
function handleFieldChange(sectionId: string, fieldKey: string, value: any, rowIndex?: number) {
  updateFieldValue(sectionId, fieldKey, value, rowIndex)
}

// Add row handler
function handleAddRow(sectionId: string) {
  addTableRow(sectionId)
}

// Save draft handler
async function handleSaveDraft() {
  savingDraft.value = true
  try {
    await saveDraft()
    routerProvider?.message.success('Draft saved successfully')
  } catch (error) {
    routerProvider?.message.error('Failed to save draft')
  } finally {
    savingDraft.value = false
  }
}

// Confirm handler
async function handleConfirm() {
  confirming.value = true
  try {
    await confirm()
    routerProvider?.message.success('Document confirmed successfully')
  } catch (error) {
    routerProvider?.message.error('Failed to confirm document')
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div v-loading="documentLoading" class="formDetailContainer">
    <!-- Scrollable sections list -->
    <div class="sectionsList">
      <ScanBatchDetailSection
        v-for="section in sectionsWithValues"
        :key="section.section_id"
        :section="section"
        @field-change="handleFieldChange"
        @add-row="handleAddRow"
      />
    </div>
    
    <!-- Sticky action buttons -->
    <div class="actionButtons">
      <ElButton
        type="primary"
        size="default"
        :loading="savingDraft"
        :disabled="!currentSelectedDoc"
        @click="handleSaveDraft"
      >
        <Icon name="lucide:save" />
        Save Draft
      </ElButton>
      <ElButton
        type="success"
        size="default"
        :loading="confirming"
        :disabled="!currentSelectedDoc"
        @click="handleConfirm"
      >
        <Icon name="lucide:check-circle" />
        Confirm
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.formDetailContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.sectionsList {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
}

.actionButtons {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background-color: var(--app-bg-color);
  border-top: 1px solid var(--app-border-color);
  flex-shrink: 0;
}
</style>
