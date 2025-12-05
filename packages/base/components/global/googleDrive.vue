<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
  fileUrl?: string,
  fileId?: string,
  fileType?: 'docs' | 'sheets' | 'slides' | 'file' | 'auto',
  readonly?: boolean,
  width?: string,
  height?: string
}>();

const emit = defineEmits(['ready', 'error']);

const iframeRef = ref<HTMLIFrameElement>();
const iframeReady = ref(false);
const embedUrl = ref('');
const loading = ref(true);

/**
 * Extract file ID from Google Drive URL
 */
function extractFileId(url: string): string | null {
  // Support various Google Drive URL formats
  const patterns = [
    // File links: https://drive.google.com/file/d/FILE_ID/view
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    // Document links: https://docs.google.com/document/d/FILE_ID/edit
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    // Spreadsheet links: https://docs.google.com/spreadsheets/d/FILE_ID/edit
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    // Presentation links: https://docs.google.com/presentation/d/FILE_ID/edit
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    // Generic /d/ pattern
    /\/d\/([a-zA-Z0-9_-]+)/,
    // Query parameter format: ?id=FILE_ID
    /[?&]id=([a-zA-Z0-9_-]+)/,
    // Folder links
    /\/folders\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detect file type from URL
 */
function detectFileType(url: string): string {
  if (url.includes('docs.google.com/document')) return 'docs';
  if (url.includes('docs.google.com/spreadsheets')) return 'sheets';
  if (url.includes('docs.google.com/presentation')) return 'slides';
  if (url.includes('docs.google.com/forms')) return 'forms';
  return 'file';
}

/**
 * Generate embed URL based on file type and ID
 */
function generateEmbedUrl(): string {
  let fileId = props.fileId;
  let type = props.fileType || 'auto';
  let url = props.fileUrl;
  // url = 'https://drive.google.com/file/d/1pzIkWZKjMaXA70SxiC3fZp8ZcTyb8mf3OU4pGWkLUPk/view?usp=sharing'
  // If fileUrl is provided, extract fileId and detect type
  if (url) {
    const extractedId = extractFileId(url);
    if (extractedId) {
      fileId = extractedId;
    }

    if (type === 'auto') {
      type = detectFileType(url) as any;
    }
  }

  if (!fileId) {
    console.error('No file ID provided or could not extract from URL');
    return '';
  }

  const mode = props.readonly ? 'preview' : 'edit';

  // Generate appropriate embed URL based on file type
  switch (type) {
    case 'docs':
      return `https://docs.google.com/document/d/${fileId}/${mode}?embedded=true`;
    case 'sheets':
      return `https://docs.google.com/spreadsheets/d/${fileId}/${mode}?embedded=true`;
    case 'slides':
      return `https://docs.google.com/presentation/d/${fileId}/${mode}?embedded=true`;
    case 'file':
    default:
      // For general files (PDF, images, etc.), use the preview mode
      return `https://drive.google.com/file/d/${fileId}/preview`;
  }
}

/**
 * Load iframe
 */
function loadIframe() {
  loading.value = true;
  iframeReady.value = false;
  embedUrl.value = generateEmbedUrl();
  if (!embedUrl.value) {
    emit('error', new Error('Failed to generate embed URL'));
    loading.value = false;
    return;
  }

  nextTick(() => {
    if (iframeRef.value) {
      iframeRef.value.onload = handleIframeLoad;
      iframeRef.value.onerror = handleIframeError;
    }
  });
}

/**
 * Handle iframe load event
 */
function handleIframeLoad() {
  iframeReady.value = true;
  loading.value = false;
  emit('ready');
}

/**
 * Handle iframe error event
 */
function handleIframeError(error: Event) {
  loading.value = false;
  emit('error', error);
}

/**
 * Refresh iframe
 */
function refresh() {
  loadIframe();
}

// Computed styles
const containerStyle = computed(() => ({
  width: props.width || '100%',
  height: props.height || '100%',
}));

// Watch for prop changes
watch([() => props.fileUrl, () => props.fileId, () => props.fileType, () => props.readonly], () => {
  loadIframe();
}, {
  immediate: true
});

// Expose methods
defineExpose({
  refresh,
});
</script>

<template>
  <div class="google-drive-container" :style="containerStyle">
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>{{ $t('common_loading') || 'Loading...' }}</span>
    </div>
    <iframe
      v-if="embedUrl"
      ref="iframeRef"
      :src="embedUrl"
      class="google-drive-iframe"
      frameborder="0"
      allowfullscreen
      :class="{ ready: iframeReady }"
    ></iframe>
    <div v-else class="error-message">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ $t('googleDrive.invalidUrl') || 'Invalid Google Drive URL or File ID' }}</span>
      <a :href="props.fileUrl" target="_blank">{{ $t('common_open') }}</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.google-drive-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 8px;
  background-color: var(--app-grey-100);
  border-radius: var(--app-space-s);
  overflow: hidden;
}

.google-drive-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: var(--app-space-s);
  opacity: 0;
  transition: opacity 0.3s ease;

  &.ready {
    opacity: 1;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  background-color: var(--app-grey-050);
  z-index: 1;

  .el-icon {
    font-size: 2rem;
    color: var(--app-primary-color);
  }

  span {
    font-size: 0.875rem;
    color: var(--app-grey-600);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  height: 100%;
  color: var(--app-danger-color);

  .el-icon {
    font-size: 2rem;
  }

  span {
    font-size: 0.875rem;
  }
}
</style>

