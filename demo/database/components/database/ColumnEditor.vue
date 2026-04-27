<script lang="ts" setup>
import type { Column, ColumnType, SelectOption, RelationConfig, NumberDisplayFormat, DateDisplayFormat, TextDisplayFormat, Database, RollupConfig, RollupAggregation } from '../../types/database'
import { useTable } from '../../composables/useDatabase'
import { extractFieldReferences, validateFormula, evaluateFormula } from '../../utils/formulaEvaluator'
import { formatNumber, formatDate, formatText } from '../../utils/displayFormatter'
import RollupColumnConfig from './RollupColumnConfig.vue'

const props = defineProps<{
  database: Database
  tableId: string
  column?: Column | null  // null = create mode, Column = edit mode
}>()

const emit = defineEmits<{
  close: []
  saved: [column: Column]
}>()

const { createColumn, updateColumn } = useTable(props.database.id, props.tableId)

const isEditMode = computed(() => !!props.column)

// Form state
const form = ref<{
  title: string
  field: string
  type: ColumnType
  width: number
  required: boolean
  // Type-specific
  options: SelectOption[]
  maxRating: number
  decimalPlaces: number
  dateFormat: string
  relationTableId: string
  relationDisplayField: string
  relationMultiple: boolean
  // Formula
  fxExpression: string
  fxResultType: 'number' | 'text' | 'date'
  fxDecimalPlaces: number
  // Rollup/Aggregation
  rollupRelationField: string
  rollupAggregateField: string
  rollupAggregation: RollupAggregation
  // Display formatting
  numberFormat: NumberDisplayFormat
  currencySymbol: string
  currencyPosition: 'prefix' | 'suffix'
  showThousandsSeparator: boolean
  prefix: string
  suffix: string
  dateDisplayFormat: DateDisplayFormat
  customDateFormat: string
  textFormat: TextDisplayFormat
  truncateLength: number
}>({
  title: '',
  field: '',
  type: 'text',
  width: 150,
  required: false,
  options: [],
  maxRating: 5,
  decimalPlaces: 2,
  dateFormat: 'YYYY-MM-DD',
  relationTableId: '',
  relationDisplayField: '',
  relationMultiple: false,
  fxExpression: '',
  fxResultType: 'number',
  fxDecimalPlaces: 2,
  // Rollup defaults
  rollupRelationField: '',
  rollupAggregateField: '',
  rollupAggregation: 'sum',
  // Display formatting defaults
  numberFormat: 'plain',
  currencySymbol: '$',
  currencyPosition: 'prefix',
  showThousandsSeparator: true,
  prefix: '',
  suffix: '',
  dateDisplayFormat: 'date',
  customDateFormat: 'YYYY-MM-DD',
  textFormat: 'plain',
  truncateLength: 50
})

// Initialize form from column if editing
watchEffect(() => {
  if (props.column) {
    const dc = props.column.displayConfig || {}
    form.value = {
      title: props.column.title,
      field: props.column.field,
      type: props.column.type,
      width: props.column.width || 150,
      required: props.column.required || false,
      options: props.column.options ? [...props.column.options] : [],
      maxRating: props.column.maxRating || 5,
      decimalPlaces: props.column.decimalPlaces || 2,
      dateFormat: props.column.dateFormat || 'YYYY-MM-DD',
      relationTableId: props.column.relationConfig?.tableId || '',
      relationDisplayField: props.column.relationConfig?.displayField || '',
      relationMultiple: props.column.relationConfig?.multiple || false,
      fxExpression: props.column.fxConfig?.expression || '',
      fxResultType: props.column.fxConfig?.resultType || 'number',
      fxDecimalPlaces: props.column.decimalPlaces || 2,
      // Rollup
      rollupRelationField: props.column.rollupConfig?.relationField || '',
      rollupAggregateField: props.column.rollupConfig?.aggregateField || '',
      rollupAggregation: props.column.rollupConfig?.aggregation || 'sum',
      // Display formatting
      numberFormat: dc.numberFormat || 'plain',
      currencySymbol: dc.currencySymbol || '$',
      currencyPosition: dc.currencyPosition || 'prefix',
      showThousandsSeparator: dc.showThousandsSeparator !== false,
      prefix: dc.prefix || '',
      suffix: dc.suffix || '',
      dateDisplayFormat: dc.dateFormat || 'date',
      customDateFormat: dc.customDateFormat || 'YYYY-MM-DD',
      textFormat: dc.textFormat || 'plain',
      truncateLength: dc.truncateLength || 50
    }
  } else {
    // Reset form for create mode
    form.value = {
      title: '',
      field: '',
      type: 'text',
      width: 150,
      required: false,
      options: [],
      maxRating: 5,
      decimalPlaces: 2,
      dateFormat: 'YYYY-MM-DD',
      relationTableId: '',
      relationDisplayField: '',
      relationMultiple: false,
      fxExpression: '',
      fxResultType: 'number',
      fxDecimalPlaces: 2,
      // Display formatting defaults
      numberFormat: 'plain',
      currencySymbol: '$',
      currencyPosition: 'prefix',
      showThousandsSeparator: true,
      prefix: '',
      suffix: '',
      dateDisplayFormat: 'date',
      customDateFormat: 'YYYY-MM-DD',
      textFormat: 'plain',
      truncateLength: 50
    }
  }
})

