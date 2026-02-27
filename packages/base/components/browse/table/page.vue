<script lang="ts" setup>
import { Pane, Splitpanes } from 'splitpanes'

import { newClientApi } from 'api'
import { EventType, useEventBus, emitBus } from 'eventbus'
import { actions, ActionsFilter } from '~/../base/utils/browseActions'

const props = withDefaults(
  defineProps<{
    idOrPath: string
    home?: any
    commentId?: string
    expandedItems: any[]
    isReload?: boolean
    showInfo?: boolean
  }>(),
  {
    idOrPath: 'root',
    expandedItems: [],
    isReload: false
  }
)

const { idOrPath, commentId, expandedItems, showInfo } = toRefs(props)
const currentIdOrPath = ref(idOrPath.value)
const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)
const selectedItem = ref<any[]>([])
const infoOpened = ref(false)

const mode = ref<'browse' | 'search'>('browse')

// Add search-related reactive variables
const isSearchExpanded = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement>()

if (!tabProvider || !routerProvider) {
  throw createError('provider not found')
}
const tableRef = ref<InstanceType<typeof BrowseTable>>()
const browswInfoRef = ref()

function addToSelection(items: any[]) {
  selectedItem.value.push(...items)
}

function removeFromSelection(items: any[]) {
  selectedItem.value = selectedItem.value.filter((item) => !items.includes(item))
}

function changeRoute(id: string) {
  currentIdOrPath.value = id
  if (props.isReload) {
    routerProvider?.updateProps({
      idOrPath: id
    })
  }
}

const docDetail = ref()
const docPermission = ref()
const selectedList = ref<any[]>([])

async function getDoc() {
  console.log("get doc")
  docDetail.value = null
  docPermission.value = null
  selectedList.value = []
  const userId = useUserId()
  const { doc } = await getDocDetail(idOrPath.value, userId.value)
  if (!doc.isFolder) {
    tabProvider?.openInCurrentTab(
      createDetailPageParams({
        docName: doc.name,
        idOrPath: doc.id,
        commentId: commentId,
        showHeaderAction: true
      })
    )
  } else {
    docDetail.value = doc
    console.log('docDetail', docDetail.value)
  }
}

function selectedChangeHandler(selectedRows: any[]) {
  selectedList.value = selectedRows
}

function closePreview({ detail }: any) {
  if (!detail) return
  if (detail.id === docDetail.value.id) {
    const newItem = createBrowseListPageParams({
      idOrPath: docDetail.value.parentRef
    })
    routerProvider?.navigateTo(newItem)
  }
}

const docActions = computed(() => {
  if (!docDetail.value) return {}
  if (selectedList.value.length > 0) {
    return ActionsFilter(actions, docDetail.value, 'showInShare')
  }
  return ActionsFilter(actions, docDetail.value, 'showInFolder')
})

function handleSelectAll() {
  if (tableRef.value) {
    tableRef.value.selectAll()
  }
}

function handleClearSelected() {
  if (tableRef.value) {
    tableRef.value.cleanSelected()
  }
}

async function handleRefresh() {
  getDoc()
  if (tableRef.value) {
    tableRef.value.reload()
    setTimeout(() => {
      if (tableRef.value) {
        tableRef.value.tableConfig.loading = false
      }
    }, 2000)
  }
}

async function handleRefreshChild(childId: string) {
  if (tableRef.value) {
    const cItem = tableRef.value?.tableRef?.getRowById(childId)
    if (!!cItem) tableRef.value?.tableRef?.reloadTreeExpand(cItem)
  }
}

function itemDeleted() {}
watch(
  [idOrPath, commentId, showInfo],
  (newVal, oldVal) => {
    getDoc()
    currentIdOrPath.value = newVal[0]
    if (newVal && (newVal[1] || newVal[2])) {
      infoOpened.value = true
    } else {
      infoOpened.value = false
    }
  },
  {
    immediate: true
  }
)

// onMounted(() => {
//   if (tableRef.value) {
//     tableRef.value.reload()
//   }
// })

provide(BrowseListProviderKey, {
  getchildApi: (pageParams: any) => {
    return newClientApi.postDmsDocumentChildrenThumbnail(pageParams)
  },
  idOrPath: currentIdOrPath,
  docDetail,
  docPermission,
  mode,
  searchQuery,
  changeRoute,
  addToSelection,
  removeFromSelection,
  collapseSearch
})
const BrowseDragMove = useBrowseDragMove(selectedList)
provide('BrowseDragMove', BrowseDragMove)
const bus = useEventBus(EventType.FILE_NEED_REFRESH)
bus.on((ids: any) => {
  if (!ids) return
  const relatedIdOrPath = ids?.relatedIdOrPath
  emitBus(EventType.FILE_CLEAN_SELECTED_ROWS)
  console.log('bus', ids)
  // console.log(relatedIdOrPath, docDetail.value.id)
  if (!relatedIdOrPath || !docDetail.value?.id) return
  if (relatedIdOrPath !== docDetail.value?.id) {
    handleRefreshChild(relatedIdOrPath)
  }
  // check id relatedIdOrPath is chidlren of current page
  // TODO: check if highlightIdOrPath is chidlren of current page
  else if (relatedIdOrPath === docDetail.value.id) {
    console.log('relatedIdOrPath')
    handleRefresh()
  }
})

const minSize = ref(30)

