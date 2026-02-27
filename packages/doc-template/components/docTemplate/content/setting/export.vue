<script lang="ts" setup>
import { DocTemplateProveKey } from '../../../../utils/docTemplateHelper'
import { getJsonConfig } from 'docpal-document-editor/src/client'
import formJson from './docJson.json'
import { useI18n } from 'vue-i18n'
import cloneDeep from 'lodash/cloneDeep'
import VariableValueText from './variable/VariableValueText.vue'
import VariableValueList from './variable/VariableValueList.vue'
import VariableValueTable from './variable/VariableValueTable.vue'
import VariableValueLink from './variable/VariableValueLink.vue'
import VariableValueImage from './variable/VariableValueImage.vue'
import { templateApi } from 'api'

const docTempalteProvider = inject(DocTemplateProveKey)
const { t } = useI18n()
const { editor, options, variables } = docTempalteProvider

const state = reactive({
  loading: false,
  visible: false,
  textContent: '',
  sidebarVisible: false,
  exportType: 'html' as 'html' | 'docx' | 'pdf',
  exportVariableDrawerVisible: false
})

const exportVariables = ref<any[]>([])

const FormRendererRef = ref()


async function performExport(exportType: 'html' | 'docx' | 'pdf', configuredVariables: any[]) {
  const data = getJsonConfig(editor.value.getJSON(), options.value, configuredVariables)
  let filename
  let mime
  let blob
  if (exportType === 'docx') {
    blob = await templateApi.convert.postConvertDocx(data, { format: 'blob' })
    filename = `${options.value.title}.docx`
    mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  } else if (exportType === 'pdf') {
    blob = await templateApi.convert.postConvertPdf(data, { format: 'blob' })
    filename = `${options.value.title}.pdf`
    mime = 'application/pdf'
  } else {
    blob = await templateApi.convert.postConvertHtml(data, { format: 'blob' })
    filename = `${options.value.title}.html`
    mime = 'text/html'
  }
  // For HTML, the server may return text, so we need to handle it as text
  let finalBlob = blob
  if (exportType === 'html') {
    // Try to convert blob to text and back to blob for correct encoding
    const text = await blob.text()
    finalBlob = new Blob([text], { type: mime })
  }
  const url = URL.createObjectURL(finalBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function handleExportDropdown(command: 'html' | 'pdf' | 'docx' | 'json') {
  if (command === 'json') {
    openDialog()
    return
  }
  // Open variable edit drawer before export
  state.exportType = command
  openExportVariableDrawer()
}

function openDialog() {
  const json = getJsonConfig(editor.value.getJSON(), options.value, [...variables.value])
  const textContent = JSON.stringify(json)
  state.visible = true
  state.loading = true
  navigator.clipboard.writeText(textContent)
  nextTick(async () => {
    await FormRendererRef.value.vFormRenderRef.setFormData({ textContent, isExport: true })
    state.loading = false
  })
}

function openExportVariableDrawer() {
  exportVariables.value = cloneDeep(variables.value)
  state.exportVariableDrawerVisible = true
}

function getValueEditorComponent(type: string) {
  switch (type) {
    case 'text':
      return VariableValueText
    case 'list':
      return VariableValueList
    case 'table':
      return VariableValueTable
    case 'link':
      return VariableValueLink
    case 'image':
      return VariableValueImage
    default:
      return VariableValueText
  }
}

function handleExportWithVariables() {
  performExport(state.exportType, exportVariables.value)
  state.exportVariableDrawerVisible = false
}
</script>

<template>
  <el-dropdown @command="handleExportDropdown">
    <ElButton>
      {{ t('docTemplate.export.export') }} <i class="el-icon-arrow-down el-icon--right"></i>
    </ElButton>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="json">{{ t('docTemplate.export.exportJSON') }}</el-dropdown-item>
        <el-dropdown-item command="html">{{ t('docTemplate.export.exportHTML') }}</el-dropdown-item>
        <el-dropdown-item command="pdf">{{ t('docTemplate.export.exportPDF') }}</el-dropdown-item>
        <el-dropdown-item command="docx">{{ t('docTemplate.export.exportDOCX') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <el-drawer v-model="state.exportVariableDrawerVisible" title="Edit Variables Before Export" size="40%">
    <div v-for="(variable, idx) in exportVariables" :key="variable.key" style="margin-bottom: 1.5rem;">
      <div style="font-weight: 600; margin-bottom: 0.5rem;">{{ variable.name }}</div>
      <component
        :is="getValueEditorComponent(variable.type)"
        v-model="exportVariables[idx].value"
      />
    </div>
    <el-button type="primary" @click="handleExportWithVariables">Save & Export</el-button>
    <el-button @click="state.exportVariableDrawerVisible = false">Cancel</el-button>
  </el-drawer>
  <el-dialog v-model="state.visible" :title="t('Export')">
    <FormRenderer ref="FormRendererRef" v-loading="state.loading" :form-json="formJson" />
  </el-dialog>
</template>
