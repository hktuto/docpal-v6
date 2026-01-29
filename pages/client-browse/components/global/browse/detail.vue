<script lang="ts" setup>
import { Splitpanes, Pane } from 'splitpanes'
import * as mime from 'mime-types'
import { EventType, useEventBus } from 'eventbus'
const props = withDefaults(
  defineProps<{
    idOrPath: string
    showHeaderAction?: boolean
    showInfo: boolean
    commentId: string
    home: any
  }>(),
  {
    idOrPath: '',
    showHeaderAction: true,
    showInfo: false,
    commentId: '',
    home: ''
  }
)
const { idOrPath, commentId } = toRefs(props)
const itemRefs = ref({})
defineOptions({
  name: 'BrowseDetailDead'
})

const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)

if (!tabProvider || !routerProvider) {
  throw createError('provider not found')
}
const infoOpened = ref(false)
const docDetail = ref()
const mobileActionOpened = ref(false)
const loading = ref(false)
const isTrash = ref(false)
async function getDetail() {
  loading.value = true
  docDetail.value = null
  const userId = useUserId()
  const { doc } = await getDocDetail(idOrPath.value, userId.value)
  isTrash.value = doc.status === 20;
  // if doc is Folder, redirect to browse page
  if (doc.isFolder) {
    const newItem = createBrowseListPageParams({
      idOrPath: doc.id
    })
    routerProvider?.navigateTo(newItem)
    return
  }
  docDetail.value = doc
  loading.value = false
  const history = routerProvider?.getHistory()
  if(!history || history.length === 0) {
    const newItem = createBrowseListPageParams({
      idOrPath: doc.parentRef
    })
    routerProvider?.addToHistory(newItem)
  }
  routerProvider?.updateTabName(docDetail.value.name)
}
const isPdf = ref(false)

function closePreview({ detail }: any) {
  if (!detail) return
  if (detail.id === docDetail.value.id) {
    const newItem = createBrowseListPageParams({
      idOrPath: docDetail.value.parentRef
    })
    routerProvider?.navigateTo(newItem)
  }
}
function itemDeleted() {
  const newItem = createBrowseListPageParams({
    idOrPath: docDetail.value.parentRef
  })
  routerProvider?.navigateTo(newItem)
}
const PreviewRef = ref()
function handleRefresh(needRefresh: boolean = true) {
  getDetail()
  if (PreviewRef.value && needRefresh) {
    if (PreviewRef.value.refresh) PreviewRef.value.refresh()
  }
}

const BrowseActionsAiDrawerRef = ref()
function handleOpenAiDrawer() {
  BrowseActionsAiDrawerRef.value.open()
}

function mobileActionsOpenedChanged(bool: boolean) {
  mobileActionOpened.value = bool
}

const detailActions = computed(() => {
  if (!docDetail.value) return {}
  return ActionsFilter(actions, docDetail.value, 'showInDetail', isTrash.value)
})

function goParent() {
  const newItem = createBrowseListPageParams({
    idOrPath: docDetail.value.parentRef
  })
  routerProvider?.navigateTo(newItem, false, true)
}

useEventListener(document, 'closeFilePreview', closePreview)

function switchFile(newFileId: string) {
  routerProvider?.updateProps({ idOrPath: newFileId })
}

watch(
  [idOrPath, commentId],
  (newVal, oldVal) => {
    getDetail()
    if (newVal && newVal[1]) {
      infoOpened.value = true
    } else if (oldVal && oldVal[1]) {
      infoOpened.value = false
    }
  },
  {
    immediate: true
  }
)

const minSize = ref(20)
const pageContainerRef = ref()
function calMinWidth() {
  // panel size is 280px, check the percentage of window width
  const pageContainer = pageContainerRef.value?.getBoundingClientRect() as any
  minSize.value = Number(((400 / pageContainer.width) * 100).toFixed(0))
}
const bus = useEventBus(EventType.FILE_NEED_REFRESH)
bus.on(({ relatedIdOrPath, highlightIdOrPath }: any) => {
  if (relatedIdOrPath === idOrPath.value) getDetail()
})

onMounted(calMinWidth)

useEventListener(window, 'resize', calMinWidth)
</script>

