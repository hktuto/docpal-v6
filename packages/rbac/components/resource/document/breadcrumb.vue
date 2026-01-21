<script lang="ts" setup>
import { ArrowRight } from '@element-plus/icons-vue'
import { clientApi } from 'api'

const props = defineProps<{
  id: string
}>()
const { id } = toRefs(props)

const emits = defineEmits(['idChange'])

const breadcrumbList = ref<any[]>([])
const loading = ref(false)

async function getBreadcrumb() {
  try {
    loading.value = true
    // if idOrPath === home.secondId, then data = []
    let data = []
    const idOrPath = id.value === 'root' ? '/' : id.value
    data = await clientApi.api.postDmsDocumentBreadcrumb({ idOrPath }).then((res: any) => res.data)
    // because Royhoo hard core root id ==== root , so ignore it
    breadcrumbList.value = data.filter((item: any) => item.id !== 'root')
  } catch (e) {
    throw e
  } finally {
    loading.value = false
  }
}

function navigate(idOrPath?: string) {
  if (idOrPath) {
    emits('idChange', idOrPath)
    return
  }
  emits('idChange')
}

watch(
  id,
  () => {
    if (id.value) {
      getBreadcrumb()
    }
  },
  {
    immediate: true
  }
)
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
  color: var(--app-grey-100);
  font-size: var(--app-font-size-m);
  font-weight: 700;

  &.pointer {
    color: var(--app-grey-300);
    cursor: pointer;

    &:hover {
      color: var(--app-accent-color);
    }
  }
}
</style>
