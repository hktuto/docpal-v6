<script lang="ts" setup>
import { useBatchDetailContext, type SectionWithValues, type FieldWithValue } from '#imports'

const props = defineProps<{
  section: SectionWithValues
  readonly?: boolean
}>()

const emits = defineEmits<{
  fieldChange: [sectionId: string, fieldKey: string, value: any, rowIndex?: number]
  addRow: [sectionId: string]
}>()

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const { highlightedSection, highlightedField, selectSection, selectField } = context

// Check if this section is currently highlighted
const isHighlighted = computed(() => {
  if (!highlightedSection.value) return false
  const sectionZone = getZoneString(props.section.zone)
  return highlightedSection.value.zone === sectionZone
})

// Check if a field is highlighted
function isFieldHighlighted(field: FieldWithValue) {
  if (!highlightedField.value) return false
  const fieldZone = getZoneString(field.zone)
  return highlightedField.value.zone === fieldZone
}

/**
 * Get zone string from zone object
 */
function getZoneString(zoneData: any): string | null {
  if (!zoneData) return null
  if (typeof zoneData === 'string') return zoneData
  if (typeof zoneData === 'object') return zoneData.zone
  return null
}

// Handle mouse enter for section - highlight persists until another is hovered
function handleSectionMouseEnter() {
  selectSection(props.section)
  // Clear field highlight when selecting a new section
  selectField(null)
}

// Handle field mouse enter - highlight persists until another is hovered
function handleFieldMouseEnter(field: FieldWithValue) {
  selectField(field)
}

// Handle field value change
function handleFieldChange(field: FieldWithValue, value: any, rowIndex?: number) {
  emits('fieldChange', props.section.section_id, field.key, value, rowIndex)
}

// Handle add row for table sections
function handleAddRow() {
  emits('addRow', props.section.section_id)
}

// Determine if field has been modified
function isFieldModified(field: FieldWithValue): boolean {
  return field.currentValue !== field.originalValue
}

// Get input type for field
function getInputType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'text',
    'date': 'date',
    'hkic': 'text',
    'number': 'number',
    'email': 'email',
    'tel': 'tel'
  }
  return typeMap[fieldType] || 'text'
}
</script>

