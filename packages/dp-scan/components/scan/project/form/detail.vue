<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  formId:string
}>()
const loading = ref(false)

const formDetail = ref()
// form Detail status logic, override by overriderStatus, this overriderStatus is to allow user override the status in fromSetup.
const overriderStatus = ref(null)
const formStatusFromFromDetail = computed(() => {
  if(!formDetail.value) return null
  // form Status has 3 status: classification, split, fromSetup.
  // if formDetail has sampleDocPath and formClassificationConfig is not empty that mean it has pass classification step
  if(!formDetail.value.sampleDocPath || !formDetail.value.formClassificationConfig) return 'classification'
  // then if pageSplitConfig is not empty, it has pass split step,
  if(!formDetail.value.pageSplitConfig) return 'split'

  return 'fromSetup'
})
const formStatus = computed(() => {
  return overriderStatus.value ?? formStatusFromFromDetail.value
})


async function fetchFormDetail() {
  loading.value = true
  try{

  const { data } = await clientApi.api.getCaptureProjformsettingId(props.formId)
  formDetail.value = data
  }catch(err){

  }finally{
    loading.value = false
  }
}

onMounted(() => {
  fetchFormDetail()
})
</script>

<template>

<div class="formDetail">

    {{formStatus}}
</div>
</template>
