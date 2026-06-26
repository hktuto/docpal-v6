<script setup lang="ts">
type ReaderOptions = {
  print: boolean
  loadAnnotations: boolean
  readOnly: boolean
}

const props = defineProps<{
  annotations?: Map<string, unknown>
  blob: Blob
  name: string
  options: ReaderOptions
  loading: boolean
}>()

const state = reactive({
  content: '',
  errorMessage: '',
  vLoading: false,
})

let readToken = 0

function formatJson(value: string) {
  const parsedValue = JSON.parse(value)
  return JSON.stringify(parsedValue, null, 2)
}

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(String(reader.result ?? ''))
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsText(blob)
  })
}

async function handleReadJson(blob: Blob) {
  const currentToken = ++readToken

  if (!blob) {
    state.content = ''
    state.errorMessage = ''
    return
  }

  state.vLoading = true
  state.errorMessage = ''

  let contents = ''

  try {
    contents = await readBlobAsText(blob)

    if (currentToken !== readToken) return

    state.content = formatJson(contents)
  } catch (error) {
    if (currentToken !== readToken) return

    state.content = contents
    state.errorMessage = error instanceof Error ? error.message : String(error)
  } finally {
    if (currentToken === readToken) {
      state.vLoading = false
    }
  }
}

watch(() => props.blob, handleReadJson, {
  immediate: true,
})
</script>

<template>
  <div
    v-loading="props.loading || state.vLoading"
    class="jsonReaderContainer"
  >
    <div
      v-if="state.errorMessage"
      class="jsonReaderError"
    >
      {{ state.errorMessage }}
    </div>
    <pre class="jsonReaderContent">{{ state.content }}</pre>
  </div>
</template>

<style lang="scss" scoped>
.jsonReaderContainer {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--app-space-xs);
  background: var(--app-bg-color);
}

.jsonReaderError {
  margin-bottom: var(--app-space-xs);
  color: var(--el-color-danger);
  white-space: pre-wrap;
}

.jsonReaderContent {
  margin: 0;
  font-family: var(--el-font-family);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
