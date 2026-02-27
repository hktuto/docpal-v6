<template>
  <BrowseMiniTable ref="tableRef" :home="homeId" showCheckbox @selectedChange="selectedChange">
    <template #toolbar_buttons>
      <BrowseBreadcrumb :idOrPath="idOrPath" :home="{ secondId: homeId, disabled: true }" />
    </template>
  </BrowseMiniTable>
</template>
<script setup lang="ts">
import { newClientApi } from 'api'
const props = defineProps<{
  disabled: boolean
  formData: any
  vformOptions: any
  homeId: string
}>()
const idOrPath = ref(props.homeId)
const loading = ref(false)
function changeRoute(id: string) {
  idOrPath.value = id
}
const tableRef = ref()
let selectedRows: any[] = []
function selectedChange(rows: any[]) {
  selectedRows = JSON.parse(JSON.stringify(rows))
}

async function getData() {
  setTimeout(() => {
    tableRef.value.cleanSelected()
  }, 100)
  return selectedRows
}

provide(BrowseListProviderKey, {
  getchildApi: (pageParams: any) => {
    return newClientApi.postDmsDocumentChildrenThumbnail(pageParams)
  },
  idOrPath,
  changeRoute
})
onMounted(() => {
  console.log('onMounted', props.vformOptions)
  
})
defineExpose({
  getData
})
</script>

<style scoped lang="scss"></style>
