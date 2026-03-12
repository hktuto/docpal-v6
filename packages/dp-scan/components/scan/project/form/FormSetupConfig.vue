<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { FormFieldsSetting, Section, CropItem } from '../../../types/formOCR'

const props = defineProps<{
  modelValue: FormFieldsSetting
  activeCropId?: string | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FormFieldsSetting]
  'update:activeCropId': [id: string | null]
  addSection: []
  editSection: [section: Section]
  deleteSection: [sectionId: string]
  addQRCode: []
  deleteQRCode: [key: string]
  setIndexQRCode: [key: string]
  save: []
}>()

// ==================== State ====================
const expandedSections = ref<string[]>([])

// ==================== Computed ====================
const config = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeField = computed(() => {
  if (!props.activeCropId) return null
  for (const section of config.value.section) {
    const field = section.fields.find(f => f.key === props.activeCropId)
    if (field) return { field, section }
  }
  return null
})

// ==================== Methods ====================
function onAddSection() {
  emit('addSection')
}

function onEditSection(section: Section) {
  emit('editSection', section)
}

function onDeleteSection(sectionId: string) {
  emit('deleteSection', sectionId)
}

function onAddQRCode() {
  emit('addQRCode')
}

function onDeleteQRCode(key: string) {
  emit('deleteQRCode', key)
}

function onSetIndexQRCode(key: string) {
  emit('setIndexQRCode', key)
}

function onSave() {
  emit('save')
}

function selectCrop(id: string) {
  emit('update:activeCropId', id)
  
  // Expand section if selecting a field
  const section = config.value.section.find(s => 
    s.fields.some(f => f.key === id)
  )
  if (section && !expandedSections.value.includes(section.section_id)) {
    expandedSections.value.push(section.section_id)
  }
}

function getFieldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
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
</script>

