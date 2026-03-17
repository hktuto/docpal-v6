<template>
  <UiPopoverDialog
    ref="popoverDialogRef"
    :width="380"
    placement="bottom-start"
    :close-on-click-outside="true"
    :close-on-off-screen="true"
    :off-screen-threshold="80"
    @close="handleClose"
  >
    <div class="record-card-dialog">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <Icon name="lucide:alert-circle" size="24" />
        <span>{{ error }}</span>
      </div>

      <!-- Card Preview -->
      <template v-else-if="cardConfig && recordData">
        <CardPreview
          :config="cardConfig"
          :fields="targetFields"
          :sample-data="recordData"
        />
      </template>

      <!-- No Config State -->
      <div v-else class="empty-state">
        <Icon name="lucide:credit-card" size="24" />
        <span>No card configuration available</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CardViewConfig, FieldInfo } from '../../types/view-config'
import { ColumnContextKey, type ColumnContext } from '../../types/column-context'
import CardPreview from '../viewConfig/CardPreview.vue'

interface RecordCardParams {
  targetTableId: string
  recordId: string
  displayValue?: string
}

const emit = defineEmits<{
  close: []
  'open-detail': [params: RecordCardParams]
}>()

// Refs
const popoverDialogRef = ref()
const loading = ref(false)
const error = ref<string | null>(null)

// Data
const currentParams = ref<RecordCardParams | null>(null)
const cardConfig = ref<CardViewConfig | null>(null)
const targetFields = ref<FieldInfo[]>([])
const recordData = ref<Record<string, any> | null>(null)

// Inject ColumnContext which provides all the necessary functions
const columnContext = inject(ColumnContextKey)

/**
 * Open the dialog with a target element for positioning
 */
async function open(targetElement: HTMLElement | null, params: RecordCardParams) {
  // Reset state
  loading.value = true
  error.value = null
  cardConfig.value = null
  targetFields.value = []
  recordData.value = null
  currentParams.value = params

  // Open popover dialog
  popoverDialogRef.value?.open(targetElement)

  try {
    // Fetch data in parallel using ColumnContext functions
    const [config, fields, record] = await Promise.all([
      columnContext?.getTableCardConfig?.(params.targetTableId) ?? Promise.resolve(null),
      columnContext?.getFieldsForTable?.(params.targetTableId) ?? Promise.resolve([]),
      columnContext?.getRecordById?.(params.targetTableId, params.recordId) ?? Promise.resolve(null)
    ])

    // If no card config, generate a default one
    if (!config && fields.length > 0) {
      cardConfig.value = generateDefaultCardConfig(fields as FieldInfo[])
    } else {
      cardConfig.value = config
    }

    targetFields.value = fields as FieldInfo[]
    recordData.value = record

    if (!record) {
      error.value = 'Record not found'
    }
  } catch (e) {
    console.error('Failed to load card data:', e)
    error.value = e instanceof Error ? e.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
}

/**
 * Close the dialog
 */
function close() {
  popoverDialogRef.value?.close()
}

/**
 * Handle close event
 */
function handleClose() {
  currentParams.value = null
  emit('close')
}

/**
 * Generate a default card config when none is configured
 */
function generateDefaultCardConfig(fields: FieldInfo[]): CardViewConfig {
  // Find a suitable title field (first text field)
  const titleField = fields.find(f => 
    f.type === 1 || f.type === 11 // Text or MultiText
  )?.fieldName

  // Take first 5 displayable fields
  const displayFields = fields
    .filter(f => !f.isSystem && f.type !== 13) // Exclude system fields and attachments
    .slice(0, 5)
    .map(f => ({
      fieldName: f.fieldName,
      colSpan: 6
    }))

  return {
    fields: displayFields,
    titleField
  }
}

// Expose methods
defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
.record-card-dialog {
  min-width: 320px;
  max-width: 400px;
}

.loading-state {
  padding: var(--app-space-m);
}

.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xl);
  color: var(--el-text-color-secondary);
  text-align: center;
  
  .iconify {
    color: var(--el-text-color-placeholder);
  }
}

.error-state {
  .iconify {
    color: var(--el-color-danger);
  }
}
</style>
