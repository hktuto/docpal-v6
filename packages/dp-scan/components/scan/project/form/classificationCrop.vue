<script lang="ts" setup>
import { clientApi } from 'api'
import DocumentCropper from './DocumentCropper.vue'
import { readQRCode } from '#imports'
import { ref, computed, nextTick, watch, onMounted, inject } from 'vue'

const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits<{
  refresh: []
}>()

const routerProvider = inject(MenuRouterKey)

// State
const saving = ref(false)
const cropperInitialized = ref(false)

// Cropper ref
const cropperRef = ref<InstanceType<typeof DocumentCropper>>()

// Current crop type when adding
const addingCropType = ref<'barcode' | 'keyword' | null>(null)

// Classification config
interface ClassificationItem {
  key: string
  zone: string
  order: number
  method: 'barcode' | 'keyword'
  barcode_type?: string
  barcode_value?: string
  keyword?: string
  croppedImage?: string
  color?: string
}

const classificationConfig = ref<Record<string, ClassificationItem>>({})

// Computed items
const barcodeItems = computed(() => {
  return Object.entries(classificationConfig.value)
    .filter(([_, item]) => item.method === 'barcode')
    .sort((a, b) => a[1].order - b[1].order)
})

const keywordItems = computed(() => {
  return Object.entries(classificationConfig.value)
    .filter(([_, item]) => item.method === 'keyword')
    .sort((a, b) => a[1].order - b[1].order)
})

// Get sample document URL
const sampleDocUrl = computed(() => {
  if (!props.formDetail?.sampleDocPath) return null
  // Assuming sampleDocPath is a full URL or needs to be resolved
  return props.formDetail.sampleDocPath
})

// Initialize from props and load cropper
function initClassificationConfig() {
  const config = props.formDetail?.formClassificationConfig
  if (config && typeof config === 'object') {
    classificationConfig.value = { ...config }
  } else {
    classificationConfig.value = {}
  }
  
  // Initialize cropper after data is loaded
  nextTick(() => {
    initCropper()
  })
}

// Initialize cropper with image and existing crops
function initCropper() {
  if (!cropperRef.value || !sampleDocUrl.value) return
  
  // Convert existing config to crop objects
  const existingCrops = Object.entries(classificationConfig.value).map(([key, item]) => ({
    id: key,
    zone: item.zone,
    color: item.color,
    method: item.method,
    barcode_type: item.barcode_type,
    barcode_value: item.barcode_value,
    keyword: item.keyword,
    croppedImage: item.croppedImage,
    order: item.order
  }))
  
  cropperRef.value.init(sampleDocUrl.value, existingCrops)
  cropperInitialized.value = true
}

// Start adding new classification item
function startAddClassification(type: 'barcode' | 'keyword') {
  if (!cropperRef.value || !cropperInitialized.value) {
    routerProvider?.message.warning('Please wait for the document to load')
    return
  }
  
  addingCropType.value = type
  
  // Generate unique key
  const timestamp = Date.now()
  const prefix = type === 'barcode' ? 'single_code' : 'single_keyword'
  const existingKeys = Object.keys(classificationConfig.value).filter(k => k.startsWith(prefix))
  const index = existingKeys.length + 1
  const key = `${prefix}_${index}_${timestamp}`
  
  // Calculate order
  const allItems = Object.values(classificationConfig.value)
  const maxOrder = allItems.reduce((max, item) => Math.max(max, item.order), 0)
  
  // Add crop via cropper - this enters edit mode
  cropperRef.value.addCrop({
    id: key,
    method: type,
    order: maxOrder + 1,
    barcode_type: type === 'barcode' ? 'qrcode' : undefined,
    barcode_value: '',
    keyword: type === 'keyword' ? '' : undefined
  })
}

// Handle crop update (confirm)
async function handleCropUpdate(cropData: any) {
  const { id, zone, color, method, croppedImage } = cropData
  
  // Get existing item or create new
  const existingItem = classificationConfig.value[id]
  
  const newItem: ClassificationItem = {
    key: id,
    zone,
    order: existingItem?.order || cropData.order,
    method: method || addingCropType.value || 'barcode',
    color,
    croppedImage
  }
  
  if (newItem.method === 'barcode') {
    newItem.barcode_type = existingItem?.barcode_type || cropData.barcode_type || 'qrcode'
    newItem.barcode_value = existingItem?.barcode_value || ''
    
    // Try to scan barcode if we have cropped image
    if (croppedImage) {
      const scannedValue = await scanBarcode(croppedImage, newItem.barcode_type!)
      if (scannedValue) {
        newItem.barcode_value = scannedValue
      }
    }
  } else {
    newItem.keyword = existingItem?.keyword || ''
  }
  
  // Update config
  classificationConfig.value[id] = newItem
  addingCropType.value = null
  
  // Auto-save
  await saveConfig()
}

