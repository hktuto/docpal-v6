<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import DocumentPreview from './DocumentPreview.vue'
import PropmtSelect from './promptSelect.vue'
import FieldEditor from '../field/editor.vue'

import type {
  CropItem,
  CropUpdateEvent
} from './DocumentPreview.vue'
import type {
  Section,
  Field,
  FieldType
} from '../../../../types/formOCR'
import {
  createEmptySection,
  createEmptyField,
  generateKey
} from '../../../../types/formOCR'

const formImages = ref<Record<string, string>>({})
const props = defineProps<{
}>()

const emit = defineEmits<{
  save: [section: Section]
  close: []
}>()

// ==================== State ====================
const visible = ref(false)
const section = ref<Section>(createEmptySection())
const activeCropId = ref<string | null>(null)
const activeTab = ref<'section' | 'fields'>('section')
const previewRef = ref<InstanceType<typeof DocumentPreview>>()
const isInitialized = ref(false)
const isEditing = ref(false)
const documentUrl = ref('')
const currentPage = ref(1)

// ==================== Computed ====================
const dialogTitle = computed(() => isEditing.value ? 'Edit Section' : 'New Section')

const canSave = computed(() => {
  return section.value.section_name &&
         section.value.section_id &&
         section.value.zone
})

// ==================== Public Methods ====================


/**
 * Open the dialog for editing an existing section
 * @param url - The document URL to preview
 * @param page - The current page number (1-based)
 * @param existingSection - The section to edit
 */
function open(url: string, page: number, existingSection?: Section) {
  // Reset state
  visible.value = true
  isInitialized.value = false
  activeCropId.value = null
  activeTab.value = 'section'
  documentUrl.value = url
  currentPage.value = page
  formImages.value = {}
  if (existingSection) {
    isEditing.value = true
    section.value = JSON.parse(JSON.stringify(existingSection))
  } else {
    isEditing.value = false
    section.value = createEmptySection()
  }

  // Initialize DocumentPreview after dialog is shown
  nextTick(async () => {
    // Prepare initial crops from section data
    const initialCrops: CropItem[] = []

    // Add section crop if exists
    if (section.value.zone) {
      initialCrops.push({
        id: 'section',
        type: 'section',
        page: 1,
        zone: section.value.zone.zone,
        label: section.value.section_name,
        editable: true
      })
    }

    // Add field crops
    section.value.fields.forEach((field) => {
      if (field.zone) {
        initialCrops.push({
          id: field.key,
          type: 'field',
          page: 1,
          zone: field.zone.zone,
          label: field.label,
          editable: true
        })
      }
    })

    // Initialize preview with all existing crops
    await previewRef.value?.init([documentUrl.value], initialCrops)
    isInitialized.value = true

    // For new sections without a zone, automatically add a section crop
    if (!isEditing.value && !section.value.zone) {
      nextTick(() => {
        previewRef.value?.addCrop({
          id: 'section',
          type: 'section',
          page: 1,
          label: section.value.section_name || 'Section',
          editable: true
        })
      })
    }
  })
}

function close() {
  visible.value = false
  isInitialized.value = false
  emit('close')
}

// ==================== Methods ====================

function handleSave() {
  if (!canSave.value) return
  const newSectionData = JSON.parse(JSON.stringify(section.value))
  newSectionData.zone.page = currentPage.value;
  newSectionData.fields.map((f:any) => {
    f.zone.page =  currentPage.value;
  })

  emit('save', newSectionData)
  close()
}

function addField() {
  const newField = createEmptyField(
    generateKey('field'),
    'New Field',
    'text'
  )
  section.value.fields.push(newField)
  activeCropId.value = newField.key
  activeTab.value = 'fields'

  // Add crop to preview (only if already initialized)
  if (isInitialized.value) {
    nextTick(() => {
      previewRef.value?.addCrop({
        id: newField.key,
        type: 'field',
        page: currentPage.value,
        label: newField.label,
        editable: true
      })
    })
  }
}

function removeField(index: number) {
  const field = section.value.fields[index]
  if (activeCropId.value === field.key) {
    activeCropId.value = null
  }
  section.value.fields.splice(index, 1)

  // Remove from preview
  if (isInitialized.value) {
    previewRef.value?.removeCropItem(field.key)
  }
}

function moveField(index: number, direction: 'up' | 'down') {
  const fields = section.value.fields
  if (direction === 'up' && index > 0) {
    ;[fields[index], fields[index - 1]] = [fields[index - 1], fields[index]]
  } else if (direction === 'down' && index < fields.length - 1) {
    ;[fields[index], fields[index + 1]] = [fields[index + 1], fields[index]]
  }
}

function handleCropUpdate(event: CropUpdateEvent) {
  const { crop, imageData } = event
  formImages.value[crop.id] = imageData
  // Parse zone string to Zone object
  const coords = crop.zone.split(',').map(Number)
  if (coords.length !== 4) return

  const newZone = {
    page: 1,
    zone: `${coords[0]},${coords[1]},${coords[2]},${coords[3]}`
  }

  if (crop.type === 'section') {
    section.value.zone = newZone

  } else {
    const field = section.value.fields.find(f => f.key === crop.id)
    if (field) {
      field.zone = newZone
    }
  }
  console.log("handleCropUpdate",section.value)
}

function handleCropRemove(cropId: string | number) {
  if (cropId === 'section') {
    section.value.zone = undefined
    if (activeCropId.value === 'section') {
      activeCropId.value = null
    }
  } else {
    // Field is already removed from data in removeField, just update active state
    if (activeCropId.value === cropId) {
      activeCropId.value = null
    }
  }
}