<template>
  <div ref="pageContainerRef" class="pageContainer">
    <splitpanes>
      <Pane>
        <div v-if="docDetail" class="detailContainer">
          <div class="header">
            <div class="fileNameContainer">
              <div class="fileName">
                <ElTooltip :content="$t('common_back')" placement="top">
                  <Icon name="tabler:arrow-back" @click="goParent" />
                </ElTooltip>
                <BrowseDetailFileNamePicker :docId="docDetail.id" :title="docDetail.name" :parentRef="docDetail.parentRef" @itemClick="switchFile" />
                <el-tag
                  v-if="docDetail.properties && docDetail.properties['file_content'] && docDetail.properties['file_content']['mime-type']"
                  class="doc-extension"
                  effect="dark"
                  type="info"
                  >{{ mime.extension(docDetail.properties['file_content']['mime-type']) }}</el-tag
                >
              </div>
            </div>
            <div class="actions">
              <template v-if="showHeaderAction">
                <CollapseMenu @openedChange="mobileActionsOpenedChanged">
                  <template #default="{ collapse }">
                    <template v-for="(group, key) in detailActions" :key="key">
                      <template v-for="item in group" :key="item.name">
                        <component
                          :is="item.component"
                          :doc="docDetail"
                          :ref="(el) => (itemRefs[item.name] = el)"
                          :isPdf="isPdf"
                          test="ssssss"
                          @success="handleRefresh"
                          @delete="itemDeleted"
                          @openAiDrawer="handleOpenAiDrawer"
                          :hideAfterClick="item.hideAfterClick !== false"
                        />
                      </template>
                      <div :class="{ actionDivider: true, collapse }"></div>
                    </template>
                  </template>
                </CollapseMenu>

                <BrowseActionsInfo @itemClicked="infoOpened = !infoOpened" />
                <div :class="{ actionDivider: true, collapse }"></div>
              </template>
            </div>
          </div>
          <div class="content">
            <BrowsePreview
              :docDetail="docDetail"
              :editable="RbacAllowTo('write', docDetail)"
              :loadAnnotations="true && allowFeature('DOC_ANNOTATION')"
              :print="RbacAllowTo('print', docDetail) && allowFeature('DOC_PRINT')"
              :readOnly="!RbacAllowTo('write', docDetail) || !allowFeature('DOC_ANNOTATION')"
            />
            <!-- <div v-if="loading || !docDetail || !docDetail.properties" class="noSupportContainer" >
                        {{ $t('common_loading') }}
                    </div>
                <template v-else>
                    <div v-if="readerType" :class="{preview:true, mobileActionOpened}" >
                        <component 
                            :is="readerType" 
                            ref="PreviewRef" 
                            :docId="docDetail.id"
                            :doc="docDetail" :editMode="editMode"
                            fileType="NUXEO" 
                            :readonly="true" 
                            :editable="AllowTo({feature:'ReadWrite' })"
                            :options="{loadAnnotations:true  && allowFeature('DOC_ANNOTATION'), print:  allowFeature('DOC_PRINT'), readOnly: !AllowTo({feature:'ReadWrite' }) || !allowFeature('DOC_ANNOTATION')}"
                            @saved="() => handleRefresh(false)"
                        /> 
                        <BrowseAiPopover v-if="appStore.licenseFeatures.ASK_AI"  :doc="docDetail"></BrowseAiPopover>
                    </div> 
                    <h2 v-else class="noSupportContainer" >
                        {{ $t('msg_thisFormatFileIsNotSupported') }}
                    </h2> 
                </template> -->
            <div class="info">
              <BrowseInfo
                v-if="showInfo"
                :doc="docDetail"
                :commentId="commentId"
                :infoOpened="infoOpened"
                :hidePreview="true"
                @close="infoOpened = false"
                @refresh="handleRefresh"
              />
            </div>
          </div>
        </div>
      </Pane>
      <Pane v-if="infoOpened" :min-size="minSize" :size="minSize">
        <BrowseInfo
          :doc="docDetail"
          :infoOpened="infoOpened"
          :commentId="commentId"
          @close="infoOpened = false"
          @refresh="handleRefresh"
        />
      </Pane>
    </splitpanes>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-s);
}
.detailContainer {
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
}
.header {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-s);
  color: var(--app-grey-000);
  align-content: center;
  .actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: calc(var(--app-space-s) / 2);
  }
  @media (max-width: 640px) {
    .actions {
      flex-flow: row nowrap;
    }
  }
}
.content {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr min-content;
  // overflow: hidden;
  position: relative;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    .info {
      position: absolute;
      z-index: 2;
      top: var(--app-space-xs);
      left: var(--app-space-xs);
      width: calc(100% - var(--app-space-xs) * 2);
      height: calc(100% - var(--app-space-xs) * 2);
    }
  }
  .info {
    transition: width 0.2s ease-in-out;
    overflow: hidden;
  }
}
.noSupportContainer,
:deep(.noSupportContainer) {
  color: var(--app-grey-000);
  display: flex;
  justify-content: center;
  align-items: center;
}
.fileNameContainer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: calc(var(--app-space-xs) / 2);
}
.fileName {
  font-size: var(--el-font-size-large);
  text-align: left;
  word-break: break-all;
  display: flex;
  gap: var(--app-space-xs);
  align-items: center;
}

:deep(.noSupportContainer) {
    font-size: var(--icon-size);
    background: var(--app-grey-200);
    padding: 8px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--app-grey-900);
    cursor: pointer;
    &:hover {
      background: var(--app-grey-200);
    }
  }
</style>
