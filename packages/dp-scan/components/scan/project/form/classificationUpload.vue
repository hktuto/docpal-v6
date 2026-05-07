<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits<{
  refresh: []
  next: []
}>()

const routerProvider = inject(MenuRouterKey)

const uploading = ref(false)
const dragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    uploadFile(files[0])
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    uploadFile(files[0])
  }
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

async function uploadFile(file: File) {
  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
  const isValidType = validTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith('.pdf') ||
    file.name.toLowerCase().endsWith('.jpg') ||
    file.name.toLowerCase().endsWith('.jpeg') ||
    file.name.toLowerCase().endsWith('.png') ||
    file.name.toLowerCase().endsWith('.tiff')

  if (!isValidType) {
    routerProvider?.message.error('Please upload a PDF or image file (JPG, PNG, TIFF)')
    return
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    routerProvider?.message.error('File size must be less than 10MB')
    return
  }

  uploading.value = true
  try {
    // Upload file using the API
    const response = await clientApi.api.postCaptureFileUploadexampletoform({
      file: file,
      projectId: props.formDetail?.projectId || '',
      formId: props.formDetail?.id || ''
    }, {
      timeout: 0
    })

    if (response.result) {
      // Update form with sampleDocPath
      const updatedForm = {
        ...props.formDetail,
        sampleDocPath: response.data.path
      }

      emits('update', updatedForm)
      emits('next')

      routerProvider?.message.success('Sample document uploaded successfully')
    } else {
      routerProvider?.message.error(response.message || 'Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    routerProvider?.message.error('Failed to upload file')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="uploadContainer">
    <div class="uploadContent">
      <div
        class="uploadArea"
        :class="{ dragOver }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="triggerFileSelect"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf"
          class="hiddenInput"
          @change="handleFileSelect"
        />

        <div v-if="uploading" class="uploadingState">
          <ElIcon class="uploadingIcon" size="48">
            <Icon name="lucide:loader-2" />
          </ElIcon>
          <div class="uploadingText">Uploading...</div>
        </div>

        <template v-else>
          <Icon name="lucide:upload-cloud" class="uploadIcon" />
          <div class="uploadTitle">Upload Sample Document</div>
          <div class="uploadDesc">
            Drag and drop a PDF or image file here, or click to browse
          </div>
          <div class="uploadFormats">
            Supported formats: PDF, JPG, PNG, TIFF (Max 10MB)
          </div>
        </template>
      </div>

      <div class="uploadInfo">
        <ElAlert type="info" :closable="false">
          <template #title>
            <div class="infoTitle">Why do we need a sample document?</div>
          </template>
          <div class="infoContent">
            A sample document is required to:
            <ul>
              <li>Configure the QR code/barcode identification</li>
              <li>Define form sections and fields</li>
              <li>Test the form processing workflow</li>
            </ul>
          </div>
        </ElAlert>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.uploadContainer {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}

.uploadContent {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-l);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: var(--app-space-xl);
}

.uploadArea {
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  padding: var(--app-space-xl);
  border: 2px dashed var(--app-border-color);
  border-radius: var(--app-radius-l);
  background-color: var(--app-bg-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.dragOver {
    border-color: var(--app-primary-color);
    background-color: var(--app-primary-color-light, rgba(64, 158, 255, 0.05));
  }
}

.hiddenInput {
  display: none;
}

.uploadIcon {
  font-size: 64px;
  color: var(--app-text-color-secondary);
}

.uploadTitle {
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  color: var(--app-text-color);
}

.uploadDesc {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
  text-align: center;
}

.uploadFormats {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
}

.uploadingState {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: var(--app-space-m);

  .uploadingIcon {
    animation: spin 1s linear infinite;
    color: var(--app-primary-color);
  }

  .uploadingText {
    font-size: var(--app-font-size-m);
    color: var(--app-text-color-secondary);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.uploadInfo {
  .infoTitle {
    font-weight: 600;
    margin-bottom: var(--app-space-xs);
  }

  .infoContent {
    ul {
      margin: var(--app-space-xs) 0;
      padding-left: var(--app-space-l);

      li {
        margin: var(--app-space-xs) 0;
      }
    }
  }
}
</style>
