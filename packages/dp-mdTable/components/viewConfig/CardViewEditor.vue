<template>
  <div class="card-view-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-info">
        <h3>Card View Configuration</h3>
        <p class="description">
          Configure how records appear in card previews, hover popups, and kanban view.
        </p>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="resetToDefault">
          <Icon name="lucide:rotate-ccw" size="14" />
          Reset to Default
        </el-button>
        <el-button
          size="small"
          :type="showAdvanced ? 'primary' : 'default'"
          @click="showAdvanced = !showAdvanced"
        >
          <Icon name="lucide:code" size="14" />
          Advanced
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="editor-content">
      <!-- Left: Configuration -->
      <div class="config-panel">
        <!-- Special Fields -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:star" size="16" />
              <span>Special Fields</span>
            </div>
          </template>

          <el-form label-position="top" size="small">
            <el-form-item label="Title Field">
              <el-select
                v-model="localConfig.titleField"
                placeholder="Select title field"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="field in textFields"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias || field.fieldName"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Subtitle Field">
              <el-select
                v-model="localConfig.subtitleField"
                placeholder="Select subtitle field"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="field in textFields"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias || field.fieldName"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Cover Image Field">
              <el-select
                v-model="localConfig.coverField"
                placeholder="Select attachment field for cover"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="field in attachmentFields"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias || field.fieldName"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Fields Configuration -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:list" size="16" />
              <span>Display Fields</span>
            </div>
          </template>

          <FieldSelector
            v-model="localConfig.fields"
            :fields="fields"
          />
        </el-card>

        <!-- Advanced Settings -->
        <el-card v-if="showAdvanced" class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:code" size="16" />
              <span>Advanced Settings</span>
            </div>
          </template>

          <el-form label-position="top" size="small">
            <el-form-item label="Custom CSS">
              <el-input
                v-model="localAdvanced.customCSS"
                type="textarea"
                :rows="5"
                placeholder=".card-preview { /* your styles */ }"
              />
            </el-form-item>

            <el-form-item label="Custom JavaScript">
              <el-input
                v-model="localAdvanced.customJS"
                type="textarea"
                :rows="5"
                placeholder="// Custom logic for card rendering"
              />
            </el-form-item>

            <el-form-item label="Custom Template">
              <el-input
                v-model="localAdvanced.template"
                type="textarea"
                :rows="5"
                placeholder="<div class='custom-card'>{{ record.title }}</div>"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- Right: Live Preview -->
      <div class="preview-panel">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:eye" size="16" />
              <span>Live Preview</span>
            </div>
          </template>

          <div class="preview-container">
            <CardPreview
              :config="localConfig"
              :fields="fields"
              :sample-data="sampleData"
            />
          </div>

          <div class="preview-note">
            <Icon name="lucide:info" size="14" />
            <span>Preview uses sample data. Actual cards will display real record values.</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="editor-footer">
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button type="primary" @click="handleSave">
        Save Configuration
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CardViewConfig, ViewFieldConfig, FieldInfo, AdvancedConfig } from '../../types/view-config'
import FieldSelector from './FieldSelector.vue'
import CardPreview from './CardPreview.vue'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Current card configuration */
  modelValue?: CardViewConfig
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Sample data for preview */
  sampleData?: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [config: CardViewConfig]
  save: [config: CardViewConfig]
  cancel: []
}>()

// Show advanced settings
const showAdvanced = ref(false)

// Local config state
const localConfig = ref<CardViewConfig>({
  fields: [],
  titleField: undefined,
  subtitleField: undefined,
  coverField: undefined
})

// Local advanced settings
const localAdvanced = ref<AdvancedConfig>({})

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    localConfig.value = JSON.parse(JSON.stringify(props.modelValue))
    localAdvanced.value = { ...props.modelValue.advanced } || {}
  } else {
    resetToDefault()
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localConfig.value = JSON.parse(JSON.stringify(newValue))
    localAdvanced.value = { ...newValue.advanced } || {}
  }
}, { deep: true })

// Sync advanced settings to config
watch(localAdvanced, (newValue) => {
  const hasAdvanced = newValue.customCSS || newValue.customJS || newValue.template
  localConfig.value.advanced = hasAdvanced ? { ...newValue } : undefined
}, { deep: true })

// Filter text fields for title/subtitle
const textFields = computed(() => {
  return props.fields.filter(f => 
    f.type === ColumnFieldType.Text || 
    f.type === ColumnFieldType.MultiText ||
    f.type === ColumnFieldType.Email ||
    f.type === ColumnFieldType.URL ||
    f.type === ColumnFieldType.Phone
  )
})

// Filter attachment fields for cover
const attachmentFields = computed(() => {
  return props.fields.filter(f => f.type === ColumnFieldType.Attachment)
})

// Generate default configuration
function generateDefaultConfig(): CardViewConfig {
  const displayableFields = props.fields.filter(f => 
    !f.isSystem && 
    f.type !== ColumnFieldType.Attachment && 
    f.type !== ColumnFieldType.MagicLink
  )

  const titleField = displayableFields.find(f => 
    f.type === ColumnFieldType.Text || f.type === ColumnFieldType.MultiText
  )?.fieldName

  const cardFields: ViewFieldConfig[] = displayableFields.slice(0, 5).map(f => ({
    fieldName: f.fieldName,
    colSpan: 6
  }))

  return {
    fields: cardFields,
    titleField
  }
}

// Reset to default
function resetToDefault() {
  localConfig.value = generateDefaultConfig()
  localAdvanced.value = {}
}

// Handle save
function handleSave() {
  emit('update:modelValue', localConfig.value)
  emit('save', localConfig.value)
}

// Handle cancel
function handleCancel() {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.card-view-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);

  h3 {
    margin: 0 0 var(--app-space-xs) 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .description {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  overflow: auto;
}

.config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.config-section {
  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: var(--app-space-m);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
}

.preview-panel {
  position: sticky;
  top: 0;
  height: fit-content;
}

.preview-card {
  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: var(--app-space-m);
  }
}

.preview-container {
  padding: var(--app-space-m);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
  display: flex;
  justify-content: center;
}

.preview-note {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  margin-top: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--el-color-info-light-9);
  border-radius: var(--el-border-radius-small);
  font-size: var(--app-font-size-xs);
  color: var(--el-color-info);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
}
</style>
