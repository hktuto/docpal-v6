<script lang="ts" setup>
import { ref, computed, watch, onMounted, inject, nextTick } from 'vue'
import { clientApi } from 'api'
import {ElMessageBox}　from 'element-plus'
import DocumentPreview from './DocumentPreview.vue'
import SectionDialog from './SectionDialog.vue'
import FormSetupConfig from './FormSetupConfig.vue'
import TestFromDialog from './testDialog.vue'
import JsonDialog from './jsonDialog.vue'
import type {
  FormFieldsSetting,
  Section,
  QRCodeField,
  Zone
} from '../../../../types/formOCR'
import {
  createEmptyFormFieldsSetting,
  createEmptyQRCodeField,
  generateKey
} from '../../../../types/formOCR'
import type { CropItem } from './DocumentPreview.vue'


const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits(['refresh','back'])
const hasUnSaveChange = ref(false)
const routerProvider = inject(MenuRouterKey)

// ==================== Refs ====================
const previewRef = ref<InstanceType<typeof DocumentPreview>>()

// ==================== State ====================
const loading = ref(false)
const saving = ref(false)
const formConfig = ref<FormFieldsSetting>(createEmptyFormFieldsSetting())
const formImages = ref<any>({})
// Dialog state
const sectionDialogRef  = ref()
const editingSection = ref<Section | null>(null)

// Document paths for multi-page support
const documentPaths = ref<string[]>([])

// Prompt templates (mock - should be fetched from API)
const promptTemplates = ref<Array<{ id: string; name: string }>>([
  { id: '1', name: 'Standard Form Template' },
  { id: '2', name: 'HKHS Application Template' },
  { id: '3', name: 'Table Extraction Template' }
])

// ==================== Initialization ====================
async function initFormConfig() {

  const existing = props.formDetail?.fieldsSetting
  if (existing && typeof existing === 'object') {

    formConfig.value = {
      ...createEmptyFormFieldsSetting(props.formDetail),
      ...existing,
      qrcode: existing.qrcode || [],
      section: existing.section || [],
    }

  } else {
    formConfig.value = createEmptyFormFieldsSetting(props.formDetail)
    if (props.formDetail?.formName) {
      formConfig.value.form_name = props.formDetail.formName
    }
  }
  console.log("formConfig.value", formConfig.value.section[1].fields[0].zone)
  // Setup document paths
  await setupDocumentPaths()
  initPreview()

}

async function setupDocumentPaths() {
  // For now, use sampleDocPath as single page
 const pages = await clientApi.api.getCaptureProjformsettingSplitpageFormid(props.formDetail.id)
 documentPaths.value = Object.values(pages.data)

}

function initPreview() {
  if (!previewRef.value) return

  const crops = buildCropsFromConfig()
  previewRef.value.init(documentPaths.value, crops)

}

function buildCropsFromConfig(): CropItem[] {
  const crops: CropItem[] = []

  // Add QRCode crops
  formConfig.value.qrcode.forEach(qr => {
    crops.push({
      id: qr.key,
      type: 'qrcode',
      page: qr.zone.page,
      zone: qr.zone.zone,
      label: qr.label,
      editable: true
    })
  })

  // Add section and field crops
  formConfig.value.section.forEach(section => {
    if (section.zone) {
      crops.push({
        id: section.section_id,
        type: 'section',
        page: section.zone.page,
        zone: section.zone.zone,
        label: section.section_name,
        editable: false
      })
    }
    if(!section.fields){
      section.fields = []
    }
    section.fields.forEach(field => {
      crops.push({
        id: field.key,
        type: 'field',
        section: section.section_id,
        page: field.zone.page,
        zone: field.zone.zone,
        label: field.label,
        editable: false,
        parentId: section.section_id
      })
    })
  })

  return crops
}

