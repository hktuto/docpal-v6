<script setup lang="ts">
import { Rank } from '@element-plus/icons-vue'
import { mimeTypeToIcon } from '../../../base/utils/browseHelper'
import { ColumnFieldType, type DocPalDocCellValue } from '../../types/column-types'

type UrlCellValue = {
  text: string
  title: string
}

const routerProvider = inject(MenuRouterKey, null)
interface Props {
  row: Record<string, any>
  fields: any[]
  styleConfig: {
    showCover?: boolean
    coverField?: string
    stretchCover?: boolean
    showFieldName?: boolean
    bordered?: boolean
    compact?: boolean
    shadow?: 'none' | 'small' | 'hover'
  }
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  row: () => ({}),
  fields: () => [],
  styleConfig: () => ({
    showCover: true,
    coverField: '',
    stretchCover: true,
    showFieldName: true,
    bordered: true,
    compact: false,
    shadow: 'small',
    cardCount: 5
  }),
  draggable: false
})

const emit = defineEmits<{
  'open-record': [row: any]
  'row-context-menu': [row: any, event: MouseEvent]
}>()

const previewFields = computed(() => {
  return props.fields.filter((field: any) => !field.hidden).slice(0, 6)
})

const cardClass = computed(() => {
  return {
    'is-bordered': props.styleConfig.bordered !== false,
    'is-compact': !!props.styleConfig.compact,
    'shadow-none': props.styleConfig.shadow === 'none',
    'shadow-small': props.styleConfig.shadow === 'small',
    'shadow-hover': props.styleConfig.shadow === 'hover',
    'is-deleted': props.row.__deleted
  }
})

const coverUrl = computed(() => {
  const selectedCoverField = props.styleConfig.coverField || ''
  if (!selectedCoverField || props.styleConfig.showCover === false) {
    return ''
  }
  const attachmentField = props.fields.find((field: any) => {
    const fieldName = field?.field_name || field?.fieldName
    return fieldName === selectedCoverField
  })
  if (!attachmentField) {
    return ''
  }
  const fieldName = attachmentField?.field_name || attachmentField?.fieldName
  const value = props.row?.[fieldName]
  if (!value) {
    return ''
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0]?.url || value[0]?.downloadUrl || ''
  }
  if (typeof value === 'string') {
    return value
  }
  return value?.url || value?.downloadUrl || ''
})

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function isUrlField(field: any) {
  return field?.business_type === ColumnFieldType.URL
}

function normalizeHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function getUrlLinks(value: unknown): Array<{ href: string; label: string }> {
  if (value === null || value === undefined || value === '') {
    return []
  }

  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [{ text: value, title: value }]
      : [value]

  return items
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim()
        return text ? { href: normalizeHref(text), label: text } : null
      }

      const cell = item as Partial<UrlCellValue>
      const text = typeof cell.text === 'string' ? cell.text.trim() : ''
      const title = typeof cell.title === 'string' ? cell.title.trim() : ''
      if (!text && !title) return null

      const hrefSource = text || title
      return {
        href: normalizeHref(hrefSource),
        label: title || text
      }
    })
    .filter((item): item is { href: string; label: string } => Boolean(item))
}

function isDocPalDocField(field: any) {
  return field?.business_type === ColumnFieldType.DocPalDoc
}

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

function handleOpenRecord() {
  if(props.row.__deleted) return
  emit('open-record', props.row)
}

function handleContextMenu(event: MouseEvent) {
  emit('row-context-menu', props.row, event)
}
</script>

<template>
  <div
    class="md-card-widget"
    :class="cardClass"
    :id="'cardItem_' + props.row.id"
    tabindex="0"
    aria-label="打开记录"
    :style="{ '--card-count': styleConfig.cardCount }"
    @click="handleOpenRecord"
    @contextmenu.prevent.stop="handleContextMenu"
    @keydown.enter="handleOpenRecord"
  >
    <!-- <div
      v-if="draggable"
      class="card-drag-handle drag-handle"
      tabindex="0"
      aria-label="拖拽调整顺序"
      @mousedown.stop
      @click.stop
      @keydown.enter.stop
    >
      <el-icon :size="16">
        <Rank />
      </el-icon>
    </div> -->

    <div v-if="!!styleConfig.coverField && styleConfig.showCover !== false" class="card-cover" :class="{ stretch: !!styleConfig.stretchCover }">
      <img v-if="coverUrl" :src="coverUrl" alt="cover" />
      <div v-else class="cover-placeholder">No Cover</div>
    </div>

    <div class="card-content">
      <div v-for="(field, index) in previewFields" :key="field.field_name" :class="{ 'card-row': true, 'is-title': index === 0 }">
        <span v-if="styleConfig.showFieldName !== false && index > 0" class="field-name">{{ field.field_name_alias || field.field_name }}</span>
        <template v-if="isUrlField(field)">
          <span v-if="!getUrlLinks(row?.[field.field_name]).length" class="field-value">--</span>
          <span v-else class="field-value field-value--links">
            <a
              v-for="(link, linkIndex) in getUrlLinks(row?.[field.field_name])"
              :key="linkIndex"
              class="field-link"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              tabindex="0"
              :aria-label="link.label"
              @click.stop
            >
              {{ link.label }}
            </a>
          </span>
        </template>
        <template v-else-if="isDocPalDocField(field)">
          <span v-if="!getDocPalDocs(row?.[field.field_name]).length" class="field-value">--</span>
          <span v-else class="field-value field-value--links">
            <a
              v-for="doc in getDocPalDocs(row?.[field.field_name])"
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
        <span v-else class="field-value">{{ formatValue(row?.[field.field_name]) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.md-card-widget {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  position: relative;
  &.is-deleted{
      text-decoration: line-through;
      background: var(--app-grey-900);
      cursor: not-allowed;
  }
  &.is-bordered {
    border: 1px solid #ebeef5;
  }

  &.shadow-none {
    box-shadow: none;
  }

  &.shadow-small {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  &.shadow-hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.14);
    }
  }

  &.is-compact {
    .card-content {
      padding: 8px;
    }

    .card-row {
      margin-bottom: 2px;
    }
  }
}

.md-card-widget.md-card-ghost {
  opacity: 0.6;
}

.card-drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(235, 238, 245, 0.95);
  color: var(--app-text-color-secondary);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.card-cover {
  height: calc(200px + (8 - var(--card-count)) * 20px);
  flex-shrink: 0;
  overflow: hidden;
  background: var(--app-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;

  &.stretch img {
    object-fit: cover;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .cover-placeholder {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.card-content {
  padding: 12px;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12px;
}

.field-name {
  color: var(--app-text-color-secondary);
}

.field-value {
  color: var(--app-text-color-primary);
  font-size: var(--app-font-size-l);
  word-break: break-word;
}

.field-value--links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-link {
  color: var(--el-color-primary);
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.field-link--doc {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.field-link__icon {
  width: var(--app-space-m);
  height: var(--app-space-m);
  flex-shrink: 0;
  object-fit: contain;
}

.card-row.is-title {
  .field-value {
    font-size: var(--app-font-size-xl);
    font-weight: 700;
    line-height: 1.5;
  }
}
</style>
