<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import DocumentPreview from './DocumentPreview.vue'
import type {
  Section,
  Field,
  SectionType,
  MergeMethod,
  Zone,
  FieldType
} from '../../../../types/formOCR'
import {
  createEmptySection,
  createEmptyField,
  generateKey,
  zoneToCoordinates,
  coordinatesToZone
} from '../../../../types/formOCR'

const props = defineProps<{
  modelValue: boolean
  documentUrl: string
  existingSection?: Section | null
  promptTemplates?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [section: Section]
}>()

// ==================== State ====================
const section = ref<Section>(createEmptySection())
const activeCropId = ref<string | null>(null)
const activeTab = ref<'section' | 'fields'>('section')

// ==================== Computed ====================
const isEditing = computed(() => !!props.existingSection)

const dialogTitle = computed(() => isEditing.value ? 'Edit Section' : 'New Section')
const previewRef = ref()
const crops = computed(() => {
  const result: Array<{
    id: string
    type: 'section' | 'field'
    zone: Zone
    label: string
    isEditing: boolean
  }> = []

  // Add section crop if exists
  if (section.value.zone) {
    result.push({
      id: 'section',
      type: 'section',
      zone: section.value.zone,
      label: section.value.section_name,
      isEditing: activeCropId.value === 'section'
    })
  }

  // Add field crops
  section.value.fields.forEach((field, index) => {
    result.push({
      id: field.key,
      type: 'field',
      zone: field.zone,
      label: field.label,
      isEditing: activeCropId.value === field.key
    })
  })

  return result
})

const canSave = computed(() => {
  return section.value.section_name &&
         section.value.section_id &&
         section.value.zone
})

// ==================== Watchers ====================
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (props.existingSection) {
      section.value = JSON.parse(JSON.stringify(props.existingSection))
    } else {
      section.value = createEmptySection()
    }
    nextTick(() => {
      console.log(section.value)
     previewRef.value.init([props.documentUrl], [])
    })
    activeTab.value = 'section'
  }
})

// ==================== Methods ====================

function close() {
  emit('update:modelValue', false)
}

function handleSave() {
  if (!canSave.value) return
  emit('save', JSON.parse(JSON.stringify(section.value)))
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
}

function removeField(index: number) {
  const field = section.value.fields[index]
  if (activeCropId.value === field.key) {
    activeCropId.value = null
  }
  section.value.fields.splice(index, 1)
}

function moveField(index: number, direction: 'up' | 'down') {
  const fields = section.value.fields
  if (direction === 'up' && index > 0) {
    ;[fields[index], fields[index - 1]] = [fields[index - 1], fields[index]]
  } else if (direction === 'down' && index < fields.length - 1) {
    ;[fields[index], fields[index + 1]] = [fields[index + 1], fields[index]]
  }
}

function handleCropClick(cropId: string | number) {
  if (cropId === 'section') {
    activeTab.value = 'section'
  } else {
    activeTab.value = 'fields'
  }
  activeCropId.value = cropId as string
}

function handleEmptyClick() {
  activeCropId.value = null
}

function handleCropResize(cropId: string | number, newZone: Zone) {
  if (cropId === 'section') {
    section.value.zone = newZone
  } else {
    const field = section.value.fields.find(f => f.key === cropId)
    if (field) {
      field.zone = newZone
    }
  }
}

function handleCropMove(cropId: string | number, newZone: Zone) {
  handleCropResize(cropId, newZone)
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

function handleCropUpdate({crop}:any){

}
function handleCropRemove(deleteKey:string){

}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="90%"
    class="sectionDialog"
    :close-on-click-modal="false"
    destroy-on-close
    fullscreen
    @update:model-value="$emit('update:modelValue', $event)"
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
                  <ElCol :span="12">
                    <ElFormItem label="Prompt Template">
                      <ElSelect v-model="section.prompt_template_id" class="w-full" clearable>
                        <ElOption
                          v-for="template in promptTemplates"
                          :key="template.id"
                          :label="template.name"
                          :value="template.id"
                        />
                      </ElSelect>
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

                <ElAlert v-if="!section.zone" type="warning" :closable="false">
                  <template #default>
                    Click on the document to define section area
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
                <ElCollapse v-model="activeCropId">
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

                    <div class="field-form">
                      <ElForm label-position="top" size="small">
                        <ElRow :gutter="12">
                          <ElCol :span="16">
                            <ElFormItem label="Label" required>
                              <ElInput v-model="field.label" />
                            </ElFormItem>
                          </ElCol>
                          <ElCol :span="8">
                            <ElFormItem label="Type">
                              <ElSelect v-model="field.type">
                                <ElOption label="Text" value="text" />
                                <ElOption label="Select" value="select" />
                                <ElOption label="Date" value="date" />
                                <ElOption label="HKID" value="hkic" />
                                <ElOption label="Number" value="number" />
                                <ElOption label="Checkbox" value="checkbox" />
                                <ElOption label="Radio" value="radio" />
                              </ElSelect>
                            </ElFormItem>
                          </ElCol>
                        </ElRow>

                        <ElRow :gutter="12">
                          <ElCol :span="12">
                            <ElFormItem label="Export Label">
                              <ElInput v-model="field.export_label" placeholder="Column name" />
                            </ElFormItem>
                          </ElCol>
                          <ElCol :span="12" v-if="field.type === 'date'">
                            <ElFormItem label="Date Format">
                              <ElInput v-model="field.format" placeholder="DD/MM/YYYY" />
                            </ElFormItem>
                          </ElCol>
                        </ElRow>

                        <ElRow :gutter="12">
                          <ElCol :span="12">
                            <ElFormItem>
                              <ElCheckbox v-model="field.need_ocr">Need OCR</ElCheckbox>
                            </ElFormItem>
                          </ElCol>
                          <ElCol :span="12">
                            <ElFormItem>
                              <ElCheckbox v-model="field.required">Required</ElCheckbox>
                            </ElFormItem>
                          </ElCol>
                        </ElRow>

                        <ElFormItem v-if="['select', 'radio'].includes(field.type)">
                          <template #label>
                            Options <ElTag size="small">Format: value=label</ElTag>
                          </template>
                          <ElInput
                            v-model="field.field_setting!.options"
                            type="textarea"
                            :rows="3"
                            placeholder="Y=Yes&#10;N=No"
                          />
                        </ElFormItem>

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
                      </ElForm>
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

.field-form {
  padding: 12px;
  background: #fafafa;
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
