<script lang="ts" setup>
import { clientApi } from 'api'

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
    const response = await clientApi.api.postCaptureProjformsettingPage({ projId: props.projectId })
    forms.value = response.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function CreateNewForm() {}

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
      <div class="title">Title</div>
      <div class="actions">
        <ElButton ref="newButtonEl" type="primary">New Form</ElButton>
      </div>
    </div>
    <div v-loading="loading" class="listBody">
      {{ forms }}
    </div>
  </div>
  <ScanPropjectFormNewDialog ref="newFormDialog" :buttonEl="newButtonEl" @updated="getForms"></ScanPropjectFormNewDialog>
</template>
