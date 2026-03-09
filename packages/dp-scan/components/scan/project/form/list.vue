<script lang="ts" setup>
import { clientApi } from 'api'
import ScanPropjectFormNewDialog from './newDialog.vue'
const props = defineProps<{
  projectId: string
}>()
const newFormDialogEl = ref()
const newButtonEl = ref()
const forms = ref<any[]>([])
const loading = ref(false)

async function getForms() {
  loading.value = true
  try {
    const response = await clientApi.api.postCaptureProjformsettingPage({ projectId: props.projectId })
    forms.value = response.data
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

function deleteForm(form: any) {
  // TODO: Show confirmation dialog and delete
  console.log('Delete form:', form)
}

function configureForm(form: any) {
  // TODO: Navigate to form configuration (page split, sections, fields)
  console.log('Configure form:', form)
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
          @delete="deleteForm"
          @configure="configureForm"
        />
      </div>
    </div>
  </div>
  <ScanPropjectFormNewDialog ref="newFormDialogEl" :buttonEl="newButtonEl" :projectId="projectId" @updated="getForms" />
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