// Column types
const columnTypes: { value: ColumnType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'single-select', label: 'Single Select', icon: '☑️' },
  { value: 'multi-select', label: 'Multi Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'switch', label: 'Switch', icon: '🔘' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'user', label: 'User', icon: '👤' },
  { value: 'relation', label: 'Relation', icon: '🔗' },
  { value: 'attachment', label: 'Attachment', icon: '📎' },
  { value: 'fx', label: 'Formula', icon: '🔣' },
  { value: 'rollup', label: 'Aggregation', icon: '∑' }
]

// Get available tables for relation
const availableTables = computed(() => {
  return props.database.tables || []
})

// Get columns from selected relation table
const relationTableColumns = computed(() => {
  if (!form.value.relationTableId) return []
  const table = availableTables.value.find(t => t.id === form.value.relationTableId)
  return table?.columns.filter(c => c.type === 'text') || []
})

// Get current table for formula fields
const currentTable = computed(() => {
  console.log(props.database.tables)
  return props.database.tables.find(t => t.id === props.tableId)
})

// Get available fields for formula (numeric and other calculable fields)
const formulaAvailableFields = computed(() => {
  if (!currentTable.value) return []
  return currentTable.value.columns
    .filter(c => {
      // Exclude the current column being edited
      if (props.column && c.id === props.column.id) return false
      // Only include numeric-compatible types
      return ['number', 'rating'].includes(c.type)
    })
    .map(c => ({ field: c.field, title: c.title, type: c.type }))
})

// Validate the current formula
const formulaValidationError = computed(() => {
  if (!form.value.fxExpression) return null
  const availableFieldNames = formulaAvailableFields.value.map(f => f.field)
  return validateFormula(form.value.fxExpression, availableFieldNames)
})

// Test the formula with sample values
const formulaTestResult = computed(() => {
  if (!form.value.fxExpression || formulaValidationError.value) return null
  
  // Create mock context with sample values
  const mockContext: Record<string, number> = {}
  for (const field of formulaAvailableFields.value) {
    mockContext[field.field] = 100 // Use 100 as test value
  }
  
  const result = evaluateFormula(form.value.fxExpression, mockContext)
  return result
})

// Insert field reference at cursor position
const formulaInputRef = ref<HTMLInputElement | null>(null)

function insertFieldReference(field: string) {
  // Insert the field name directly (the evaluator will recognize it)
  form.value.fxExpression += field
}

// Preview formatted number
function getNumberPreview(): string {
  const sampleValue = 1234567.89
  const mockColumn: Partial<Column> = {
    type: 'number',
    decimalPlaces: form.value.decimalPlaces,
    displayConfig: {
      numberFormat: form.value.numberFormat,
      currencySymbol: form.value.currencySymbol,
      currencyPosition: form.value.currencyPosition,
      showThousandsSeparator: form.value.showThousandsSeparator,
      prefix: form.value.prefix,
      suffix: form.value.suffix
    }
  }
  return formatNumber(sampleValue, mockColumn as Column)
}

