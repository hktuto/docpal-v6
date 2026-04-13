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
        {{ formatFieldValue(config.titleField) || 'Untitled' }}
      </div>

      <!-- Subtitle -->
      <div v-if="config.subtitleField" class="card-subtitle">
        {{ formatFieldValue(config.subtitleField) || '' }}
      </div>

      <!-- Fields Grid -->
      <div v-if="config.fields.length > 0" class="card-fields">
        <template v-for="field in visibleFields" :key="field.fieldName">
          <div 
            class="card-field"
            :style="getFieldStyle(field)"
          >
            <div class="field-label">{{ getFieldLabel(field.fieldName) }}</div>
            <div class="field-value" :class="getFieldValueClass(field.fieldName)">
              <!-- Single Select -->
              <template v-if="getFieldType(field.fieldName) === ColumnFieldType.SingleSelect">
                <span 
                  v-if="getSelectOption(field.fieldName)" 
                  class="select-tag"
                  :style="{ '--select-color': getSelectOption(field.fieldName)?.color }"
                >
                  {{ getSelectOption(field.fieldName)?.label }}
                </span>
                <span v-else>-</span>
              </template>

              <!-- Multi Select -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.MultiSelect">
                <div v-if="getSelectOptions(field.fieldName)?.length" class="multi-select-tags">
                  <span 
                    v-for="option in getSelectOptions(field.fieldName)" 
                    :key="option.id"
                    class="select-tag"
                    :style="{ '--select-color': option?.color }"
                  >
                    {{ option?.label }}
                  </span>
                </div>
                <span v-else>-</span>
              </template>

              <!-- DateTime -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.DateTime">
                {{ formatDateTime(field.fieldName) }}
              </template>

              <!-- Number -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Number">
                {{ formatNumber(field.fieldName) }}
              </template>

              <!-- Currency -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Currency">
                {{ formatCurrency(field.fieldName) }}
              </template>

              <!-- Percent -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Percent">
                {{ formatPercent(field.fieldName) }}
              </template>

              <!-- Rating -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Rating">
                <span class="rating-stars">{{ formatRating(field.fieldName) }}</span>
              </template>

              <!-- Checkbox -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Checkbox">
                <el-checkbox :model-value="getFieldValue(field.fieldName)" disabled />
              </template>

              <!-- Member -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Member">
                {{ formatMember(field.fieldName) }}
              </template>

              <!-- Email -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Email">
                <a :href="`mailto:${getFieldValue(field.fieldName)}`" class="field-link" @click.stop>
                  {{ getFieldValue(field.fieldName) }}
                </a>
              </template>

              <!-- URL -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.URL">
                <a :href="getFieldValue(field.fieldName)" target="_blank" class="field-link" @click.stop>
                  {{ getFieldValue(field.fieldName) }}
                </a>
              </template>

              <!-- Phone -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Phone">
                {{ formatFieldValue(field.fieldName) }}
              </template>

              <!-- Attachment -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Attachment">
                <span v-if="getAttachmentCount(field.fieldName)" class="attachment-count">
                  <Icon name="lucide:paperclip" size="14" />
                  {{ getAttachmentCount(field.fieldName) }} files
                </span>
                <span v-else>-</span>
              </template>

              <!-- Default text display -->
              <template v-else>
                {{ formatFieldValue(field.fieldName) }}
              </template>
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
import { computed } from 'vue'
import type { CardViewConfig, ViewFieldConfig, FieldInfo } from '../../types/view-config'
import { ColumnFieldType } from '../../types/column-types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// Initialize dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)

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

// Get field type
function getFieldType(fieldName: string): ColumnFieldType | undefined {
  return getFieldInfo(fieldName)?.type
}

