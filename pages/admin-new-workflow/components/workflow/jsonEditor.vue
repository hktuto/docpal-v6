<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { ElMessage, ElMessageBox } from 'element-plus'

type JsonEditorMode = 'import' | 'export'

const { t } = useI18n()
const emit = defineEmits<{
  import: [data: Record<string, any>]
}>()

const visible = ref(false)
const mode = ref<JsonEditorMode>('import')
const editorValue = ref('')

const extensions = computed(() => {
  const base = [json(), linter(jsonParseLinter())]
  if (mode.value === 'export') {
    base.push(EditorView.editable.of(false))
  }
  return base
})

const title = computed(() =>
  mode.value === 'import' ? t('designer.toolbar.importJson') : t('designer.toolbar.exportJson')
)

function open(nextMode: JsonEditorMode, data: Record<string, any> = {}) {
  mode.value = nextMode
  editorValue.value = JSON.stringify(data, null, 2)
  visible.value = true
}

function handleClose() {
  visible.value = false
}

function handleImport() {
  try {
    const parsed = JSON.parse(editorValue.value)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.nodes)) {
      throw new Error(t('workflow_invalidJsonFormat'))
    }
    if (parsed.edges != null && !Array.isArray(parsed.edges)) {
      throw new Error(t('workflow_invalidJsonFormat'))
    }
    emit('import', parsed)
    visible.value = false
    ElMessage.success(t('designer.hint.importJsonSuccess'))
  } catch (e: any) {
    ElMessage.error(e?.message || String(e))
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(editorValue.value)
    ElMessage.success(t('designer.hint.copyJsonSuccess'))
  } catch {
    ElMessage.error(t('designer.hint.copyJsonFail'))
  }
}

async function handleSaveAsFile() {
  const defaultFileName = `workflow-${Date.now()}.json`
  try {
    const { value } = await ElMessageBox.prompt(t('designer.hint.fileNameForSave'), t('designer.hint.saveFileTitle'), {
      inputValue: defaultFileName,
      closeOnClickModal: false,
      inputPlaceholder: t('designer.hint.fileNameInputPlaceholder')
    })
    const fileName = value?.trim() || defaultFileName
    const blob = new Blob([editorValue.value], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    // user cancelled
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    class="big"
    center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-alert
      v-if="mode === 'import'"
      type="info"
      :title="t('designer.hint.importJsonHint')"
      show-icon
      class="json-editor-alert"
    />
    <codemirror
      v-model="editorValue"
      :style="{ width: '100%', height: '60vh' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
    />
    <template #footer>
      <div class="dialog-footer">
        <template v-if="mode === 'import'">
          <el-button type="primary" @click="handleImport">{{ t('designer.hint.import') }}</el-button>
          <el-button @click="handleClose">{{ t('designer.hint.cancel') }}</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="handleCopy">{{ t('designer.hint.copyJson') }}</el-button>
          <el-button @click="handleSaveAsFile">{{ t('designer.hint.saveFormJson') }}</el-button>
          <el-button @click="handleClose">{{ t('designer.hint.closePreview') }}</el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.json-editor-alert {
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
