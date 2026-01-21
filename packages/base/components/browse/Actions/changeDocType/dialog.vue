<script lang="ts" setup>
import { getDisplayProperties } from '@/components/meta/metadata'
import { useEventListener } from '@vueuse/core'
import { clientApi } from 'api'
import { emitBus, EventType } from 'eventbus'

const props = defineProps<{
  doc: any
}>()
const emits = defineEmits(['success'])

const { formatDate } = useTime()
const dialogOpened = ref(false)
const route = useRoute()

const state = reactive<any>({
  loading: false,
  docPath: '',
  doc: {},
  dispalyMeta: []
})
const MetaFormRef = ref()

async function iconClickHandler(doc: any) {
  dialogOpened.value = true
  state.docPath = doc.path
  state.loading = true

  try {
    state.doc = await clientApi.api.postDmsDocumentFetch({ idOrPath: doc.id }).then(r => r.data)
    state.dispalyMeta = getDisplayProperties(state.doc.properties)
    if (!state.doc.properties) state.doc.properties = {}
    if (!state.doc.properties.maskList) state.doc.properties.maskList = []
    if (!state.doc.properties.readonlyList) state.doc.properties.readonlyList = []
    await MetaFormRef.value.init(state.doc.type, {
      isFolder: state.doc.isFolder,
      hiddenFields: state.doc.properties.maskList,
      readonlyFields: state.doc.properties.readonlyList
    })
  } catch (e) {
    console.log(e)
  }
  setTimeout(() => {
    if (!state.doc.properties) state.doc.properties = {}
    MetaFormRef.value?.setData({
      ...state.doc.properties,
      documentType: state.doc.type
    })
  }, 100)
  // MetaFormRef.value.setData({ ...state.doc.properties, documentType: doc.type || doc.documentType || doc.docpalType })
  // open upload dialog
  state.loading = false
}

async function handleSubmit() {
  try {
    const metaFormData = await MetaFormRef.value.getData()
    if (!metaFormData) return
    state.loading = true
    const params = {
      idOrPath: state.doc.id,
      oldDocPalType: state.doc.type,
      type: metaFormData.documentType,
      properties: metaFormData
      // idOrPath: `${parentPath}/new Folder${timestamp}`,
    }
    delete params.properties.documentType
    const res = await clientApi.api.patchDmsDocumentType(params).then(r => r.data)
    dialogOpened.value = false
    if (state.doc.id !== route.query.docId) {
      setTimeout(() => {
        const ev = new CustomEvent('docActionRefresh', { detail: props.doc })
        document.dispatchEvent(ev)
      })
    } else {
      emits('success', state.doc)
    }
  } catch (error: any) {
    console.error(error)
  } finally {
    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: state.doc.id,
      highlightIdOrPath: state.doc.id
    })
    state.loading = false
  }
}

function getVersion(doc) {
  const major_version = doc?.properties?.['uid:major_version'] || 0
  const minor_version = doc?.properties?.['uid:minor_version'] || 0
  const plus = doc.isCheckedOut ? '+' : ''
  return major_version + '.' + minor_version + plus
}

function getMetaValue(row: any) {
  if (Array.isArray(row)) {
    return row.map((item: any) => item.label || item || '-').join(',')
  }
  return row.label || row || '-'
}

onMounted(async () => {
  useEventListener(document, 'docActionChangeDocType', (event: any) => iconClickHandler(event.detail))
})
defineExpose({ iconClickHandler })
</script>

<template>
  <el-dialog
    class="scroll-dialog change-doc-type-dialog"
    v-model="dialogOpened"
    append-to-body
    :title="`${$t('filePopover_changeDocType')} ${state.doc.name}`"
    :close-on-click-modal="false"
  >
    <main v-loading="state.loading">
      <div v-if="state.doc && state.doc.properties" style="overflow: auto; height: 100%">
        <BrowseActionsChangeDocTypeCopyItem :label="$t('info_type')" :value="state.doc.type" :noCopy="true" />
        <BrowseActionsChangeDocTypeCopyItem :label="$t('info_version')" :value="getVersion(state.doc)" />
        <BrowseActionsChangeDocTypeCopyItem
          v-if="state.doc && state.doc.properties && state.doc.properties['file:content']"
          :label="$t('docInfo.fileExtension')"
          :value="state.doc?.properties['file:content']['mime-type']"
        />
        <BrowseActionsChangeDocTypeCopyItem v-else :label="$t('docInfo.fileExtension')" value="-" />
        <BrowseActionsChangeDocTypeCopyItem :label="$t('info_modified')" :value="formatDate(state.doc.modifiedDate)" />
        <BrowseActionsChangeDocTypeCopyItem :label="$t('info_created')" :value="formatDate(state.doc.createdDate)" />
        <BrowseActionsChangeDocTypeCopyItem :label="$t('info_by')" :value="state.doc.createdBy" />
        <template v-if="state.dispalyMeta && state.dispalyMeta.length > 0 && state.doc.properties">
          <el-divider />
          <BrowseActionsChangeDocTypeCopyItem v-for="item in state.dispalyMeta" :label="$t(item.metaData)"
                                              :value="getMetaValue(item.value)" />
        </template>
      </div>
      <div class="border"></div>
      <MetaRenderForm2 ref="MetaFormRef" mode="changeDocType" style="overflow: auto"></MetaRenderForm2>
    </main>
    <template #footer>
      <el-button id="Browse__ChangeDocumentType__Submit" :loading="state.loading" type="primary" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
main {
  display: grid;
  grid-template-columns: 30% min-content 1fr;
  gap: var(--app-space-xs);
  height: calc(80vh - 10rem);
  overflow: hidden;

  .border {
    border-right: 1px solid #ddd;
  }
}
</style>
<style lang="scss">
.change-doc-type-dialog {
  .el-dialog__body {
    height: 80vh;
    overflow: hidden;
  }
}
</style>
