<script setup lang="ts">
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { DocPalDocCellValue } from '../../../types/column-types'
import { getRowCellValue } from '../../../utils/fieldValueFormat'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const routerProvider = inject(MenuRouterKey, null)

function getDocPalDocs(value: unknown): DocPalDocCellValue[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter((item): item is DocPalDocCellValue => Boolean((item as DocPalDocCellValue)?.id))
  }

  const single = value as DocPalDocCellValue
  return single?.id ? [single] : []
}

function getDocIcon(doc: DocPalDocCellValue) {
  return mimeTypeToIcon(doc.mimeType || '')
}

function handleOpenDocument(doc: DocPalDocCellValue, event: MouseEvent | KeyboardEvent) {
  event.stopPropagation()
  event.preventDefault()
  if (!routerProvider) return

  routerProvider.navigateTo(
    createDetailPageParams({
      idOrPath: doc.id,
      docName: doc.name || doc.id
    }),
    true
  )
}

const docs = computed(() => getDocPalDocs(getRowCellValue(props.row, props.field)))
</script>

<template>
  <span v-if="!docs.length" class="field-value">--</span>
  <span v-else class="field-value field-value--links">
    <a
      v-for="doc in docs"
      :key="doc.id"
      class="field-link field-link--doc"
      href="#"
      tabindex="0"
      role="link"
      :aria-label="doc.name || doc.id"
      @click.stop="handleOpenDocument(doc, $event)"
      @keydown.enter.stop.prevent="handleOpenDocument(doc, $event)"
    >
      <img class="field-link__icon" :src="getDocIcon(doc)" alt="" aria-hidden="true" />
      {{ doc.name || doc.id }}
    </a>
  </span>
</template>
