<template>
  <div 
    class="card-preview"
    :class="{ 'has-cover': hasCover }"
    :style="customStyles"
  >
    <!-- Cover Image -->
    <div v-if="hasCover" class="card-cover">
      <img 
        v-if="coverUrl" 
        :src="coverUrl" 
        alt="Cover"
        class="cover-image"
      />
      <div v-else class="cover-placeholder">
        <Icon name="lucide:image" size="32" />
      </div>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <!-- Title -->
      <div v-if="config.titleField" class="card-title">
        {{ getFieldValue(config.titleField) || 'Untitled' }}
      </div>

      <!-- Subtitle -->
      <div v-if="config.subtitleField" class="card-subtitle">
        {{ getFieldValue(config.subtitleField) || '' }}
      </div>

      <!-- Fields Grid -->
      <div v-if="config.fields.length > 0" class="card-fields">
        <template v-for="field in visibleFields" :key="field.fieldName">
          <div 
            class="card-field"
            :style="getFieldStyle(field)"
          >
            <div class="field-label">{{ getFieldLabel(field.fieldName) }}</div>
            <div class="field-value">
              <component
                :is="getFieldRenderer(field.fieldName)"
                v-if="getFieldRenderer(field.fieldName)"
                :value="getFieldValue(field.fieldName)"
                :field-info="getFieldInfo(field.fieldName)"
              />
              <span v-else>{{ formatFieldValue(field.fieldName) }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-else class="card-empty">
        <span>No fields configured</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { CardViewConfig, ViewFieldConfig, FieldInfo } from '../../types/view-config'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Card configuration */
  config: CardViewConfig
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Record data to display */
  sampleData?: Record<string, any>
}>()

// Default sample data for preview
const defaultSampleData: Record<string, any> = {
  title: 'Sample Record',
  name: 'John Doe',
  email: 'john@example.com',
  status: 'Active',
  amount: 1234.56,
  date: '2024-01-15',
  rating: 4,
  checkbox: true,
  description: 'This is a sample description for the card preview.'
}

// Use provided sample data or defaults
const recordData = computed(() => {
  return props.sampleData || generateSampleData()
})

// Generate sample data based on field types
function generateSampleData(): Record<string, any> {
  const data: Record<string, any> = {}
  
  props.fields.forEach(field => {
    switch (field.type) {
      case ColumnFieldType.Text:
      case ColumnFieldType.MultiText:
        data[field.fieldName] = field.fieldNameAlias || 'Sample Text'
        break
      case ColumnFieldType.Number:
      case ColumnFieldType.Currency:
        data[field.fieldName] = 1234.56
        break
      case ColumnFieldType.Percent:
        data[field.fieldName] = 0.75
        break
      case ColumnFieldType.Email:
        data[field.fieldName] = 'sample@email.com'
        break
      case ColumnFieldType.URL:
        data[field.fieldName] = 'https://example.com'
        break
      case ColumnFieldType.Phone:
        data[field.fieldName] = '+1 (555) 123-4567'
        break
      case ColumnFieldType.DateTime:
        data[field.fieldName] = new Date().toISOString()
        break
      case ColumnFieldType.Checkbox:
        data[field.fieldName] = true
        break
      case ColumnFieldType.Rating:
        data[field.fieldName] = 4
        break
      case ColumnFieldType.SingleSelect:
        data[field.fieldName] = 'Option A'
        break
      case ColumnFieldType.MultiSelect:
        data[field.fieldName] = ['Option A', 'Option B']
        break
      case ColumnFieldType.Member:
        data[field.fieldName] = { name: 'John Doe', avatar: '' }
        break
      default:
        data[field.fieldName] = `[${field.fieldNameAlias || field.fieldName}]`
    }
  })
  
  return data
}

// Check if cover is configured
const hasCover = computed(() => !!props.config.coverField)

// Get cover image URL
const coverUrl = computed(() => {
  if (!props.config.coverField) return null
  const coverValue = recordData.value[props.config.coverField]
  if (Array.isArray(coverValue) && coverValue.length > 0) {
    return coverValue[0].url || coverValue[0]
  }
  return typeof coverValue === 'string' ? coverValue : null
})

// Filter visible fields (not hidden, not used as title/subtitle/cover)
const visibleFields = computed(() => {
  const specialFields = new Set([
    props.config.titleField,
    props.config.subtitleField,
    props.config.coverField
  ].filter(Boolean))

  return props.config.fields.filter(f => 
    !f.hidden && !specialFields.has(f.fieldName)
  )
})

// Custom styles from advanced config
const customStyles = computed(() => {
  if (props.config.advanced?.customCSS) {
    // In a real implementation, this would be scoped/sandboxed
    return {}
  }
  return {}
})

// Get field info by name
function getFieldInfo(fieldName: string): FieldInfo | undefined {
  return props.fields.find(f => f.fieldName === fieldName)
}

// Get field label
function getFieldLabel(fieldName: string): string {
  const fieldConfig = props.config.fields.find(f => f.fieldName === fieldName)
  if (fieldConfig?.label) return fieldConfig.label
  
  const fieldInfo = getFieldInfo(fieldName)
  return fieldInfo?.fieldNameAlias || fieldName
}

// Get field value
function getFieldValue(fieldName: string): any {
  return recordData.value[fieldName]
}

// Get field style based on colSpan
function getFieldStyle(field: ViewFieldConfig): Record<string, string> {
  const span = field.colSpan || 6
  return {
    gridColumn: `span ${span}`
  }
}

// Format field value for display
function formatFieldValue(fieldName: string): string {
  const value = getFieldValue(fieldName)
  const fieldInfo = getFieldInfo(fieldName)
  
  if (value === null || value === undefined) return '-'
  
  if (!fieldInfo) return String(value)
  
  switch (fieldInfo.type) {
    case ColumnFieldType.DateTime:
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return String(value)
      }
    
    case ColumnFieldType.Checkbox:
      return value ? 'Yes' : 'No'
    
    case ColumnFieldType.Rating:
      const rating = Number(value) || 0
      return '★'.repeat(rating) + '☆'.repeat(5 - rating)
    
    case ColumnFieldType.Number:
    case ColumnFieldType.Currency:
      return new Intl.NumberFormat().format(Number(value))
    
    case ColumnFieldType.Percent:
      return `${(Number(value) * 100).toFixed(0)}%`
    
    case ColumnFieldType.MultiSelect:
      if (Array.isArray(value)) return value.join(', ')
      return String(value)
    
    case ColumnFieldType.Member:
      if (typeof value === 'object' && value.name) return value.name
      return String(value)
    
    default:
      return String(value)
  }
}

// Get custom renderer for field (placeholder for future implementation)
function getFieldRenderer(fieldName: string): any {
  // Future: return custom renderer component based on field type
  // For now, return null to use default text rendering
  return null
}
</script>

<style lang="scss" scoped>
.card-preview {

}

.card-cover {
  width: 100%;
  height: 160px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}

.card-content {
  padding: var(--app-space-m);
}

.card-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: var(--app-space-xs);
  line-height: 1.3;
  
  // Truncate long titles
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-subtitle {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  margin-bottom: var(--app-space-m);
  
  // Truncate long subtitles
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-fields {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--app-space-s);
}

.card-field {
  min-width: 0; // Allow text truncation
}

.field-label {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-value {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-empty {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: var(--app-font-size-s);
}
</style>