// Get field properties (display settings)
function getFieldProperties(fieldName: string): Record<string, any> {
  return getFieldInfo(fieldName)?.properties || {}
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

// Get field value class for styling
function getFieldValueClass(fieldName: string): string {
  const type = getFieldType(fieldName)
  if (type === undefined) return ''
  return `field-type-${ColumnFieldType[type].toLowerCase()}`
}

// ==================== Formatting Functions ====================

// Format DateTime with proper format settings
function formatDateTime(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (!value) return '-'
  
  const properties = getFieldProperties(fieldName)
  const { dateFormat, includeTime, dateTimeFormat, timezone: tz } = properties
  
  try {
    const format = includeTime && dateTimeFormat 
      ? `${dateFormat || 'YYYY-MM-DD'} ${dateTimeFormat}` 
      : (dateFormat || 'YYYY-MM-DD')
    
    let displayValue = dayjs(value).format(format)
    
    if (includeTime && tz) {
      displayValue = dayjs(value).tz(tz).format(format)
    }
    
    return displayValue
  } catch {
    return String(value)
  }
}

// Format Number with precision and thousands separator
function formatNumber(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  
  const properties = getFieldProperties(fieldName)
  const { precision = 0, showThouComma } = properties
  
  let formatted = Number(value).toFixed(precision)
  
  if (showThouComma) {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  
  return formatted
}

// Format Currency with symbol
function formatCurrency(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  
  const properties = getFieldProperties(fieldName)
  const { precision = 2, symbol = '$', symbolAlign = 'left' } = properties
  
  let formatted = Number(value).toFixed(precision)
  formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  if (symbolAlign === 'right') {
    return `${formatted} ${symbol}`
  }
  return `${symbol}${formatted}`
}

// Format Percent
function formatPercent(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  
  const properties = getFieldProperties(fieldName)
  const { precision = 0 } = properties
  
  return `${(Number(value) * 100).toFixed(precision)}%`
}

// Format Rating as stars
function formatRating(fieldName: string): string {
  const value = getFieldValue(fieldName)
  const properties = getFieldProperties(fieldName)
  const max = properties.max || 5
  const rating = Number(value) || 0
  return '★'.repeat(Math.min(rating, max)) + '☆'.repeat(Math.max(0, max - rating))
}

// Format Member
function formatMember(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (!value) return '-'
  
  if (typeof value === 'object') {
    return value.name || value.displayName || value.email || JSON.stringify(value)
  }
  return String(value)
}

// Get select option for SingleSelect
function getSelectOption(fieldName: string): { id: string; label: string; color: string } | null {
  const value = getFieldValue(fieldName)
  if (!value) return null
  
  const properties = getFieldProperties(fieldName)
  const options = properties.options || []
  
  return options.find((opt: any) => opt.id === value) || null
}

// Get select options for MultiSelect
function getSelectOptions(fieldName: string): { id: string; label: string; color: string }[] {
  const value = getFieldValue(fieldName)
  if (!value || !Array.isArray(value)) return []
  
  const properties = getFieldProperties(fieldName)
  const options = properties.options || []
  
  return value.map((id: string) => options.find((opt: any) => opt.id === id)).filter(Boolean)
}

// Get attachment count
function getAttachmentCount(fieldName: string): number {
  const value = getFieldValue(fieldName)
  if (!value) return 0
  if (Array.isArray(value)) return value.length
  return 1
}

// Generic format field value (fallback)
function formatFieldValue(fieldName: string): string {
  const value = getFieldValue(fieldName)
  if (value === null || value === undefined) return '-'
  
  const type = getFieldType(fieldName)
  
  // Handle specific types that don't have special rendering
  switch (type) {
    case ColumnFieldType.Phone:
      return String(value)
    
    case ColumnFieldType.MultiSelect:
      if (Array.isArray(value)) {
        const options = getSelectOptions(fieldName)
        return options.map(o => o.label).join(', ') || value.join(', ')
      }
      return String(value)
    
    default:
      return String(value)
  }
}

// Expose ColumnFieldType for template
const ColumnFieldTypeRef = ColumnFieldType
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
  
  // Select tag styling
  .select-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: var(--app-font-size-xs);
    background-color: var(--select-color, var(--el-fill-color));
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  // Multi-select tags container
  .multi-select-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .select-tag {
      flex-shrink: 0;
    }
  }
  
  // Rating stars
  .rating-stars {
    color: #f7ba2a;
    letter-spacing: 2px;
  }
  
  // Link styling
  .field-link {
    color: var(--el-color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  // Attachment count
  .attachment-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-secondary);
  }
}

.card-empty {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: var(--app-font-size-s);
}
</style>