// Handle crop remove
function handleCropRemove(cropId: string | number) {
  // Remove from config
  if (classificationConfig.value[cropId]) {
    delete classificationConfig.value[cropId]
    saveConfig()
  }
}

// Scan barcode from cropped image using pure function
async function scanBarcode(base64Image: string, barcodeType: string): Promise<string | null> {
  try {
    // Import BarcodeFormat dynamically
    const { BarcodeFormat } = await import('@zxing/library')
    
    // Get formats for the specified type
    const typeMap: Record<string, any[]> = {
      qrcode: [BarcodeFormat.QR_CODE],
      data_matrix: [BarcodeFormat.DATA_MATRIX],
      barcode: [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.ITF,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]
    }
    
    const formats = typeMap[barcodeType]
    
    // Try with specific formats first
    if (formats && formats.length > 0) {
      const result = await readQRCode(base64Image, { formats })
      if (result) return result.value
    }
    
    // Fallback: try all formats
    const result = await readQRCode(base64Image)
    return result?.value || null
  } catch (error) {
    console.warn('Barcode scan failed:', error)
    return null
  }
}

// Update functions
async function updateBarcodeType(key: string, newType: string) {
  const item = classificationConfig.value[key]
  if (!item || item.method !== 'barcode') return

  item.barcode_type = newType
  if (item.croppedImage) {
    const scannedValue = await scanBarcode(item.croppedImage, newType)
    if (scannedValue) {
      item.barcode_value = scannedValue
    }
  }
  await saveConfig()
}

async function updateBarcodeValue(key: string, value: string) {
  const item = classificationConfig.value[key]
  if (!item || item.method !== 'barcode') return
  item.barcode_value = value
  await saveConfig()
}

async function updateKeyword(key: string, value: string) {
  const item = classificationConfig.value[key]
  if (!item || item.method !== 'keyword') return
  item.keyword = value
  await saveConfig()
}

// Delete classification item
async function deleteClassificationItem(key: string) {
  try {
    await routerProvider?.dialog.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this classification item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    })

    delete classificationConfig.value[key]
    
    // Re-initialize cropper to reflect changes
    initCropper()
    
    await saveConfig()
    routerProvider?.message.success('Classification item deleted')
  } catch {
    // User cancelled
  }
}

// Save classification config
async function saveConfig() {
  saving.value = true
  try {
    await clientApi.api.patchCaptureProjformsettingId(props.formDetail.id, {
      formClassificationConfig: classificationConfig.value
    })
    routerProvider?.message.success('Classification configuration saved')
    emits('refresh')
  } catch (error) {
    console.error('Save error:', error)
    routerProvider?.message.error('Failed to save configuration')
  } finally {
    saving.value = false
  }
}

// Watch for sampleDocPath changes
watch(() => props.formDetail?.sampleDocPath, () => {
  if (sampleDocUrl.value && cropperRef.value) {
    initCropper()
  }
})

onMounted(() => {
  initClassificationConfig()
})
</script>