<template>
  <div
    class="sectionContainer"
    :class="{ highlighted: isHighlighted }"
    tabindex="0"
    @mouseenter="handleSectionMouseEnter"
  >
    <div class="sectionHeader">
      <Icon name="lucide:layout-template" class="sectionIcon" />
      <span class="sectionName">{{ section.section_name }}</span>
      <ElTag v-if="section.zone?.page" size="small" type="info">
        Page {{ section.zone.page }}
      </ElTag>
      
      <!-- Add row button for table sections - only show when not readonly -->
      <ElButton
        v-if="section.section_type === 'table' && !readonly"
        type="primary"
        size="small"
        circle
        class="addRowBtn"
        @click.stop="handleAddRow"
      >
        <Icon name="lucide:plus" />
      </ElButton>
    </div>
    
    <!-- Standard Section -->
    <div v-if="section.section_type !== 'table'" class="fieldsList">
      <div
        v-for="field in section.fields"
        :key="field.key"
        class="fieldItem"
        :class="{ 
          highlighted: isFieldHighlighted(field),
          modified: isFieldModified(field)
        }"
        @mouseenter="handleFieldMouseEnter(field)"
      >
        <div class="fieldLabel">
          <span class="labelText">{{ field.lable || field.label }}</span>
          <ElTag v-if="field.required" size="small" type="danger" effect="plain" class="requiredTag">
            *
          </ElTag>
        </div>
        
        <!-- Select field with options -->
        <ElSelect
          v-if="field.options && field.options.length > 0"
          :model-value="field.currentValue"
          size="small"
          class="fieldInput"
          :placeholder="`Select ${field.lable || field.label}`"
          :disabled="readonly"
          @update:model-value="(val) => handleFieldChange(field, val)"
        >
          <ElOption
            v-for="opt in field.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        
        <!-- Regular text input -->
        <ElInput
          v-else
          :model-value="field.currentValue"
          size="small"
          class="fieldInput"
          :type="getInputType(field.type)"
          :placeholder="field.lable || field.label"
          :disabled="readonly"
          @update:model-value="(val) => handleFieldChange(field, val)"
        />
        
        <!-- Original OCR value display -->
        <div v-if="isFieldModified(field)" class="originalValue">
          <Icon name="lucide:history" class="originalIcon" />
          <span class="originalText">{{ field.originalValue || '(empty)' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Table Section -->
    <div v-else class="tableSection">
      <div v-if="!section.rows || section.rows.length === 0" class="emptyTable">
        <ElEmpty :description="readonly ? 'No data rows.' : 'No data rows. Click + to add.'" :image-size="60" />
      </div>
      
      <div
        v-for="(row, rowIndex) in section.rows"
        :key="rowIndex"
        class="tableRow"
      >
        <div class="rowHeader">
          <Icon name="lucide:rows-3" class="rowIcon" />
          <span>Row {{ rowIndex + 1 }}</span>
        </div>
        
        <div class="rowFields">
          <div
            v-for="field in row.fields"
            :key="field.key"
            class="fieldItem"
            :class="{ modified: field.currentValue !== field.originalValue }"
            @mouseenter="handleFieldMouseEnter(field)"
          >
            <div class="fieldLabel">
              <span class="labelText">{{ field.lable || field.label }}</span>
              <ElTag v-if="field.required" size="small" type="danger" effect="plain" class="requiredTag">
                *
              </ElTag>
            </div>
            
            <ElSelect
              v-if="field.options && field.options.length > 0"
              :model-value="field.currentValue"
              size="small"
              class="fieldInput"
              :disabled="readonly"
              @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
            >
              <ElOption
                v-for="opt in field.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            
            <ElInput
              v-else
              :model-value="field.currentValue"
              size="small"
              class="fieldInput"
              :type="getInputType(field.type)"
              :disabled="readonly"
              @update:model-value="(val) => handleFieldChange(field, val, rowIndex)"
            />
            
            <!-- Original OCR value display -->
            <div v-if="field.currentValue !== field.originalValue" class="originalValue">
              <Icon name="lucide:history" class="originalIcon" />
              <span class="originalText">{{ field.originalValue || '(empty)' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sectionContainer {
  width: 100%;
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-m);
  overflow: hidden;
  background-color: var(--app-bg-color);
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover,
  &.highlighted {
    border-color: var(--app-primary-color);
    box-shadow: 0 0 0 1px var(--app-primary-color-light);
  }
  
  &:focus-within {
    outline: 2px solid var(--app-primary-color);
    outline-offset: 2px;
  }
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background-color: var(--app-bg-color-secondary);
  border-bottom: 1px solid var(--app-border-color);
  font-weight: 600;
  font-size: var(--app-font-size-m);
  
  .sectionContainer:hover &,
  .sectionContainer.highlighted & {
    background-color: var(--app-primary-color-light);
    color: var(--app-primary-color);
  }
}

.sectionIcon {
  font-size: 16px;
}

.sectionName {
  flex: 1;
}

.addRowBtn {
  margin-left: auto;
}

.fieldsList {
  padding: var(--app-space-s);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-s);
}

.fieldItem {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  border-radius: var(--app-radius-s);
  transition: all 0.15s ease;
  
  &:hover,
  &.highlighted {
    background-color: var(--app-primary-color-light);
  }
  
  &.modified {
    border-left: 3px solid var(--app-warning-color);
    padding-left: calc(var(--app-space-xs) - 3px);
  }
}

.fieldLabel {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.labelText {
  flex: 1;
}

.requiredTag {
  font-weight: bold;
}

.fieldInput {
  width: 100%;
}

.originalValue {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
  padding: var(--app-space-xs);
  background-color: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-s);
  
  .originalIcon {
    font-size: 12px;
  }
  
  .originalText {
    text-decoration: line-through;
    opacity: 0.7;
  }
}

// Table styles
.tableSection {
  padding: var(--app-space-s);
}

.emptyTable {
  padding: var(--app-space-m);
}

.tableRow {
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-s);
  margin-bottom: var(--app-space-s);
  overflow: hidden;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.rowHeader {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: var(--app-bg-color-secondary);
  font-size: var(--app-font-size-s);
  font-weight: 500;
}

.rowIcon {
  font-size: 14px;
}

.rowFields {
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}
</style>
