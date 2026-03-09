<script lang="ts" setup>
import { clientApi } from 'api'
import { pdfPageToImageUrl, loadPDF } from '#imports'
import { createScanFormDetailPageTab } from '#imports'

const props = defineProps<{
  form: any
}>()

const emits = defineEmits<{
  edit: [form: any]
  delete: [form: any]
  configure: [form: any]
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const previewImage = ref<string | undefined>()
const loadingPreview = ref(false)

async function getPreview() {
  if (!props.form.sampleDocPath || props.form.firstPagePath) return
  const path = props.form.firstPagePath || props.form.sampleDocPath
  loadingPreview.value = true
  try {
    // Get file blob from API
    const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
      { path },
      {
        format: 'blob',
        headers: {
          noThrowError: true
        }
      }
    )

    // Create file from blob
    const fileName = props.form.sampleDocPath.split('/').pop() || 'document'
    const file = new File([blob], fileName, { type: blob.type })

    // Check if PDF and convert to image
    if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const pdf = await loadPDF(file)
      // Convert first page to image
      previewImage.value = await pdfPageToImageUrl(pdf, 1, {
        scale: 1.5,
        maxWidth: 400,
        maxHeight: 300
      })
    } else if (file.type.startsWith('image/')) {
      // Use image directly
      previewImage.value = URL.createObjectURL(blob)
    } else {
      // Unsupported file type
      previewImage.value = undefined
    }
  } catch (error) {
    console.error('Failed to load preview:', error)
    previewImage.value = undefined
  } finally {
    loadingPreview.value = false
  }
}

function handleEdit() {
  // Navigate to form detail page
  const tab = createScanFormDetailPageTab(props.form.id)
  routerProvider?.navigateTo(tab)
  emits('edit', props.form)
}

function handleDelete() {
  emits('delete', props.form)
}

function handleConfigure() {
  emits('configure', props.form)
}

onMounted(() => {
  getPreview()
})

onUnmounted(() => {
  // Cleanup object URL to prevent memory leaks
  if (previewImage.value && previewImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewImage.value)
  }
})
</script>

<template>
  <ElCard class="formCard" shadow="hover">
    <div class="cardHeader">
      <div class="formName">{{ form.name }}</div>
      <ElDropdown trigger="click">
        <ElButton link>
          <Icon name="lucide:more-vertical" />
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem @click="handleEdit">
              <Icon name="lucide:edit" />
              Edit
            </ElDropdownItem>
            <ElDropdownItem @click="handleConfigure">
              <Icon name="lucide:settings" />
              Configure
            </ElDropdownItem>
            <ElDropdownItem divided @click="handleDelete">
              <Icon name="lucide:trash-2" class="text-danger" />
              <span class="text-danger">Delete</span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <div class="cardBody">
      <!-- Preview -->
      <div v-loading="loadingPreview" class="formPreview">
        <img
          v-if="previewImage"
          :src="previewImage"
          class="previewImage"
          alt="Form preview"
        />
        <div v-else class="previewPlaceholder">
          <Icon name="lucide:file-text" class="placeholderIcon" />
          <span class="placeholderText">No preview available</span>
        </div>
      </div>

      <!-- Code Value -->
      <div v-if="form.codeValue" class="codeValue">
        <span class="label">Code:</span>
        <ElTag size="small" type="info">{{ form.codeValue }}</ElTag>
      </div>

      <!-- Stats -->
      <div class="formStats">
        <div class="statItem">
          <Icon name="lucide:layout-template" />
          <span>{{ form.sectionCount || 0 }} sections</span>
        </div>
        <div class="statItem">
          <Icon name="lucide:text-fields" />
          <span>{{ form.fieldCount || 0 }} fields</span>
        </div>
      </div>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.formCard {
  :deep(.el-card__body) {
    padding: var(--app-space-s);
    display: flex;
    flex-flow: column nowrap;
    gap: var(--app-space-s);
  }
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);

  .formName {
    font-size: var(--app-font-size-m);
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.cardBody {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}

.formPreview {
  min-height: 120px;
  max-height: 200px;
  overflow: hidden;
  border-radius: var(--app-radius-s);
  background-color: var(--app-bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;

  .previewImage {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.previewPlaceholder {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-m);
  color: var(--app-text-color-secondary);
  gap: var(--app-space-xs);

  .placeholderIcon {
    font-size: 32px;
  }

  .placeholderText {
    font-size: var(--app-font-size-s);
  }
}

.codeValue {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);

  .label {
    color: var(--app-text-color-secondary);
  }
}

.formStats {
  display: flex;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);

  .statItem {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}

.text-danger {
  color: var(--app-danger-color);
}
</style>
