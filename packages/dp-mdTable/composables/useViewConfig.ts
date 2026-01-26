// composables/useViewConfig.ts
// Composable for managing view configurations (Card, Form, Detail, List)

import { ref, computed, type Ref, type InjectionKey } from 'vue'
import type {
  FormStructure,
  CardViewConfig,
  FormViewConfig,
  DetailViewConfig,
  ListViewConfig,
  ViewFieldConfig,
  FieldInfo,
  generateDefaultCardConfig,
  generateDefaultListConfig
} from '../types/view-config'

/**
 * Context key for view config injection
 */
export const ViewConfigContextKey: InjectionKey<ReturnType<typeof useViewConfig>> = Symbol('ViewConfigContext')

/**
 * Options for useViewConfig
 */
export interface UseViewConfigOptions {
  /** Initial form structure */
  initialConfig?: FormStructure
  /** Available fields for configuration */
  fields: Ref<FieldInfo[]>
  /** Callback when config changes */
  onConfigChange?: (config: FormStructure) => void
}

/**
 * Composable for managing view configurations
 */
export function useViewConfig(options: UseViewConfigOptions) {
  const { initialConfig, fields, onConfigChange } = options

  // Current form structure
  const formStructure = ref<FormStructure>(initialConfig || {})

  // Individual view configs as computed
  const cardConfig = computed({
    get: () => formStructure.value.card,
    set: (value) => {
      formStructure.value = { ...formStructure.value, card: value }
      onConfigChange?.(formStructure.value)
    }
  })

  const formConfig = computed({
    get: () => formStructure.value.form,
    set: (value) => {
      formStructure.value = { ...formStructure.value, form: value }
      onConfigChange?.(formStructure.value)
    }
  })

  const detailConfig = computed({
    get: () => formStructure.value.detail,
    set: (value) => {
      formStructure.value = { ...formStructure.value, detail: value }
      onConfigChange?.(formStructure.value)
    }
  })

  const listConfig = computed({
    get: () => formStructure.value.list,
    set: (value) => {
      formStructure.value = { ...formStructure.value, list: value }
      onConfigChange?.(formStructure.value)
    }
  })

  /**
   * Update card view configuration
   */
  function updateCardConfig(updates: Partial<CardViewConfig>) {
    const current = formStructure.value.card || { fields: [] }
    cardConfig.value = { ...current, ...updates }
  }

  /**
   * Update form view configuration
   */
  function updateFormConfig(updates: Partial<FormViewConfig>) {
    const current = formStructure.value.form || { fields: [] }
    formConfig.value = { ...current, ...updates }
  }

  /**
   * Update detail view configuration
   */
  function updateDetailConfig(updates: Partial<DetailViewConfig>) {
    const current = formStructure.value.detail || { widgets: [] }
    detailConfig.value = { ...current, ...updates }
  }

  /**
   * Update list view configuration
   */
  function updateListConfig(updates: Partial<ListViewConfig>) {
    const current = formStructure.value.list || { fields: [] }
    listConfig.value = { ...current, ...updates }
  }

  /**
   * Add a field to card view
   */
  function addCardField(fieldName: string, colSpan: number = 6) {
    const current = formStructure.value.card || { fields: [] }
    if (!current.fields.find(f => f.fieldName === fieldName)) {
      current.fields.push({ fieldName, colSpan })
      cardConfig.value = { ...current }
    }
  }

  /**
   * Remove a field from card view
   */
  function removeCardField(fieldName: string) {
    const current = formStructure.value.card
    if (current) {
      current.fields = current.fields.filter(f => f.fieldName !== fieldName)
      cardConfig.value = { ...current }
    }
  }

  /**
   * Update a field in card view
   */
  function updateCardField(fieldName: string, updates: Partial<ViewFieldConfig>) {
    const current = formStructure.value.card
    if (current) {
      const fieldIndex = current.fields.findIndex(f => f.fieldName === fieldName)
      if (fieldIndex !== -1) {
        current.fields[fieldIndex] = { ...current.fields[fieldIndex], ...updates }
        cardConfig.value = { ...current }
      }
    }
  }

  /**
   * Reorder card fields
   */
  function reorderCardFields(newOrder: ViewFieldConfig[]) {
    const current = formStructure.value.card || { fields: [] }
    cardConfig.value = { ...current, fields: newOrder }
  }

  /**
   * Generate default card config from available fields
   */
  function generateDefaultCard(): CardViewConfig {
    const displayableFields = fields.value.filter(f => 
      !f.isSystem && 
      f.type !== 6 && // Attachment
      f.type !== 14   // MagicLink (relation)
    )

    const titleField = displayableFields.find(f => f.type === 19 || f.type === 1)?.fieldName

    const cardFields = displayableFields.slice(0, 5).map(f => ({
      fieldName: f.fieldName,
      colSpan: 6
    }))

    return {
      fields: cardFields,
      titleField
    }
  }

  /**
   * Reset card config to default
   */
  function resetCardToDefault() {
    cardConfig.value = generateDefaultCard()
  }

  /**
   * Get field info by name
   */
  function getFieldInfo(fieldName: string): FieldInfo | undefined {
    return fields.value.find(f => f.fieldName === fieldName)
  }

  /**
   * Get available fields not yet in card config
   */
  const availableFieldsForCard = computed(() => {
    const usedFields = new Set(formStructure.value.card?.fields.map(f => f.fieldName) || [])
    return fields.value.filter(f => !usedFields.has(f.fieldName) && !f.isSystem)
  })

  /**
   * Load config from external source
   */
  function loadConfig(config: FormStructure) {
    formStructure.value = config
  }

  /**
   * Get the full form structure
   */
  function getFormStructure(): FormStructure {
    return formStructure.value
  }

  return {
    // State
    formStructure,
    cardConfig,
    formConfig,
    detailConfig,
    listConfig,

    // Card operations
    updateCardConfig,
    addCardField,
    removeCardField,
    updateCardField,
    reorderCardFields,
    resetCardToDefault,
    generateDefaultCard,
    availableFieldsForCard,

    // Form operations
    updateFormConfig,

    // Detail operations
    updateDetailConfig,

    // List operations
    updateListConfig,

    // Utility
    getFieldInfo,
    loadConfig,
    getFormStructure
  }
}

export type ViewConfigContext = ReturnType<typeof useViewConfig>