// Preview formatted date
function getDatePreview(): string {
  const sampleDate = new Date()
  const mockColumn: Partial<Column> = {
    type: 'date',
    displayConfig: {
      dateFormat: form.value.dateDisplayFormat,
      customDateFormat: form.value.customDateFormat
    }
  }
  return formatDate(sampleDate, mockColumn as Column)
}

// Preview formatted text
function getTextPreview(): string {
  const sampleText = 'Hello World Example Text That Might Be Long'
  const mockColumn: Partial<Column> = {
    type: 'text',
    displayConfig: {
      textFormat: form.value.textFormat,
      truncateLength: form.value.truncateLength
    }
  }
  return formatText(sampleText, mockColumn as Column)
}

// Auto-generate field name from title
watch(() => form.value.title, (newTitle) => {
  if (!isEditMode.value && newTitle) {
    form.value.field = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }
})

// Options management for select types
const newOptionLabel = ref('')
const optionColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#6b7280'
]

function addOption() {
  if (!newOptionLabel.value.trim()) return
  
  form.value.options.push({
    id: `opt-${Date.now()}`,
    label: newOptionLabel.value.trim(),
    color: optionColors[form.value.options.length % optionColors.length]
  })
  newOptionLabel.value = ''
}

function removeOption(index: number) {
  form.value.options.splice(index, 1)
}

// Save
function handleSave() {
  if (!form.value.title || !form.value.field) return
  
  const columnData: Partial<Column> = {
    title: form.value.title,
    field: form.value.field,
    type: form.value.type,
    width: form.value.width,
    required: form.value.required
  }
  
  // Type-specific data
  if (form.value.type === 'single-select' || form.value.type === 'multi-select') {
    columnData.options = form.value.options
  }
  
  if (form.value.type === 'rating') {
    columnData.maxRating = form.value.maxRating
  }
  
  if (form.value.type === 'number') {
    columnData.decimalPlaces = form.value.decimalPlaces
  }
  
  if (form.value.type === 'rollup') {
    columnData.decimalPlaces = form.value.decimalPlaces
  }
  
  if (form.value.type === 'date') {
    columnData.dateFormat = form.value.dateFormat
  }
  
  if (form.value.type === 'relation') {
    columnData.relationConfig = {
      tableId: form.value.relationTableId,
      displayField: form.value.relationDisplayField,
      multiple: form.value.relationMultiple
    }
  }
  
  if (form.value.type === 'fx') {
    columnData.fxConfig = {
      expression: form.value.fxExpression,
      resultType: form.value.fxResultType
    }
    columnData.decimalPlaces = form.value.fxDecimalPlaces
  }
  
  if (form.value.type === 'rollup') {
    columnData.rollupConfig = {
      relationField: form.value.rollupRelationField,
      aggregateField: form.value.rollupAggregateField,
      aggregation: form.value.rollupAggregation
    }
    columnData.decimalPlaces = form.value.decimalPlaces
  }
  
  // Build display configuration
  columnData.displayConfig = {}
  
  // Number display config
  if (form.value.type === 'number' || form.value.type === 'fx' || form.value.type === 'rollup') {
    columnData.displayConfig.numberFormat = form.value.numberFormat
    if (form.value.numberFormat === 'currency') {
      columnData.displayConfig.currencySymbol = form.value.currencySymbol
      columnData.displayConfig.currencyPosition = form.value.currencyPosition
    }
    columnData.displayConfig.showThousandsSeparator = form.value.showThousandsSeparator
    if (form.value.prefix) columnData.displayConfig.prefix = form.value.prefix
    if (form.value.suffix) columnData.displayConfig.suffix = form.value.suffix
  }
  
  // Date display config
  if (form.value.type === 'date') {
    columnData.displayConfig.dateFormat = form.value.dateDisplayFormat
    if (form.value.dateDisplayFormat === 'custom') {
      columnData.displayConfig.customDateFormat = form.value.customDateFormat
    }
  }
  
  // Text display config
  if (form.value.type === 'text' || form.value.type === 'textarea') {
    columnData.displayConfig.textFormat = form.value.textFormat
    if (form.value.textFormat === 'truncate') {
      columnData.displayConfig.truncateLength = form.value.truncateLength
    }
  }
  
  let savedColumn: Column | undefined
  
  if (isEditMode.value && props.column) {
    savedColumn = updateColumn(props.column.id, columnData)
  } else {
    savedColumn = createColumn(columnData)
  }
  
  if (savedColumn) {
    emit('saved', savedColumn)
    emit('close')
  }
}
</script>

