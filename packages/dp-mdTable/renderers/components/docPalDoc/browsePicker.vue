<script setup lang="ts">
import { newClientApi } from 'api'
import type { DocPalDocCellValue } from '../../../types/column-types'

const props = withDefaults(
  defineProps<{
    visible: boolean
    homeId?: string
  }>(),
  {
    homeId: '/'
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'add', docs: DocPalDocCellValue[]): void
}>()

const { t } = useI18n()

const idOrPath = ref(props.homeId)
const tableRef = ref()
let selectedRows: Array<{ id: string; name: string; mimeType?: string; isFolder?: boolean }> = []

function selectedChange(rows: Array<{ id: string; name: string; mimeType?: string; isFolder?: boolean }>) {
  selectedRows = JSON.parse(JSON.stringify(rows))
}

function handleClose() {
  emit('update:visible', false)
}

function handleAdd() {
  const docs: DocPalDocCellValue[] = selectedRows
    .filter((row) => row?.id && !row.isFolder)
    .map((row) => ({ id: row.id, name: row.name, mimeType: row.mimeType }))
  emit('add', docs)
  tableRef.value?.cleanSelected?.()
  selectedRows = []
  emit('update:visible', false)
}

function changeRoute(id: string) {
  idOrPath.value = id
}

provide(BrowseListProviderKey, {
  getchildApi: (pageParams: Record<string, unknown>) => {
    return newClientApi.postDmsDocumentChildrenThumbnail(pageParams)
  },
  idOrPath,
  changeRoute
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    idOrPath.value = props.homeId
    selectedRows = []
    nextTick(() => {
      tableRef.value?.cleanSelected?.()
    })
  }
)
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="t('editor.docPalDoc.select')"
    width="80%"
    top="5vh"
    destroy-on-close
    append-to-body
    class="docpal-doc-browse-picker-dialog vxe-table--ignore-clear"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="docpal-doc-browse-picker">
      <BrowseMiniTable ref="tableRef" :home="homeId" showCheckbox @selectedChange="selectedChange">
        <template #toolbar_buttons>
          <BrowseBreadcrumb :idOrPath="idOrPath" :home="{ secondId: homeId, disabled: true }" />
        </template>
      </BrowseMiniTable>
    </div>
    <template #footer>
      <ElButton @click="handleClose">{{ t('cancelText') }}</ElButton>
      <ElButton type="primary" @click="handleAdd">{{ t('Add') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.docpal-doc-browse-picker {
  height: 70vh;
  overflow: hidden;
}
</style>
