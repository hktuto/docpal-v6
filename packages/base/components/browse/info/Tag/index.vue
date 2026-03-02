<template>
  <el-divider content-position="left">{{ $t('info.tag&collection') }}</el-divider>
  <div class="infoSection" v-show="tags.length > 0 || canWrite">
    <div class="infoTitle">{{ $t('rightDetail_tags') }}</div>
    <div class="infoContent">
      <VueTagsInput
        element-id="tags"
        v-model="tags" :only-from-suggestions="false"
        :existing-tags="allTags"
        :add-on-space="false" :add-on-comma="true" :add-on-blur="true"
        :placeholder="$t('tip.input')"
        :typeahead="true"
        :disabled="!canWrite"
        @tag-removed="handleTagsRemoved"
        @tag-added="handleTagsAdded"
      />

    </div>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  doc: any,
}>()
const { doc } = toRefs(props)
const { t } = useI18n()
const canWrite = computed(() => {
  return RbacAllowTo('editMetadata', doc.value)
})
// TODO : add api
const emit = defineEmits(['update'])

async function handleTagsAdded(tagSelected: any) {
  // if tagSelected is already in props.doc.properties['nxtag:tags'] return
  if (props.doc?.properties['nxtag:tags'] && props.doc?.properties['nxtag:tags'].some((item: any) => item.label === tagSelected.value)) {
    return
  }
  const param = {
    documentIdOrPath: props.doc.id,
    labels: [tagSelected.value]
  }
  await newClientApi.postDmsDocumentTags(param)
  routerProvider?.message.success(t('msg_successfullyModified') as string)
  emit('update')
}

async function handleTagsRemoved(e: any) {
  console.log('handleDocumentTagsChange', tags.value)
  const param = {
    documentIdOrPath: props.doc.id,
    labels: tags.value.map((item: any) => item.value)
  }
  await newClientApi.patchDmsDocumentTags(param).then(r => r.data)
  ElMessage.success(t('msg_successfullyModified') as string)
  emit('update')
}

const tags = ref([])
const allTags = ref([])

async function getAllTags() {
  const response = await newClientApi.postDmsDocumentTagsSearch({ keyword: '' }).then(res => res.data)
  allTags.value = response.map((item: string) => {
    return { value: item, key: item }
  })
}

watch(doc, () => {
  if (!props.doc && !props.doc.properties) {
    tags.value = []
    return
  }
  tags.value = (props.doc?.properties['nxtag:tags'] || []).map((item: any) => ({
    key: item.label,
    value: item.label
  }))
}, { immediate: true })

onMounted(() => getAllTags())
</script>


<style lang="scss" scoped>


.tags-input-root {
  font-size: var(--app-font-size-m);

  :deep(.tags-input-wrapper-default.active) {
    border-color: var(--primary-color);
    box-shadow: none;
  }

  :deep(.tags-input-wrapper-default) {
    padding: var(--app-space-xxs);
  }

  :deep(input) {
    font-size: var(--app-font-size-s);
  }

  :deep(.typeahead-badges) {
    margin-block: var(--app-space-xxs);
  }

  :deep(.tags-input-typeahead-item-default) {
    background-color: var(--app-grey-900) !important;
    color: var(--app-text-color-primary) !important;
    font-style: normal !important;
  }

  :deep(.tags-input-typeahead-item-highlighted-default) {
    background-color: var(--app-primary-color) !important;
  }
}
</style>