<template>
  <el-dialog
    :model-value="true"
    :title="isEditMode ? 'Edit Column' : 'Add Column'"
    width="560px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-form label-position="top" @submit.prevent="handleSave">
      <!-- Basic Info -->
      <el-form-item label="Column Name" required>
        <el-input
          v-model="form.title"
          placeholder="Enter column name"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Column Type" required>
            <el-select
              v-model="form.type"
              style="width: 100%"
              :disabled="isEditMode"
            >
              <el-option
                v-for="t in columnTypes"
                :key="t.value"
                :value="t.value"
                :label="`${t.icon} ${t.label}`"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Width (px)">
            <el-input-number
              v-model="form.width"
              :min="80"
              :max="500"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-checkbox v-model="form.required">Required field</el-checkbox>
      </el-form-item>

      <!-- Type-specific options -->
      
      <!-- Single/Multi Select Options -->
      <template v-if="form.type === 'single-select' || form.type === 'multi-select'">
        <el-divider>Select Options</el-divider>
        <el-form-item label="Options">
          <div class="options-list">
            <div
              v-for="(opt, index) in form.options"
              :key="opt.id"
              class="option-item"
            >
              <div
                class="option-color"
                :style="{ backgroundColor: opt.color }"
              />
              <el-input v-model="opt.label" size="small" style="flex: 1" />
              <el-color-picker v-model="opt.color" size="small" />
              <el-button
                text
                size="small"
                type="danger"
                @click="removeOption(index)"
              >
                ×
              </el-button>
            </div>
            <div class="add-option">
              <el-input
                v-model="newOptionLabel"
                placeholder="Add option..."
                size="small"
                @keyup.enter="addOption"
              />
              <el-button size="small" @click="addOption">Add</el-button>
            </div>
          </div>
        </el-form-item>
      </template>

      <!-- Rating options -->
      <template v-if="form.type === 'rating'">
        <el-divider>Rating Options</el-divider>
        <el-form-item label="Max Rating">
          <el-input-number
            v-model="form.maxRating"
            :min="1"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>
      </template>

      <!-- Date options -->
      <template v-if="form.type === 'date'">
        <el-divider>Date Display Options</el-divider>
        
        <el-form-item label="Display Format">
          <el-select v-model="form.dateDisplayFormat" style="width: 100%">
            <el-option value="date" label="Date only (Jan 15, 2024)" />
            <el-option value="datetime" label="Date & Time (Jan 15, 2024, 2:30 PM)" />
            <el-option value="time" label="Time only (2:30 PM)" />
            <el-option value="relative" label="Relative (2 days ago)" />
            <el-option value="custom" label="Custom format" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.dateDisplayFormat === 'custom'" label="Custom Format">
          <el-input v-model="form.customDateFormat" placeholder="YYYY-MM-DD HH:mm" />
          <div class="form-hint">
            YYYY=year, MM=month, DD=day, HH=hour, mm=minute
          </div>
        </el-form-item>

        <el-form-item label="Preview">
          <div class="format-preview">
            {{ getDatePreview() }}
          </div>
        </el-form-item>
      </template>

      <!-- Text options -->
      <template v-if="form.type === 'text' || form.type === 'textarea'">
        <el-divider>Text Display Options</el-divider>
        
        <el-form-item label="Text Transform">
          <el-select v-model="form.textFormat" style="width: 100%">
            <el-option value="plain" label="As entered" />
            <el-option value="uppercase" label="UPPERCASE" />
            <el-option value="lowercase" label="lowercase" />
            <el-option value="capitalize" label="Capitalize Each Word" />
            <el-option value="truncate" label="Truncate (show first N chars...)" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.textFormat === 'truncate'" label="Max Characters">
          <el-input-number
            v-model="form.truncateLength"
            :min="10"
            :max="500"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Preview">
          <div class="format-preview">
            {{ getTextPreview() }}
          </div>
        </el-form-item>
      </template>

      <!-- Number options -->
      <template v-if="form.type === 'number' || form.type === 'rollup'">
        <el-divider>Number Display Options</el-divider>
        
        <el-form-item label="Display Format">
          <el-select v-model="form.numberFormat" style="width: 100%">
            <el-option value="plain" label="Plain (1,234.56)" />
            <el-option value="currency" label="Currency ($1,234.56)" />
            <el-option value="compact" label="Compact (1.2K, 3.5M)" />
            <el-option value="percentage" label="Percentage (75%)" />
            <el-option value="accounting" label="Accounting ((1,234.56) for negative)" />
          </el-select>
        </el-form-item>

        <!-- Currency options -->
        <template v-if="form.numberFormat === 'currency'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Currency Symbol">
                <el-input v-model="form.currencySymbol" placeholder="$" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Position">
                <el-select v-model="form.currencyPosition" style="width: 100%">
                  <el-option value="prefix" label="Before ($100)" />
                  <el-option value="suffix" label="After (100$)" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Decimal Places">
              <el-input-number
                v-model="form.decimalPlaces"
                :min="0"
                :max="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Thousands Separator">
              <el-switch v-model="form.showThousandsSeparator" />
              <span class="switch-label">{{ form.showThousandsSeparator ? '1,234' : '1234' }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Prefix">
              <el-input v-model="form.prefix" placeholder="e.g., ~ or ≈" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Suffix">
              <el-input v-model="form.suffix" placeholder="e.g., USD, kg, pcs" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Preview -->
        <el-form-item label="Preview">
          <div class="format-preview">
            {{ getNumberPreview() }}
          </div>
        </el-form-item>
      </template>

      <!-- Relation options -->
      <template v-if="form.type === 'relation'">
        <el-divider>Relation Options</el-divider>
        <el-form-item label="Related Table" required>
          <el-select
            v-model="form.relationTableId"
            placeholder="Select table..."
            style="width: 100%"
          >
            <el-option
              v-for="t in availableTables"
              :key="t.id"
              :value="t.id"
              :label="t.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Display Field" required>
          <el-select
            v-model="form.relationDisplayField"
            placeholder="Select field to display..."
            style="width: 100%"
            :disabled="!form.relationTableId"
          >
            <el-option
              v-for="c in relationTableColumns"
              :key="c.id"
              :value="c.field"
              :label="c.title"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.relationMultiple">Allow multiple values</el-checkbox>
        </el-form-item>
      </template>

      <!-- Rollup/Aggregation options -->
      <template v-if="form.type === 'rollup'">
        <el-divider>Aggregation Configuration</el-divider>
        
        <RollupColumnConfig
          :columns="availableTables.find(t => t.id === tableId)?.columns || []"
          :database="database"
          :model-value="{
            relationField: form.rollupRelationField,
            aggregateField: form.rollupAggregateField,
            aggregation: form.rollupAggregation
          }"
          @update:model-value="(val) => {
            form.rollupRelationField = val.relationField
            form.rollupAggregateField = val.aggregateField
            form.rollupAggregation = val.aggregation
          }"
        />
      </template>

      <!-- Formula options -->
      <template v-if="form.type === 'fx'">
        <el-divider>Formula Configuration</el-divider>
        
        <!-- Available Fields -->
        <el-form-item label="Available Fields">
          <div class="available-fields">
            <el-tag
              v-for="field in formulaAvailableFields"
              :key="field.field"
              size="small"
              class="field-tag"
              @click="insertFieldReference(field.field)"
            >
              {{ field.title }} <code>{{ field.field }}</code>
            </el-tag>
            <span v-if="formulaAvailableFields.length === 0" class="no-fields">
              No numeric fields available. Add number or rating columns first.
            </span>
          </div>
          <div class="form-hint">
            Click a field to insert it into the formula.
          </div>
        </el-form-item>

        <!-- Formula Expression -->
        <el-form-item label="Formula Expression" required>
          <el-input
            ref="formulaInputRef"
            v-model="form.fxExpression"
            type="textarea"
            :rows="3"
            placeholder="e.g., unitPrice * qty * (1 - discount/100) * (1 + tax/100)"
            :class="{ 'formula-error': formulaValidationError }"
          />
          <div v-if="formulaValidationError" class="formula-validation-error">
            ⚠️ {{ formulaValidationError }}
          </div>
          <div v-else-if="formulaTestResult" class="formula-test-result">
            <span v-if="formulaTestResult.error">❌ {{ formulaTestResult.error }}</span>
            <span v-else>✓ Test result (with value 100 for all fields): <strong>{{ formulaTestResult.value }}</strong></span>
          </div>
        </el-form-item>

        <!-- Formula Syntax Help -->
        <el-collapse>
          <el-collapse-item title="📖 Formula Syntax Help">
            <div class="syntax-help">
              <h4>Field References</h4>
              <p>Reference other columns by their field name. Both formats work:</p>
              <ul>
                <li><code>fieldName</code> - plain field name</li>
                <li><code>{'{'}fieldName{'}'}</code> - with curly braces</li>
              </ul>
              
              <h4>Operators</h4>
              <ul>
                <li><code>+</code> Addition</li>
                <li><code>-</code> Subtraction</li>
                <li><code>*</code> Multiplication</li>
                <li><code>/</code> Division</li>
                <li><code>( )</code> Grouping</li>
              </ul>
              
              <h4>Percentages</h4>
              <p>Use <code>value%</code> which converts to <code>value/100</code>.</p>
              <p>Example: <code>15%</code> = <code>0.15</code></p>
              
              <h4>Example Formulas</h4>
              <ul>
                <li><code>unitPrice * qty</code> - Simple multiplication</li>
                <li><code>(unitPrice * qty) * (1 - discount/100)</code> - With discount</li>
                <li><code>(unitPrice * qty) * (1 - discount/100) * (1 + tax/100)</code> - With discount + tax</li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>

        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :span="12">
            <el-form-item label="Result Type">
              <el-select v-model="form.fxResultType" style="width: 100%">
                <el-option value="number" label="Number" />
                <el-option value="text" label="Text" disabled />
                <el-option value="date" label="Date" disabled />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Decimal Places">
              <el-input-number
                v-model="form.fxDecimalPlaces"
                :min="0"
                :max="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="emit('close')">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="!form.title || !form.field"
        @click="handleSave"
      >
        {{ isEditMode ? 'Save Changes' : 'Add Column' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.form-hint {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  margin-top: var(--app-space-xxs);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  width: 100%;
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.option-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.add-option {
  display: flex;
  gap: var(--app-space-xs);
}

// Formula styles
.available-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-s);
  min-height: 40px;
  
  .field-tag {
    cursor: pointer;
    transition: all 0.15s ease;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    code {
      margin-left: 4px;
      font-size: var(--app-font-size-xs);
      opacity: 0.7;
    }
  }
  
  .no-fields {
    color: var(--app-text-color-placeholder);
    font-size: var(--app-font-size-s);
    padding: var(--app-space-xs);
  }
}

.formula-error {
  :deep(.el-textarea__inner) {
    border-color: var(--app-danger-color);
  }
}

.formula-validation-error {
  margin-top: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background: var(--app-danger-color-light);
  color: var(--app-danger-color);
  border-radius: var(--app-border-radius-s);
  font-size: var(--app-font-size-s);
}

.formula-test-result {
  margin-top: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background: var(--app-success-color-light);
  color: var(--app-success-color);
  border-radius: var(--app-border-radius-s);
  font-size: var(--app-font-size-s);
  
  strong {
    font-weight: 600;
  }
}

.format-preview {
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color-lighter);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  font-family: var(--app-font-family-mono, monospace);
  font-size: var(--app-font-size-m);
  color: var(--app-primary-color);
}

.switch-label {
  margin-left: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.syntax-help {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  
  h4 {
    font-size: var(--app-font-size-s);
    font-weight: 600;
    color: var(--app-text-color-primary);
    margin: var(--app-space-s) 0 var(--app-space-xs) 0;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  p {
    margin: 0 0 var(--app-space-xs) 0;
  }
  
  ul {
    margin: 0 0 var(--app-space-xs) 0;
    padding-left: var(--app-space-m);
  }
  
  li {
    margin: var(--app-space-xxs) 0;
  }
  
  code {
    background: var(--app-fill-color);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
  }
}
</style>

