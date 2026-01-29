<script lang="ts" setup>
import { EventType, useEventBus } from 'eventbus'

import { ArrowRight } from '@element-plus/icons-vue'
import { clientApi } from 'api'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  idOrPath: string
  home: any
}>()
const { idOrPath } = toRefs(props)
const listProvider = inject(BrowseListProviderKey)
if (!listProvider) {
  throw new Error('BrowseListProviderKey not found')
}

const bus = useEventBus(EventType.FILE_NEED_REFRESH)

const breadcrumbList = ref<any[]>([])
const loading = ref(false)
const dropItems = []

async function getBreadcrumb() {
  loading.value = true
  try {
    // if idOrPath === home.secondId, then data = []
    let data = []
    data = await clientApi.api.postDmsDocumentBreadcrumb({ idOrPath: idOrPath.value }).then((res: any) => {
      return res.data
    })
    if (props.home) {
      const index = data?.findIndex((item: any) => item.id === props.home.secondId)
      if (index > 0) {
        data.splice(0, index)
      }
    }

    breadcrumbList.value = data
  } catch (e) {}
  loading.value = false
  // remove old dropItem
  nextTick(() => {
    dropItems.forEach((item) => {
      if (typeof item === 'function') {
        item()
      }
    })
  })
}

function navigate(idOrPath?: string) {
  if (idOrPath) {
    listProvider?.changeRoute(idOrPath)
    return
  }
  if (props.home?.homeRouteItem) {
    routerProvider?.navigateTo(props.home.homeRouteItem)
    return
  }
  if (props.home?.secondId) {
    listProvider?.changeRoute(props.home.secondId)
    return
  }

  listProvider?.changeRoute('root')
}

watch(
  idOrPath,
  () => {
    if (idOrPath.value) {
      getBreadcrumb()
    }
  },
  {
    immediate: true
  }
)
const { dropEvent } = useBrowseBreadcrumbDrop()
onMounted(() => {
  bus.on(fileRefreshHandler)
})

onDeactivated(() => {
  bus.off(fileRefreshHandler)
})

function fileRefreshHandler({ relatedIdOrPath }: any) {
  // const needRefresh = breadcrumbList.value.some((el) => el.id !== relatedIdOrPath)
  const needRefresh = breadcrumbList.value.some((el) => el.id === relatedIdOrPath)
  getBreadcrumb()
}
</script>

<template>
  <div class="breadcrumbContainer">
    <div v-loading="loading" class="breadItem pointer home" @click="navigate()">
      <Icon name="dp-icon:breadcrumb-home" />
    </div>
    <div v-if="breadcrumbList && breadcrumbList.length > 0" class="divider">
      <ElIcon>
        <ArrowRight />
      </ElIcon>
    </div>
    <template v-for="(item, index) in breadcrumbList" :key="item.id">
      <div
        :class="{ breadItem: true, pointer: index < breadcrumbList.length - 1 }"
        :id="'breadcrumb-' + item.id"
        @click="
          () => {
            if (index === breadcrumbList.length - 1) return
            navigate(item.id)
          }
        "
        @drop.prevent="dropEvent.drop"
        @dragover.prevent="dropEvent.dragover($event, item)"
        @dragleave.prevent="dropEvent.dragleave"
      >
        {{ item.name }}
      </div>
      <div v-if="index < breadcrumbList.length - 1" class="divider">
        <ElIcon>
          <ArrowRight />
        </ElIcon>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.breadcrumbContainer {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xxs);
}

.breadItem {
  padding: var(--app-space-xs);
  color: var(--app-grey-100);
  font-size: var(--app-font-size-m);
  font-weight: 700;
  border-radius: var(--app-border-radius-m);
  &.pointer {
    color: var(--app-grey-300);
    cursor: pointer;

    &:hover {
      color: var(--app-accent-color);
    }
  }
}
.drop-row {
  background-color: var(--app-grey-900) !important;
}

</style>
