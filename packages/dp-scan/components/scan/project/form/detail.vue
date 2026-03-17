<script lang="ts" setup>
import { clientApi } from 'api'
import {ElMessageBox} from 'element-plus'

import ClassificationUpload from './classificationUpload.vue'
import ClassificationCrop from './classificationCrop.vue'
import SplitPage from './splitPage.vue'
import FormSetup from './formSetup.vue'

const props = defineProps<{
  formId: string
}>()
const formSetupRef = ref()
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
  if (!formDetail.value.formClassificationConfig ) return 'classificationCrop'

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

function normalizeObj(val: any) {
  if (!val) return null
  try {
    const jVal = JSON.parse(val)
    if(Array.isArray(jVal)) return jVal.length ? jVal : null
    return Object.keys(jVal).length ? jVal : null
  } catch {
    return null
  }
}
async function fetchFormDetail() {
  loading.value = true
  try {
    const { data } = await clientApi.api.getCaptureProjformsettingId(props.formId) as any
    // docSeparationConfig, fieldsSetting, formClassificationConfig, otherMetadataSetting, pageSplitConfig are stringmify json, need to convert and normalize it
    // if those objevt are null or underfined or empty object or array after conversion, set them to null.
    // use normalizeObj to convert and normalize them
    if(!data) throw new Error('Failed to fetch form detail')
    formDetail.value = {
      ...data,
      docSeparationConfig: normalizeObj(data.docSeparationConfig),
      fieldsSetting: normalizeObj(data.fieldsSetting),
      formClassificationConfig: normalizeObj(data.formClassificationConfig),
      otherMetadataSetting: normalizeObj(data.otherMetadataSetting),
      pageSplitConfig: normalizeObj(data.pageSplitConfig),
      pagePathList: data.pagePathList ? data.pagePathList.sort((a, b) => a.length !== b.length ? a.length - b.length : a.localeCompare(b)) : []
    }
  } catch (err) {
    console.error('Failed to fetch form detail:', err)
    routerProvider?.message.error('Failed to load form detail')
  } finally {
    loading.value = false
  }
}
async function backToList() {
  if(formSetupRef.value &&　formSetupRef.value.hasUnSaveChange){
    await ElMessageBox.confirm('There are unsaved changes. Are you sure you want to leave ?',{
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: "confirm"
    }).then((result) => {
      if(result === 'confirm') {
        const tab = createScanDetailPageTab(formDetail.value.projectId)
          routerProvider?.navigateTo(tab)
      }
    }).catch(err => {

    })
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
        <div class="back" @click="backToList">
          <Icon name="material-symbols:arrow-back-ios" />
        </div>
      <h2 class="formTitle">{{ statusTitles[formStatus] || 'Form Configuration' }}</h2>
      <div :id="'detail-' + (formDetail?.id || '')" >
      </div>
    </div>

    <!-- Status Content -->
    <div class="statusContent">
      <!-- Step 1a: Upload Sample Document -->
      <ClassificationUpload
        v-if="formStatus === 'classificationUpload'"
        :form-detail="formDetail"
        @update="refreshFormDetail"
        @next="overriderStatus = 'classificationCrop'"
      />

      <!-- Step 1b: Crop/Select QR Code Region -->
      <ClassificationCrop
        v-else-if="formStatus === 'classificationCrop'"
        :form-detail="formDetail"
        @refresh="refreshFormDetail"
        @back="overriderStatus = 'classificationUpload'"
        @next="overriderStatus = 'split'"
      />

      <!-- Step 2: Split Page -->
      <SplitPage
        v-else-if="formStatus === 'split'"
        :form-detail="formDetail"
        @back="overriderStatus = 'classificationCrop'"
        @next="overriderStatus = 'formSetup'"
        @refresh="refreshFormDetail"
      />

      <!-- Step 3: Form Setup -->
      <FormSetup
        v-else-if="formStatus === 'formSetup'"
        ref="formSetupRef"
        :form-detail="formDetail"
        @back="(step) => overriderStatus = step || 'classificationCrop'"
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
  display: flex;
  flex-flow: flex-start;
  justify-content: flex-start;
  align-items: center;
}

.formTitle {
flex: 1 0 auto;
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  color: var(--app-text-color);
}

.statusContent {
  flex: 1;
  overflow: hidden;
  /* padding: var(--app-space-m); */
}

.loadingState {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