const browseContainer = ref()
function calMinWidth() {
  // panel size is 280px, check the percentage of window width
  const containerSize = browseContainer.value?.getBoundingClientRect() as any
  if (!containerSize) return
  minSize.value = Number(((400 / containerSize.width) * 100).toFixed(0))
}
function expandedItemsChangeHandler(updateEexpandedItems: any[]) {
  if (props.isReload) {
    routerProvider?.updateProps({
      expandedItems: updateEexpandedItems
    })
  }
}

useEventListener(window, 'resize', calMinWidth)

useEventListener(document, 'closeFilePreview', closePreview)

// Add search-related functions
function expandSearch() {
  isSearchExpanded.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function collapseSearch() {
  isSearchExpanded.value = false
  searchQuery.value = ''
  mode.value = 'browse'
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    // Implement search logic here
    console.log('Searching for:', searchQuery.value)
    // You can emit an event or call a method to perform the search
    mode.value = 'search'
  }
}

function handleSearchBlur() {
  // Optional: collapse search when input loses focus
  // Uncomment the line below if you want this behavior
  // setTimeout(() => collapseSearch(), 200)
}
</script>

<template>
  <div ref="browseContainer" class="browseContainer">
    <splitpanes>
      <Pane>
        <BrowseTable
          ref="tableRef"
          :class="{ selected: selectedList.length > 0 }"
          :selectedRows="selectedItem"
          :expandedItems="expandedItems"
          :mode="mode"
          @selectedChange="selectedChangeHandler"
          @expandedItemsChange="expandedItemsChangeHandler"
        >
          <template #toolbar_buttons>
            <slot name="toolbar_buttons">
              <div class="toolsBarContainer">
                <template v-if="selectedList.length === 0">
                  <BrowseBreadcrumb :idOrPath="currentIdOrPath" :home="home" />
                </template>
                <template v-else>
                  <div class="selectedNoteContainer">
                    {{ $t('dpDocument_fileSelected') }}: {{ selectedList.length }}
                    <Icon name="mdi:close" @click="handleClearSelected" />
                  </div>
                </template>
              </div>
            </slot>
            <slot name="toolbarTools">
              <div :class="{ searchContainer: true, expanded: isSearchExpanded }">
                <div v-if="!isSearchExpanded" class="searchButton" @click="expandSearch">
                  <Icon name="mdi:magnify" />
                </div>
                <div v-else class="searchInputContainer">
                  <input
                    ref="searchInputRef"
                    v-model="searchQuery"
                    type="text"
                    class="searchInput"
                    placeholder="Search..."
                    @keyup.enter="handleSearch"
                    @blur="handleSearchBlur"
                  />
                  <div class="searchActions">
                    <Icon name="mdi:magnify" class="searchIcon" @click="handleSearch" />
                    <Icon name="mdi:close" class="closeIcon" @click="collapseSearch" />
                  </div>
                </div>
              </div>
              <CollapseMenu v-if="idOrPath !== '/'">
                <template #default="{ collapse }">
                  <template v-for="(group, key) in docActions" :key="key">
                    <template v-for="item in group" :key="item.name">
                      <component
                        :is="item.component"
                        :doc="docDetail"
                        :selectedList="selectedList"
                        @clearSelected="handleClearSelected"
                        @success="handleRefresh"
                        @delete="itemDeleted"
                      />
                    </template>
                    <div :class="{ actionDivider: true, collapse }"></div>
                  </template>
                </template>
              </CollapseMenu>
              <BrowseActionsInfo v-if="idOrPath !== '/'" :doc="docDetail" @itemClicked="infoOpened = !infoOpened" />
            </slot>
          </template>
        </BrowseTable>
      </Pane>
      <Pane v-if="idOrPath !== '/' && infoOpened" :min-size="minSize" :size="minSize">
        <BrowseInfo :doc="docDetail" :infoOpened="infoOpened" :commentId="commentId" @close="infoOpened = false" @refresh="handleRefresh" />
      </Pane>
    </splitpanes>
  </div>
</template>

<style lang="scss" scoped>
.browseContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.selectedNoteContainer {
  padding-left: var(--app-space-s);
  line-height: 1;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: var(--app-space-xs);
}

.toolsBarContainer {
  flex: 1 0 auto;
}

.actionRow {
  width: auto;
  display: flex;
  flex-flow: column nowrap;
}

.pageContainer {
  height: 100%;
  position: relative;
  padding: var(--app-space-s);
}

.actionDivider {
  --icon-size: 1.14rem;
  height: calc(var(--icon-size) + 16px);
  width: 1px;
  background: var(--app-grey-900);

  &.collapse {
    width: 100%;
    height: 1px;
  }
}

.searchContainer {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: var(--app-space-s);
  border-radius: 20px;
  background: transparent;
  border: 1px solid var(--app-grey-900);
  min-width: var(--vxe-ui-button-height-default);
  height: var(--vxe-ui-button-height-default);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: var(--app-space-xs);
  .searchButton {
    line-height: 1;
    padding: 0;
    height: fit-content;
  }
  &.expanded {
    justify-content: flex-start;
  }
  cursor: pointer;
}

.searchInputContainer {
  display: flex;
  align-items: center;
  background: var(--app-white);
  border-color: transparent;
  border-radius: 20px;
  padding: var(--app-space-xs);
  gap: var(--app-space-xs);
}

.searchInput {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  min-width: 120px;

  &::placeholder {
    color: var(--app-grey-950);
  }
}

.searchActions {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
.shareActions {
  margin-right: var(--app-space-xs);
}
.searchIcon,
.closeIcon {
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--app-grey-100);
  }
}
</style>