function handleActiveCropChange(cropId: string | null) {
  activeCropId.value = cropId

  if (cropId && isInitialized.value) {
    if (cropId === 'section') {
      activeTab.value = 'section'
    } else {
      activeTab.value = 'fields'
    }
    // Focus the crop in preview
    previewRef.value?.focusCrop(cropId)
  } else if (isInitialized.value) {
    previewRef.value?.blur()
  }
}


function getFieldTypeLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Text',
    select: 'Select',
    date: 'Date',
    hkic: 'HKID',
    number: 'Number',
    checkbox: 'Checkbox',
    radio: 'Radio'
  }
  return labels[type] || type
}

// ==================== Expose ====================
defineExpose({
  open
})
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="90%"
    class="sectionDialog"
    :close-on-click-modal="false"
    destroy-on-close
    fullscreen
  >
    <div class="section-dialog">
      <!-- Left: Document Preview -->
      <div class="preview-panel">
        <DocumentPreview
          ref="previewRef"
          @update="handleCropUpdate"
          @remove="handleCropRemove"
        />
      </div>

      <!-- Right: Configuration -->
      <div class="config-panel">
        <ElTabs v-model="activeTab" type="border-card">
          <!-- Section Tab -->
          <ElTabPane label="Section" name="section">
            <div class="section-form">
              <ElForm label-position="top">
                <ElFormItem label="Section Name" required>
                  <ElInput v-model="section.section_name" placeholder="Enter section name" />
                </ElFormItem>

                <ElFormItem label="Section ID" required>
                  <ElInput v-model="section.section_id" placeholder="Enter unique section ID" />
                </ElFormItem>

                <ElRow :gutter="16">
                  <ElCol :span="12">
                    <ElFormItem label="Section Type">
                      <ElSelect v-model="section.section_type" class="w-full">
                        <ElOption label="Standard" value="standard" />
                        <ElOption label="Table" value="table" />
                      </ElSelect>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="Merge Method">
                      <ElSelect v-model="section.merge_method" class="w-full">
                        <ElOption label="Overwrite" value="overwrite" />
                        <ElOption label="Append" value="append" />
                      </ElSelect>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElRow :gutter="16">
                  <ElCol :span="12">
                    <ElFormItem label="Export Label">
                      <ElInput v-model="section.export_label" placeholder="Export column name" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="24">
                    <ElFormItem label="Prompt Template">
                        <PropmtSelect v-model="section.prompt_template_id" />
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElRow :gutter="32">
                  <ElCol :span="8">
                    <ElFormItem>
                      <ElCheckbox v-model="section.corp_to_scan">
                        Crop To Scan
                      </ElCheckbox>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="8">
                    <ElFormItem>
                      <ElCheckbox v-model="section.save_to_result">
                        Save To Result
                      </ElCheckbox>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElAlert v-if="!section.zone" type="info" :closable="false">
                  <template #default>
                    Creating section crop automatically...
                  </template>
                </ElAlert>

                <ElAlert v-else-if="activeCropId === 'section'" type="info" :closable="false">
                  <template #default>
                    Drag handles to resize section area
                  </template>
                </ElAlert>
              </ElForm>
            </div>
          </ElTabPane>

          <!-- Fields Tab -->
          <ElTabPane label="Fields" name="fields">
            <div class="fields-panel">
              <div class="fields-header">
                <span class="fields-count">{{ section.fields.length }} fields</span>
                <ElButton type="primary" size="small" @click="addField">
                  <Icon name="lucide:plus" />
                  Add Field
                </ElButton>
              </div>

              <div class="fields-list">
                <ElCollapse
                  :model-value="activeCropId"
                  @update:model-value="handleActiveCropChange"
                >
                  <ElCollapseItem
                    v-for="(field, index) in section.fields"
                    :key="field.key"
                    :name="field.key"
                    :class="{ 'is-active': activeCropId === field.key }"
                  >
                    <template #title>
                      <div class="field-header">
                        <span class="field-label">{{ field.label }}</span>
                        <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
                      </div>
                    </template>

                    <FieldEditor v-model="section.fields[index]" />

                    <div class="field-actions">
                      <ElButton
                        :disabled="index === 0"
                        size="small"
                        @click="moveField(index, 'up')"
                      >
                        <Icon name="lucide:arrow-up" />
                      </ElButton>
                      <ElButton
                        :disabled="index === section.fields.length - 1"
                        size="small"
                        @click="moveField(index, 'down')"
                      >
                        <Icon name="lucide:arrow-down" />
                      </ElButton>
                      <ElButton type="danger" size="small" @click="removeField(index)">
                        <Icon name="lucide:trash-2" />
                      </ElButton>
                    </div>
                  </ElCollapseItem>
                </ElCollapse>

                <ElEmpty v-if="section.fields.length === 0" description="No fields added" />
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>

    <template #footer>
      <ElButton @click="close">Cancel</ElButton>
      <ElButton type="primary" :disabled="!canSave" @click="handleSave">
        {{ isEditing ? 'Save Changes' : 'Create Section' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style>
.sectionDialog{
    .el-dialog__body{
       height: calc(100% - 89px);
    }
}
</style>
<style scoped>
.section-dialog {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 500px;
}

.preview-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.config-panel {
  width: 450px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.config-panel :deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.config-panel :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}

.section-form {
  padding: 16px;
}

.alert-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fields-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fields-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.fields-count {
  font-size: 14px;
  color: #606266;
}

.fields-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding-right: 16px;
}

.field-label {
  font-weight: 500;
  flex: 1;
}

.field-type {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.field-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.w-full {
  width: 100%;
}

:deep(.el-collapse-item.is-active .el-collapse-item__header) {
  background: #ecf5ff;
  color: #409eff;
}
</style>
