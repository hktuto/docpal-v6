<script lang="ts" setup>
import { clientApi } from 'api'
import ClassificationUpload from './classificationUpload.vue'
import ClassificationCrop from './classificationCrop.vue'
import SplitPage from './splitPage.vue'
import FormSetup from './formSetup.vue'

const props = defineProps<{
  formId: string
}>()

const loading = ref(false)
const routerProvider = inject(MenuRouterKey)

const formDetail = ref<any>()

// Form Detail status logic - only use override for formSetup stage
const overriderStatus = ref<string | null>(null)

const formStatusFromFormDetail = computed(() => {
  if (!formDetail.value) return null

  // Check if we need to upload sample doc first (classification step)
  if (!formDetail.value.sampleDocPath) return 'classificationUpload'

  // Check if classification config is complete
  if (!formDetail.value.formClassificationConfig) return 'classificationCrop'

  // Check if page split is complete
  if (!formDetail.value.pageSplitConfig) return 'split'

  return 'formSetup'
})

const formStatus = computed(() => {
  return overriderStatus.value ?? formStatusFromFormDetail.value
})

const statusTitles: Record<string, string> = {
  classificationUpload: 'Upload Sample Document',
  classificationCrop: 'Configure QR Code',
  split: 'Split Page',
  formSetup: 'Form Detail'
}

async function fetchFormDetail() {
  loading.value = true
  try {
    const { data } = await clientApi.api.getCaptureProjformsettingId(props.formId)
    formDetail.value = data
  } catch (err) {
    console.error('Failed to fetch form detail:', err)
    routerProvider?.message.error('Failed to load form detail')
  } finally {
    loading.value = false
  }
}

async function refreshFormDetail() {
  await fetchFormDetail()
}

onMounted(() => {
  fetchFormDetail()
})
</script>

<template>
  <div v-loading="loading" class="formDetail">
    <!-- Header with current step name -->
    <div class="formHeader">
      <h2 class="formTitle">{{ statusTitles[formStatus] || 'Form Configuration' }}</h2>
    </div>

    <!-- Status Content -->
    <div class="statusContent">
      <!-- Step 1a: Upload Sample Document -->
      <ClassificationUpload
        v-if="formStatus === 'classificationUpload'"
        :form-detail="formDetail"
        @refresh="refreshFormDetail"
      />

      <!-- Step 1b: Crop/Select QR Code Region -->
      <ClassificationCrop
        v-else-if="formStatus === 'classificationCrop'"
        :form-detail="formDetail"
        @refresh="refreshFormDetail"
      />

      <!-- Step 2: Split Page -->
      <SplitPage
        v-else-if="formStatus === 'split'"
        :form-detail="formDetail"
        @refresh="refreshFormDetail"
      />

      <!-- Step 3: Form Setup -->
      <FormSetup
        v-else-if="formStatus === 'formSetup'"
        :form-detail="formDetail"
        @refresh="refreshFormDetail"
      />

      <!-- Loading State -->
      <div v-else class="loadingState">
        <ElEmpty description="Loading form configuration..." />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.formDetail {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  background-color: var(--app-bg-color);
}

.formHeader {
  padding: var(--app-space-m) var(--app-space-l);
  background-color: var(--app-bg-color);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.formTitle {
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  color: var(--app-text-color);
}

.statusContent {
  flex: 1;
  overflow: hidden;
  padding: var(--app-space-m);
}

.loadingState {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
