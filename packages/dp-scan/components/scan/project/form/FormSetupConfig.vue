<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { FormFieldsSetting, Section, CropItem } from '../../../../types/formOCR'
import PropmtSelect from './promptSelect.vue'
import QrcodeEdit from './formQrcpde/edit.vue'
const props = defineProps<{
  modelValue: FormFieldsSetting
  formImages: Record<string, string>
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


// ==================== Computed ====================
const config = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
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


}

function onDeleteQRCode(key: string) {
  emit('deleteQRCode', key)
}

function onSetIndexQRCode(key: string) {
  emit('setIndexQRCode', key)
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

const activeQrcode = ref([])
</script>

<template>
  <div class="form-setup-config">
    <div class="formContent">
        <!-- Form Information -->
        <div class="config-section">
        <div class="section-header">
            <div class="header-left">
                <Icon name="lucide:info" />
                <span>Information</span>
            </div>
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
            <ElFormItem label="Form Prompt Template">
                <PropmtSelect v-model="config.prompt_template_id" />
            </ElFormItem>
            <ElFormItem label="Init Logic">
                <ElInput v-model="config.custom_init_logic" />
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
                <div class="scction-item"
                    v-for="section in config.section"
                >
                    <div class="section-name">{{section.section_name}} </div>
                    <div class="section-actions">
                         <Icon class="info" name="lucide:edit" @click="onEditSection(section)" />
                          <Icon class="warning" name="lucide:trash-2" @click="onDeleteSection(section.section_id)" />
                    </div>
                </div>


                <ElEmpty v-if="config.section.length === 0" description="No sections added">
                <ElButton type="primary" @click="$emit('addSection')">Add Section</ElButton>
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
                <ElButton type="primary" size="small" circle @click="$emit('addQRCode')">
                <Icon name="lucide:plus" />
                </ElButton>
            </div>
            <div class="section-content">
                <el-collapse v-model="activeQrcode">
                <QrcodeEdit
                    v-for="qr in config.qrcode" :key="qr.key"
                    :modelValue="qr"
                    :img="formImages[qr.key]"
                    @update:modelValue="(newVal)=>qr = newVal "
                    @delete="onDeleteQRCode(qr.key)"
                />
                </el-collapse>
                <ElEmpty v-if="config.qrcode.length === 0" description="No QRCodes added" />
            </div>
        </div>
    </div>
    <!-- Footer Actions -->
    <div class="config-footer">
      <ElButton :loading="saving" type="primary" @click="$emit('save')">
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
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-s);
  overflow-y: hidden;
  padding: var(--app-space-xs);
  :deep(.el-form-item--small){
    margin-bottom: var(--app-space-s);
  }
  :deep(.el-form-item--label-top .el-form-item__label){
    margin-bottom: var(--app-space-xs);
    line-height: 1.2;
  }
}

.formContent{
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--app-space-s);
    overflow-y: auto;
}

.config-section {
    width: 100%;
    max-height: 500px;
  overflow: auto;
  flex-shrink: 0;
  &.highlight {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: var(--app-space-xs) var(--app-space-s);
  background: #8BD9E0;
  color: white;
  font-weight: 600;
  margin-bottom :var(--app-space-s);
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 0 auto;
  }
}

.section-content {
    padding-inline: var(--app-space-xs);
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

.title-text {
  flex: 1;
}
.scction-item{
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items:center;
    gap:var(--app-space-xs);
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
}
.section-actions {
    flex: 1 0 auto;
    display: flex;
    gap: var(--app-space-xs);
    justify-content: flex-end;

    > *{
        cursor:pointer;
    }
    .warning {
        color: var(--app-error-color);
    }
    .info{
        color: var(--app-info-color);
    }
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
