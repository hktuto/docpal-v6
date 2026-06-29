<script setup lang="ts">
import { getRowCellValue } from '../../../utils/fieldValueFormat'

type UrlCellValue = {
  text: string
  title: string
}

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

function normalizeHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function getUrlLinks(value: unknown): Array<{ href: string; label: string }> {
  if (value === null || value === undefined || value === '') {
    return []
  }

  const items = Array.isArray(value) ? value : typeof value === 'string' ? [{ text: value, title: value }] : [value]

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

const links = computed(() => getUrlLinks(getRowCellValue(props.row, props.field)))
</script>

<template>
  <span v-if="!links.length" class="field-value">--</span>
  <span v-else class="field-value field-value--links">
    <a
      v-for="(link, linkIndex) in links"
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