<template>
  <div class="form-setup-config">
    <!-- Form Information -->
    <div class="config-section">
      <div class="section-header">
        <Icon name="lucide:info" />
        <span>Information</span>
      </div>
      <div class="section-content">
        <ElForm label-position="top" size="small">
          <ElFormItem label="Form Name" required>
            <ElInput v-model="config.form_name" placeholder="Enter form name" />
          </ElFormItem>
          
          <ElFormItem label="Export Format">
            <ElSelect v-model="config.export_format" class="w-full">
              <ElOption label="XML" value="xml" />
              <ElOption label="JSON" value="json" />
              <ElOption label="CSV" value="csv" />
            </ElSelect>
          </ElFormItem>
          
          <ElFormItem label="Output File Name Template">
            <ElInput v-model="config.out_file_name_template" />
          </ElFormItem>
          
          <ElFormItem label="Document Name Template">
            <ElInput v-model="config.new_document_name_tempate" />
          </ElFormItem>
        </ElForm>
      </div>
    </div>

    <!-- Sections -->
    <div class="config-section">
      <div class="section-header">
        <div class="header-left">
          <Icon name="lucide:layout-grid" />
          <span>Sections</span>
        </div>
        <ElButton type="primary" size="small" circle @click="onAddSection">
          <Icon name="lucide:plus" />
        </ElButton>
      </div>
      <div class="section-content">
        <ElCollapse v-model="expandedSections">
          <ElCollapseItem
            v-for="section in config.section"
            :key="section.section_id"
            :name="section.section_id"
            :class="{ 'is-active': activeCropId === section.section_id }"
          >
            <template #title>
              <div 
                class="collapse-title"
                :class="{ active: activeCropId === section.section_id }"
                @click.stop="selectCrop(section.section_id)"
              >
                <span class="title-text">{{ section.section_name }}</span>
                <ElTag size="small" :type="section.section_type === 'table' ? 'warning' : 'info'">
                  {{ section.section_type }}
                </ElTag>
              </div>
            </template>
            
            <div class="section-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">{{ section.section_id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fields:</span>
                <span class="detail-value">{{ section.fields.length }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Crop to Scan:</span>
                <ElSwitch v-model="section.corp_to_scan" size="small" />
              </div>
              <div class="detail-row">
                <span class="detail-label">Save to Result:</span>
                <ElSwitch v-model="section.save_to_result" size="small" />
              </div>
              
              <div class="section-actions">
                <ElButton size="small" @click="onEditSection(section)">
                  <Icon name="lucide:edit" />
                  Edit
                </ElButton>
                <ElButton type="danger" size="small" @click="onDeleteSection(section.section_id)">
                  <Icon name="lucide:trash-2" />
                </ElButton>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>
        
        <ElEmpty v-if="config.section.length === 0" description="No sections added">
          <ElButton type="primary" @click="onAddSection">Add Section</ElButton>
        </ElEmpty>
      </div>
    </div>

    <!-- QRCodes -->
    <div class="config-section">
      <div class="section-header">
        <div class="header-left">
          <Icon name="lucide:qr-code" />
          <span>QRCodes</span>
        </div>
        <ElButton type="primary" size="small" circle @click="onAddQRCode">
          <Icon name="lucide:plus" />
        </ElButton>
      </div>
      <div class="section-content">
        <div v-for="qr in config.qrcode" :key="qr.key" class="qr-item">
          <div 
            class="qr-info"
            :class="{ active: activeCropId === qr.key, index: config.index_field.qrcode_option === qr.key }"
            @click="selectCrop(qr.key)"
          >
            <div class="qr-label">{{ qr.label }}</div>
            <div class="qr-meta">
              <ElTag size="small">{{ qr.format }}</ElTag>
              <ElTag 
                v-if="config.index_field.qrcode_option === qr.key" 
                type="success" 
                size="small"
              >
                Index
              </ElTag>
            </div>
          </div>
          <div class="qr-actions">
            <ElButton 
              v-if="config.index_field.qrcode_option !== qr.key"
              size="small"
              @click="onSetIndexQRCode(qr.key)"
            >
              Set as Index
            </ElButton>
            <ElButton type="danger" size="small" circle @click="onDeleteQRCode(qr.key)">
              <Icon name="lucide:trash-2" />
            </ElButton>
          </div>
        </div>
        
        <ElEmpty v-if="config.qrcode.length === 0" description="No QRCodes added" />
      </div>
    </div>

    <!-- Active Selection Details -->
    <div v-if="activeField" class="config-section highlight">
      <div class="section-header">
        <Icon name="lucide:mouse-pointer" />
        <span>Selected Field</span>
      </div>
      <div class="section-content">
        <div class="field-info">
          <div class="info-row">
            <span class="info-label">Label:</span>
            <span class="info-value">{{ activeField.field.label }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">{{ getFieldTypeLabel(activeField.field.type) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Section:</span>
            <span class="info-value">{{ activeField.section.section_name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Export:</span>
            <span class="info-value">{{ activeField.field.export_label || '-' }}</span>
          </div>
        </div>
        <ElAlert type="info" :closable="false" size="small">
          Edit this field in the Section dialog
        </ElAlert>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="config-footer">
      <ElButton :loading="saving" type="primary" @click="onSave">
        <Icon name="lucide:save" />
        Save Configuration
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-setup-config {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.config-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  flex-shrink: 0;

  &.highlight {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-weight: 600;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.section-content {
  padding: 16px;
}

.w-full {
  width: 100%;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  padding: 0 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

:deep(.el-collapse-item.is-active .el-collapse-item__header) {
  background: #ecf5ff;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding-right: 12px;

  &.active {
    color: #409eff;
    font-weight: 500;
  }
}

.title-text {
  flex: 1;
}

.section-details {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.detail-label {
  color: #606266;
  font-size: 13px;
}

.detail-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.section-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.qr-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.qr-info {
  flex: 1;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #e4e7ed;
  }

  &.active {
    background: #ecf5ff;
  }

  &.index {
    border-left: 3px solid #67c23a;
  }
}

.qr-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.qr-meta {
  display: flex;
  gap: 8px;
}

.qr-actions {
  display: flex;
  gap: 8px;
}

.field-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 80px;
  color: #606266;
  font-size: 13px;
}

.info-value {
  flex: 1;
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.config-footer {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

// Scrollbar
.form-setup-config::-webkit-scrollbar {
  width: 6px;
}

.form-setup-config::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.form-setup-config::-webkit-scrollbar-track {
  background: transparent;
}
</style>
