<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { emitBus, EventType } from 'eventbus'
const show = ref(false)
const infoOpened = ref(false)
const permission = ref()
const {
  public: { feature }
} = useRuntimeConfig()
const { allowFeature } = useLayout()
const doc = ref({
  name: ''
})
const { relatedChildren } = useRelatedFolder()

function closePreview() {
  show.value = false
}

useEventListener(document, 'show-relate-map', ({ detail }) => {
  console.log(detail)
  permission.value = detail.permission
  doc.value = detail.doc
  show.value = true
})
useEventListener(document, 'close-relate-map', () => {
  show.value = false
})

function itemDeleted() {
  closePreview()
}

function handleRefresh() {
  emitBus(EventType.FILE_NEED_REFRESH, {
    relatedIdOrPath: doc.value
  })
}
const DISABLE_EDIT_METADATA = computed(() => {
  return !RbacAllowTo({ feature: 'ReadWrite', permission })
})
</script>

<template>
  <div id="relatedMapContainer">
    <teleport to="body">
      <div v-if="show && relatedChildren" class="dialog">
        <div id="modalHeader">
          <div class="fileNameContainer">
            <div class="fileName">{{ doc.name }}</div>
          </div>
          <div class="actions">
            <BrowseActionsInfo :doc="doc" @click="infoOpened = !infoOpened" />
            <div class="actionIconContainer" @click="closePreview">
              <el-icon>
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728="">
                  <path
                    fill="currentColor"
                    d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
                  ></path>
                </svg>
              </el-icon>
            </div>
          </div>
        </div>
        <div id="relatedContent">
          <canvas id="relatedCanvas"></canvas>
          <BrowseInfo
            id="relatedInfo"
            :doc="doc"
            :permission="permission"
            :infoOpened="infoOpened"
            :hidePreview="true"
            @close="infoOpened = false"
            draggable
            :resizeOption="{
              edges: { left: true, right: true, bottom: false, top: false }
            }"
          >
            <template #header>
              <div class="infoHeaderActions">
                <BrowseActionsHold :doc="doc" :permission="permission" @success="handleRefresh" />
                <BrowseActionsEdit v-if="!DISABLE_EDIT_METADATA" :doc="doc" @success="handleRefresh" />
                <BrowseActionsSubscribe v-if="allowFeature('SUBSCRIBE')" :doc="doc" />
                <BrowseActionsReplace :doc="doc" v-if="!DISABLE_EDIT_METADATA" @success="handleRefresh" />
                <!-- <BrowseActionsReplace :doc="doc" v-if=" RbacAllowTo({feature:'ReadWrite', permission }) && !doc.isCheckedOut" @success="handleRefresh"/> -->
                <BrowseActionsDownload v-if="!DISABLE_EDIT_METADATA" :doc="doc" />
                <BrowseActionsDelete v-if="!DISABLE_EDIT_METADATA" :doc="doc" @delete="itemDeleted" @success="handleRefresh" />
                <BrowseActionsCopyPath :doc="doc" />
                <BrowseActionsOffice v-if="!DISABLE_EDIT_METADATA" :doc="doc" @refresh="handleRefresh" />

                <BrowseActionsShare
                  v-if="allowFeature('SHARE_EXTERNAL') && RbacAllowTo({ feature: 'ReadWrite', permission })"
                  :doc="doc"
                  :hideAfterClick="true"
                />
              </div>
            </template>
          </BrowseInfo>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
.dialog {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100%;
  z-index: 5;
  background: conic-gradient(from 90deg at 1px 1px, #c9ddf4 90deg, #dee7ee 0) 0 0/10px 10px;
  display: grid;
  grid-template-rows: min-content 1fr;
}

#modalHeader {
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-s);
  padding-inline: var(--el-component-size-small);
  padding-top: var(--app-space-s);
  color: var(--color-grey-0000);
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
.actionIconContainer {
  color: #000;
}
.fileName {
  color: #000;
  font-size: 1.2rem;
  font-weight: 700;
}
#relatedContent {
  width: 100%;
  height: 100%;
  position: relative;
}
#relatedInfo {
  max-height: 80vh;
  right: var(--app-space-s);
  top: var(--app-space-s);
}

.infoHeaderActions {
  width: 100%;
  overflow: auto;
  display: flex;
  gap: var(--app-space-s);
  flex-flow: row nowrap;
}

:deep(.actionIconContainer) {
  font-size: var(--icon-size);
  background: var(--color-grey-150);
  padding: 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--color-grey-950);
  cursor: pointer;
  &:hover {
    background: var(--color-grey-200);
  }
}
</style>