<template>
  <div class="classificationCrop">
    <ElSplitter class="splitter">
      <!-- Left Panel: Document Cropper -->
      <ElSplitterPanel size="60%" min="300">
        <div class="leftPanel">
          <DocumentCropper
            v-if="sampleDocUrl"
            ref="cropperRef"
            @update="handleCropUpdate"
            @remove="handleCropRemove"
          />
          <div v-else class="previewPlaceholder">
            <div class="placeholderContent">
              <Icon name="lucide:file-x" class="placeholderIcon" />
              <p class="placeholderText">No sample document available</p>
            </div>
          </div>
        </div>
      </ElSplitterPanel>

      <!-- Right Panel: Configuration -->
      <ElSplitterPanel size="40%" min="320">
        <div class="rightPanel">
          <!-- QRCode Section -->
          <div class="section">
            <div class="sectionHeader">
              <span class="sectionTitle">
                <Icon name="lucide:qr-code" />
                QRcode
              </span>
              <ElButton
                type="primary"
                size="small"
                circle
                :disabled="!cropperInitialized"
                @click="startAddClassification('barcode')"
              >
                <Icon name="lucide:plus" />
              </ElButton>
            </div>
            <div class="sectionContent">
              <div
                v-for="[key, item] in barcodeItems"
                :key="key"
                class="classificationItem"
              >
                <div class="itemPreview">
                  <img
                    v-if="item.croppedImage"
                    :src="item.croppedImage"
                    alt="QR Code preview"
                  />
                  <div v-else class="noPreview">
                    <Icon name="lucide:image" />
                  </div>
                  <ElButton
                    type="danger"
                    size="small"
                    circle
                    class="deleteBtn"
                    @click="deleteClassificationItem(key)"
                  >
                    <Icon name="lucide:trash-2" />
                  </ElButton>
                </div>
                <div class="itemForm">
                  <ElForm label-position="top" size="small">
                    <ElFormItem label="QRCode Type :" required>
                      <ElSelect
                        :model-value="item.barcode_type"
                        class="fullWidth"
                        @change="(val) => updateBarcodeType(key, val as string)"
                      >
                        <ElOption label="QR Code" value="qrcode" />
                        <ElOption label="Data Matrix" value="data_matrix" />
                        <ElOption label="Barcode" value="barcode" />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="Value :" required>
                      <ElInput
                        :model-value="item.barcode_value"
                        placeholder="Enter or scan barcode value"
                        @update:model-value="(val) => updateBarcodeValue(key, val as string)"
                      />
                    </ElFormItem>
                  </ElForm>
                </div>
              </div>
              <ElEmpty
                v-if="barcodeItems.length === 0"
                description="No QR codes added"
                :image-size="60"
              />
            </div>
          </div>

          <!-- Keywords Section -->
          <div class="section">
            <div class="sectionHeader">
              <span class="sectionTitle">
                <Icon name="lucide:type" />
                Keywords
              </span>
              <ElButton
                type="primary"
                size="small"
                circle
                :disabled="!cropperInitialized"
                @click="startAddClassification('keyword')"
              >
                <Icon name="lucide:plus" />
              </ElButton>
            </div>
            <div class="sectionContent">
              <div
                v-for="[key, item] in keywordItems"
                :key="key"
                class="classificationItem"
              >
                <div class="itemPreview">
                  <img
                    v-if="item.croppedImage"
                    :src="item.croppedImage"
                    alt="Keyword preview"
                  />
                  <div v-else class="noPreview">
                    <Icon name="lucide:image" />
                  </div>
                  <ElButton
                    type="danger"
                    size="small"
                    circle
                    class="deleteBtn"
                    @click="deleteClassificationItem(key)"
                  >
                    <Icon name="lucide:trash-2" />
                  </ElButton>
                </div>
                <div class="itemForm">
                  <ElForm label-position="top" size="small">
                    <ElFormItem label="Keyword" required>
                      <ElInput
                        :model-value="item.keyword"
                        placeholder="Enter keyword"
                        @update:model-value="(val) => updateKeyword(key, val as string)"
                      />
                    </ElFormItem>
                  </ElForm>
                </div>
              </div>
              <ElEmpty
                v-if="keywordItems.length === 0"
                description="No keywords added"
                :image-size="60"
              />
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="panelFooter">
            <ElButton type="primary" :loading="saving" @click="saveConfig">
              Save & Continue
              <Icon name="lucide:arrow-right" />
            </ElButton>
          </div>
        </div>
      </ElSplitterPanel>
    </ElSplitter>
  </div>
</template>

<style lang="scss" scoped>
.classificationCrop {
  height: 100%;
  width: 100%;
}

.splitter {
  height: 100%;
  width: 100%;
}

.leftPanel {
  height: 100%;
  width: 100%;
  border-radius: var(--app-radius-m);
  overflow: hidden;
  border: 1px solid var(--app-border-color);
}

.previewPlaceholder {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--app-bg-color-secondary);
}

.placeholderContent {
  text-align: center;
  color: var(--app-text-color-secondary);
  max-width: 400px;
}

.placeholderIcon {
  font-size: 64px;
  margin-bottom: var(--app-space-m);
  opacity: 0.5;
}

.placeholderText {
  font-size: var(--app-font-size-m);
  line-height: 1.6;
}

.inlineIcon {
  display: inline;
  font-size: var(--app-font-size-s);
  vertical-align: middle;
  margin: 0 4px;
}

.rightPanel {
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  background-color: var(--app-bg-color);
  overflow: hidden;
  border-radius: var(--app-radius-m);
  border: 1px solid var(--app-border-color);
}

.section {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  border-bottom: 1px solid var(--app-border-color);

  &:last-of-type {
    border-bottom: none;
  }
}

.sectionHeader {
  padding: var(--app-space-m);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  flex-shrink: 0;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-weight: 600;
  font-size: var(--app-font-size-m);
}

.sectionContent {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-m);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-m);
}

.classificationItem {
  display: flex;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background-color: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-m);
  border: 1px solid var(--app-border-color);

  &:hover {
    border-color: var(--app-primary-color);
  }
}

.itemPreview {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: var(--app-radius-s);
  overflow: hidden;
  background-color: var(--app-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .noPreview {
    color: var(--app-text-color-secondary);
    font-size: var(--app-font-size-l);
  }

  .deleteBtn {
    position: absolute;
    top: 2px;
    right: 2px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .deleteBtn {
    opacity: 1;
  }
}

.itemForm {
  flex: 1;
  min-width: 0;
}

.panelFooter {
  padding: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  background-color: var(--app-bg-color);
}

.fullWidth {
  width: 100%;
}
</style>
