<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  id: string
  oldVersionNum: string
}>()
const routerProvider = inject(MenuRouterKey)
const newVersion = ref<any>()
const oldVersion = ref<any>()
const activeNames = ref(['1'])
const infoDiff = ref()
const state = reactive({
  title: '',
  previewOldFile: {
    blob: null,
    name: '',
    id: '',
    loading: false,
    options: {
      noDownload: true,
      print: false,
      loadAnnotations: false,
      readOnly: true
    }
  },
  previewNewFile: {
    blob: null,
    name: '',
    id: '',
    loading: false,
    options: {
      noDownload: true,
      print: false,
      loadAnnotations: false,
      readOnly: true
    }
  }
})
// const init = async(path) => {
//     const idOrPath = path
// }

const back = () => {
  const newItem = createDetailPageParams({
    idOrPath: newVersion.value.id,
    docName: newVersion.value.name,
    showHeaderAction: true
  })
  routerProvider?.navigateTo(newItem)
}
async function getPreviewFile(previewFile: any, id: string, version: any) {
  previewFile.loading = true
  try {
    previewFile.blob = await clientApi.api.postDmsDocumentPreview(
      { idOrPath: id, version },
      {
        format: 'blob',
        timeout: 0
      }
    )
  } catch (error) {
    throw error
  }
  previewFile.loading = false
}
onMounted(async () => {
  // init(id as string);
  newVersion.value = await clientApi.api.postDmsDocumentFetch({ idOrPath: props.id }).then((res) => res.data)
  state.title = newVersion.value.name
  oldVersion.value = await clientApi.api
    .postNuxeoGetspecificversion({
      idOrPath: props.id,
      versionNum: props.oldVersionNum
    })
    .then((res) => res.data)
  getPreviewFile(state.previewNewFile, newVersion.value.id, newVersion.value.version)
  getPreviewFile(state.previewOldFile, oldVersion.value.id, props.oldVersionNum)
  nextTick(() => {
    infoDiff.value.handleData()
  })
})
</script>

<template>
  <div class="versionPageContainer">
    <div class="viewersContainer padding">
      <VersionHeader :doc="oldVersion" :canRestore="true">
        <ElTooltip :content="$t('common_back')" placement="top">
          <Icon name="tabler:arrow-back" @click="back" class="" />
        </ElTooltip>
      </VersionHeader>
      <!-- <VersionHerader :doc="oldVersion" </VersionHerader> -->
      <VersionHeader :doc="newVersion"></VersionHeader>
    </div>

    <main v-if="newVersion">
      <!-- <Collapse v-model="activeNames">
            <CollapseItem title="info" name="1">
            <InfoDiff ref="infoDiff" :newVersion="newVersion" :oldVersion="oldVersion"></InfoDiff>
            </CollapseItem>
        </Collapse> -->
      <h3 class="">{{ $t('common_info') }}</h3>
      <InfoDiff ref="infoDiff" :newVersion="newVersion" :oldVersion="oldVersion"></InfoDiff>
      <h3 class="">{{ $t('common_file') }}</h3>
      <div class="viewersContainer">
        <Reader ref="ReaderRef" v-bind="state.previewOldFile"></Reader>
        <Reader ref="ReaderRef" v-bind="state.previewNewFile"></Reader>
        <!-- <PdfViewer :doc="oldVersion"  /> -->
        <!-- <PdfViewer :doc="newVersion"  /> -->
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.versionPageContainer {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-s);
  display: grid;
  grid-template-rows: min-content 1fr;
}

.viewersContainer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  height: 100%;
  flex: 1 0 auto;
  & > div {
    overflow: hidden;
  }
}
h3 {
  margin: 0;
}
main {
  overflow: auto;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
}
.code-diff-view {
  flex: 1 0 auto;
}
.i__back {
  color: var(--color-grey-400);
  font-size: 1.2rem;
  cursor: pointer;
}
</style>
