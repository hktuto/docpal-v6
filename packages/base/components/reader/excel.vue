<script setup lang="ts">
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import * as XLSX from 'xlsx'

const props = withDefaults(
  defineProps<{
    src?: string
    blob?: Blob
    fileType?: string
    name?: string
    /** 冻结首行 */
    freezeFirstRow?: boolean
    /** 冻结首列 */
    freezeFirstCol?: boolean
  }>(),
  {
    freezeFirstRow: false,
    freezeFirstCol: false
  }
)

function isCsvFile(fileType?: string, name?: string) {
  if (fileType === 'text/csv') return true

  const lowerName = name?.toLowerCase() ?? ''
  return lowerName.endsWith('.csv')
}

function isXlsFile(fileType?: string, name?: string) {
  if (fileType === 'application/vnd.ms-excel' && !isCsvFile(fileType, name)) return true

  const lowerName = name?.toLowerCase() ?? ''
  return lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')
}

/**
 * x-spreadsheet freeze cell = first unfrozen cell
 * - A2: freeze row 1
 * - B1: freeze col A
 * - B2: freeze row 1 + col A
 */
const freezeCell = computed(() => {
  if (props.freezeFirstRow && props.freezeFirstCol) return 'B2'
  if (props.freezeFirstRow) return 'A2'
  if (props.freezeFirstCol) return 'B1'
  return ''
})

function applyFreeze(workbookData: Array<Record<string, unknown>>) {
  const cell = freezeCell.value
  if (!cell || !Array.isArray(workbookData)) return workbookData
  return workbookData.map((sheet) => ({
    ...sheet,
    freeze: cell
  }))
}

const excelOptions = computed(() => ({
  xls: isXlsFile(props.fileType, props.name),
  ...(freezeCell.value ? { transformData: applyFreeze } : {})
}))

const excelSrc = ref<string | ArrayBuffer>('')
const loading = ref(false)
const containerRef = ref<HTMLElement | null>(null)
let convertToken = 0
let lastContainerSize = { width: 0, height: 0 }

function csvToXlsxBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Uint8Array(output).buffer
}

async function resolveExcelSrc() {
  const currentToken = ++convertToken

  if (isCsvFile(props.fileType, props.name) && props.blob) {
    loading.value = true

    try {
      const buffer = await props.blob.arrayBuffer()
      if (currentToken !== convertToken) return
      excelSrc.value = csvToXlsxBuffer(buffer)
    } catch {
      if (currentToken !== convertToken) return
      excelSrc.value = ''
    } finally {
      if (currentToken === convertToken) {
        loading.value = false
      }
    }
    return
  }

  excelSrc.value = props.src ?? ''
}

const excelSrcKey = computed(() => {
  if (!excelSrc.value) return ''
  const freezeKey = freezeCell.value || 'none'
  if (typeof excelSrc.value === 'string') return `${excelSrc.value}-${freezeKey}`
  return `${props.name}-${excelSrc.value.byteLength}-${freezeKey}`
})

watch(() => [props.src, props.blob, props.fileType, props.name], resolveExcelSrc, { immediate: true })

/**
 * @vue-office/excel (x-spreadsheet) only reloads layout on window.resize.
 * Splitter / flex panel width changes do not fire window resize, so notify it.
 */
const notifySpreadsheetResize = useDebounceFn(() => {
  window.dispatchEvent(new Event('resize'))
}, 50)

useResizeObserver(containerRef, (entries) => {
  const entry = entries[0]
  if (!entry) return

  const { width, height } = entry.contentRect
  if (width <= 0 || height <= 0) return

  const next = { width: Math.round(width), height: Math.round(height) }
  const isFirst = lastContainerSize.width === 0 && lastContainerSize.height === 0
  const unchanged = next.width === lastContainerSize.width && next.height === lastContainerSize.height
  lastContainerSize = next

  if (isFirst || unchanged) return
  notifySpreadsheetResize()
})
</script>

<template>
  <div ref="containerRef" v-loading="loading" class="excel-reader">
    <VueOfficeExcel
      v-if="excelSrc && !loading"
      :key="excelSrcKey"
      class="vue-office-excel"
      :src="excelSrc"
      :options="excelOptions"
    />
  </div>
</template>

<style lang="scss" scoped>
.excel-reader {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.vue-office-excel {
  width: 100%;
  height: 100%;
}
</style>
