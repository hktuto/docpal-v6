<script setup lang="ts">
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'
import * as XLSX from 'xlsx'

const props = defineProps<{
  src?: string
  blob?: Blob
  fileType?: string
  name?: string
}>()

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

const excelOptions = computed(() => ({
  xls: isXlsFile(props.fileType, props.name),
}))

const excelSrc = ref<string | ArrayBuffer>('')
const loading = ref(false)
let convertToken = 0

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
  if (typeof excelSrc.value === 'string') return excelSrc.value
  return `${props.name}-${excelSrc.value.byteLength}`
})

watch(() => [props.src, props.blob, props.fileType, props.name], resolveExcelSrc, { immediate: true })
</script>

<template>
  <div v-loading="loading" class="excel-reader">
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
}

.vue-office-excel {
  width: 100%;
}
</style>
