<script setup lang="ts">
import { newClientApi } from 'api'
const props = defineProps<{
  docId: string
}>()

const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)
if (!tabProvider || !routerProvider) {
  throw new Error('TabManagerKey not found')
}

const docDetail = ref<any>(null)
const loading = ref(false)

async function getDocDetail() {
  loading.value = true
  try {
    docDetail.value = await newClientApi.postDmsDocumentFetch({idOrPath: props.docId}).then(r => r.data)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function openDoc() {
  const newItem = createDetailPageParams({
    idOrPath: props.docId
  })
  routerProvider.navigateTo(newItem, false)
}

onMounted(() => {
  getDocDetail()
})
</script>

<template>
  <div v-loading="loading">
    <div v-if="docDetail" @click="openDoc" class="cursor-pointer">
      {{ docDetail.name }}
    </div>
  </div>
</template>


<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
  color: var(--app-primary-color);
  text-decoration: underline;
}
</style>
