<script lang="ts" setup>
import { clientApi } from 'api'
import ScanPropjectFormNewDialog from './newDialog.vue'
import ScanPropjectFormDuplicateDialog from './duplicateDialog.vue'
const props = defineProps<{
  projectId: string
}>()
const newFormDialogEl = ref()
const duplicateFormDialogEl = ref()
const newButtonEl = ref()
const forms = ref<any[]>([])
const loading = ref(false)

const orderMap = {
  'section': 0,
  'field': 1,
  'qrcode': 2
}

async function getForms() {
  loading.value = true
  try {
    const response = await clientApi.api.postCaptureProjformsettingPage({ projectId: props.projectId, pageSize: -1 })

    const orderMap = {
      'A': 0,
      'I': 1,
    }
    forms.value = response.data.filter((a) => a.status !== 'D').sort((a,b) => {
        const indexA = orderMap[a.status] ?? Number.MAX_SAFE_INTEGER; // Items not in order go last
        const indexB = orderMap[b.status] ?? Number.MAX_SAFE_INTEGER;
        return (indexA - indexB) || a.name.localeCompare(b.name) || a.id.localeCompare(b.name);
    })
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function openNewFormDialog() {
  newFormDialogEl.value?.open()
}

function editForm(form: any) {
  // TODO: Open edit dialog or navigate to edit page
  console.log('Edit form:', form)
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
function normalizeForm(form:any){
  const normalizeFormData = {
    ...form,
    docSeparationConfig: normalizeObj(form.docSeparationConfig),
    fieldsSetting: normalizeObj(form.fieldsSetting),
    formClassificationConfig: normalizeObj(form.formClassificationConfig),
    otherMetadataSetting: normalizeObj(form.otherMetadataSetting),
    pageSplitConfig: normalizeObj(form.pageSplitConfig),
    pagePathList: form.pagePathList ? form.pagePathList.sort((a, b) => a.length !== b.length ? a.length - b.length : a.localeCompare(b)) : []
  }
  delete normalizeFormData.updatedBy
  delete normalizeFormData.updatedAt
  delete normalizeFormData.createdAt
  delete normalizeFormData.createdBy
  return normalizeFormData
}
async function activeForm(form: any) {
  const newData = normalizeForm(form)
  newData.status = 'A'
  await clientApi.api.putCaptureProjformsetting(newData)
  getForms()
}
async function deleteForm(form: any) {
  // TODO: Show confirmation dialog and delete
  const newData = normalizeForm(form)
  newData.status = 'I'
  await clientApi.api.putCaptureProjformsetting(newData)
  getForms()
}

async function removeForm(form: any) {
  const newData = normalizeForm(form)
  newData.status = 'D'
  await clientApi.api.putCaptureProjformsetting(newData)
  getForms()
}

function configureForm(form: any) {
  // TODO: Navigate to form configuration (page split, sections, fields)
  console.log('Configure form:', form)
}

function duplicateForm(form: any) {
  duplicateFormDialogEl.value?.open(form.id, form.name)
}

watch(
  () => props.projectId,
  () => {
    getForms()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="formListContainer">
    <div class="listHeader">
      <div class="title">Forms ({{ forms.length }})</div>
      <div class="actions">
        <ElButton ref="newButtonEl" type="primary" @click="openNewFormDialog">
          <Icon name="lucide:plus" />
          New Form
        </ElButton>
      </div>
    </div>
    <div v-loading="loading" class="listBody">
      <!-- Empty State -->
      <div v-if="!loading && forms.length === 0" class="emptyState">
        <Icon name="lucide:file-text" class="emptyIcon" />
        <div class="emptyText">No forms yet</div>
        <div class="emptySubtext">Click "New Form" to add your first form template</div>
      </div>

      <!-- Form Cards Grid -->
      <div v-else class="formGrid">
        <ScanProjectFormItemCard
          v-for="form in forms"
          :key="form.id"
          :form="form"
          @edit="editForm"
          @active="activeForm"
          @delete="deleteForm"
          @configure="configureForm"
          @duplicate="duplicateForm"
          @remove="removeForm"
        />
      </div>
    </div>
  </div>
  <ScanPropjectFormNewDialog ref="newFormDialogEl" :buttonEl="newButtonEl" :projectId="projectId" @updated="getForms" />
  <ScanPropjectFormDuplicateDialog ref="duplicateFormDialogEl" @updated="getForms" />
</template>

<style lang="scss" scoped>
.formListContainer {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
}

.listHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;

  .title {
    font-size: var(--app-font-size-l);
    font-weight: 600;
  }
}

.listBody {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);
  height: calc(100vh - 166px);
}

.emptyState {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--app-text-color-secondary);
  gap: var(--app-space-s);

  .emptyIcon {
    font-size: 48px;
    opacity: 0.5;
  }

  .emptyText {
    font-size: var(--app-font-size-l);
    font-weight: 500;
  }

  .emptySubtext {
    font-size: var(--app-font-size-s);
    opacity: 0.7;
  }
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--app-space-s);
}
</style>
