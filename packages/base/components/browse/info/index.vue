<script lang="ts" setup>
import * as mime from 'mime-types'

const { infoSlots } = useBrowse()

const BrowseActionsEditRef = ref()
const props = withDefaults(
  defineProps<{
    doc?: any
    infoOpened?: boolean
    hidePreview?: boolean
    draggable?: boolean
    resizeOption?: any
    listData?: any
    commentId?: string
  }>(),
  {
    doc: null
  }
)
const userId = useUserId()

const { doc } = toRefs(props)
const currentTab = ref('info')

const loading = ref(false)
const detail = ref<any>()
const DISABLE_EDIT_METADATA = computed(() => {
  return !RbacAllowTo('editMetadata', doc.value)
})
function openEditInfo() {
  if (BrowseActionsEditRef.value) {
    BrowseActionsEditRef.value.openDialog()
  }
}

async function docUpdated(forceRefresh?: boolean = false) {
  if (props.listData && doc.value.id === props.listData.doc.id && !forceRefresh) {
    detail.value = deepCopy(props.listData.doc)
    return
  }
  loading.value = true
  try {
    // @ts-ignore
    detail.value = null // set detail to null to reset all tab
    // check doc is Folder or not, if is folder but tag is convert or relate, switch back to info
    if (doc.value.isFolder && ['convert', 'relate'].includes(currentTab.value)) {
      currentTab.value = 'info'
    }
    // get detail
    //   const response = await getDocumentDetail(doc.value.id, userId);
    const response = await getDocDetail(doc.value.id, userId.value)
    detail.value = response.doc
    //scroll to top
    const tabContent = document.querySelector('#browseInfoSection .infoTagContainer')
    if (tabContent) {
      tabContent.scrollTop = 0
    }
  } catch (error) {}
  loading.value = false
}

watch(
  doc,
  async () => {
    if (!doc.value) return
    docUpdated()
  },
  { immediate: true }
)
watch(
  () => props.commentId,
  async () => {
    if (props.commentId) {
      currentTab.value = 'comments'
    } else if (props.showInfo) {
      currentTab.value = 'info'
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="infoContainer">
    <!-- doc preview and name -->
    <div class="infoHeaderSection">
      <slot name="header" />
      <div class="headerTopRow">
        <div class="name">
          <div class="namespan" @dblclick="openEditInfo">{{ doc ? doc.name : '' }}</div>
          <BrowseActionsEdit ref="BrowseActionsEditRef" v-if="!DISABLE_EDIT_METADATA" :doc="detail" @success="$emit('refresh')" />
        </div>

        <SvgIcon :src="'/icons/close.svg'" @click="$emit('close')" />
      </div>
    </div>
    <template v-if="detail">
      <el-tabs class="tabContainer dp-tabs--auto" v-model="currentTab">
        <el-tab-pane :label="$t('rightDetail_info')" name="info">
          <div class="infoTagContainer">
            <!-- <div v-if="!hidePreview" class="infoPreviewContainer">
                <BrowseInfoPreview :doc="detail"  />
            </div> -->
            <BrowseInfoDocInfo :doc="detail" :disable="DISABLE_EDIT_METADATA" @update="docUpdated" @refresh="$emit('refresh')" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('rightDetail_activities')" name="activities">
          <BrowseInfoActivities v-if="currentTab === 'activities'" :doc="detail" />
        </el-tab-pane>
        <el-tab-pane v-if="allowFeature('DOC_COMMENT')" class="pane--comment" :label="$t('rightDetail_comments')" name="comments">
          <!-- TODO: rbac check permission :disabled="checkPermission(permission)" -->
          <BrowseInfoComments 
            v-if="currentTab === 'comments'" 
            :doc="detail" 
            :commentId="commentId"
            :disabled="detail.status === 20"
          />
        </el-tab-pane>
        <el-tab-pane v-if="!detail.isFolder && allowFeature('DOCUMENT_CONVERSION')" :label="$t('convert_convert')" name="convert">
          <BrowseInfoPicture v-if="allowFeature('DAM_FILE_CONVERTION')" :doc="detail" />
          <BrowseInfoConvert v-if="currentTab === 'convert'" :doc="detail" />
        </el-tab-pane>
        <el-tab-pane v-for="slot in infoSlots" :key="slot.name" :label="$t(slot.name)" :name="slot.name">
          <component v-if="currentTab === slot.name" :is="slot.component" v-bind="{ ...$props, detail }" />
        </el-tab-pane>
      </el-tabs>
    </template>
    <!--  <div  v-loading="loading" class="loadingContainer">-->
    <!--    {{ detail }}-->
    <!--  </div>-->
  </div>
</template>

<style lang="scss" scoped>
.infoContainer {
  width: 100%;
  height: 100%;
  padding-inline: var(--app-space-s);
}
.infoPreviewContainer {
  background: var(--app-grey-900);
  padding: var(--app-space-xs);
}
.infoHeaderSection {
  padding-block: var(--app-space-xs);
}
.headerTopRow {
  --icon-size: var(--app-font-size-m);
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  align-items: center;
  > * {
    flex-shrink: 0;
    min-width: var(--icon-size);
  }
  .name {
    flex: 1 0 auto;
    font-weight: 800;
    font-size: 1.2rem;
    word-break: break-all;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: calc(var(--app-space-xs));
  }
}
.infoContainer {
  height: 100%;
  user-select: none;
  -ms-touch-action: none;
  touch-action: none;
  overflow: auto;
  display: grid;
  grid-template-rows: min-content 1fr;
  border-radius: 12px;
  position: relative;
  &.infoOpened {
    padding: var(--app-space-xs);
  }
  &.draggable {
    cursor: move;
    position: fixed;
  }
  @media (max-width: 640px) {
    margin-left: 0;
  }
}
.infoTagContainer {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  gap: 6px;
  overflow: auto;
}
.tabContainer {
  min-width: 180px;
  :deep(.el-tab-pane) {
    height: 100%;
    overflow: auto;
  }
}

.resize-drag {
  box-sizing: border-box;
  background: #41b883;

  /* To prevent interact.js warnings */
  user-select: none;
  -ms-touch-action: none;
  touch-action: none;
}
.dp-tabs--auto {
  overflow: hidden;
  .pane--comment {
    overflow: hidden;
  }
}
</style>