// ==================== Document Preview Events ====================
function handleCropUpdate({crop, imageData}:any) {
  const id = crop.id as string

  formImages.value[crop.id] = imageData
  // Update zone in config (no auto-save)
  const zone: Zone = {
    page: crop.page,
    zone: crop.zone
  }

  // Check if it's a section
  const section = formConfig.value.section.find(s => s.section_id === id)
  if (section) {

    section.zone = zone
    return
  }

  // Check if it's a QRCode
  const qrCode = formConfig.value.qrcode.find(q => q.key === id)
  if (qrCode) {

    qrCode.zone = zone
    return
  }

  // Check if it's a field
  if(!crop.section) throw new Error("no section in field")
  const selectedSection =  formConfig.value.section.filter((sec) => sec.section_id === crop.section)
  for (const sect of selectedSection) {
    const field = sect.fields.find(f => f.key === id)
    if (field) {
      field.zone = zone
      return
    }
  }
  hasUnSaveChange.value = true
}

function handleCropRemove(cropId: string | number) {
  const id = cropId as string

  // Remove from config
  let removed = false

  // Check QRCode
  const qrIndex = formConfig.value.qrcode.findIndex(q => q.key === id)
  if (qrIndex >= 0) {
    formConfig.value.qrcode.splice(qrIndex, 1)
    if (formConfig.value.index_field.qrcode_option === id) {
      formConfig.value.index_field.qrcode_option = ''
    }
    removed = true
  }

  // Check section
  if (!removed) {
    const sectionIndex = formConfig.value.section.findIndex(s => s.section_id === id)
    if (sectionIndex >= 0) {
      formConfig.value.section.splice(sectionIndex, 1)
      removed = true
    }
  }

  // Check field
  if (!removed) {
    for (const section of formConfig.value.section) {
      const fieldIndex = section.fields.findIndex(f => f.key === id)
      if (fieldIndex >= 0) {
        section.fields.splice(fieldIndex, 1)
        removed = true
        break
      }
    }
  }

    hasUnSaveChange.value = true
}

// ==================== Section Management ====================
function openAddSection() {
  const currentPageImg = documentPaths.value[previewRef.value?.currentPage -1 || 0]
  sectionDialogRef.value.open(currentPageImg, previewRef.value?.currentPage)
  editingSection.value = null
}

function openEditSection(section: Section) {

  editingSection.value = JSON.parse(JSON.stringify(section))
  const sectionPage = editingSection.value.zone.page
  if(!sectionPage) throw error("sectionPage is not define")
  const currentPageImg = documentPaths.value[sectionPage -1]
  sectionDialogRef.value.open(currentPageImg, sectionPage, editingSection.value)

}

function handleSaveSection(updatedSection: Section) {
  const existingIndex = formConfig.value.section.findIndex(
    s => s.section_id === updatedSection.section_id
  )

  if (existingIndex !== -1) {
    formConfig.value.section[existingIndex] = updatedSection
  } else {
    formConfig.value.section.push(updatedSection)
  }
  const newCrops = buildCropsFromConfig()
  previewRef.value.crops = newCrops
  previewRef.value?.renderCropsForCurrentPage()
   hasUnSaveChange.value = true
}

function deleteSection(sectionId: string) {
  ElMessageBox.confirm('Are you sure you want to delete this section? All fields will be removed.',{
    confirmButtonClass: 'el-button el-button--warning',
    dangerouslyUseHTMLString: true,
    confirmButtonText: 'Confirm'
  }).then((result) => {
    if(result !== 'confirm') return
    const index = formConfig.value.section.findIndex(s => s.section_id === sectionId)
    if (index >= 0) {
      formConfig.value.section.splice(index, 1)
      routerProvider?.message.success('Section deleted. Click Save to apply changes.')
    }
    const newCrops = buildCropsFromConfig()
    previewRef.value.crops = newCrops
    previewRef.value?.renderCropsForCurrentPage()
    hasUnSaveChange.value = true
  }).catch(() => {
    // Cancelled
  })
}

// ==================== QRCode Management ====================
function addQRCode() {
  const newQR = createEmptyQRCodeField(`QR Code ${formConfig.value.qrcode.length + 1}`)
  console.log("newQR",newQR)
  formConfig.value.qrcode.push(newQR)
  // If first QRCode, set as index field
  if (formConfig.value.qrcode.length === 1) {
    formConfig.value.index_field.qrcode_option = newQR.key
  }

  // Add crop to preview
  nextTick(() => {
    previewRef.value?.addCrop({
      id: newQR.key,
      type: 'qrcode',
      label: newQR.label,
      editable: true,
    })
  })
  hasUnSaveChange.value = true
}

