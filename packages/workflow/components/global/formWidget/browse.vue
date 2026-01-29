<script lang="ts" setup>
import { clientApi } from 'api'
const home = ref({ secondId: '/' })
const idOrPath = ref('')

const tableRef = ref()
function handleRefresh() {
  if (tableRef.value) {
    tableRef.value.reload()
  }
}

const props = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { formData, options } = toRefs(props)

function getFormData() {
  console.log('getFormData')
  // if no data , return empty
  return {}
}

function changeRoute(id: string) {
  idOrPath.value = id
}

function getInfo() {
  // get options
  if (props.options.data.folderCabinetId && props.formData[props.options.data.folderCabinetId]) {
    // console.log({formData});
    home.value = {
      secondId: props.formData[props.options.data.folderCabinetId]
    }
    idOrPath.value = props.formData[props.options.data.folderCabinetId]
  } else {
    idOrPath.value = ''
    home.value = {
      secondId: ''
    }
  }
}

defineExpose({ getFormData })

provide(BrowseListProviderKey, {
  getchildApi: (pageParams: any) => {
    return clientApi.api.postDmsDocumentChildrenThumbnail(pageParams)
  },
  idOrPath,
  changeRoute
})

watch(
  formData,
  () => {
    getInfo()
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  getInfo()
})
</script>

<template>
  <div class="browse-cabinet-container">
    <!-- {{idOrPath}} -->
    <BrowseMiniTable v-if="home.secondId && idOrPath" ref="tableRef" :hideColumns="['fileSize', 'mimeType', 'documentType']">
      <template #toolbar_buttons>
        <BrowseBreadcrumb :idOrPath="idOrPath" :home="home" />
      </template>
    </BrowseMiniTable>
    <div v-else class="el-card">
      <el-skeleton :rows="5" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.browse-cabinet-container {
  height: 600px;
  position: relative;
}
.el-card {
  padding: var(--app-space-m);
}
</style>
