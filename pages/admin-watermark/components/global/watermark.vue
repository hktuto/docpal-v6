<template>
  <div class="pageContainer">
    <template v-if="list.length === 0">
      <WatermarkEmpty @update="getList" />
    </template>
    <template v-else>
      <div class="listContainer">
        <WatermarkList :list="list" :selected-id="detail?.id" @update="getList" @remove="deleteItem"
                       @switch="handleSwitch" />
        <WatermarkDetail v-if="detail" ref="watermarkDetail" :detail="detail">
          <template #footer>
            <ElButton id="WatermarkSetting__Save" type="primary" :loading="loading" @click="save">Save</ElButton>
          </template>
        </WatermarkDetail>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'

const detail = ref<WatermarkTemplateDetail | null>(null)
const { getWatermarkTemplateDetail, removeWatermarkTemplate, list, updateWatermarkTemplateDetail } = useWatermark()
const watermarkDetail = ref()
const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  id: string
}>()

const { t } = useI18n()
const loading = ref(false)

async function getList(dummy: boolean = false) {
  const data = await clientApi.admin.getAdmindocpalWatermarkTemplatesAll().then(r => r.data) || []
  list.value = data.sort((a, b) => a.name.localeCompare(b.name))
}

async function deleteItem(id: string) {
  await removeWatermarkTemplate(id)
  routerProvider?.message.success(t('tip_deleteSuccessMessage', {
    modelName: t('tip_SelectedMsg') + t('watermark.watermark'),
    name: null
  }))
  await getList()
  if (list.value.length > 0) {
    routerProvider?.updateProps({
      id: list.value[0].id
    })
    getDetail(list.value[0].id)
  }
}

async function handleSwitch(id: string) {
  detail.value = {
    id,
    watermarkSettings: []
  }
  getDetail(id)
}

async function getDetail(id: string) {
  try {
    detail.value = await getWatermarkTemplateDetail(id)
    if (detail.value.type === 'dynamic') detail.value.contentType = detail.value.content
  } catch (error) {
    detail.value = null
  }
}

async function save() {
  loading.value = true
  const data = await watermarkDetail.value.save()
  if (!data) return
  await updateWatermarkTemplateDetail(data.update)
  routerProvider?.message.success(t('tip_updateMsg', {
    modelName: t('watermark.watermark'),
    name: null
  }))
  setTimeout(() => {
    loading.value = false
  }, 100)
}

onMounted(async () => {
  await getList()
  if (props.id) {
    getDetail(props.id)
  } else if (list.value.length > 0) {
    getDetail(list.value[0].id)
  }
})

</script>
<style lang="scss">
textarea[data-fabric-hiddentextarea] {
  position: fixed !important;
}
</style>
<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  padding: var(--app-space-xs);
  position: relative;
}

.listContainer {
  height: 100%;
  width: 100%;
  padding: 0;
  display: grid;
  grid-template-columns: min-content 1fr;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  overflow: hidden;
  position: relative;
  transform: scale(1);
}
</style>