function deleteQRCode(key: string) {

  const index = formConfig.value.qrcode.findIndex(q => q.key === key)
  if (index >= 0) {
    formConfig.value.qrcode.splice(index, 1)

    if (formConfig.value.index_field.qrcode_option === key) {
      formConfig.value.index_field.qrcode_option = ''
    }
    previewRef.value?.removeCropItem(key)
  }
  hasUnSaveChange.value = true
}

function setIndexQRCode(key: string) {
  formConfig.value.index_field.qrcode_option = key
}

// ==================== Save ====================
async function saveConfig() {
  saving.value = true
  try {
    const updateData = {
      ...props.formDetail,
      fieldsSetting: {
        ...formConfig.value
      }
    }
    delete updateData.updatedBy
    delete updateData.updatedAt
    delete updateData.createdAt
    delete updateData.createdBy
    await clientApi.api.putCaptureProjformsetting(updateData)
    hasUnSaveChange.value = false
    routerProvider?.message.success('Form has Updated')
    // emits('refresh')
  } catch (error) {
    console.error('Save error:', error)
    routerProvider?.message.error('Failed to save configuration')
  } finally {
    saving.value = false
  }
}


//================= Test form logic ====================
const testFormRef = ref()
function testForm(){
  testFormRef.value.open(props.formDetail.id, props.formDetail.projectId, deepCopy(formConfig.value))
}

// ==================== Watchers ====================
watch(() => props.formDetail, () => {
  initFormConfig()
}, { immediate: true })

// ================== handle close window alert =============

function dataLostWarning(e){
  if(hasUnSaveChange.value){
    event.preventDefault();
    event.returnValue = ""; // Required for most browsers
  }
}

watch(formConfig, (newVal) => {
  // console.trace(newVal.section[1].fields[0].zone.zone)
  if (!hasUnSaveChange.value) {
    hasUnSaveChange.value = true;
  }
},{
  deep: true
})

onMounted(() => {
  window.addEventListener("beforeunload", dataLostWarning)
})

onUnmounted(() => {
  window.removeEventListener("beforeunload", dataLostWarning)
})
defineExpose({
  hasUnSaveChange
})

// json dialog logic
const jsonDialogRef = ref()
function openJsonEditor(){
  jsonDialogRef.value.open(deepCopy(formConfig.value))
}

function handleJsonSave(newJson:any){
  formConfig.value = deepCopy(newJson)
}
</script>

<template>
  <div class="form-setup">
      <Teleport :to="`#detail-${formDetail.id}`" defer>
           <!-- <ElButton type="primary" @click="testForm">Test Form</ElButton> -->
          <ElButton type="primary" @click="$emit('back', 'classificationUpload')">Repalce Sample</ElButton>
          <ElButton type="primary" @click="$emit('back', 'split')">Split Page</ElButton>
          <ElButton type="info" @click="openJsonEditor">Edit In Json</ElButton>
      </Teleport>
    <ElSplitter class="splitter">
      <!-- Left Panel: Document Preview -->
      <ElSplitterPanel >
          <DocumentPreview
            ref="previewRef"
            @update="handleCropUpdate"
            @remove="handleCropRemove"
          />
      </ElSplitterPanel>

      <!-- Right Panel: Configuration Panel -->
      <ElSplitterPanel size="260" min="120">
        <FormSetupConfig
          v-model="formConfig"
          :formImages="formImages"
          :saving="saving"
          @addSection="openAddSection"
          @editSection="openEditSection"
          @deleteSection="deleteSection"
          @addQRCode="addQRCode"
          @deleteQRCode="deleteQRCode"
          @setIndexQRCode="setIndexQRCode"
          @save="saveConfig"
        />
      </ElSplitterPanel>
    </ElSplitter>

    <!-- Section Dialog -->
    <SectionDialog
    ref="sectionDialogRef"
      @save="handleSaveSection"
    />
    <TestFromDialog ref="testFormRef" />
    <JsonDialog ref="jsonDialogRef" @update="handleJsonSave" />
  </div>
</template>

<style lang="scss" scoped>
.form-setup {
  display: flex;
  flex-direction: column;
  height: 100%;
}


</style>
